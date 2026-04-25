import { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { S } from '@/lib/strings';
import { useList } from '@/hooks/useList';
import { useFileSync } from '@/hooks/useFileSync';
import { useComparison } from '@/hooks/useComparison';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SkipForward, Equal, Undo2, Plus, History as HistoryIcon, X, ListOrdered } from 'lucide-react';
import { SwipeMode } from '@/components/SwipeMode';
import { RankChip } from '@/components/RankChip';
import { HelpHint } from '@/components/HelpHint';
import { getSettings } from '@/lib/storage';
import { triggerHaptic } from '@/lib/haptics';
import { sortItemsByElo, getItemRank } from '@/lib/ranking';
import { avatarBackground, avatarInitial, isEmojiInitial } from '@/lib/avatar';
import sessionCompleteImg from '@/assets/illustrations/session-complete.png';

export default function Duel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { syncToFile, syncHistoryToFile } = useFileSync(id);
  const onDuel = useCallback(
    (updated: import('@/types').ListConfig) => {
      syncToFile(updated);
      syncHistoryToFile();
    },
    [syncToFile, syncHistoryToFile],
  );
  const { list, reload } = useList(id!);

  if (!list) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <h1 className="text-2xl font-bold">{S.common.listNotFound}</h1>
        <Button onClick={() => navigate('/')}>{S.common.goHome}</Button>
      </div>
    );
  }

  const activeItems = list.items.filter((i) => !i.removed);

  if (activeItems.length < 2) {
    const need = 2 - activeItems.length;
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <p className="text-muted-foreground">
          {S.duel.needTwoItemsWithCount(activeItems.length, need)}
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => navigate(`/list/${id}?add=1`)}>
            <Plus className="h-4 w-4 mr-1" />
            {S.duel.addItems}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/list/${id}`)}>
            {S.common.backToList}
          </Button>
        </div>
      </div>
    );
  }

  return <DuelSession list={list} onReload={reload} onDuel={onDuel} />;
}

function DuelSession({
  list,
  onReload,
  onDuel,
}: {
  list: import('@/types').ListConfig;
  onReload: () => void;
  onDuel?: (list: import('@/types').ListConfig) => void;
}) {
  const navigate = useNavigate();
  const {
    currentPair,
    duelCount,
    isComplete,
    recordDuel,
    skipPair,
    restartSession,
    biggestMovers,
    topThree,
    undoLast,
    canUndo,
  } = useComparison(list, onDuel);

  const [lastWinner, setLastWinner] = useState<string | null>(null);
  const [newSessionConfirmOpen, setNewSessionConfirmOpen] = useState(false);
  // Guards against rapid double-taps recording the same pair twice while
  // the win/lose animation is still running. Mirrored as state so the
  // disabled prop on the choice buttons stays in sync.
  const processingRef = useRef(false);
  const [processing, setProcessing] = useState(false);

  const progress =
    list.sessionLength > 0 ? (duelCount / list.sessionLength) * 100 : 0;

  const handlePick = useCallback(
    (winner: import('@/types').Item | null) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setProcessing(true);
      triggerHaptic(winner ? 15 : 8);
      // Show the win/lose/tie animation on the cards the user just
      // clicked, then advance to the next pair after the animation
      // window. Recording immediately would re-key the grid and unmount
      // the animated cards before the keyframes could play.
      setLastWinner(winner?.id ?? 'tie');
      setTimeout(() => {
        const updated = recordDuel(winner);
        if (updated) onReload();
        setLastWinner(null);
        processingRef.current = false;
        setProcessing(false);
      }, 400);
    },
    [recordDuel, onReload],
  );

  const handleSkip = useCallback(() => {
    if (processingRef.current) return;
    triggerHaptic(8);
    skipPair();
  }, [skipPair]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isComplete || !currentPair) return;
      // Don't capture keys while a modal is open behind the dialog.
      if (newSessionConfirmOpen) return;
      if (e.key === 'ArrowLeft' || e.key === '1') {
        handlePick(currentPair.itemA);
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        handlePick(currentPair.itemB);
      } else if (e.key === 't' || e.key === 'T') {
        handlePick(null);
      } else if (e.key === 's' || e.key === 'S') {
        handleSkip();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isComplete, currentPair, handlePick, handleSkip, newSessionConfirmOpen]);

  // Stable rank lookup so we can ground each card with `#N` when scores are
  // hidden. Memoized so dialog open/close doesn't recompute. Declared
  // before any conditional return so React's hook order stays stable when
  // the session completes.
  const sortedActive = useMemo(
    () => sortItemsByElo(list.items.filter((i) => !i.removed)),
    [list.items],
  );
  const rankA = useMemo(
    () => (currentPair ? getItemRank(sortedActive, currentPair.itemA.id) : -1),
    [sortedActive, currentPair],
  );
  const rankB = useMemo(
    () => (currentPair ? getItemRank(sortedActive, currentPair.itemB.id) : -1),
    [sortedActive, currentPair],
  );

  if (isComplete) {
    const movers = biggestMovers();
    const top = topThree();
    const showTopScores = list.displayMode !== 'rank';
    return (
      <div className="p-4 max-w-lg mx-auto space-y-6" aria-live="polite">
        <div className="text-center space-y-2 animate-slide-in-up">
          <img
            src={sessionCompleteImg}
            alt=""
            aria-hidden="true"
            className="max-w-[220px] mx-auto opacity-90"
          />
          <h1 className="text-2xl font-bold">{S.duel.sessionComplete}</h1>
          <p className="text-muted-foreground">
            {S.duel.duelsCompleted(duelCount)}
          </p>
        </div>

        {top.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {S.duel.currentTop3}
            </h2>
            {top.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-md border p-3"
              >
                <RankChip position={i + 1} />
                <span className="flex-1 truncate">{item.name}</span>
                {showTopScores && (
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {Math.round(item.eloScore)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {movers.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {S.duel.biggestMovers}
            </h2>
            {movers.map((m) => {
              // rankChange < 0 means the item moved UP the ranking
              // (a lower rank number = higher position).
              const movedUp = m.rankChange < 0;
              const magnitude = Math.abs(m.rankChange);
              return (
                <div
                  key={m.item.id}
                  className="flex items-center gap-3 rounded-md border p-2"
                >
                  <span className="flex-1 truncate text-sm">{m.item.name}</span>
                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium tabular-nums ${
                      movedUp
                        ? 'bg-outcome-win/15 text-outcome-win'
                        : 'bg-outcome-loss/15 text-outcome-loss'
                    }`}
                  >
                    <span aria-hidden="true">{movedUp ? '▲' : '▼'}</span>
                    {magnitude}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <Separator />

        <div className="flex justify-center gap-2 flex-wrap">
          {canUndo && (
            <Button
              variant="outline"
              size="sm"
              onClick={undoLast}
              aria-label={S.duel.undoAria}
            >
              <Undo2 className="h-4 w-4 mr-1" />
              {S.duel.undo}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/list/${list.id}/history`)}
          >
            <HistoryIcon className="h-4 w-4 mr-1" />
            {S.duel.viewHistory}
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => navigate(`/list/${list.id}`)}
          >
            <ListOrdered className="h-4 w-4 mr-2" />
            {S.duel.rankings}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setNewSessionConfirmOpen(true)}
          >
            {S.duel.newSession}
          </Button>
        </div>

        <ConfirmDialog
          open={newSessionConfirmOpen}
          title={S.duel.newSessionConfirmTitle}
          message={S.duel.newSessionConfirmMessage}
          confirmLabel={S.duel.newSessionConfirmButton}
          danger
          onConfirm={() => {
            setNewSessionConfirmOpen(false);
            restartSession();
          }}
          onCancel={() => setNewSessionConfirmOpen(false)}
        />
      </div>
    );
  }

  if (!currentPair) {
    // Defensive only: useComparison routes pair-pool exhaustion through
    // isComplete, so this branch is normally unreachable. Render a thin
    // fallback so an unexpected null pair still navigates the user out.
    navigate(`/list/${list.id}`);
    return null;
  }

  const { itemA, itemB } = currentPair;
  const duelMode = getSettings().duelMode;
  const showScores = list.showScoresDuringDuels === true;

  const isFinalDuel =
    list.sessionLength > 0 && duelCount + 1 === list.sessionLength;

  if (duelMode === 'swipe') {
    return (
      <SwipeMode
        key={`${itemA.id}-${itemB.id}`}
        itemA={itemA}
        itemB={itemB}
        duelCount={duelCount}
        sessionLength={list.sessionLength}
        showScores={list.showScoresDuringDuels === true}
        onPick={handlePick}
        onSkip={handleSkip}
        canUndo={canUndo}
        onUndo={undoLast}
      />
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/list/${list.id}`)}
          className="h-8 px-2 -ml-2 shrink-0"
        >
          <X className="h-4 w-4 mr-1" />
          {S.duel.endShort}
        </Button>
        <h1 className="text-base font-semibold truncate flex-1 min-w-0">
          {list.name}
        </h1>
        {canUndo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={undoLast}
            aria-label={S.duel.undoAria}
            className="h-8 px-2 shrink-0"
          >
            <Undo2 className="h-4 w-4 mr-1" />
            {S.duel.undo}
          </Button>
        )}
      </div>

      {list.sessionLength > 0 && (
        <div className="flex items-center gap-2">
          <Progress value={progress} className="h-2 flex-1" />
          {isFinalDuel ? (
            <span className="inline-flex items-center rounded-full bg-brand-soft text-brand-deep px-2 py-0.5 text-xs font-medium shrink-0">
              {S.duel.finalDuel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground tabular-nums shrink-0">
              <span aria-live="polite" aria-atomic="true">
                {duelCount}/{list.sessionLength}
              </span>
              <HelpHint anchor="session" term={S.glossary.termSessionLabel} />
            </span>
          )}
        </div>
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {S.duel.pairAnnouncement(duelCount + 1, itemA.name, itemB.name)}
        {isFinalDuel ? ` ${S.duel.finalDuelAnnouncement}` : ''}
      </p>

      <div key={`${itemA.id}-${itemB.id}`} className="grid grid-cols-2 gap-3">
        {[
          { item: itemA, rank: rankA },
          { item: itemB, rank: rankB },
        ].map(({ item, rank }) => {
          const isWinner = lastWinner === item.id;
          const isLoser =
            lastWinner && lastWinner !== 'tie' && lastWinner !== item.id;
          const isTie = lastWinner === 'tie';
          const initial = avatarInitial(item.name);
          const isEmoji = isEmojiInitial(initial);
          return (
            <Card
              key={item.id}
              asChild
              className={`cursor-pointer hover:border-primary focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                isWinner ? 'animate-winner-grow' : ''
              }${isLoser ? ' animate-loser-shrink' : ''}${
                isTie ? ' animate-tie-pulse' : ''
              }`}
            >
              <button
                type="button"
                aria-label={S.duel.pickAria(item.name)}
                style={{ touchAction: 'manipulation' }}
                disabled={processing}
                className="disabled:opacity-100"
                onClick={() => handlePick(item)}
              >
                <CardContent className="p-6 sm:p-8 text-center flex flex-col items-center gap-2">
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold shadow-sm ${
                      isEmoji ? 'bg-muted text-foreground' : 'text-white'
                    }`}
                    style={isEmoji ? undefined : { backgroundColor: avatarBackground(item.id) }}
                    aria-hidden="true"
                  >
                    {initial}
                  </span>
                  <p className="font-semibold text-lg leading-tight">{item.name}</p>
                  {showScores ? (
                    <p className="text-xs text-muted-foreground">
                      {S.duel.scoreSuffix(Math.round(item.eloScore))}
                    </p>
                  ) : rank > 0 ? (
                    <RankChip position={rank} />
                  ) : null}
                </CardContent>
              </button>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handlePick(null)}
        >
          <Equal className="h-4 w-4 mr-1" />
          {S.duel.tie}
        </Button>
        <Button
          variant="ghost"
          className="flex-1"
          onClick={handleSkip}
        >
          <SkipForward className="h-4 w-4 mr-1" />
          {S.duel.skip}
        </Button>
      </div>

      <p
        className="text-xs text-center text-muted-foreground flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
        aria-label={S.duel.keyboardHintAria}
      >
        <span className="inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border bg-muted">←</kbd>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border bg-muted">→</kbd>
          <span>to pick</span>
        </span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border bg-muted">T</kbd>
          <span>for tie</span>
        </span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border bg-muted">S</kbd>
          <span>to skip</span>
        </span>
      </p>
    </div>
  );
}
