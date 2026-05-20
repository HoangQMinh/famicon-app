// Service Worker — fc-shell-v1
// Strategy: network-first for API/Supabase, cache-first for shell assets,
// offline fallback to /offline.html for navigation requests.
// Push handler and notificationclick handler preserved from Sprint 5.

const CACHE_NAME = 'fc-shell-v1';

// Shell assets to pre-cache on install
const SHELL_ASSETS = [
  '/offline.html',
  '/icon-192.png',
  '/manifest.json',
];

// Match Supabase URLs for network-first treatment
function isApiOrSupabaseRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co')
  );
}

// ---------------------------------------------------------------------------
// Install: pre-cache shell assets
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  // Activate immediately — don't wait for old SW to be unused
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate: delete old caches
// ---------------------------------------------------------------------------

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// ---------------------------------------------------------------------------
// Fetch: routing strategy
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-first for API and Supabase calls
  if (isApiOrSupabaseRequest(url)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If navigation and offline, return offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Network error', { status: 503 });
      })
    );
    return;
  }

  // Navigation requests: network-first, fallback to offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/offline.html').then(
          (cached) => cached || new Response('Offline', { status: 503 })
        )
      )
    );
    return;
  }

  // Cache-first for shell assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache successful responses for shell assets
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ---------------------------------------------------------------------------
// Push notifications — Sprint 5 handler (preserved, icon path fixed)
// ---------------------------------------------------------------------------

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  // Use tag to deduplicate — if two pushes arrive for the same request,
  // the browser replaces the first notification instead of stacking two.
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
      tag: data.tag || 'default',
    })
  );
});

// ---------------------------------------------------------------------------
// Notification click — Sprint 5 handler (preserved)
// ---------------------------------------------------------------------------

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Open the URL embedded in notification data.
  // clients.openWindow handles both: focusing an existing tab and opening new one.
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
