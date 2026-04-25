import { useState, useCallback, useRef, useEffect } from 'react';
import type { DuelRecord, Item, ListConfig } from '@/types';
import { calculateEloChange, sortItemsByElo, captureSessionSnapshot, calculateBiggestMovers } from '@/lib/ranking';
import {
  appendDuelToHistory,
  createDuelRecord,
  parseRecentPairs,
  createPairKey,
  removeLastDuelFromHistory,
} from '@/lib/history';
import { selectNextPair } from '@/lib/pairing';
import { getHistory, saveHistory, saveList } from '@/lib/storage';

interface SessionState {
  duelCount: number;
  duelRecords: DuelRecord[];
  currentPair: { itemA: Item; itemB: Item } | null;
  isComplete: boolean;
  prevRankMap: Map<string, number>;
}

interface UndoSnapshot {
  pair: { itemA: Item; itemB: Item };
  itemAEloBefore: number;
  itemBEloBefore: number;
  itemACountBefore: number;
  itemBCountBefore: number;
  duelRecord: DuelRecord;
}

export function useComparison(list: ListConfig, onDuel?: (list: ListConfig) => void) {
  const recentSkips = useRef(new Map<string, number>());
  const [lastSnapshot, setLastSnapshot] = useState<UndoSnapshot | null>(null);

  // Persist the prev-rank/prev-elo snapshot to storage so the Rankings view
  // can render trend arrows that survive page reloads. Idempotent: writes
  // only when values actually change. Kept as an effect (not in useState
  // initializer) so React StrictMode does not double-write during dev.
  const persistPrevRankSnapshot = useCallback(() => {
    const active = list.items.filter((i) => !i.removed);
    const { prevElo, prevRank } = captureSessionSnapshot(active);
    let dirty = false;
    const snapshotItems = list.items.map((item) => {
      const r = prevRank.get(item.id);
      const e = prevElo.get(item.id);
      if (r === undefined || e === undefined) return item;
      if (item.prevRank === r && item.prevEloScore === e) return item;
      dirty = true;
      return { ...item, prevRank: r, prevEloScore: e };
    });
    if (dirty) {
      saveList({ ...list, items: snapshotItems });
    }
  }, [list]);

  const initSession = useCallback((): SessionState => {
    const active = list.items.filter((i) => !i.removed);
    const { prevRank } = captureSessionSnapshot(active);
    const historyStr = getHistory(list.id);
    const recentPairs = parseRecentPairs(historyStr, active.length);
    recentSkips.current = new Map();
    const pair = selectNextPair(active, recentPairs, recentSkips.current);

    return {
      duelCount: 0,
      duelRecords: [],
      currentPair: pair,
      isComplete: false,
      prevRankMap: prevRank,
    };
  }, [list]);

  const [session, setSession] = useState<SessionState>(initSession);

  // Snapshot persistence happens once per mount; restartSession re-runs it
  // explicitly below.
  useEffect(() => {
    persistPrevRankSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recordDuel = useCallback(
    (winner: Item | null) => {
      if (!session.currentPair) return;
      const { itemA, itemB } = session.currentPair;

      // Snapshot pre-state for single-step undo.
      setLastSnapshot({
        pair: { itemA, itemB },
        itemAEloBefore: itemA.eloScore,
        itemBEloBefore: itemB.eloScore,
        itemACountBefore: itemA.comparisonCount,
        itemBCountBefore: itemB.comparisonCount,
        duelRecord: createDuelRecord(itemA, itemB, winner, Date.now()),
      });

      // Calculate ELO
      const aIsWinner = winner?.id === itemA.id;
      const result = winner ? 'win' : ('tie' as const);
      const w = winner ? (aIsWinner ? itemA : itemB) : itemA;
      const l = winner ? (aIsWinner ? itemB : itemA) : itemB;

      const { winnerNewElo, loserNewElo } = calculateEloChange(
        w.eloScore,
        l.eloScore,
        list.kFactor,
        result,
      );

      // Update items in-place on the list
      const updatedItems = list.items.map((item) => {
        if (item.id === w.id) {
          return { ...item, eloScore: winnerNewElo, comparisonCount: item.comparisonCount + 1 };
        }
        if (item.id === l.id) {
          return { ...item, eloScore: loserNewElo, comparisonCount: item.comparisonCount + 1 };
        }
        return item;
      });

      const updatedList = { ...list, items: updatedItems };
      saveList(updatedList);

      // Record history
      // Record history
      appendDuelToHistory(list.id, list.name, itemA, itemB, winner);

      // Notify caller for file sync
      onDuel?.(updatedList);

      const record = createDuelRecord(itemA, itemB, winner, Date.now());
      const newCount = session.duelCount + 1;
      const sessionLengthHit =
        list.sessionLength > 0 && newCount >= list.sessionLength;

      // Get next pair
      const active = updatedItems.filter((i) => !i.removed);
      const historyStr = getHistory(list.id);
      const recentPairs = parseRecentPairs(historyStr, active.length);
      const nextPair = sessionLengthHit
        ? null
        : selectNextPair(active, recentPairs, recentSkips.current);

      // Treat pair-pool exhaustion as session complete too, so users with
      // small lists are credited with their work instead of dead-ending on
      // a "no more pairs" screen.
      const isComplete = sessionLengthHit || nextPair === null;

      setSession((prev) => ({
        ...prev,
        duelCount: newCount,
        duelRecords: [...prev.duelRecords, record],
        currentPair: nextPair,
        isComplete,
      }));

      // Return updated list so parent can sync state
      return updatedList;
    },
    [session, list],
  );

  const skipPair = useCallback(() => {
    if (!session.currentPair) return;
    const { itemA, itemB } = session.currentPair;
    const key = createPairKey(itemA.id, itemB.id);
    const count = recentSkips.current.get(key) ?? 0;
    recentSkips.current.set(key, count + 1);

    const active = list.items.filter((i) => !i.removed);
    const historyStr = getHistory(list.id);
    const recentPairs = parseRecentPairs(historyStr, active.length);
    const nextPair = selectNextPair(active, recentPairs, recentSkips.current);

    setSession((prev) => ({
      ...prev,
      currentPair: nextPair,
      // If the pair pool is now exhausted, end the session gracefully
      // rather than stranding the user on a "no more pairs" screen.
      isComplete: prev.isComplete || nextPair === null,
    }));
  }, [session, list]);

  const restartSession = useCallback(() => {
    setLastSnapshot(null);
    persistPrevRankSnapshot();
    setSession(initSession());
  }, [initSession, persistPrevRankSnapshot]);

  const undoLast = useCallback(() => {
    if (!lastSnapshot) return;
    const { pair, itemAEloBefore, itemBEloBefore, itemACountBefore, itemBCountBefore } = lastSnapshot;

    // Restore the two items in the list.
    const restoredItems = list.items.map((item) => {
      if (item.id === pair.itemA.id) {
        return { ...item, eloScore: itemAEloBefore, comparisonCount: itemACountBefore };
      }
      if (item.id === pair.itemB.id) {
        return { ...item, eloScore: itemBEloBefore, comparisonCount: itemBCountBefore };
      }
      return item;
    });
    const restoredList = { ...list, items: restoredItems };
    saveList(restoredList);

    // Rewrite history without the last entry.
    const current = getHistory(list.id);
    const rolledBack = removeLastDuelFromHistory(current);
    saveHistory(list.id, rolledBack);

    onDuel?.(restoredList);

    // Rewind session state and restore the original pair.
    setSession((prev) => ({
      ...prev,
      duelCount: Math.max(0, prev.duelCount - 1),
      duelRecords: prev.duelRecords.slice(0, -1),
      currentPair: {
        itemA: restoredItems.find((i) => i.id === pair.itemA.id)!,
        itemB: restoredItems.find((i) => i.id === pair.itemB.id)!,
      },
      isComplete: false,
    }));

    setLastSnapshot(null);
  }, [list, onDuel, lastSnapshot]);

  const biggestMovers = useCallback(() => {
    const active = list.items.filter((i) => !i.removed);
    return calculateBiggestMovers(active, session.prevRankMap);
  }, [list, session.prevRankMap]);

  const topThree = useCallback(() => {
    const active = list.items.filter((i) => !i.removed);
    return sortItemsByElo(active).slice(0, 3);
  }, [list]);

  return {
    ...session,
    recordDuel,
    skipPair,
    restartSession,
    biggestMovers,
    topThree,
    undoLast,
    canUndo: lastSnapshot !== null,
  };
}
