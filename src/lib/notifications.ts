/**
 * Browser Notification platform wrapper. Used by the in-app reminder system to
 * show OS-level notifications when the channel is `'os'` or `'both'`.
 *
 * - All notifications are fired through the active ServiceWorker registration
 *   so the click handler in `src/sw.ts` can focus / route correctly.
 * - Scheduled notifications use the experimental `TimestampTrigger` API
 *   (Chromium-only, installed PWA). On unsupported browsers `scheduleAt`
 *   resolves to `false` and the caller stays in foreground-only mode.
 */

const TAG = 'duellist-reminder';

export interface ReminderNotificationPayload {
  title: string;
  body: string;
  /** Deep link the SW will focus / open on click. */
  url: string;
  listId?: string;
  /** When this notification is supposed to fire (epoch ms). Informational. */
  scheduledFor?: number;
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function getPermission(): NotificationPermission {
  if (!notificationsSupported()) return 'denied';
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * Feature-detect scheduled-notification support. Requires both:
 * - `TimestampTrigger` constructor in the window scope
 * - An active ServiceWorker registration (otherwise we have nowhere to schedule)
 */
export async function triggerSupported(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (typeof (globalThis as { TimestampTrigger?: unknown }).TimestampTrigger === 'undefined') {
    return false;
  }
  const reg = await navigator.serviceWorker.getRegistration();
  return !!reg;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return (await navigator.serviceWorker.ready) ?? null;
  } catch {
    return null;
  }
}

/**
 * Fire an immediate notification through the SW registration.
 * Returns true on success.
 */
export async function showLocal(payload: ReminderNotificationPayload): Promise<boolean> {
  if (getPermission() !== 'granted') return false;
  const reg = await getRegistration();
  if (!reg) return false;
  try {
    await reg.showNotification(payload.title, {
      body: payload.body,
      tag: TAG,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: payload.url,
        listId: payload.listId,
        scheduledFor: payload.scheduledFor ?? Date.now(),
      },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Schedule a notification to fire at `timestamp` (epoch ms). Uses the
 * experimental `showTrigger` / `TimestampTrigger` API. Re-using the same tag
 * means a subsequent schedule replaces the previous pending notification.
 * Returns true if the schedule was accepted.
 */
export async function scheduleAt(
  payload: ReminderNotificationPayload,
  timestamp: number,
): Promise<boolean> {
  if (getPermission() !== 'granted') return false;
  if (!(await triggerSupported())) return false;
  const reg = await getRegistration();
  if (!reg) return false;
  const Trigger = (globalThis as { TimestampTrigger?: new (t: number) => unknown }).TimestampTrigger;
  if (!Trigger) return false;
  try {
    // Cancel any pending scheduled notification first so we don't stack them.
    await cancelScheduled();
    // `showTrigger` is not in the standard NotificationOptions type yet.
    await reg.showNotification(payload.title, {
      body: payload.body,
      tag: TAG,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: payload.url,
        listId: payload.listId,
        scheduledFor: timestamp,
      },
      showTrigger: new Trigger(timestamp),
    } as NotificationOptions & { showTrigger: unknown });
    return true;
  } catch {
    return false;
  }
}

/**
 * Cancel any pending (not-yet-fired) notifications with our tag.
 * `includeTriggered: false` keeps already-shown notifications visible.
 */
export async function cancelScheduled(): Promise<void> {
  const reg = await getRegistration();
  if (!reg) return;
  try {
    const pending = await reg.getNotifications({
      tag: TAG,
      includeTriggered: false,
    } as GetNotificationOptions & { includeTriggered: boolean });
    for (const n of pending) n.close();
  } catch {
    // Older browsers may not accept the includeTriggered flag — ignore.
  }
}
