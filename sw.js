const CACHE_NAME = 'noor-alquran-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/about.html',
  '/books.html',
  '/clips.html',
  '/css/style.css',
  '/js/main.js',
  '/js/data.js',
  '/js/search.js'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('Opened cache');
      // استخدام fetch مع تتبع التحويلات (redirects) لتجنب فشل الكاش
      // لأن Cloudflare Pages يقوم بتحويل index.html إلى /
      for (let asset of ASSETS_TO_CACHE) {
        try {
          const request = new Request(asset, { cache: 'reload' });
          const response = await fetch(request, { redirect: 'follow' });
          if (response && response.ok) {
            await cache.put(asset, response);
          }
        } catch (e) {
          console.error('Failed to cache:', asset, e);
        }
      }
    }).then(() => self.skipWaiting())
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
  // Always fetch dynamic data files like data.js from the network first
  if (event.request.url.includes('data.js')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // بالنسبة لطلبات التنقل (Navigate) لتجنب خطأ ERR_FAILED مع Cloudflare Pages Redirects
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then(response => {
          return response || caches.match('/index.html');
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
