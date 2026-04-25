import { useEffect, useCallback, useState } from 'react';
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
import { SkipForward, Equal, TrendingUp, TrendingDown, ArrowLeft, Undo2, Plus } from 'lucide-react';
import { SwipeMode } from '@/components/SwipeMode';
import { RankChip } from '@/components/RankChip';
import { HelpHint } from '@/components/HelpHint';
import { getSettings } from '@/lib/storage';
import { triggerHaptic } from '@/lib/haptics';
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
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <p className="text-muted-foreground">{S.duel.needTwoItems}</p>
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

  const progress =
    list.sessionLength > 0 ? (duelCount / list.sessionLength) * 100 : 0;

  const handlePick = useCallback(
    (winner: import('@/types').Item | null) => {
      triggerHaptic(winner ? 15 : 8);
      setLastWinner(winner?.id ?? 'tie');
      const updated = recordDuel(winner);
      if (updated) onReload();
      // Let animation play, then clear for next pair
      setTimeout(() => setLastWinner(null), 600);
    },
    [recordDuel, onReload],
  );

  const handleSkip = useCallback(() => {
    triggerHaptic(8);
    skipPair();
  }, [skipPair]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isComplete || !currentPair) return;
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
  }, [isComplete, currentPair, handlePick, handleSkip]);

  if (isComplete) {
    const movers = biggestMovers();
    const top = topThree();
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
                <span className="text-sm text-muted-foreground tabular-nums">
                  {Math.round(item.eloScore)}
                </span>
              </div>
            ))}
          </div>
        )}

        {movers.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {S.duel.biggestMovers}
            </h2>
            {movers.map((m) => (
              <div
                key={m.item.id}
                className="flex items-center gap-3 rounded-md border p-2"
              >
                {m.rankChange < 0 ? (
                  <TrendingUp className="h-4 w-4 text-outcome-win shrink-0" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-outcome-loss shrink-0" />
                )}
                <span className="flex-1 truncate text-sm">{m.item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {m.rankChange < 0 ? `↑${Math.abs(m.rankChange)}` : `↓${m.rankChange}`}
                </span>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {canUndo && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={undoLast}
              aria-label={S.duel.undoAria}
            >
              <Undo2 className="h-4 w-4 mr-1" />
              {S.duel.undo}
            </Button>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => navigate(`/list/${list.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
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
    return (
      <div className="p-4 max-w-lg mx-auto text-center space-y-4 mt-12">
        <p className="text-muted-foreground">{S.duel.noMorePairs}</p>
        <Button onClick={() => navigate(`/list/${list.id}`)}>
          {S.duel.backToRankings}
        </Button>
      </div>
    );
  }

  const { itemA, itemB } = currentPair;
  const duelMode = getSettings().duelMode;
  const showScores = list.showScoresDuringDuels === true;

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
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold truncate">{list.name}</h1>
        <div className="flex items-center gap-2 shrink-0">
          {canUndo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={undoLast}
              aria-label={S.duel.undoAria}
              className="h-8 px-2"
            >
              <Undo2 className="h-4 w-4" />
              <span className="sr-only">{S.duel.undo}</span>
            </Button>
          )}
          {list.sessionLength > 0 && (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
              <span aria-live="polite" aria-atomic="true">
                {duelCount}/{list.sessionLength}
              </span>
              <HelpHint anchor="session" term={S.glossary.termSessionLabel} />
            </span>
          )}
        </div>
      </div>

      {list.sessionLength > 0 && (
        <Progress value={progress} className="h-2" />
      )}

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {S.duel.pairAnnouncement(duelCount + 1, itemA.name, itemB.name)}
      </p>

      <div key={`${itemA.id}-${itemB.id}`} className="grid grid-cols-2 gap-3">
        <Card
          role="button"
          tabIndex={0}
          aria-label={S.duel.pickAria(itemA.name)}
          className={`cursor-pointer hover:border-primary focus-visible:ring-2 focus-visible:ring-ring transition-all ${
            lastWinner === itemA.id ? 'animate-winner-grow' : ''
          }${lastWinner && lastWinner !== 'tie' && lastWinner !== itemA.id ? ' animate-loser-shrink' : ''}`}
          onClick={() => handlePick(itemA)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePick(itemA); } }}
        >
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-lg">{itemA.name}</p>
            {showScores && (
              <p className="text-xs text-muted-foreground mt-1">
                {S.duel.scoreSuffix(Math.round(itemA.eloScore))}
              </p>
            )}
          </CardContent>
        </Card>

        <Card
          role="button"
          tabIndex={0}
          aria-label={S.duel.pickAria(itemB.name)}
          className={`cursor-pointer hover:border-primary focus-visible:ring-2 focus-visible:ring-ring transition-all ${
            lastWinner === itemB.id ? 'animate-winner-grow' : ''
          }${lastWinner && lastWinner !== 'tie' && lastWinner !== itemB.id ? ' animate-loser-shrink' : ''}`}
          onClick={() => handlePick(itemB)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePick(itemB); } }}
        >
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-lg">{itemB.name}</p>
            {showScores && (
              <p className="text-xs text-muted-foreground mt-1">
                {S.duel.scoreSuffix(Math.round(itemB.eloScore))}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={() => handlePick(null)}>
          <Equal className="h-4 w-4 mr-1" />
          {S.duel.tie}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSkip}>
          <SkipForward className="h-4 w-4 mr-1" />
          {S.duel.skip}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {S.duel.keyboardHint}
      </p>
    </div>
  );
}
