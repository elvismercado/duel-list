import type { AppSettings, ListConfig } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PREFIX = 'duellist:';
const KEY_LISTS = `${PREFIX}lists`;
const KEY_SETTINGS = `${PREFIX}settings`;
const listKey = (id: string) => `${PREFIX}list:${id}`;
const historyKey = (id: string) => `${PREFIX}history:${id}`;

const DB_NAME = 'DuelListDB';
const DB_VERSION = 1;
const STORE_FILE_HANDLES = 'fileHandles';

const QUOTA_LIMIT = 5_000_000; // ~5 MB estimate

// ---------------------------------------------------------------------------
// List registry
// ---------------------------------------------------------------------------

export interface ListEntry {
  id: string;
  name: string;
  lastOpened: number | null;
  /**
   * Epoch ms of the last recorded duel for this list. Null = never duelled.
   * Maintained by `markDuelRecorded`. Pre-existing entries are lazily
   * backfilled by `getAllLists` from the history file the first time they're
   * read after the field was introduced.
   */
  lastDuelAt?: number | null;
}

export function getAllLists(): ListEntry[] {
  const raw = localStorage.getItem(KEY_LISTS);
  if (!raw) return [];
  const entries = JSON.parse(raw) as ListEntry[];
  // Lazy backfill: any entry created before `lastDuelAt` existed has the
  // field undefined. Parse the latest @iso suffix in the history file once
  // and persist the result so subsequent renders are O(1).
  let mutated = false;
  for (const e of entries) {
    if (e.lastDuelAt === undefined) {
      e.lastDuelAt = parseLastDuelTimestamp(getHistory(e.id));
      mutated = true;
    }
  }
  if (mutated) saveRegistry(entries);
  return entries;
}

