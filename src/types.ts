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
  /** Epoch ms of the last item-level edit (rename or notes change). */
  updated?: number;
  /** Epoch ms of the last notes save. Cleared when notes go empty. */
  notesUpdated?: number;
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
  /** When true, item scores are shown on the duel cards. Default false (hidden). */
  showScoresDuringDuels?: boolean;
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

export type DuelMode = 'side-by-side' | 'speed-round' | 'bracket';

export interface AppSettings {
  firstRunDone: boolean;
  theme: 'light' | 'dark' | 'system';
  homeSortOrder: HomeSortMode;
  customListOrder: string[];
  duelMode: DuelMode;
  timeFormat: '12h' | '24h';
  reminders: ReminderSettings;
  /** Default kFactor (16, 32, 48) applied to newly created or imported lists. */
  defaultKFactor: number;
  /** Default sessionLength (0 = unlimited) applied to newly created or imported lists. */
  defaultSessionLength: number;
  /** Default value for `ListConfig.showScoresDuringDuels` on newly created lists. */
  defaultShowScoresDuringDuels: boolean;
}

export type ReminderCadence =
  | 'off'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom';

export type CustomCadenceUnit = 'day' | 'week' | 'month' | 'year';

export type ReminderChannel = 'in-app' | 'os' | 'both';

export interface ReminderSettings {
  enabled: boolean;
  cadence: ReminderCadence;
  /** Used when cadence === 'custom'. Range 1..99. */
  customCount: number;
  /** Used when cadence === 'custom'. */
  customUnit: CustomCadenceUnit;
  /** Local hour (0-23) preferred for showing the reminder. */
  preferredHour: number;
  /** Local minute (0-59) preferred for showing the reminder. */
  preferredMinute: number;
  /** When false, quiet hours are ignored and reminders may show at any time. */
  quietHoursEnabled: boolean;
  /** Quiet hours window.no reminders during [start, end). 0-23 each. */
  quietHoursStart: number;
  quietHoursEnd: number;
  /** Minute (0-59) component of the quiet hours window endpoints. */
  quietHoursStartMinute: number;
  quietHoursEndMinute: number;
  channel: ReminderChannel;
  /** List IDs excluded from the reminder rotation. */
  perListOptOut: string[];
  /** Epoch ms of the last reminder shown. Null = never. */
  lastShownAt: number | null;
  /** Epoch ms; reminders suppressed until this time. Null = not snoozed. */
  snoozedUntil: number | null;
}

export type HomeSortMode =
  | 'recent-desc'
  | 'recent-asc'
  | 'name-asc'
  | 'name-desc'
  | 'created-desc'
  | 'created-asc'
  | 'custom';

export type HomeSortField = 'recent' | 'name' | 'created' | 'custom';
