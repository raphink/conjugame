// Service Worker for Conjugame
const CACHE_NAME = 'conjugame-v1';
const urlsToCache = [
  '/conjugame/',
  '/conjugame/index.html',
  '/conjugame/identify.html',
  '/conjugame/choose.html',
  '/conjugame/styles.css',
  '/conjugame/common.js',
  '/conjugame/identify.js',
  '/conjugame/choose.js',
  '/conjugame/languageFlags.js',
  '/conjugame/pwa-install.js',
  '/conjugame/fr.json',
  '/conjugame/es.json',
  '/conjugame/it.json',
  '/conjugame/icon.png',
  '/conjugame/favicon.ico',
  '/conjugame/manifest.webmanifest',
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

// Detect if user is on mobile
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Fetch event - Serve cached resources when possible
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If we have a cached version, return it
        if (response) {
          return response;
        }
        
        // Otherwise, fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if response is not valid or if it's not a GET request
            if (!response || response.status !== 200 || event.request.method !== 'GET') {
              return response;
            }
            
            // If on mobile, be more aggressive with caching to ensure offline functionality
            if (isMobile()) {
              // Clone the response as it can only be consumed once
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(() => {
            // If both cache and network fail, serve a fallback for HTML requests
            if (event.request.url.match(/\.(html)$/)) {
              return caches.match('/conjugame/index.html');
            }
            
            // Just return the error for other resource types
            return new Response('Network error occurred', {
              status: 408,
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
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
            // Remove old caches
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
