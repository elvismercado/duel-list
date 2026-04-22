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
}

export interface AppSettings {
  firstRunDone: boolean;
  theme: 'light' | 'dark' | 'system';
  homeSortOrder: 'recent' | 'a-z' | 'created' | 'custom';
  customListOrder: string[];
}
