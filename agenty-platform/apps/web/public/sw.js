const CACHE_NAME = 'agenty-platform-v1.0.0'
const STATIC_CACHE_NAME = 'agenty-static-v1.0.0'
const DYNAMIC_CACHE_NAME = 'agenty-dynamic-v1.0.0'

// Assets to cache for offline functionality
const STATIC_ASSETS = [
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// API endpoints that should be cached
const CACHE_API_PATTERNS = [
  '/api/agents',
  '/api/analytics',
  '/api/providers',
  '/api/templates'
]

// Assets that should not be cached
const EXCLUDE_PATTERNS = [
  '/api/auth',
  '/api/upload',
  '/api/stream',
  'chrome-extension://',
  'moz-extension://'
]

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('[SW] Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME &&
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests with cache strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and excluded patterns
  if (request.method !== 'GET' ||
      EXCLUDE_PATTERNS.some(pattern => request.url.includes(pattern))) {
    return
  }

  // Handle different types of requests
  if (request.url.includes('/_next/static/')) {
    // Static assets - cache first strategy
    event.respondWith(handleStaticAssets(request))
  } else if (CACHE_API_PATTERNS.some(pattern => request.url.includes(pattern))) {
    // API requests - network first with cache fallback
    event.respondWith(handleAPIRequests(request))
  } else if (request.destination === 'document') {
    // HTML pages - network first with offline fallback
    event.respondWith(handlePageRequests(request))
  } else {
    // Other resources - cache first with network fallback
    event.respondWith(handleOtherRequests(request))
  }
})

// Strategy: Cache first for static assets
async function handleStaticAssets(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('[SW] Failed to handle static asset:', error)
    return new Response('Asset not available offline', { status: 503 })
  }
}

// Strategy: Network first for API requests
async function handleAPIRequests(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)

      // Check Cache-Control header before caching
      const cacheControl = networkResponse.headers.get('cache-control') || ''
      const shouldCache = !cacheControl.includes('no-store') &&
                         !cacheControl.includes('no-cache') &&
                         !cacheControl.includes('private') &&
                         (!cacheControl.includes('max-age=0') || cacheControl.includes('public'))

      if (shouldCache) {
        try {
          cache.put(request, networkResponse.clone())
        } catch (cacheError) {
          console.warn('[SW] Failed to cache API response:', cacheError)
        }
      }
    }

    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache...')

    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    return new Response(JSON.stringify({
      error: 'No network connection',
      message: 'This data is not available offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Strategy: Network first for HTML pages
async function handlePageRequests(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed for page request, trying cache...')

    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    // Return offline page as fallback
    const staticCache = await caches.open(STATIC_CACHE_NAME)
    const offlineResponse = await staticCache.match('/offline.html')
    return offlineResponse || new Response('Page not available offline', {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Strategy: Cache first for other resources
async function handleOtherRequests(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      // Return cached version and update in background
      fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone())
        }
      }).catch(() => {
        // Network failed, but we have cached version
      })
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('[SW] Failed to handle request:', error)
    return new Response('Resource not available offline', { status: 503 })
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag)

  if (event.tag === 'sync-agents') {
    event.waitUntil(syncAgents())
  } else if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics())
  }
})

// Push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push received:', event)

  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event)

  event.notification.close()

  const action = event.action
  const data = event.notification.data

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }

        // Open new window
        let url = '/'
        if (action === 'view' && data?.url) {
          url = data.url
        }

        return clients.openWindow(url)
      })
  )
})

// Periodic background sync for analytics
self.addEventListener('periodicsync', event => {
  console.log('[SW] Periodic sync triggered:', event.tag)

  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics())
  }
})

// Helper functions for background sync
async function syncAgents() {
  try {
    // Get pending agent changes from IndexedDB
    // Sync with server
    console.log('[SW] Syncing agents...')
    // Implementation would go here
  } catch (error) {
    console.error('[SW] Failed to sync agents:', error)
  }
}

async function syncAnalytics() {
  try {
    // Get pending analytics data from IndexedDB
    // Send to server
    console.log('[SW] Syncing analytics...')
    // Implementation would go here
  } catch (error) {
    console.error('[SW] Failed to sync analytics:', error)
  }
}

// Message handling for communication with main thread
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'GET_VERSION') {
    if (event.ports && event.ports.length > 0) {
      event.ports[0].postMessage({ version: CACHE_NAME })
    } else {
      console.warn('[SW] GET_VERSION request without valid ports')
    }
  }
})