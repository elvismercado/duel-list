import type { Item } from '@/types';
import { createPairKey } from '@/lib/history';

// ---------------------------------------------------------------------------
// Pair selection
// ---------------------------------------------------------------------------

export function selectNextPair(
  items: Item[],
  recentPairs: Set<string>,
  recentSkips: Map<string, number>,
): { itemA: Item; itemB: Item } | null {
  // Filter to active items only
  const active = items.filter((i) => !i.removed);
  if (active.length < 2) return null;

  // 1. Build all possible pairs
  const pairs: Array<{ a: Item; b: Item; key: string }> = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i]!;
      const b = active[j]!;
      pairs.push({ a, b, key: createPairKey(a.id, b.id) });
    }
  }

  // 2. Score each pair: lower score = higher priority
  // Order of importance:
  //   primary  : fewest comparisons (uncertainty)
  //   secondary: not recently skipped
  //   tertiary : not on recent-pair cooldown
  //   quaternary: ELO proximity (close ratings = informative)
  const scored = pairs.map((p) => {
    const minComparisons = Math.min(p.a.comparisonCount, p.b.comparisonCount);
    const eloDiff = Math.abs(p.a.eloScore - p.b.eloScore);
    const onCooldown = recentPairs.has(p.key) ? 1 : 0;
    const skipPenalty = recentSkips.has(p.key) ? 1 : 0;

    const score =
      minComparisons * 1_000_000 + // primary: uncertainty
      skipPenalty * 100_000 +      // secondary: avoid just-skipped pairs
      onCooldown * 10_000 +        // tertiary: avoid recent pairs
      eloDiff;                     // quaternary: prefer close ELO

    return { ...p, score };
  });

  // 3. Sort by score ascending (best pair first)
  scored.sort((a, b) => a.score - b.score);

  // 4. Among ties at the best score, pick randomly
  const bestScore = scored[0]!.score;
  const topTier = scored.filter((s) => s.score === bestScore);
  const pick = topTier[Math.floor(Math.random() * topTier.length)]!;

  // 5. If we picked a previously-skipped pair, clear it from the queue
  //    so it doesn't keep accumulating penalty.
  if (recentSkips.has(pick.key)) {
    recentSkips.delete(pick.key);
  }

  return { itemA: pick.a, itemB: pick.b };
}
