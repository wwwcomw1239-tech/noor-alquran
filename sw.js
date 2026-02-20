const CACHE_NAME = 'noor-alquran-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/about.html',
  '/books.html',
  '/clips.html',
  '/reflections.html',
  '/404.html',
  '/css/style.css',
  '/js/main.js',
  '/js/data.js',
  '/js/search.js'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).catch(() => {
          // If network fails and request is for HTML, show 404 page
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/404.html');
          }
        });
      })
  );
});