const CACHE_NAME = 'noor-alquran-v9';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/js/search.js'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('Opened cache v9');
      // وضعنا الملفات الأساسية فقط بدلاً من الصفحات الفرعية
      // لتجنب مشاكل التحويلات في Cloudflare
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
  // تخطي تام لطلبات الصفحات والـ API والـ data.js
  // جعل المتصفح يتولى تحميل الصفحات الفرعية مثل books.html بالكامل
  if (event.request.mode === 'navigate' || event.request.url.includes('data.js')) {
    return; // لا تتدخل إطلاقاً، دع المتصفح يعالجها (هذا يحل ERR_FAILED من جذوره)
  }

  // بالنسبة للملفات الأخرى (CSS, JS, صور)، حاول جلبها من الشبكة أولاً
  // وإذا فشل (في حال عدم وجود إنترنت)، اجلبها من الكاش
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
