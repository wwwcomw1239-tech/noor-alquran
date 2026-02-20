/* =========================================
   يوتيوب — تحميل المقاطع تلقائياً
   المصدر: YouTube RSS → rss2json.com
   الكاش: localStorage (5 دقائق)
   المطوّر: داوود الاحمدي
   ========================================= */

(function () {
  'use strict';

  var PLAYLIST_ID = 'PLVbjqy4Qzz1NWqxom2befYJBuB99zcd9e';
  var CACHE_KEY   = 'yt_pl_' + PLAYLIST_ID;
  var CACHE_TTL   = 5 * 60 * 1000; // 5 دقائق بالميلي ثانية

  var RSS_URL = 'https://www.youtube.com/feeds/videos.xml?playlist_id=' + PLAYLIST_ID;
  var API_URL = 'https://api.rss2json.com/v1/api.json?rss_url=' +
                encodeURIComponent(RSS_URL) + '&count=50';

  /* ══════════════════════════════
     كاش localStorage
     ══════════════════════════════ */
  function loadCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() - obj.ts > CACHE_TTL) return null;
      return obj.items;
    } catch (e) { return null; }
  }

  function saveCache(items) {
    try {
      localStorage.setItem(CACHE_KEY,
        JSON.stringify({ ts: Date.now(), items: items }));
    } catch (e) {}
  }

  /* ══════════════════════════════
     مساعدات
     ══════════════════════════════ */
  function vidId(link) {
    var m = String(link || '').match(/[?&]v=([^&]+)/);
    return m ? m[1] : '';
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtDate(str) {
    if (!str) return '';
    try {
      var d = new Date(str);
      var months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                    'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    } catch (e) { return ''; }
  }

  /* ══════════════════════════════
     رسم البطاقات
     ══════════════════════════════ */
  function renderCards(items) {
    var grid = document.getElementById('ytVideosGrid');
    if (!grid) return;

    if (!items || !items.length) {
      grid.innerHTML = '<p class="yt-empty">لا توجد مقاطع متاحة حالياً</p>';
      return;
    }

    grid.innerHTML = items.map(function (item) {
      var id    = vidId(item.link);
      var thumb = id ? 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg' : '';
      var date  = fmtDate(item.pubDate);

      return (
        '<article class="yt-card" data-vid="' + escHtml(id) + '" ' +
        'tabindex="0" role="button" aria-label="' + escHtml(item.title) + '">' +
          '<div class="yt-thumb">' +
            (thumb ? '<img src="' + thumb + '" alt="" loading="lazy">' : '<div class="yt-no-thumb"></div>') +
            '<span class="yt-play-btn" aria-hidden="true">&#9654;</span>' +
          '</div>' +
          '<div class="yt-info">' +
            '<h3 class="yt-title">' + escHtml(item.title) + '</h3>' +
            (date ? '<span class="yt-date">' + date + '</span>' : '') +
          '</div>' +
        '</article>'
      );
    }).join('');

    /* أحداث النقر والكيبورد */
    grid.querySelectorAll('.yt-card').forEach(function (card) {
      function act() { openModal(card.dataset.vid); }
      card.addEventListener('click', act);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
      });
    });

    /* تحديث SITE_DATA لتكامل البحث */
    try {
      if (window.SITE_DATA) {
        SITE_DATA.clips = items.map(function (item) {
          return {
            type:  'مقطع',
            title: item.title,
            desc:  (item.description || '').replace(/<[^>]+>/g, '').slice(0, 160),
            page:  item.link
          };
        });
      }
    } catch (e) {}
  }

  /* ══════════════════════════════
     مودال التشغيل
     ══════════════════════════════ */
  function openModal(id) {
    if (!id) return;
    var modal  = document.getElementById('ytModal');
    var iframe = document.getElementById('ytModalIframe');
    var close  = document.getElementById('ytModalClose');
    if (!modal || !iframe) return;
    iframe.src = 'https://www.youtube.com/embed/' + id +
                 '?autoplay=1&rel=0&modestbranding=1';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (close) close.focus();
  }

  function closeModal() {
    var modal  = document.getElementById('ytModal');
    var iframe = document.getElementById('ytModalIframe');
    if (modal)  modal.classList.remove('active');
    if (iframe) iframe.src = '';
    document.body.style.overflow = '';
  }

  /* ══════════════════════════════
     التهيئة الرئيسية
     ══════════════════════════════ */
  function init() {
    /* ربط المودال */
    var modal    = document.getElementById('ytModal');
    var closeBtn = document.getElementById('ytModalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    /* محاولة الكاش أولاً لتجنب طلبات شبكة غير ضرورية */
    var cached = loadCache();
    if (cached) {
      renderCards(cached);
      return;
    }

    /* تحميل من الشبكة */
    var grid = document.getElementById('ytVideosGrid');
    if (grid) {
      grid.innerHTML =
        '<div class="yt-loading"><span class="yt-spinner"></span> جارٍ تحميل المقاطع...</div>';
    }

    fetch(API_URL)
      .then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (data.status === 'ok' && Array.isArray(data.items) && data.items.length) {
          saveCache(data.items);
          renderCards(data.items);
        } else {
          renderCards([]);
        }
      })
      .catch(function () {
        var g = document.getElementById('ytVideosGrid');
        if (g) {
          g.innerHTML =
            '<p class="yt-empty">⚠️ تعذّر تحميل المقاطع، يُرجى المحاولة لاحقاً</p>';
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
