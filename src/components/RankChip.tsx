const PODIUM_CHIP_CLASS: readonly string[] = [
  'bg-amber-400/20 text-amber-700 dark:text-amber-300',
  'bg-slate-400/25 text-slate-700 dark:text-slate-300',
  'bg-orange-400/20 text-orange-800 dark:text-orange-300',
];

const MUTED_CHIP_CLASS = 'bg-muted text-muted-foreground';

export interface RankChipProps {
  position: number;
  className?: string;
}

/**
 * Medal-tier `#1`/`#2`/`#3` chip for the top podium positions; falls back to
 * a muted `#N` chip for positions outside the podium so the same component
 * can be used uniformly across lists.
 */
export function RankChip({ position, className }: RankChipProps) {
  const tier =
    position >= 1 && position <= 3 ? PODIUM_CHIP_CLASS[position - 1]! : MUTED_CHIP_CLASS;
  return (
    <span
      className={`inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${tier} ${className ?? ''}`}
      aria-hidden="true"
    >
      #{position}
    </span>
  );
}
