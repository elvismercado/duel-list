import type { ListEntry } from '@/lib/storage';
import type {
  CustomCadenceUnit,
  ListConfig,
  ReminderCadence,
  ReminderSettings,
} from '@/types';
import { getDuelCountFromHistory } from '@/lib/history';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;
const YEAR_MS = 365 * DAY_MS;

function unitToMs(unit: CustomCadenceUnit): number {
  switch (unit) {
    case 'day': return DAY_MS;
    case 'week': return WEEK_MS;
    case 'month': return MONTH_MS;
    case 'year': return YEAR_MS;
  }
}

/**
 * Minimum interval (ms) between reminders for a given cadence.
 * For 'custom', divides the unit period by `customCount`.
 */
export function cadenceToIntervalMs(
  cadence: ReminderCadence,
  customCount: number,
  customUnit: CustomCadenceUnit,
): number {
  switch (cadence) {
    case 'off':
      return Number.POSITIVE_INFINITY;
    case 'daily':
      return DAY_MS;
    case 'weekly':
      return WEEK_MS;
    case 'monthly':
      return MONTH_MS;
    case 'custom': {
      const n = Math.max(1, Math.min(99, customCount));
      return unitToMs(customUnit) / n;
    }
  }
}

/** True when `now` is OUTSIDE the quiet-hours window (i.e. allowed). */
export function inAllowedHours(date: Date, settings: ReminderSettings): boolean {
  if (!settings.quietHoursEnabled) return true;
  const h = date.getHours();
  const { quietHoursStart: s, quietHoursEnd: e } = settings;
  if (s === e) return true; // disabled
  if (s < e) {
    // simple range, e.g. 1..6
    return h < s || h >= e;
  }
  // wrap-around range, e.g. 22..8 → quiet when h>=22 OR h<8
  return h < s && h >= e;
}

export function isReminderDue(
  settings: ReminderSettings,
  now: Date = new Date(),
): boolean {
  if (!settings.enabled || settings.cadence === 'off') return false;
  const t = now.getTime();
  if (settings.snoozedUntil && t < settings.snoozedUntil) return false;
  if (!inAllowedHours(now, settings)) return false;
  const interval = cadenceToIntervalMs(
    settings.cadence,
    settings.customCount,
    settings.customUnit,
  );
  if (settings.lastShownAt === null) return true;
  return t - settings.lastShownAt >= interval;
}

export interface ReminderCandidate {
  entry: ListEntry;
  list: ListConfig;
  duelCount: number;
  daysSinceOpened: number;
  score: number;
}

/**
 * Choose the best list to nudge. Higher score wins.
 * Score = daysSinceOpened * 0.3 + (lessDevelopedBonus).
 * Excludes opted-out lists and lists with < 2 active items.
 */
export function pickReminderList(
  entries: ListEntry[],
  getList: (id: string) => ListConfig | null,
  getHistory: (id: string) => string,
  settings: ReminderSettings,
  now: Date = new Date(),
): ReminderCandidate | null {
  const optOut = new Set(settings.perListOptOut);
  const candidates: ReminderCandidate[] = [];

  for (const entry of entries) {
    if (optOut.has(entry.id)) continue;
    const list = getList(entry.id);
    if (!list) continue;
    const activeCount = list.items.filter((i) => !i.removed).length;
    if (activeCount < 2) continue;
    const duelCount = getDuelCountFromHistory(getHistory(entry.id));
    const daysSinceOpened =
      entry.lastOpened === null
        ? 365
        : Math.max(0, (now.getTime() - entry.lastOpened) / DAY_MS);
    // Less-developed lists get a bonus (more leverage per duel).
    const developmentBonus = duelCount < 10 ? 2 : duelCount < 50 ? 1 : 0;
    const score = daysSinceOpened * 0.3 + developmentBonus;
    candidates.push({ entry, list, duelCount, daysSinceOpened, score });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.duelCount - b.duelCount;
  });
  return candidates[0] ?? null;
}
