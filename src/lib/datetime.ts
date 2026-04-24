// Centralised date/time formatting.
//
// Conventions:
// - Per-duel timestamps in markdown lines and any future merge logic use
//   ISO-8601 UTC with milliseconds (`d.toISOString()`).
// - User-facing grouping/display dates use LOCAL `YYYY-MM-DD` so a duel at
//   23:30 local stays on "today" for the user.
// - Times displayed to the user are local `HH:MM` (24h).
// - Numeric epoch ms (`Date.now()`) is used for `lastOpened` and in-memory
//   `DuelRecord.timestamp`.those are never formatted by this module.

/** Local-calendar `YYYY-MM-DD`. */
export function formatLocalDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local 24h `HH:MM`. */
export function formatLocalTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export type TimeFormat = '12h' | '24h';

/** Format a Date's clock time according to the user's preferred format. */
export function formatTimeOfDay(d: Date, fmt: TimeFormat): string {
  return formatHourMinute(d.getHours(), d.getMinutes(), fmt);
}

/** Format raw hour (0-23) and minute (0-59) ints. */
export function formatHourMinute(
  hour: number,
  minute: number,
  fmt: TimeFormat,
): string {
  const m = String(minute).padStart(2, '0');
  if (fmt === '24h') {
    return `${String(hour).padStart(2, '0')}:${m}`;
  }
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${period}`;
}

/**
 * Extract a trailing ` @<value>` timestamp suffix from a history entry line.
 * Recognises:
 *   - ISO-8601 UTC (e.g. `2026-04-23T14:32:05.847Z`)
 *   - Legacy local `HH:MM` or `HH:MM:SS`
 * Returns the body without the suffix and the parsed pieces.
 */
export function parseTimestampSuffix(raw: string): {
  body: string;
  tsIso: string | null;
  localTime: string | null;
} {
  const match = / @(\S+)\s*$/.exec(raw);
  if (!match) return { body: raw, tsIso: null, localTime: null };
  const value = match[1]!;
  const body = raw.slice(0, match.index);

  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return { body, tsIso: value, localTime: formatLocalTime(d) };
    }
  } else if (/^\d{2}:\d{2}/.test(value)) {
    return { body, tsIso: null, localTime: value.slice(0, 5) };
  }

  // Unknown suffix.strip it but report nothing.
  return { body, tsIso: null, localTime: null };
}
