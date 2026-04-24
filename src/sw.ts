/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Precache assets injected at build time by vite-plugin-pwa (injectManifest).
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

interface ReminderNotificationData {
  url?: string;
  listId?: string;
  scheduledFor?: number;
}

/**
 * Notification click → focus an existing client at the target URL if one is
 * already open, otherwise open a new window. The deep link is carried on
 * `event.notification.data.url`.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = (event.notification.data ?? {}) as ReminderNotificationData;
  const targetUrl = data.url ?? '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      // Prefer focusing an already-open client and navigating it.
      for (const client of allClients) {
        try {
          await client.focus();
          if ('navigate' in client && typeof client.navigate === 'function') {
            await client.navigate(targetUrl);
          }
          return;
        } catch {
          // fall through to open a new window
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
