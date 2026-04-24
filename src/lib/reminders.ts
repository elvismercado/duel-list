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
  const nowMin = date.getHours() * 60 + date.getMinutes();
  const s = settings.quietHoursStart * 60 + (settings.quietHoursStartMinute ?? 0);
  const e = settings.quietHoursEnd * 60 + (settings.quietHoursEndMinute ?? 0);
  if (s === e) return true; // disabled
  if (s < e) {
    // simple range, e.g. 01:00..06:00
    return nowMin < s || nowMin >= e;
  }
  // wrap-around range, e.g. 22:00..08:00 → quiet when now>=s OR now<e
  return nowMin < s && nowMin >= e;
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

/**
 * Compute the next epoch ms at which a reminder is allowed to fire, given
 * cadence, snooze, preferred time, and quiet hours. Returns null if the
 * settings disable reminders entirely.
 *
 * Algorithm:
 *  1. Earliest candidate = max(now, lastShownAt + interval, snoozedUntil).
 *  2. If `preferredHour:preferredMinute` falls today after the candidate, use
 *     today's preferred slot; else use tomorrow's. (Always snap up so we don't
 *     fire earlier than requested.)
 *  3. If the snapped time falls inside quiet hours, walk forward in 15-min
 *     steps until we land outside the window (capped at 7 days lookahead).
 */
export function nextEligibleTick(
  settings: ReminderSettings,
  now: Date = new Date(),
): number | null {
  if (!settings.enabled || settings.cadence === 'off') return null;
  const interval = cadenceToIntervalMs(
    settings.cadence,
    settings.customCount,
    settings.customUnit,
  );
  if (!isFinite(interval)) return null;

  const earliest = Math.max(
    now.getTime(),
    settings.lastShownAt !== null ? settings.lastShownAt + interval : now.getTime(),
    settings.snoozedUntil ?? 0,
  );

  // Snap to the preferred hour:minute. We pick the soonest slot >= earliest.
  const snapped = new Date(earliest);
  snapped.setSeconds(0, 0);
  const targetMin = settings.preferredHour * 60 + settings.preferredMinute;
  const snappedMin = snapped.getHours() * 60 + snapped.getMinutes();
  if (snappedMin <= targetMin) {
    snapped.setHours(settings.preferredHour, settings.preferredMinute, 0, 0);
  } else {
    // Move to tomorrow's preferred time.
    snapped.setDate(snapped.getDate() + 1);
    snapped.setHours(settings.preferredHour, settings.preferredMinute, 0, 0);
  }

  // If quiet hours apply, walk forward in 15-min steps until we land outside.
  let probe = snapped;
  const cap = snapped.getTime() + 7 * 86_400_000;
  while (!inAllowedHours(probe, settings)) {
    probe = new Date(probe.getTime() + 15 * 60_000);
    if (probe.getTime() > cap) return null;
  }
  return probe.getTime();
}


export interface ReminderCandidate {
  entry: ListEntry;
  list: ListConfig;
  duelCount: number;
  /**
   * Days since the user last opened this list. Kept for backwards-compat with
   * existing UI copy; prefer `daysSinceLastDuel` for ranking-staleness logic.
   */
  daysSinceOpened: number;
  /**
   * Days since the most recent duel for this list. Equals 365 (treated as
   * "very stale") when the list has never been duelled. This is the value
   * `pickReminderList` scores on — it matches the activity-dot semantics on
   * the home page (which also reflect duel freshness, not visit freshness).
   */
  daysSinceLastDuel: number;
  score: number;
}

/**
 * Choose the best list to nudge. Higher score wins.
 * Score = daysSinceLastDuel * 0.3 + (lessDevelopedBonus).
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
    const daysSinceLastDuel =
      entry.lastDuelAt === null || entry.lastDuelAt === undefined
        ? 365
        : Math.max(0, (now.getTime() - entry.lastDuelAt) / DAY_MS);
    // Less-developed lists get a bonus (more leverage per duel).
    const developmentBonus = duelCount < 10 ? 2 : duelCount < 50 ? 1 : 0;
    // Score by ranking-staleness, not visit-staleness, so a list opened
    // yesterday but not actually duelled in 6 weeks still surfaces.
    const score = daysSinceLastDuel * 0.3 + developmentBonus;
    candidates.push({ entry, list, duelCount, daysSinceOpened, daysSinceLastDuel, score });
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.duelCount - b.duelCount;
  });
  return candidates[0] ?? null;
}

/**
 * Weighted-random pick of a duel-eligible list, biased toward stale /
 * less-developed lists. Returns null when no list has >= 2 active items.
 */
export function pickRandomDuelList(
  entries: ListEntry[],
  getList: (id: string) => ListConfig | null,
  getHistory: (id: string) => string,
  now: Date = new Date(),
): ListEntry | null {
  const weighted: { entry: ListEntry; weight: number }[] = [];
  for (const entry of entries) {
    const list = getList(entry.id);
    if (!list) continue;
    const activeCount = list.items.filter((i) => !i.removed).length;
    if (activeCount < 2) continue;
    const duelCount = getDuelCountFromHistory(getHistory(entry.id));
    const daysSinceOpened =
      entry.lastOpened === null
        ? 365
        : Math.max(0, (now.getTime() - entry.lastOpened) / DAY_MS);
    const developmentBonus = duelCount < 10 ? 2 : duelCount < 50 ? 1 : 0;
    // Floor of 1 so even fresh, well-developed lists keep a chance.
    const weight = Math.max(1, daysSinceOpened * 0.3 + developmentBonus + 1);
    weighted.push({ entry, weight });
  }
  if (weighted.length === 0) return null;
  const total = weighted.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weighted) {
    r -= w.weight;
    if (r <= 0) return w.entry;
  }
  return weighted[weighted.length - 1]!.entry;
}
