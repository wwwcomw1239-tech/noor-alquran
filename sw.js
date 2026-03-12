const CACHE_NAME = 'noor-alquran-v10';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/books.html',
  '/clips.html',
  '/about.html',
  '/css/style.css',
  '/js/main.js',
  '/js/search.js',
  '/js/data.js'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('Opened cache v10');
      try {
        await cache.addAll(ASSETS_TO_CACHE);
      } catch (e) {
        console.error('Cache addAll failed:', e);
      }
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch Event — Network First, fallback to Cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // تخزين نسخة في الكاش عند كل تحميل ناجح
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
