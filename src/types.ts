export interface Item {
  id: string;
  name: string;
  metadata?: Record<string, string>;
  eloScore: number;
  prevEloScore: number;
  prevRank: number;
  comparisonCount: number;
  added: string;
  removed?: boolean;
  /** Free-text user notes about this item. Empty/undefined when none. */
  notes?: string;
}

export interface DuelRecord {
  itemA: string;
  itemB: string;
  winner: string | null;
  timestamp: number;
}

export interface ListConfig {
  id: string;
  name: string;
  sessionLength: number;
  kFactor: number;
  created: string;
  items: Item[];
  /** Display mode for ranked items: rank position (default) or ELO score. */
  displayMode?: 'rank' | 'elo';
  /** Sort order applied to the rankings list view. */
  sortMode?: SortMode;
}

export type SortMode =
  | 'rank-desc'
  | 'rank-asc'
  | 'elo-desc'
  | 'elo-asc'
  | 'added-desc'
  | 'added-asc'
  | 'name-asc'
  | 'name-desc';

export interface AppSettings {
  firstRunDone: boolean;
  theme: 'light' | 'dark' | 'system';
  homeSortOrder: 'recent' | 'a-z' | 'created' | 'custom';
  customListOrder: string[];
  duelMode: 'side-by-side' | 'swipe';
}
