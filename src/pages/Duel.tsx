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
import { SkipForward, Equal, Trophy, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { SwipeMode } from '@/components/SwipeMode';
import { RankChip } from '@/components/RankChip';
import { getSettings } from '@/lib/storage';

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
        <Button onClick={() => navigate(`/list/${id}`)}>{S.common.backToList}</Button>
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
  } = useComparison(list, onDuel);

  const [lastWinner, setLastWinner] = useState<string | null>(null);

  const progress =
    list.sessionLength > 0 ? (duelCount / list.sessionLength) * 100 : 0;

  const handlePick = useCallback(
    (winner: import('@/types').Item | null) => {
      setLastWinner(winner?.id ?? 'tie');
      const updated = recordDuel(winner);
      if (updated) onReload();
      // Let animation play, then clear for next pair
      setTimeout(() => setLastWinner(null), 600);
    },
    [recordDuel, onReload],
  );

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
        skipPair();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isComplete, currentPair, handlePick, skipPair]);

  if (isComplete) {
    const movers = biggestMovers();
    const top = topThree();
    return (
      <div className="p-4 max-w-lg mx-auto space-y-6" aria-live="polite">
        <div className="text-center space-y-2">
          <Trophy className="h-10 w-10 mx-auto text-yellow-500" />
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
                  <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
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
            onClick={restartSession}
          >
            {S.duel.newSession}
          </Button>
        </div>
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

  if (duelMode === 'swipe') {
    return (
      <SwipeMode
        key={`${itemA.id}-${itemB.id}`}
        itemA={itemA}
        itemB={itemB}
        duelCount={duelCount}
        sessionLength={list.sessionLength}
        showElo={(list.displayMode ?? 'rank') === 'elo'}
        onPick={handlePick}
        onSkip={skipPair}
      />
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold truncate">{list.name}</h1>
        {list.sessionLength > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums" aria-live="polite" aria-atomic="true">
            {duelCount}/{list.sessionLength}
          </span>
        )}
      </div>

      {list.sessionLength > 0 && (
        <Progress value={progress} className="h-2" />
      )}

      <div className="grid grid-cols-2 gap-3">
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
            <p className="text-xs text-muted-foreground mt-1">
              {S.duel.eloSuffix(Math.round(itemA.eloScore))}
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              {S.duel.eloSuffix(Math.round(itemB.eloScore))}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={() => handlePick(null)}>
          <Equal className="h-4 w-4 mr-1" />
          {S.duel.tie}
        </Button>
        <Button variant="ghost" size="sm" onClick={skipPair}>
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
