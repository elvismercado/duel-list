import { useEffect } from 'react';
import {
  getAllLists,
  getList,
  getHistory,
  getSettings,
  subscribeSettings,
} from '@/lib/storage';
import { S } from '@/lib/strings';
import {
  cancelScheduled,
  getPermission,
  notificationsSupported,
  scheduleAt,
  triggerSupported,
} from '@/lib/notifications';
import { nextEligibleTick, pickReminderList } from '@/lib/reminders';

const DEBOUNCE_MS = 30_000;

/**
 * Top-level effect that keeps a single scheduled OS notification in sync with
 * the user's current reminder settings. Mounted once in `App.tsx`.
 *
 * Triggers a re-evaluation when:
 *  - reminder settings change (subscription via `subscribeSettings`)
 *  - the page becomes visible (so background-scheduled reminders are re-armed
 *    after the user has been away)
 *
 * If the browser doesn't support `TimestampTrigger` we still call
 * `cancelScheduled()` to clean up but otherwise no-op (foreground-only mode is
 * handled directly by `Home.tsx`).
 */
export function useReminderScheduler(): void {
  useEffect(() => {
    if (!notificationsSupported()) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function debouncedReschedule() {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        if (cancelled) return;
        void reschedule();
      }, DEBOUNCE_MS);
    }

    async function reschedule() {
      const settings = getSettings();
      const reminders = settings.reminders;
      const wantsOs = reminders.channel === 'os' || reminders.channel === 'both';

      if (!wantsOs || !reminders.enabled || getPermission() !== 'granted') {
        await cancelScheduled();
        return;
      }
      if (!(await triggerSupported())) {
        // Foreground-only fallback: no scheduling possible.
        await cancelScheduled();
        return;
      }

      const tick = nextEligibleTick(reminders);
      if (tick === null) {
        await cancelScheduled();
        return;
      }

      const lists = getAllLists();
      const candidate = pickReminderList(lists, getList, getHistory, reminders);
      if (!candidate) {
        await cancelScheduled();
        return;
      }

      await scheduleAt(
        {
          title: S.settings.osNotificationTitle,
          body: S.settings.osNotificationBody(
            candidate.list.name,
            Math.round(candidate.daysSinceLastDuel),
          ),
          url: `/list/${candidate.entry.id}/duel`,
          listId: candidate.entry.id,
          scheduledFor: tick,
        },
        tick,
      );
    }

    // Initial run (no debounce) so the first paint already arms a schedule.
    void reschedule();

    const unsubSettings = subscribeSettings(() => debouncedReschedule());

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        debouncedReschedule();
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    // Permission flips (user revokes/grants notifications in browser settings)
    // don't fire any settings or visibility event. Use the Permissions API to
    // observe them directly. Guarded.Safari historically rejects the
    // 'notifications' name and Firefox <86 lacks the API entirely.
    let permStatus: PermissionStatus | null = null;
    function onPermissionChange() {
      debouncedReschedule();
    }
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'notifications' as PermissionName })
        .then((status) => {
          if (cancelled) return;
          permStatus = status;
          status.addEventListener('change', onPermissionChange);
        })
        .catch(() => {
          // Unsupported / rejected.silently fall back to settings + visibility.
        });
    }

    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
      unsubSettings();
      document.removeEventListener('visibilitychange', onVisibility);
      if (permStatus) {
        permStatus.removeEventListener('change', onPermissionChange);
      }
    };
  }, []);
}
