/**
 * Persistent ring buffer for runtime errors caught by the error boundary or
 * React Router's `errorElement`. Survives reloads so the user can copy details
 * after recovering. Best-effort: any storage failure is swallowed.
 */

const KEY = 'duel-list:error-log:v1';
const MAX_ENTRIES = 10;

export type ErrorSource = 'boundary' | 'route' | 'manual';

export interface ErrorLogEntry {
  ts: number;
  source: ErrorSource;
  message: string;
  stack: string;
  ua: string;
  path: string;
}

function readAll(): ErrorLogEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ErrorLogEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: ErrorLogEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // quota / serialization — give up silently
  }
}

export function appendError(
  err: unknown,
  source: ErrorSource,
): ErrorLogEntry {
  const e = err instanceof Error ? err : new Error(String(err));
  const entry: ErrorLogEntry = {
    ts: Date.now(),
    source,
    message: e.message || 'Unknown error',
    stack: e.stack ?? '',
    ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    path: typeof location !== 'undefined' ? location.pathname + location.search : '',
  };
  const next = [entry, ...readAll()].slice(0, MAX_ENTRIES);
  writeAll(next);
  return entry;
}

export function getLastError(): ErrorLogEntry | null {
  return readAll()[0] ?? null;
}

export function getErrorLog(): ErrorLogEntry[] {
  return readAll();
}

export function clearErrorLog() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function formatErrorForCopy(entry: ErrorLogEntry): string {
  return [
    `Time: ${new Date(entry.ts).toISOString()}`,
    `Source: ${entry.source}`,
    `Path: ${entry.path}`,
    `UA: ${entry.ua}`,
    `Message: ${entry.message}`,
    '',
    'Stack:',
    entry.stack || '(no stack)',
  ].join('\n');
}
