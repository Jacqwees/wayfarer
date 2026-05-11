// Custom service worker additions for Wayfarer — push notification handler

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Wayfarer', body: event.data.text() }
  }

  const options = {
    body: data.body ?? data.message ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/favicon-32.png',
    data: { url: data.url ?? '/' },
    vibrate: [100, 50, 100],
    tag: data.tag ?? 'wayfarer-notification',
    renotify: true,
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Wayfarer', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
