import { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { S } from '@/lib/strings';
import { useList } from '@/hooks/useList';
import { useComparison } from '@/hooks/useComparison';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SkipForward, Equal, Trophy, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';

export default function Duel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { list, reload } = useList(id!);

  if (!list) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <h1 className="text-2xl font-bold">List not found</h1>
        <Button onClick={() => navigate('/')}>Go home</Button>
      </div>
    );
  }

  const activeItems = list.items.filter((i) => !i.removed);

  if (activeItems.length < 2) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 text-center mt-12">
        <p className="text-muted-foreground">{S.duel.needTwoItems}</p>
        <Button onClick={() => navigate(`/list/${id}`)}>Back to list</Button>
      </div>
    );
  }

  return <DuelSession list={list} onReload={reload} />;
}

function DuelSession({
  list,
  onReload,
}: {
  list: import('@/types').ListConfig;
  onReload: () => void;
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
  } = useComparison(list);

  const [lastWinner, setLastWinner] = useState<string | null>(null);

  const progress =
    list.sessionLength > 0 ? (duelCount / list.sessionLength) * 100 : 0;

  const handlePick = useCallback(
    (winner: import('@/types').Item | null) => {
      setLastWinner(winner?.id ?? 'tie');
      const updated = recordDuel(winner);
      if (updated) onReload();
      // Clear animation after a short delay
      setTimeout(() => setLastWinner(null), 300);
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
      <div className="p-4 max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Trophy className="h-10 w-10 mx-auto text-yellow-500" />
          <h1 className="text-2xl font-bold">{S.duel.sessionComplete}</h1>
          <p className="text-muted-foreground">
            {duelCount} duels completed
          </p>
        </div>

        {top.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Current Top 3
            </h2>
            {top.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-md border p-3"
              >
                <span className="text-lg font-bold w-6 text-right">
                  {i + 1}
                </span>
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
              Biggest Movers
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
            Rankings
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={restartSession}
          >
            New session
          </Button>
        </div>
      </div>
    );
  }

  if (!currentPair) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center space-y-4 mt-12">
        <p className="text-muted-foreground">No more pairs available</p>
        <Button onClick={() => navigate(`/list/${list.id}`)}>
          Back to rankings
        </Button>
      </div>
    );
  }

  const { itemA, itemB } = currentPair;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold truncate">{list.name}</h1>
        {list.sessionLength > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {duelCount}/{list.sessionLength}
          </span>
        )}
      </div>

      {list.sessionLength > 0 && (
        <Progress value={progress} className="h-2" />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card
          className={`cursor-pointer hover:border-primary transition-all ${
            lastWinner === itemA.id ? 'animate-winner-grow' : ''
          }`}
          onClick={() => handlePick(itemA)}
        >
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-lg">{itemA.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(itemA.eloScore)} ELO
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:border-primary transition-all ${
            lastWinner === itemB.id ? 'animate-winner-grow' : ''
          }`}
          onClick={() => handlePick(itemB)}
        >
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-lg">{itemB.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(itemB.eloScore)} ELO
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
        ← / → to pick · T for tie · S to skip
      </p>
    </div>
  );
}
