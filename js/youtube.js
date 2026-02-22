/* =========================================
   يوتيوب — تحميل المقاطع + مشغّل مضمّن + مختار الجودة
   ========================================= */

(function () {
  'use strict';

  var PLAYLIST_ID = 'PLVbjqy4Qzz1NWqxom2befYJBuB99zcd9e';
  var CACHE_KEY   = 'yt_pl_' + PLAYLIST_ID;
  var CACHE_TTL   = 5 * 60 * 1000;

  var RSS_URL  = 'https://www.youtube.com/feeds/videos.xml?playlist_id=' + PLAYLIST_ID;
  var API_RSS2 = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(RSS_URL) + '&count=50';
  var API_AO   = 'https://api.allorigins.win/get?url=' + encodeURIComponent(RSS_URL);

  var currentPlayer = null;
  var currentCard   = null;
  var ytApiReady    = false;
  var pendingPlay   = null;

  var QUALITY_LABELS = {
    'hd1080': '1080p HD',
    'hd720':  '720p HD',
    'large':  '480p',
    'medium': '360p',
    'small':  '240p',
    'tiny':   '144p',
    'default': 'تلقائي'
  };

  /* ════ حقن الأنماط (CSS) ════ */
  function injectStyles() {
    if (document.getElementById('yt-inline-styles')) return;
    var s = document.createElement('style');
    s.id = 'yt-inline-styles';
    s.textContent = [
      /* البطاقة أثناء التشغيل — تمتد عبر العمود الكامل في الشبكة */
      '.yt-card.yt-playing{cursor:default;grid-column:1/-1;}',

      /* غلاف المشغّل */
      '.yt-player-wrap{width:100%;border-radius:10px;overflow:hidden;',
      'box-shadow:0 8px 32px rgba(0,0,0,.5);margin-bottom:4px;}',

      /* حاوية الفيديو — نسبة 16:9 */
      '.yt-player-container{position:relative;width:100%;padding-bottom:56.25%;background:#000;}',
      '.yt-player-container>div,.yt-player-container iframe{',
      'position:absolute!important;top:0!important;left:0!important;',
      'width:100%!important;height:100%!important;border:none!important;}',

      /* شريط التحكم */
      '.yt-player-controls{display:flex;align-items:center;justify-content:space-between;',
      'background:#111;padding:8px 12px;gap:8px;}',

      /* زر الإغلاق */
      '.yt-close-btn{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.08);',
      'color:#bbb;border:none;border-radius:5px;padding:6px 12px;cursor:pointer;',
      'font-family:Cairo,sans-serif;font-size:.82rem;transition:.2s;white-space:nowrap;}',
      '.yt-close-btn:hover{background:rgba(220,50,50,.35);color:#fff;}',

      /* مختار الجودة */
      '.yt-quality-selector{position:relative;}',

      '.yt-quality-btn{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.08);',
      'color:#bbb;border:none;border-radius:5px;padding:6px 12px;cursor:pointer;',
      'font-family:Cairo,sans-serif;font-size:.82rem;transition:.2s;white-space:nowrap;}',
      '.yt-quality-btn:hover{background:rgba(255,255,255,.15);color:#fff;}',

      '.yt-quality-label{font-size:.72rem;color:#888;}',
      '.yt-quality-current{color:#c9a84c;font-weight:700;font-size:.82rem;}',

      /* قائمة الجودة — تفتح للأعلى */
      '.yt-quality-menu{display:none;position:absolute;bottom:calc(100% + 6px);right:0;',
      'background:#1c1c1c;border:1px solid #383838;border-radius:8px;overflow:hidden;',
      'min-width:140px;box-shadow:0 -6px 24px rgba(0,0,0,.7);z-index:9999;}',
      '.yt-quality-selector.open .yt-quality-menu{display:block;}',

      '.yt-quality-menu-title{display:block;padding:7px 14px;color:#777;font-size:.72rem;',
      'border-bottom:1px solid #2e2e2e;font-family:Cairo,sans-serif;text-align:right;}',

      '.yt-quality-item{display:block;width:100%;padding:9px 16px;background:transparent;',
      'border:none;color:#ccc;text-align:right;cursor:pointer;font-size:.85rem;',
      'font-family:Cairo,sans-serif;transition:.15s;}',
      '.yt-quality-item:hover{background:#252525;color:#fff;}',
      '.yt-quality-item.active{color:#c9a84c;font-weight:700;}',
      '.yt-quality-item.active::after{content:" ✓";margin-right:4px;}',
    ].join('');
    document.head.appendChild(s);
  }

  /* ════ إغلاق قوائم الجودة عند النقر خارجها ════ */
  document.addEventListener('click', function () {
    document.querySelectorAll('.yt-quality-selector.open').forEach(function (el) {
      el.classList.remove('open');
    });
  });

  /* ════ كاش ════ */
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
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: items }));
    } catch (e) {}
  }

  /* ════ مساعدات ════ */
  function vidId(link) {
    var m = String(link || '').match(/[?&]v=([^&]+)/);
    return m ? m[1] : '';
  }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtDate(str) {
    if (!str) return '';
    try {
      var d  = new Date(str);
      var mo = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                 'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      return d.getDate() + ' ' + mo[d.getMonth()] + ' ' + d.getFullYear();
    } catch (e) { return ''; }
  }

  /* ════ تحليل XML يوتيوب ════ */
  function parseXml(xmlStr) {
    var items = [];
    var rx = /<entry>([\u0000-\uFFFF]*?)<\/entry>/g;
    var m;
    while ((m = rx.exec(xmlStr)) !== null) {
      var e = m[1];
      var title   = (/<title>([\u0000-\uFFFF]*?)<\/title>/.exec(e)           || [])[1] || '';
      var videoId = (/<yt:videoId>([\u0000-\uFFFF]*?)<\/yt:videoId>/.exec(e) || [])[1] || '';
      var pub     = (/<published>([\u0000-\uFFFF]*?)<\/published>/.exec(e)   || [])[1] || '';
      if (videoId) {
        items.push({
          title:   title.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'),
          link:    'https://www.youtube.com/watch?v=' + videoId,
          pubDate: pub,
          description: ''
        });
      }
    }
    return items;
  }

  /* ════ سلسلة المحاولات ════ */
  function tryRss2json() {
    return fetch(API_RSS2)
      .then(function (r) { if (!r.ok) throw new Error('r2j-' + r.status); return r.json(); })
      .then(function (d) {
        if (d.status === 'ok' && Array.isArray(d.items) && d.items.length) return d.items;
        throw new Error('r2j-empty');
      });
  }

  function tryAllOrigins() {
    return fetch(API_AO)
      .then(function (r) { if (!r.ok) throw new Error('ao-' + r.status); return r.json(); })
      .then(function (d) {
        var items = parseXml(d.contents || '');
        if (!items.length) throw new Error('ao-empty');
        return items;
      });
  }

  /* ════ YouTube IFrame API ════ */
  function loadYTApi() {
    if (window.YT && window.YT.Player) { ytApiReady = true; return; }
    if (document.querySelector('script[src*="iframe_api"]')) return;
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  window.onYouTubeIframeAPIReady = function () {
    ytApiReady = true;
    if (pendingPlay) {
      var p = pendingPlay;
      pendingPlay = null;
      playInline(p.card, p.id);
    }
  };

  /* ════ بناء مختار الجودة ════ */
  function buildQualitySelector(player, controlsBar) {
    var old = controlsBar.querySelector('.yt-quality-selector');
    if (old) old.remove();

    var levels = [];
    try { levels = player.getAvailableQualityLevels() || []; } catch (e) {}

    /* ترتيب الجودات من الأعلى للأدنى */
    var order   = ['hd1080', 'hd720', 'large', 'medium', 'small', 'tiny'];
    var available = order.filter(function (q) { return levels.indexOf(q) !== -1; });
    if (!available.length) available = levels.filter(function (q) { return q !== 'default'; });

    var current = 'default';
    try { current = player.getPlaybackQuality() || 'default'; } catch (e) {}

    /* بناء بنود القائمة */
    var itemsHtml = '<span class="yt-quality-menu-title">جودة الفيديو</span>';
    available.forEach(function (q) {
      itemsHtml +=
        '<button class="yt-quality-item' + (q === current ? ' active' : '') + '" data-q="' + q + '">' +
        (QUALITY_LABELS[q] || q) + '</button>';
    });
    itemsHtml +=
      '<button class="yt-quality-item' + (current === 'default' ? ' active' : '') + '" data-q="default">تلقائي</button>';

    var selector = document.createElement('div');
    selector.className = 'yt-quality-selector';
    selector.innerHTML =
      '<button class="yt-quality-btn" title="جودة الفيديو">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">' +
          '<path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61' +
          'l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54' +
          'c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94' +
          'l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58' +
          'c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32' +
          'c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41' +
          'h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96' +
          'c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z' +
          'M12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>' +
        '</svg>' +
        '<span class="yt-quality-label">جودة: </span>' +
        '<span class="yt-quality-current">' + (QUALITY_LABELS[current] || 'تلقائي') + '</span>' +
      '</button>' +
      '<div class="yt-quality-menu">' + itemsHtml + '</div>';

    controlsBar.appendChild(selector);

    /* فتح/إغلاق القائمة */
    selector.querySelector('.yt-quality-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      selector.classList.toggle('open');
    });

    /* اختيار جودة */
    selector.querySelectorAll('.yt-quality-item').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var q = btn.dataset.q;
        try { player.setPlaybackQuality(q); } catch (er) {}
        selector.querySelectorAll('.yt-quality-item').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var lbl = selector.querySelector('.yt-quality-current');
        if (lbl) lbl.textContent = QUALITY_LABELS[q] || q;
        selector.classList.remove('open');
      });
    });
  }

  /* ════ إعادة البطاقة لحالتها الأصلية ════ */
  function restoreCard(card) {
    if (!card) return;
    card.classList.remove('yt-playing');
    var wrap  = card.querySelector('.yt-player-wrap');
    var thumb = card.querySelector('.yt-thumb');
    var info  = card.querySelector('.yt-info');
    if (wrap)  wrap.remove();
    if (thumb) thumb.style.display = '';
    if (info)  info.style.display  = '';
  }

  /* ════ تشغيل الفيديو في مكانه (مضمّن) ════ */
  function playInline(card, id) {
    if (!id) return;

    /* إذا لم تكن API جاهزة بعد — احفظ الطلب وانتظر */
    if (!ytApiReady || !window.YT || !window.YT.Player) {
      pendingPlay = { card: card, id: id };
      return;
    }

    /* أغلق البطاقة السابقة */
    if (currentCard && currentCard !== card) {
      restoreCard(currentCard);
      if (currentPlayer) {
        try { currentPlayer.destroy(); } catch (e) {}
        currentPlayer = null;
      }
    }

    currentCard = card;
    card.classList.add('yt-playing');

    /* إخفاء الصورة المصغّرة والمعلومات */
    var thumb = card.querySelector('.yt-thumb');
    var info  = card.querySelector('.yt-info');
    if (thumb) thumb.style.display = 'none';
    if (info)  info.style.display  = 'none';

    /* بناء غلاف المشغّل */
    var wrap = document.createElement('div');
    wrap.className = 'yt-player-wrap';
    wrap.innerHTML =
      '<div class="yt-player-container">' +
        '<div id="yt-player-' + id + '"></div>' +
      '</div>' +
      '<div class="yt-player-controls">' +
        '<button class="yt-close-btn" aria-label="إغلاق المشغّل">' +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
          ' إغلاق' +
        '</button>' +
        '<!-- مختار الجودة يُحقن هنا بعد جاهزية المشغّل -->' +
      '</div>';

    card.insertBefore(wrap, thumb);

    /* زر الإغلاق */
    wrap.querySelector('.yt-close-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      if (currentPlayer) {
        try { currentPlayer.destroy(); } catch (er) {}
        currentPlayer = null;
      }
      restoreCard(card);
      if (currentCard === card) currentCard = null;
    });

    /* إنشاء مشغّل YouTube IFrame API */
    var playerEl = document.getElementById('yt-player-' + id);
    currentPlayer = new YT.Player(playerEl, {
      videoId: id,
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        origin: window.location.origin || ''
      },
      events: {
        onReady: function (event) {
          event.target.playVideo();
          /* ننتظر ثانيتين لتحميل قوائم الجودة ثم نبنيها */
          var controls = wrap.querySelector('.yt-player-controls');
          setTimeout(function () {
            buildQualitySelector(event.target, controls);
          }, 2000);
        },
        onPlaybackQualityChange: function (event) {
          /* تحديث عنوان الجودة عند تغيّرها تلقائياً */
          var lbl = wrap.querySelector('.yt-quality-current');
          if (lbl) lbl.textContent = QUALITY_LABELS[event.data] || event.data;
          wrap.querySelectorAll('.yt-quality-item').forEach(function (btn) {
            btn.classList.toggle('active', btn.dataset.q === event.data);
          });
        }
      }
    });
  }

  /* ════ iframe احتياطي نهائي ════ */
  function showIframeFallback() {
    var g = document.getElementById('ytVideosGrid');
    if (!g) return;
    g.style.display = 'block';
    g.innerHTML =
      '<div style="position:relative;width:100%;padding-bottom:56.25%;border-radius:8px;overflow:hidden;' +
      'box-shadow:0 8px 32px rgba(0,0,0,.2);border:3px solid #c9a84c;background:#000;">' +
        '<iframe style="position:absolute;top:0;left:0;width:100%;height:100%;"' +
        ' src="https://www.youtube.com/embed?listType=playlist&list=' + PLAYLIST_ID +
        '&rel=0&modestbranding=1"' +
        ' title="\u0622\u064a\u0629 \u0648\u062a\u0641\u0633\u064a\u0631" frameborder="0" loading="lazy"' +
        ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"' +
        ' allowfullscreen></iframe>' +
      '</div>';
  }

  /* ════ رسم بطاقات الفيديو ════ */
  function renderCards(items) {
    var grid = document.getElementById('ytVideosGrid');
    if (!grid) return;
    if (!items || !items.length) { showIframeFallback(); return; }

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

    grid.querySelectorAll('.yt-card').forEach(function (card) {
      function act() { playInline(card, card.dataset.vid); }
      card.addEventListener('click', act);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
      });
    });

    /* تحديث SITE_DATA للبحث */
    try {
      if (window.SITE_DATA) {
        SITE_DATA.clips = items.map(function (item) {
          return { type: '\u0645\u0642\u0637\u0639', title: item.title, desc: '', page: item.link };
        });
      }
    } catch (e) {}
  }

  /* ════ التهيئة ════ */
  function init() {
    injectStyles();
    loadYTApi();

    var cached = loadCache();
    if (cached) { renderCards(cached); return; }

    var grid = document.getElementById('ytVideosGrid');
    if (grid) {
      grid.innerHTML =
        '<div class="yt-loading"><span class="yt-spinner"></span> \u062c\u0627\u0631\u064d \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0642\u0627\u0637\u0639...</div>';
    }

    tryRss2json()
      .catch(function () { return tryAllOrigins(); })
      .then(function (items) { saveCache(items); renderCards(items); })
      .catch(function () { showIframeFallback(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
