const CACHE_NAME = 'noor-alquran-v8';
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
      console.log('Opened cache v8');
      // استخدام fetch مع تتبع التحويلات لتخزين الملفات حتى لو كان هناك Redirect
      for (let asset of ASSETS_TO_CACHE) {
        try {
          const response = await fetch(asset, { redirect: 'follow' });
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
  // 1. ملفات البيانات المتغيرة تجلب من السيرفر دائماً
  if (event.request.url.includes('data.js')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 2. طلبات التنقل (Navigate) - الحل النهائي لمشكلة ERR_FAILED 
  // المشكلة تحدث لأن Cloudflare Pages يقوم بتحويل books.html إلى books (Redirect 308)
  // والـ Service Worker يرفض الـ OpaqueRedirect لطلبات التنقل.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // نقوم بجلب الرابط مع تتبع التحويلات للحصول على استجابة 200 صريحة
      fetch(event.request.url, { redirect: 'follow' })
        .catch(() => {
          // في حال انقطاع الإنترنت، جلب من الكاش
          return caches.match(event.request).then(response => {
            return response || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 3. باقي الملفات (صور، CSS، JS غير بيانات) من الكاش أولاً
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
