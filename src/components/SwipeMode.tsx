import { useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Equal, SkipForward } from 'lucide-react';
import { S } from '@/lib/strings';
import type { Item } from '@/types';

interface SwipeModeProps {
  itemA: Item;
  itemB: Item;
  duelCount: number;
  sessionLength: number;
  onPick: (winner: Item | null) => void;
  onSkip: () => void;
}

const SWIPE_THRESHOLD = 100;

export function SwipeMode({
  itemA,
  itemB,
  duelCount,
  sessionLength,
  onPick,
  onSkip,
}: SwipeModeProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const leftHint = useTransform(x, [-150, -50, 0], [1, 0.6, 0]);
  const rightHint = useTransform(x, [0, 50, 150], [0, 0.6, 1]);

  const [exiting, setExiting] = useState<'left' | 'right' | null>(null);

  function handleDragEnd(_e: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      setExiting('right');
      // Right swipe = pick A (top card represents A; goes off to the right as winner)
      setTimeout(() => onPick(itemA), 200);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      setExiting('left');
      setTimeout(() => onPick(itemB), 200);
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Swipe to choose</h1>
        {sessionLength > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums" aria-live="polite" aria-atomic="true">
            {duelCount}/{sessionLength}
          </span>
        )}
      </div>

      <div className="relative h-72">
        {/* Bottom card (item B) */}
        <Card className="absolute inset-0 scale-95 opacity-80">
          <CardContent className="h-full flex flex-col items-center justify-center p-6 text-center">
            <p className="font-semibold text-lg">{itemB.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(itemB.eloScore)} ELO
            </p>
          </CardContent>
        </Card>

        {/* Top draggable card (item A) */}
        <motion.div
          className="absolute inset-0"
          drag={exiting ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.7}
          style={{ x, rotate, opacity }}
          animate={
            exiting === 'right'
              ? { x: 500, opacity: 0 }
              : exiting === 'left'
                ? { x: -500, opacity: 0 }
                : undefined
          }
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onDragEnd={handleDragEnd}
        >
          <Card className="h-full cursor-grab active:cursor-grabbing">
            <CardContent className="h-full flex flex-col items-center justify-center p-6 text-center relative">
              <p className="font-semibold text-lg">{itemA.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(itemA.eloScore)} ELO
              </p>
              <motion.div
                style={{ opacity: rightHint }}
                className="absolute top-4 left-4 border-2 border-green-500 text-green-500 px-3 py-1 rounded font-bold text-sm rotate-[-15deg]"
              >
                PICK
              </motion.div>
              <motion.div
                style={{ opacity: leftHint }}
                className="absolute top-4 right-4 border-2 border-red-500 text-red-500 px-3 py-1 rounded font-bold text-sm rotate-[15deg]"
              >
                NOPE
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Button fallback for keyboard / accessibility */}
      <div className="flex gap-2 justify-center flex-wrap">
        <Button variant="outline" size="sm" onClick={() => onPick(itemA)} aria-label={`Pick ${itemA.name}`}>
          ← Pick {itemA.name}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPick(itemB)} aria-label={`Pick ${itemB.name}`}>
          Pick {itemB.name} →
        </Button>
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
        Swipe right to pick · swipe left to reject · ← / → keys also work
      </p>
    </div>
  );
}
