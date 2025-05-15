// Service Worker for Conjugame
const CACHE_NAME = 'conjugame-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/identify.html',
  '/choose.html',
  '/styles.css',
  '/common.js',
  '/identify.js',
  '/choose.js',
  '/languageFlags.js',
  '/pwa-install.js',
  '/fr.json',
  '/es.json',
  '/it.json',
  '/icon.png',
  '/favicon.ico',
  '/manifest.webmanifest',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js'
];

// Install event - Cache all initial resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - Return cached responses or fetch new ones
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response
        if (response) {
          return response;
        }

        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // NOTE: We could cache API calls to enhance offline capability,
                // but this would significantly increase cache size. For now,
                // we're only storing previously viewed content, not verb data.
                // This means the app will need internet connection for new verbs.
                if (!event.request.url.includes('verbe.cc')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        ).catch(() => {
          // If fetch fails (offline), attempt to serve the offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
