const PODIUM_CHIP_CLASS: readonly string[] = [
  'bg-podium-gold/20 text-podium-gold',
  'bg-podium-silver/25 text-podium-silver',
  'bg-podium-bronze/20 text-podium-bronze',
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
