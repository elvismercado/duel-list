import { useState, useCallback, useRef } from 'react';
import type { DuelRecord, Item, ListConfig } from '@/types';
import { calculateEloChange, sortItemsByElo, captureSessionSnapshot, calculateBiggestMovers } from '@/lib/ranking';
import { appendDuelToHistory, createDuelRecord, parseRecentPairs, createPairKey } from '@/lib/history';
import { selectNextPair } from '@/lib/pairing';
import { getHistory, saveList } from '@/lib/storage';

interface SessionState {
  duelCount: number;
  duelRecords: DuelRecord[];
  currentPair: { itemA: Item; itemB: Item } | null;
  isComplete: boolean;
  prevRankMap: Map<string, number>;
}

export function useComparison(list: ListConfig, onDuel?: (list: ListConfig) => void) {
  const recentSkips = useRef(new Map<string, number>());

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

  const recordDuel = useCallback(
    (winner: Item | null) => {
      if (!session.currentPair) return;
      const { itemA, itemB } = session.currentPair;

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
      const isComplete =
        list.sessionLength > 0 && newCount >= list.sessionLength;

      // Get next pair
      const active = updatedItems.filter((i) => !i.removed);
      const historyStr = getHistory(list.id);
      const recentPairs = parseRecentPairs(historyStr, active.length);
      const nextPair = isComplete
        ? null
        : selectNextPair(active, recentPairs, recentSkips.current);

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
    }));
  }, [session, list]);

  const restartSession = useCallback(() => {
    setSession(initSession());
  }, [initSession]);

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
  };
}