function parseLastDuelTimestamp(history: string): number | null {
  if (!history) return null;
  // Match the most recent ISO timestamp suffix (`@2026-04-23T14:32:05.847Z`).
  // History grows append-only so the last match in the string is the newest.
  const matches = history.match(/@(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/g);
  if (!matches || matches.length === 0) return null;
  const last = matches[matches.length - 1]!.slice(1);
  const t = Date.parse(last);
  return Number.isFinite(t) ? t : null;
}

function saveRegistry(entries: ListEntry[]): void {
  localStorage.setItem(KEY_LISTS, JSON.stringify(entries));
}

// ---------------------------------------------------------------------------
// List CRUD
// ---------------------------------------------------------------------------

export function getList(listId: string): ListConfig | null {
  const raw = localStorage.getItem(listKey(listId));
  if (!raw) return null;
  return JSON.parse(raw) as ListConfig;
}

export function saveList(config: ListConfig): void {
  localStorage.setItem(listKey(config.id), JSON.stringify(config));

  const entries = getAllLists();
  const idx = entries.findIndex((e) => e.id === config.id);
  const previous = idx === -1 ? null : entries[idx]!;
  const entry: ListEntry = {
    id: config.id,
    name: config.name,
    lastOpened: Date.now(),
    // Preserve the previous duel timestamp on rename/save.only `markDuelRecorded`
    // should advance it.
    lastDuelAt: previous?.lastDuelAt ?? null,
  };

  if (idx === -1) {
    entries.push(entry);
  } else {
    entries[idx] = entry;
  }
  saveRegistry(entries);
}

export function deleteList(listId: string): void {
  // 1. Remove list data
  localStorage.removeItem(listKey(listId));

  // 2. Remove from registry
  const entries = getAllLists().filter((e) => e.id !== listId);
  saveRegistry(entries);

  // 3. Remove history
  localStorage.removeItem(historyKey(listId));

  // 4. Remove from custom order in settings
  const settings = getSettings();
  const orderIdx = settings.customListOrder.indexOf(listId);
  if (orderIdx !== -1) {
    settings.customListOrder.splice(orderIdx, 1);
    updateSettings({ customListOrder: settings.customListOrder });
  }

  // 5. Remove file handle (async, fire-and-forget)
  deleteFileHandle(listId).catch(() => {});
}

/**
 * Apply a single field value to every list. Bypasses the registry update so
 * `lastOpened` is not bumped (which would reorder Home in "Recent" sort).
 * Returns the number of lists updated.
 */
export function applyDefaultToAllLists(
  field: 'kFactor' | 'sessionLength',
  value: number,
): number {
  const entries = getAllLists();
  let count = 0;
  for (const e of entries) {
    const list = getList(e.id);
    if (!list) continue;
    if (list[field] === value) continue;
    list[field] = value;
    localStorage.setItem(listKey(list.id), JSON.stringify(list));
    count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// History (raw markdown strings)
// ---------------------------------------------------------------------------

export function getHistory(listId: string): string {
  return localStorage.getItem(historyKey(listId)) ?? '';
}

export function saveHistory(listId: string, markdown: string): void {
  localStorage.setItem(historyKey(listId), markdown);
}

/**
 * Update a list entry's `lastDuelAt` to the current time. Called by the
 * history-append path so the activity dot and reminder scorer can rely on a
 * cheap timestamp instead of re-parsing the history string on every render.
 */
export function markDuelRecorded(listId: string): void {
  const entries = getAllLists();
  const idx = entries.findIndex((e) => e.id === listId);
  if (idx === -1) return;
  entries[idx]!.lastDuelAt = Date.now();
  saveRegistry(entries);
}

// ---------------------------------------------------------------------------
// App settings
// ---------------------------------------------------------------------------

const DEFAULT_REMINDERS: AppSettings['reminders'] = {
  enabled: false,
  cadence: 'daily',
  customCount: 3,
  customUnit: 'week',
  preferredHour: 19,
  preferredMinute: 0,
  quietHoursEnabled: false,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  quietHoursStartMinute: 0,
  quietHoursEndMinute: 0,
  channel: 'in-app',
  perListOptOut: [],
  lastShownAt: null,
  snoozedUntil: null,
};

// Migrate legacy reminder shape (customPerWeek, 'few-per-week' cadence) to the
// new customCount/customUnit + simplified cadence.
function migrateReminders(
  raw: unknown,
): AppSettings['reminders'] {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_REMINDERS };
  const r = raw as Record<string, unknown> & {
    customPerWeek?: number;
    cadence?: string;
  };
  const merged = { ...DEFAULT_REMINDERS, ...(r as Partial<AppSettings['reminders']>) };
  // Legacy customPerWeek -> customCount/customUnit
  if (typeof r.customPerWeek === 'number' && typeof r.customCount !== 'number') {
    merged.customCount = r.customPerWeek;
    merged.customUnit = 'week';
  }
  // Legacy 'few-per-week' cadence -> custom 3/week
  if (r.cadence === 'few-per-week') {
    merged.cadence = 'custom';
    if (typeof r.customPerWeek !== 'number') {
      merged.customCount = 3;
      merged.customUnit = 'week';
    }
  }
  // 'off' is no longer a UI option; the master enabled toggle handles disable.
  // Remap to 'daily' so users land on a valid preset.
  if (merged.cadence === 'off') {
    merged.cadence = 'daily';
  }
  return merged;
}

const DEFAULT_SETTINGS: AppSettings = {
  firstRunDone: false,
  theme: 'system',
  homeSortOrder: 'recent-desc',
  customListOrder: [],
  duelMode: 'side-by-side',
  timeFormat: '24h',
  reminders: DEFAULT_REMINDERS,
  defaultKFactor: 32,
  defaultSessionLength: 10,
};

// Migrate legacy homeSortOrder values to the new field+direction shape.
function migrateHomeSort(value: unknown): AppSettings['homeSortOrder'] {
  switch (value) {
    case 'recent': return 'recent-desc';
    case 'a-z': return 'name-asc';
    case 'created': return 'created-desc';
    case 'recent-desc':
    case 'recent-asc':
    case 'name-asc':
    case 'name-desc':
    case 'created-desc':
    case 'created-asc':
    case 'custom':
      return value;
    default:
      return 'recent-desc';
  }
}

export function getSettings(): AppSettings {
  const raw = localStorage.getItem(KEY_SETTINGS);
  if (!raw) return { ...DEFAULT_SETTINGS };
  const parsed = JSON.parse(raw) as Partial<AppSettings> & {
    homeSortOrder?: unknown;
    reminders?: unknown;
  };
  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    homeSortOrder: migrateHomeSort(parsed.homeSortOrder),
    reminders: migrateReminders(parsed.reminders),
  };
}

export function updateSettings(partial: Partial<AppSettings>): void {
  const current = getSettings();
  localStorage.setItem(
    KEY_SETTINGS,
    JSON.stringify({ ...current, ...partial }),
  );
  for (const fn of settingsListeners) {
    try {
      fn();
    } catch {
      // listener errors must not break the settings write
    }
  }
}

const settingsListeners = new Set<() => void>();

/**
 * Subscribe to in-process settings updates. Fires after every successful
 * `updateSettings` call. Returns an unsubscribe function.
 *
 * Note: this only catches updates from the same tab. Cross-tab updates would
 * need a separate `storage` event listener.
 */
export function subscribeSettings(listener: () => void): () => void {
  settingsListeners.add(listener);
  return () => {
    settingsListeners.delete(listener);
  };
}

// ---------------------------------------------------------------------------
// Quota monitoring
// ---------------------------------------------------------------------------

export function getStorageUsage(): {
  current: number;
  limit: number;
  percentage: number;
} {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) {
      total += key.length + (localStorage.getItem(key)?.length ?? 0);
    }
  }
  // Characters are UTF-16 → ~2 bytes each
  const bytes = total * 2;
  return {
    current: bytes,
    limit: QUOTA_LIMIT,
    percentage: Math.round((bytes / QUOTA_LIMIT) * 100),
  };
}

