import { useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Equal, SkipForward } from 'lucide-react';
import { S } from '@/lib/strings';
import { Progress } from '@/components/ui/progress';
import type { Item } from '@/types';

interface SwipeModeProps {
  itemA: Item;
  itemB: Item;
  duelCount: number;
  sessionLength: number;
  showElo: boolean;
  onPick: (winner: Item | null) => void;
  onSkip: () => void;
}

const SWIPE_THRESHOLD = 80;

interface SwipeCardProps {
  item: Item;
  showElo: boolean;
  onPick: () => void;
  exiting: boolean;
}

function SwipeCard({ item, showElo, onPick, exiting }: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const upHint = useTransform(y, [-120, -40, 0], [1, 0.4, 0]);
  const tilt = useTransform(x, [-100, 100], [-8, 8]);

  function handleDragEnd(_e: unknown, info: PanInfo) {
    if (info.offset.y < -SWIPE_THRESHOLD || Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
      onPick();
    }
  }

  return (
    <motion.div
      drag={exiting ? false : true}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      style={{ x, y, rotate: tilt }}
      animate={
        exiting
          ? { y: -500, opacity: 0, transition: { duration: 0.25 } }
          : undefined
      }
      onDragEnd={handleDragEnd}
      className="touch-none"
    >
      <Card
        role="button"
        tabIndex={0}
        aria-label={S.duel.pickAria(item.name)}
        onClick={onPick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPick();
          }
        }}
        className="cursor-grab active:cursor-grabbing select-none focus-visible:ring-2 focus-visible:ring-ring h-56 sm:h-64"
      >
        <CardContent className="h-full flex flex-col items-center justify-center p-4 text-center relative">
          <p className="font-semibold text-base sm:text-lg">{item.name}</p>
          {showElo && (
            <p className="text-xs text-muted-foreground mt-1">
              {S.duel.scoreSuffix(Math.round(item.eloScore))}
            </p>
          )}
          <motion.div
            style={{ opacity: upHint }}
            className="absolute top-3 left-1/2 -translate-x-1/2 border-2 border-outcome-win text-outcome-win px-3 py-1 rounded font-bold text-xs"
          >
            {S.duel.pickBadge}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function SwipeMode({
  itemA,
  itemB,
  duelCount,
  sessionLength,
  showElo,
  onPick,
  onSkip,
}: SwipeModeProps) {
  const [exiting, setExiting] = useState<'a' | 'b' | null>(null);

  function handlePickA() {
    if (exiting) return;
    setExiting('a');
    setTimeout(() => onPick(itemA), 220);
  }

  function handlePickB() {
    if (exiting) return;
    setExiting('b');
    setTimeout(() => onPick(itemB), 220);
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{S.duel.swipeUpToPick}</h1>
        {sessionLength > 0 && (
          <span
            className="text-sm text-muted-foreground tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {duelCount}/{sessionLength}
          </span>
        )}
      </div>

      {sessionLength > 0 && (
        <Progress value={(duelCount / sessionLength) * 100} className="h-2" />
      )}

      <div className="grid grid-cols-2 gap-3">
        <SwipeCard
          item={itemA}
          showElo={showElo}
          onPick={handlePickA}
          exiting={exiting === 'a'}
        />
        <SwipeCard
          item={itemB}
          showElo={showElo}
          onPick={handlePickB}
          exiting={exiting === 'b'}
        />
      </div>

      <div className="flex gap-2 justify-center">
        <Button variant="outline" size="sm" onClick={() => onPick(null)}>
          <Equal className="h-4 w-4 mr-1" />
          {S.duel.tie}
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          <SkipForward className="h-4 w-4 mr-1" />
          {S.duel.skip}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {S.duel.swipeHelpText}
      </p>
    </div>
  );
}
