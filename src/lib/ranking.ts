import type { Item } from '@/types';
import type { SortMode } from '@/types';

// ---------------------------------------------------------------------------
// ELO calculation
// ---------------------------------------------------------------------------

export function calculateEloChange(
  winnerOldElo: number,
  loserOldElo: number,
  kFactor: number,
  result: 'win' | 'tie',
): { winnerNewElo: number; loserNewElo: number } {
  const expectedWinner =
    1 / (1 + Math.pow(10, (loserOldElo - winnerOldElo) / 400));
  const expectedLoser = 1 - expectedWinner;

  let actualWinner: number;
  let actualLoser: number;

  if (result === 'win') {
    actualWinner = 1;
    actualLoser = 0;
  } else {
    // tie
    actualWinner = 0.5;
    actualLoser = 0.5;
  }

  return {
    winnerNewElo: Math.round(
      winnerOldElo + kFactor * (actualWinner - expectedWinner),
    ),
    loserNewElo: Math.round(
      loserOldElo + kFactor * (actualLoser - expectedLoser),
    ),
  };
}

// ---------------------------------------------------------------------------
// Item helpers
// ---------------------------------------------------------------------------

export function updateItemElo(item: Item, newElo: number): void {
  item.eloScore = newElo;
  item.comparisonCount += 1;
}

export function sortItemsByElo(items: Item[]): Item[] {
  return [...items].sort((a, b) => b.eloScore - a.eloScore);
}

export function getItemRank(
  sortedItems: Item[],
  targetItemId: string,
): number {
  const idx = sortedItems.findIndex((i) => i.id === targetItemId);
  return idx === -1 ? -1 : idx + 1;
}

/**
 * Reorder a canonical-by-ELO array for display only. Rank numbers (1..N) come
 * from the input ELO order; this just permutes for the user-chosen view.
 */
export function applyDisplaySort(
  itemsSortedByElo: Item[],
  mode: SortMode,
): Item[] {
  const a = [...itemsSortedByElo];
  switch (mode) {
    case 'rank-desc':
      return a;
    case 'rank-asc':
      return a.reverse();
    case 'elo-desc':
      return a.sort((x, y) => y.eloScore - x.eloScore);
    case 'elo-asc':
      return a.sort((x, y) => x.eloScore - y.eloScore);
    case 'added-desc':
      return a.sort((x, y) => (y.added ?? '').localeCompare(x.added ?? ''));
    case 'added-asc':
      return a.sort((x, y) => (x.added ?? '').localeCompare(y.added ?? ''));
    case 'name-asc':
      return a.sort((x, y) => x.name.localeCompare(y.name));
    case 'name-desc':
      return a.sort((x, y) => y.name.localeCompare(x.name));
  }
}

export type SortField = 'rank' | 'elo' | 'added' | 'name';
export type SortDir = 'asc' | 'desc';

export function splitSortMode(mode: SortMode): { field: SortField; dir: SortDir } {
  const [field, dir] = mode.split('-') as [SortField, SortDir];
  return { field, dir };
}

export function joinSortMode(field: SortField, dir: SortDir): SortMode {
  return `${field}-${dir}` as SortMode;
}

// ---------------------------------------------------------------------------
// Session snapshot helpers
// ---------------------------------------------------------------------------

export function captureSessionSnapshot(
  items: Item[],
): { prevElo: Map<string, number>; prevRank: Map<string, number> } {
  const sorted = sortItemsByElo(items);
  const prevElo = new Map<string, number>();
  const prevRank = new Map<string, number>();

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i]!;
    prevElo.set(item.id, item.eloScore);
    prevRank.set(item.id, i + 1);
  }

  return { prevElo, prevRank };
}

export function calculateBiggestMovers(
  items: Item[],
  prevRankMap: Map<string, number>,
): Array<{ item: Item; rankChange: number }> {
  const sorted = sortItemsByElo(items);

  const movers = sorted
    .map((item, idx) => {
      const oldRank = prevRankMap.get(item.id) ?? idx + 1;
      const newRank = idx + 1;
      // Positive = climbed (old 5 → new 2 = +3)
      return { item, rankChange: oldRank - newRank };
    })
    .filter((m) => m.rankChange !== 0)
    .sort((a, b) => Math.abs(b.rankChange) - Math.abs(a.rankChange));

  return movers.slice(0, 3);
}
