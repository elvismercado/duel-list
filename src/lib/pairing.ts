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

  // 1. Check skip re-queue first (highest skip count wins)
  if (recentSkips.size > 0) {
    let bestKey: string | null = null;
    let bestCount = -1;
    for (const [key, count] of recentSkips) {
      if (count > bestCount) {
        bestKey = key;
        bestCount = count;
      }
    }
    if (bestKey) {
      const [id1, id2] = bestKey.split(':') as [string, string];
      const a = active.find((i) => i.id === id1);
      const b = active.find((i) => i.id === id2);
      if (a && b) {
        recentSkips.delete(bestKey);
        return { itemA: a, itemB: b };
      }
      // If items were removed, drop this skip entry and continue
      recentSkips.delete(bestKey);
    }
  }

  // 2. Build all possible pairs
  const pairs: Array<{ a: Item; b: Item; key: string }> = [];
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i]!;
      const b = active[j]!;
      pairs.push({ a, b, key: createPairKey(a.id, b.id) });
    }
  }

  // 3. Score each pair: lower score = higher priority
  const scored = pairs.map((p) => {
    const minComparisons = Math.min(p.a.comparisonCount, p.b.comparisonCount);
    const eloDiff = Math.abs(p.a.eloScore - p.b.eloScore);
    const onCooldown = recentPairs.has(p.key) ? 1 : 0;

    // Priority: fewest comparisons first, then ELO proximity, then not-on-cooldown
    // Score components weighted to enforce priority order
    const score =
      minComparisons * 100_000 + // primary: uncertainty
      onCooldown * 10_000 + // secondary: avoid recent pairs
      eloDiff; // tertiary: prefer close ELO

    return { ...p, score };
  });

  // 4. Sort by score ascending (best pair first)
  scored.sort((a, b) => a.score - b.score);

  // 5. Among ties at the best score, pick randomly
  const bestScore = scored[0]!.score;
  const topTier = scored.filter((s) => s.score === bestScore);
  const pick = topTier[Math.floor(Math.random() * topTier.length)]!;

  return { itemA: pick.a, itemB: pick.b };
}
