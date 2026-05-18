const CACHE_NAME = 'famicon-v1'
const SHELL = ['/', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request)
    })
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  // Use tag to deduplicate — if two pushes arrive for the same request,
  // the browser replaces the first notification instead of stacking two.
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { url: data.url || '/' },
      tag: data.tag || 'default',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Open the URL embedded in notification data.
  // clients.openWindow handles both: focusing an existing tab and opening new one.
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  )
})
