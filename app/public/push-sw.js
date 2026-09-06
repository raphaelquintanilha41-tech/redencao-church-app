// Handlers de Web Push, injetados no service worker gerado pelo Workbox
// via `workbox.importScripts` (ver app/vite.config.ts).

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (err) {
    payload = { title: 'Redenção Church', body: event.data.text() };
  }

  const title = payload.title || 'Redenção Church';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag,
    data: { url: payload.url || '/notificacoes' },
  };

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, options);
      if (typeof payload.unreadCount === 'number' && 'setAppBadge' in self.navigator) {
        try {
          if (payload.unreadCount > 0) {
            await self.navigator.setAppBadge(payload.unreadCount);
          } else {
            await self.navigator.clearAppBadge();
          }
        } catch (err) {
          // Badge API indisponível ou falhou — ignora silenciosamente.
        }
      }
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/notificacoes';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        try {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === targetUrl && 'focus' in client) {
            await client.focus();
            return;
          }
        } catch (err) {
          // ignora URLs inválidas
        }
      }
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await client.navigate(targetUrl);
            } catch (err) {
              // navegação pode falhar entre origens — ignora
            }
          }
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});
