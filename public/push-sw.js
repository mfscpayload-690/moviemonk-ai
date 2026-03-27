self.addEventListener('push', (event) => {
  const defaultPayload = {
    title: 'MovieMonk',
    body: 'You have a new notification.',
    icon: '/asset/android-chrome-192x192.png',
    badge: '/asset/favicon-32x32.png',
    data: { url: '/' }
  };

  let payload = defaultPayload;
  try {
    const parsed = event.data ? event.data.json() : null;
    if (parsed && typeof parsed === 'object') {
      payload = {
        ...defaultPayload,
        ...parsed,
        data: { ...defaultPayload.data, ...(parsed.data || {}) }
      };
    }
  } catch {
    // Ignore malformed payload and show default notification.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      data: payload.data,
      renotify: false,
      requireInteraction: false
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((client) => client.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(targetUrl);
        return;
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