export function isQuotaNearLimit(): boolean {
  return getStorageUsage().percentage > 80;
}

// ---------------------------------------------------------------------------
// IndexedDB.file handle persistence
// ---------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_FILE_HANDLES)) {
        db.createObjectStore(STORE_FILE_HANDLES, { keyPath: 'listId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getFileHandle(
  listId: string,
): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FILE_HANDLES, 'readonly');
      const store = tx.objectStore(STORE_FILE_HANDLES);
      const req = store.get(listId);
      req.onsuccess = () => {
        const result = req.result as
          | { listId: string; handle: FileSystemFileHandle }
          | undefined;
        resolve(result?.handle ?? null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveFileHandle(
  listId: string,
  handle: FileSystemFileHandle,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILE_HANDLES, 'readwrite');
    const store = tx.objectStore(STORE_FILE_HANDLES);
    store.put({ listId, handle });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFileHandle(listId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FILE_HANDLES, 'readwrite');
      const store = tx.objectStore(STORE_FILE_HANDLES);
      store.delete(listId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // IndexedDB unavailable.silently ignore
  }
}

/**
 * Returns the set of list IDs that have a persisted file handle (linked or
 * needs-relink). Excludes ":history" companion handles.
 */
export async function listLinkedListIds(): Promise<Set<string>> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FILE_HANDLES, 'readonly');
      const store = tx.objectStore(STORE_FILE_HANDLES);
      const req = store.getAllKeys();
      req.onsuccess = () => {
        const keys = (req.result ?? []) as string[];
        resolve(new Set(keys.filter((k) => !k.includes(':'))));
      };
      req.onerror = () => resolve(new Set());
    });
  } catch {
    return new Set();
  }
}

/**
 * Returns a map of list IDs to their link status by silently querying
 * file handle permissions (no browser dialog).
 * 'linked' = handle exists and permission is granted.
 * 'broken' = handle exists but permission is denied or needs prompting.
 */
export async function listLinkedListIdsWithStatus(): Promise<Map<string, 'linked' | 'broken'>> {
  const { queryPermissionSilently } = await import('@/lib/file-sync');
  const result = new Map<string, 'linked' | 'broken'>();
  try {
    const db = await openDB();
    const entries = await new Promise<Array<{ listId: string; handle: FileSystemFileHandle }>>((resolve) => {
      const tx = db.transaction(STORE_FILE_HANDLES, 'readonly');
      const store = tx.objectStore(STORE_FILE_HANDLES);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result ?? []) as Array<{ listId: string; handle: FileSystemFileHandle }>);
      req.onerror = () => resolve([]);
    });
    const listEntries = entries.filter((e) => !e.listId.includes(':'));
    await Promise.all(
      listEntries.map(async (e) => {
        try {
          const state = await queryPermissionSilently(e.handle);
          result.set(e.listId, state === 'granted' ? 'linked' : 'broken');
        } catch {
          result.set(e.listId, 'broken');
        }
      }),
    );
  } catch {
    // DB error — return empty map
  }
  return result;
}
