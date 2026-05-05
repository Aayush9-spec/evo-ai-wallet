
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Evo AI Alert', body: 'Neural link established.' };
  
  const options = {
    body: data.body,
    icon: '/logo.png', // Fallback icon
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {action: 'explore', title: 'Open Dashboard'},
      {action: 'close', title: 'Ignore'}
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'explore') {
    clients.openWindow('/dashboard');
  }
});
