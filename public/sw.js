/* eslint-disable no-restricted-globals */
'use strict';

// event.data.json() retorna uma Promise — é preciso aguardar antes de usar o payload
self.addEventListener('push', function (event) {
  if (!event.data) return;
  var promise = Promise.resolve()
    .then(function () {
      if (typeof event.data.json === 'function') {
        return event.data.json();
      }
      return { title: 'Dome', body: '', url: '/dashboard/comunidade', tag: 'notification' };
    })
    .then(function (payload) {
      var title = payload.title || 'Dome';
      var body = payload.body || '';
      var url = payload.url || '/dashboard/comunidade';
      var tag = payload.tag || 'notification';
      return self.registration.showNotification(title, {
        body: body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: tag,
        data: { url: url },
        requireInteraction: tag === 'test',
      });
    })
    .catch(function () {
      return self.registration.showNotification('Dome', {
        body: 'Nova notificação',
        icon: '/icon.svg',
        tag: 'notification',
        data: { url: '/dashboard/comunidade' },
      });
    });
  event.waitUntil(promise);
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/dashboard/comunidade';
  var fullUrl = new URL(url, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url && client.focus) {
          client.navigate(fullUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl);
      }
    })
  );
});
