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
}

export function getAllLists(): ListEntry[] {
  const raw = localStorage.getItem(KEY_LISTS);
  if (!raw) return [];
  return JSON.parse(raw) as ListEntry[];
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
  const entry: ListEntry = {
    id: config.id,
    name: config.name,
    lastOpened: Date.now(),
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

// ---------------------------------------------------------------------------
// History (raw markdown strings)
// ---------------------------------------------------------------------------

export function getHistory(listId: string): string {
  return localStorage.getItem(historyKey(listId)) ?? '';
}

export function saveHistory(listId: string, markdown: string): void {
  localStorage.setItem(historyKey(listId), markdown);
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
// IndexedDB — file handle persistence
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
    // IndexedDB unavailable — silently ignore
  }
}
