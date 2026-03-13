/* ==========================================================
   نور القرآن — محرك قوائم التشغيل
   — تحميل تلقائي فوري بلا أخطاء
   — كاش دائم في localStorage
   — تحديث خفي في الخلفية
   — جودة تلقائية حسب سرعة الاتصال
   — تحكّم يدوي بالجودة
   — تشغيل مضمَّن بدون مغادرة الصفحة
   — 3 طرق احتياطية عند فشل الجلب
   ========================================================== */

(function () {
  'use strict';

  /* ================================================================
     جدول بيانات القوائم (مصدر الحقيقة الوحيدة)
     يُستخدم من clips.html و playlist.html و index.html
  ================================================================ */
  var PLAYLISTS = {
    '1': { name: 'آية وتفسير',         icon: '🎬', desc: 'شرح وتفسير الآيات بأسلوب ميسّر',       ytId: 'PLVbjqy4Qzz1NWqxom2befYJBuB99zcd9e' },
    '2': { name: 'القرآن كاملاً',       icon: '📖', desc: 'تلاوة كاملة بصوت خاشع متأمِّل',             ytId: 'PLVbjqy4Qzz1NljvZXXP1TVg_hWUlt8mvM' },
    '3': { name: 'القرآن وتزكية النفس', icon: '🌿', desc: 'كيف يُزكّي القرآن النفوس ويرقّق القلوب',      ytId: 'PLVbjqy4Qzz1MdV23AlsPSND7d5I_pZD6w'  },
    '4': { name: 'مواعظ القرآن',        icon: '🕌', desc: 'مواعظ وعِبَر مستقاة من الكتاب العزيز',        ytId: 'PLVbjqy4Qzz1P8e523UtvCxLDaefbfMTLF'  },
    '5': { name: 'آداب حملة القرآن',    icon: '💿', desc: 'آداب وأخلاق حاملي القرآن الكريم',               ytId: 'PLVbjqy4Qzz1N3nupwtHO-2IoUikenFOjN'  },
    '6': { name: 'وقفات تدبرية',        icon: '🌙', desc: 'وقفات تأملية مع معاني الآيات ومقاصدها',          ytId: 'PLVbjqy4Qzz1N4YEdMDY5NvSDLYgOtTxKw'  }
  };

  /* ================================================================
     إعدادات
  ================================================================ */
  var CFG = {
    CACHE_TTL   : 24 * 60 * 60 * 1000,   // تحديث كل 24س
    COUNT       : 50,                      // عدد المقاطع لكل طلب
    RETRY_DELAY : 3000,                    // تأخير المحاولة الثانية بالمسل
    LOW_BW_Q    : 'small',                 // جودة البداية للاتصال البطيء
    DEFAULT_Q   : 'hd720',                 // جودة البداية للاتصال الجيد
    SPEED_TEST_THRESHOLD_KBPS: 500         // ما دون ذلك = اتصال بطيء
  };

  var QUALITY_LABELS = {
    'hd1080': '1080p HD 🟢',
    'hd720' : '720p HD 🟡',
    'large' : '480p 🟠',
    'medium': '360p ⚪',
    'small' : '240p 🔵',
    'tiny'  : '144p ⚪️',
    'default': 'تلقائي'
  };

  /* ================================================================
     متغيرات الحالة العامّة
  ================================================================ */
  var state = {
    ytApiReady   : false,
    pendingPlay  : null,
    currentPlayer: null,
    currentCard  : null,
    isLowBW      : false,   // يُكتشف تلقائياً
    detectedQ    : null     // أفضل جودة مكتشفة
  };

  /* ================================================================
     اكتشاف سرعة الاتصال (Network Info API + قياس حقيقي)
  ================================================================ */
  function detectBandwidth() {
    /* طريقة 1: Network Information API (Chrome/Android) */
    try {
      var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        var eff = conn.effectiveType || '';
        if (eff === 'slow-2g' || eff === '2g') { state.isLowBW = true;  state.detectedQ = 'small'; return; }
        if (eff === '3g')                       { state.isLowBW = false; state.detectedQ = 'medium'; return; }
        if (eff === '4g')                       { state.isLowBW = false; state.detectedQ = 'hd720';  return; }
        var dl = conn.downlink || 0; // Mbps
        if (dl > 0) {
          if (dl < 0.5) { state.isLowBW = true;  state.detectedQ = 'small'; }
          else if (dl < 2) { state.isLowBW = false; state.detectedQ = 'medium'; }
          else if (dl < 5) { state.isLowBW = false; state.detectedQ = 'large'; }
          else             { state.isLowBW = false; state.detectedQ = 'hd720'; }
          return;
        }
      }
    } catch(e) {}

    /* طريقة 2: قياس حقيقي عبر صورة صغيرة */
    try {
      var t0  = Date.now();
      var img = new Image();
      var url = 'https://i.ytimg.com/vi/1/hqdefault.jpg?_t=' + t0;
      img.onload = function () {
        var kbps = Math.round((150 * 8) / ((Date.now() - t0) / 1000));
        if (kbps < CFG.SPEED_TEST_THRESHOLD_KBPS) {
          state.isLowBW   = true;
          state.detectedQ = 'small';
        } else if (kbps < 1500) {
          state.isLowBW   = false;
          state.detectedQ = 'medium';
        } else {
          state.isLowBW   = false;
          state.detectedQ = 'hd720';
        }
      };
      img.onerror = function () { state.detectedQ = state.detectedQ || 'medium'; };
      img.src = url;
    } catch(e) {}
  }

  /* ================================================================
     CSS مضمَّن
  ================================================================ */
  function injectStyles() {
    if (document.getElementById('yt-styles')) return;
    var s = document.createElement('style');
    s.id = 'yt-styles';
    s.textContent = [
      /* شبكة البطاقات */
      '.yt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;}',

      /* بطاقة مفردة */
      '.yt-card{background:#fff;border:1.5px solid #e0d9cc;border-radius:12px;overflow:hidden;',
      'cursor:pointer;transition:transform .26s,box-shadow .26s,border-color .26s;',
      'box-shadow:0 2px 8px rgba(0,0,0,.07);}',
      '.yt-card:hover,.yt-card:focus-visible{transform:translateY(-5px);',
      'box-shadow:0 10px 30px rgba(0,0,0,.13);border-color:#cc0000;outline:none;}',
      '.yt-card.yt-playing{grid-column:1/-1;cursor:default;transform:none;',
      'box-shadow:0 6px 28px rgba(204,0,0,.2);border-color:#cc0000;}',

      /* صورة مصغّرة */
      '.yt-thumb{position:relative;width:100%;padding-bottom:56.25%;background:#111;overflow:hidden;}',
      '.yt-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;',
      'transition:transform .4s;}',
      '.yt-card:hover .yt-thumb img{transform:scale(1.05);}',
      '.yt-play-btn{position:absolute;inset:0;display:flex;align-items:center;',
      'justify-content:center;background:rgba(0,0,0,.32);opacity:0;transition:opacity .26s;',
      'font-size:2.8rem;color:#fff;}',
      '.yt-card:hover .yt-play-btn{opacity:1;}',

      /* معلومات */
      '.yt-info{padding:14px 16px 16px;}',
      '.yt-num{font-size:.73rem;color:#cc0000;font-weight:700;margin-bottom:3px;}',
      '.yt-title{font-size:.97rem;font-weight:700;color:#1c1c1c;line-height:1.55;',
      'margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;',
      '-webkit-box-orient:vertical;overflow:hidden;}',
      '.yt-date{font-size:.76rem;color:#bbb;display:block;}',

      /* مؤشر التحميل */
      '.yt-loading{grid-column:1/-1;text-align:center;padding:56px 20px;',
      'color:#6b6b6b;font-family:Cairo,sans-serif;}',
      '.yt-spinner{display:block;width:46px;height:46px;margin:0 auto 14px;',
      'border:4px solid rgba(26,71,49,.1);border-top-color:#cc0000;',
      'border-radius:50%;animation:ytSpin 1s linear infinite;}',
      '@keyframes ytSpin{to{transform:rotate(360deg);}}',

      /* رسالة خطأ */
      '.yt-error{grid-column:1/-1;text-align:center;padding:44px 20px;',
      'color:#e74c3c;font-family:Cairo,sans-serif;font-size:.95rem;line-height:2;}',
      '.yt-retry-btn{display:inline-flex;align-items:center;gap:6px;margin-top:12px;',
      'padding:10px 24px;background:#1A4731;color:#fff;border-radius:8px;',
      'border:none;cursor:pointer;font-family:Cairo,sans-serif;font-size:.92rem;',
      'font-weight:700;transition:background .2s;}',
      '.yt-retry-btn:hover{background:#2D6A4F;}',

      /* شارة اتصال بطيء */
      '.yt-lowbw-bar{display:none;align-items:center;gap:10px;padding:10px 16px;',
      'background:rgba(255,165,0,.1);border:1px solid rgba(255,165,0,.3);',
      'border-radius:8px;margin-bottom:16px;font-size:.86rem;',
      'color:#b36000;font-family:Cairo,sans-serif;}',
      '.yt-lowbw-bar.show{display:flex;}',
      '.yt-lowbw-icon{font-size:1.2rem;flex-shrink:0;}',

      /* مشغّل */
      '.yt-player-wrap{width:100%;border-radius:10px;overflow:hidden;',
      'box-shadow:0 8px 32px rgba(0,0,0,.5);}',
      '.yt-player-container{position:relative;width:100%;padding-bottom:56.25%;background:#000;}',
      '.yt-player-container>div,.yt-player-container iframe{position:absolute!important;',
      'top:0!important;left:0!important;width:100%!important;height:100%!important;border:none!important;}',

      /* شريط تحكّم المشغّل */
      '.yt-ctrl{display:flex;align-items:center;justify-content:space-between;',
      'background:#111;padding:8px 14px;gap:8px;flex-wrap:wrap;}',

      /* زر الإغلاق */
      '.yt-close-btn{display:inline-flex;align-items:center;gap:5px;',
      'background:rgba(255,255,255,.08);color:#bbb;border:none;border-radius:5px;',
      'padding:7px 14px;cursor:pointer;font-family:Cairo,sans-serif;font-size:.85rem;',
      'transition:.2s;white-space:nowrap;}',
      '.yt-close-btn:hover{background:rgba(220,50,50,.35);color:#fff;}',

      /* مجموعة أزرار الجودة */
      '.yt-q-group{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}',
      '.yt-q-label{color:#888;font-size:.78rem;font-family:Cairo,sans-serif;',
      'white-space:nowrap;margin-left:4px;}',
      '.yt-q-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 11px;',
      'background:rgba(255,255,255,.06);color:#aaa;border:1px solid rgba(255,255,255,.12);',
      'border-radius:20px;cursor:pointer;font-family:Cairo,sans-serif;font-size:.76rem;',
      'font-weight:700;white-space:nowrap;transition:.2s;}',
      '.yt-q-btn:hover{background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.3);}',
      '.yt-q-btn.active{background:rgba(201,168,76,.2);color:#c9a84c;',
      'border-color:rgba(201,168,76,.5);}',
      '.yt-q-btn.active::after{content:" ✓";margin-right:2px;}',
      '.yt-q-auto{font-size:.7rem;color:#666;margin-right:2px;}',

      /* شارة الجودة الحالية */
      '.yt-q-now{color:#c9a84c;font-size:.74rem;font-family:Cairo,sans-serif;',
      'padding:4px 10px;background:rgba(201,168,76,.1);border-radius:20px;',
      'border:1px solid rgba(201,168,76,.25);white-space:nowrap;}',

      /* Responsive */
      '@media(max-width:600px){',
      '.yt-grid{grid-template-columns:1fr 1fr;gap:12px;}',
      '.yt-info{padding:10px 12px 12px;}',
      '.yt-title{font-size:.88rem;}',
      '.yt-q-btn{padding:4px 8px;font-size:.7rem;}',
      '}',
      '@media(max-width:400px){.yt-grid{grid-template-columns:1fr;}}']
      .join('');
    document.head.appendChild(s);
  }

  /* ================================================================
     كاش localStorage
  ================================================================ */
  function loadCache(ytId) {
    try {
      var raw = localStorage.getItem('yt_pl_' + ytId);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (CFG.CACHE_TTL > 0 && Date.now() - obj.ts > CFG.CACHE_TTL) return null;
      return obj.items && obj.items.length ? obj.items : null;
    } catch(e) { return null; }
  }

  function saveCache(ytId, items) {
    try {
      localStorage.setItem('yt_pl_' + ytId,
        JSON.stringify({ ts: Date.now(), items: items }));
    } catch(e) {}
  }

  /* ================================================================
     تحليل XML يوتيوب
  ================================================================ */
  function parseXml(xml) {
    var items = [], rx = /<entry>([\u0000-\uFFFF]*?)<\/entry>/g, m;
    while ((m = rx.exec(xml)) !== null) {
      var e      = m[1];
      var title  = (/<title>([\u0000-\uFFFF]*?)<\/title>/.exec(e)           || [])[1] || '';
      var vid    = (/<yt:videoId>([\u0000-\uFFFF]*?)<\/yt:videoId>/.exec(e) || [])[1] || '';
      var pub    = (/<published>([\u0000-\uFFFF]*?)<\/published>/.exec(e)   || [])[1] || '';
      if (vid) items.push({
        title  : title.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'),
        link   : 'https://www.youtube.com/watch?v=' + vid,
        pubDate: pub
      });
    }
    return items;
  }

  /* ================================================================
     جلب القائمة — 3 طرق احتياطية
  ================================================================ */
  function fetchPlaylist(ytId) {
    var RSS  = 'https://www.youtube.com/feeds/videos.xml?playlist_id=' + ytId;
    var U1   = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(RSS) + '&count=' + CFG.COUNT;
    var U2   = 'https://api.allorigins.win/get?url=' + encodeURIComponent(RSS);
    var U3   = 'https://cors-anywhere.herokuapp.com/' + RSS; // احتياطي ثالث

    function tryRss2json() {
      return fetch(U1, { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined })
        .then(function(r){ if(!r.ok) throw new Error('r2j-'+r.status); return r.json(); })
        .then(function(d){ if(d.status==='ok'&&d.items&&d.items.length) return d.items; throw new Error('r2j-empty'); });
    }

    function tryAllOrigins() {
      return fetch(U2, { signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined })
        .then(function(r){ if(!r.ok) throw new Error('ao-'+r.status); return r.json(); })
        .then(function(d){ var it=parseXml(d.contents||''); if(!it.length) throw new Error('ao-empty'); return it; });
    }

    function tryCorsAnywhere() {
      return fetch(U3, { signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined })
        .then(function(r){ if(!r.ok) throw new Error('ca-'+r.status); return r.text(); })
        .then(function(t){ var it=parseXml(t); if(!it.length) throw new Error('ca-empty'); return it; });
    }

    return tryRss2json()
      .catch(function(){
        return new Promise(function(res){ setTimeout(res, CFG.RETRY_DELAY); })
          .then(tryAllOrigins);
      })
      .catch(function(){
        return new Promise(function(res){ setTimeout(res, CFG.RETRY_DELAY); })
          .then(tryCorsAnywhere);
      });
  }

  /* ================================================================
     YouTube IFrame API
  ================================================================ */
  function loadYTApi() {
    if (window.YT && window.YT.Player) { state.ytApiReady = true; return; }
    if (document.querySelector('script[src*="iframe_api"]')) return;
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  window.onYouTubeIframeAPIReady = function () {
    state.ytApiReady = true;
    if (state.pendingPlay) {
      var p = state.pendingPlay;
      state.pendingPlay = null;
      playInline(p.card, p.id);
    }
  };

  /* ================================================================
     أزرار الجودة
  ================================================================ */
  function buildQualityBtns(player, ctrl) {
    var old = ctrl.querySelector('.yt-q-group');
    if (old) old.remove();
    var old2 = ctrl.querySelector('.yt-q-now');
    if (old2) old2.remove();

    var levels = [];
    try { levels = player.getAvailableQualityLevels() || []; } catch(e) {}
    var current;
    try { current = player.getPlaybackQuality() || 'default'; } catch(e) { current = 'default'; }

    /* إذا لم تتوفّر مستويات — خفِّ المجموعة */
    if (!levels.length) return;

    var order    = ['hd1080','hd720','large','medium','small','tiny'];
    var avail    = order.filter(function(q){ return levels.indexOf(q)!==-1; });
    if (!avail.length) avail = levels.filter(function(q){ return q!=='default'; });

    /* عرض الجودة الحالية */
    var nowEl = document.createElement('span');
    nowEl.className = 'yt-q-now';
    nowEl.textContent = '📡 ' + (QUALITY_LABELS[current] || current);
    ctrl.appendChild(nowEl);

    var grp = document.createElement('div');
    grp.className = 'yt-q-group';
    grp.innerHTML = '<span class="yt-q-label">جودة:</span>';

    avail.concat(['default']).forEach(function(q){
      var btn = document.createElement('button');
      btn.className = 'yt-q-btn' + (q===current?' active':'');
      btn.dataset.q = q;
      btn.textContent = q==='default' ? 'تلقائي' : (QUALITY_LABELS[q]||q);
      if (q === state.detectedQ) {
        btn.innerHTML += ' <span class="yt-q-auto" title="موصى حسب اتصالك">★</span>';
      }
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        try { player.setPlaybackQuality(q); } catch(er) {}
        grp.querySelectorAll('.yt-q-btn').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        nowEl.textContent = '📡 ' + (QUALITY_LABELS[q] || q);
      });
      grp.appendChild(btn);
    });
    ctrl.appendChild(grp);

    /* تحديث تلقائي عند تغيير الجودة من يوتيوب */
    player.__qNowEl = nowEl;
    player.__qGrp   = grp;
  }

  /* ================================================================
     إعادة البطاقة لحالتها الأصلية
  ================================================================ */
  function restoreCard(card) {
    if (!card) return;
    card.classList.remove('yt-playing');
    var w = card.querySelector('.yt-player-wrap');
    var t = card.querySelector('.yt-thumb');
    var i = card.querySelector('.yt-info');
    if (w) w.remove();
    if (t) t.style.display = '';
    if (i) i.style.display  = '';
  }

  /* ================================================================
     تشغيل فيديو مضمَّن في البطاقة
  ================================================================ */
  function playInline(card, id) {
    if (!id) return;

    /* إذا لم تتحمّل API بعد */
    if (!state.ytApiReady || !window.YT || !window.YT.Player) {
      state.pendingPlay = { card: card, id: id };
      return;
    }

    /* أغلق البطاقة السابقة */
    if (state.currentCard && state.currentCard !== card) {
      restoreCard(state.currentCard);
      try { state.currentPlayer.destroy(); } catch(e) {}
      state.currentPlayer = null;
    }

    state.currentCard = card;
    card.classList.add('yt-playing');

    var thumb = card.querySelector('.yt-thumb');
    var info  = card.querySelector('.yt-info');
    if (thumb) thumb.style.display = 'none';
    if (info)  info.style.display  = 'none';

    /* بناء غلاف المشغّل */
    var wrap = document.createElement('div');
    wrap.className = 'yt-player-wrap';

    /* طبقة الفيديو */
    var playerDivId = 'yt-p-' + id + '-' + Date.now();
    wrap.innerHTML =
      '<div class="yt-player-container"><div id="' + playerDivId + '"></div></div>' +
      '<div class="yt-ctrl">' +
        '<button class="yt-close-btn">' +
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
          ' stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/>' +
          '<line x1="6" y1="6" x2="18" y2="18"/></svg> إغلاق' +
        '</button>' +
      '</div>';

    card.insertBefore(wrap, thumb);

    /* زر الإغلاق */
    wrap.querySelector('.yt-close-btn').addEventListener('click', function(e){
      e.stopPropagation();
      try { state.currentPlayer.destroy(); } catch(er) {}
      state.currentPlayer = null;
      restoreCard(card);
      if (state.currentCard === card) state.currentCard = null;
    });

    var ctrl = wrap.querySelector('.yt-ctrl');

    /* جودة البداية */
    var startQ = state.detectedQ || (state.isLowBW ? CFG.LOW_BW_Q : CFG.DEFAULT_Q);

    state.currentPlayer = new YT.Player(playerDivId, {
      videoId: id,
      playerVars: {
        autoplay         : 1,
        rel              : 0,
        modestbranding   : 1,
        origin           : window.location.origin || '',
        vq               : startQ,   /* جودة مبدئية */
        playsinline      : 1         /* iOS inline */
      },
      events: {
        onReady: function(ev) {
          ev.target.playVideo();
          /* تعيين الجودة مرتين: مباشرة + بعد 2ث */
          try { ev.target.setPlaybackQuality(startQ); } catch(er) {}
          setTimeout(function(){
            try { ev.target.setPlaybackQuality(startQ); } catch(er) {}
            buildQualityBtns(ev.target, ctrl);
          }, 2200);
        },
        onPlaybackQualityChange: function(ev) {
          var q = ev.data;
          var nowEl = state.currentPlayer && state.currentPlayer.__qNowEl;
          var grp   = state.currentPlayer && state.currentPlayer.__qGrp;
          if (nowEl) nowEl.textContent = '📡 ' + (QUALITY_LABELS[q]||q);
          if (grp) {
            grp.querySelectorAll('.yt-q-btn').forEach(function(b){
              b.classList.toggle('active', b.dataset.q===q);
            });
          }
        },
        onError: function(ev) {
          /* أكواد الخطأ: 2=معطل, 5=خطأ HTML5, 100=غير موجود, 101/150=محظور تضمين */
          var code = ev.data;
          var msg = '⚠️ تعذّر تشغيل المقطع';
          if (code===101||code===150) msg = '⚠️ هذا المقطع لا يسمح بالتشغيل خارج يوتيوب';
          if (code===100)             msg = '⚠️ المقطع غير متاح أو تم حذفه';
          var container = wrap.querySelector('.yt-player-container');
          if (container) {
            container.innerHTML =
              '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
              'justify-content:center;background:#111;color:#ff9090;font-family:Cairo,sans-serif;' +
              'font-size:.92rem;text-align:center;padding:20px;gap:12px;">' +
              msg + '<br>' +
              '<a href="https://www.youtube.com/watch?v='+id+'" target="_blank" ' +
              'style="color:#c9a84c;font-weight:700;font-size:.88rem;">فتح في يوتيوب ↗</a>' +
              '</div>';
          }
        }
      }
    });
  }

  /* ================================================================
     iframe احتياطي نهائي (فشل كل شيء)
  ================================================================ */
  function showIframeFallback(container, ytId) {
    container.innerHTML =
      '<div style="grid-column:1/-1;position:relative;width:100%;padding-bottom:56.25%;' +
      'border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.2);' +
      'border:3px solid #c9a84c;background:#000;">' +
        '<iframe style="position:absolute;top:0;left:0;width:100%;height:100%;"' +
        ' src="https://www.youtube.com/embed?listType=playlist&list='+ytId+
        '&rel=0&modestbranding=1&vq='+CFG.LOW_BW_Q+'"' +
        ' title="قائمة تشغيل" frameborder="0" loading="lazy"' +
        ' allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"' +
        ' allowfullscreen></iframe>' +
      '</div>';
  }

  /* ================================================================
     رسم بطاقات الفيديو
  ================================================================ */
  function fmtDate(str) {
    if (!str) return '';
    try {
      var d  = new Date(str);
      var mo = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
               'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      return d.getDate() + ' ' + mo[d.getMonth()] + ' ' + d.getFullYear();
    } catch(e) { return ''; }
  }

  function escHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function vidId(link) {
    var m = String(link||'').match(/[?&]v=([^&]+)/);
    return m ? m[1] : '';
  }

  function renderCards(items, grid, ytId) {
    if (!items || !items.length) { showIframeFallback(grid, ytId); return; }

    /* تحديث عداد المقاطع */
    var countEl = document.getElementById('vidCount');
    if (countEl) countEl.textContent = items.length;

    grid.innerHTML = items.map(function(item, idx){
      var id    = vidId(item.link);
      var thumb = id ? 'https://i.ytimg.com/vi/'+id+'/mqdefault.jpg' : '';
      var date  = fmtDate(item.pubDate);
      return '<article class="yt-card" data-vid="'+escHtml(id)+'"' +
        ' tabindex="0" role="button" aria-label="'+escHtml(item.title)+'">' +
        '<div class="yt-thumb">' +
          (thumb ? '<img src="'+thumb+'" alt="" loading="lazy">' : '') +
          '<div class="yt-play-btn">&#9654;</div>' +
        '</div>' +
        '<div class="yt-info">' +
          '<div class="yt-num">#'+(idx+1)+'</div>' +
          '<h3 class="yt-title">'+escHtml(item.title)+'</h3>' +
          (date ? '<span class="yt-date">'+date+'</span>' : '') +
        '</div>' +
        '</article>';
    }).join('');

    grid.querySelectorAll('.yt-card').forEach(function(card){
      function act(){ playInline(card, card.dataset.vid); }
      card.addEventListener('click', act);
      card.addEventListener('keydown', function(e){
        if (e.key==='Enter'||e.key===' '){ e.preventDefault(); act(); }
      });
    });

    /* تحديث SITE_DATA للبحث */
    try {
      if (window.SITE_DATA) {
        SITE_DATA.clips = (SITE_DATA.clips||[]).concat(
          items.map(function(it){ return { type:'مقطع', title:it.title, desc:'', page:it.link }; })
        );
      }
    } catch(e) {}
  }

  /* ================================================================
     شارة الاتصال البطيء
  ================================================================ */
  function showLowBWBar(gridParent) {
    var bar = gridParent && gridParent.previousElementSibling;
    if (bar && bar.classList.contains('yt-lowbw-bar')) {
      bar.classList.add('show');
    }
  }

  /* ================================================================
     الدالّة العامّة: تحميل قائمة بعينها
     الخوارزمية:
       1. عرض الكاش فورياً
       2. جلب تحديث خفي في الخلفية
       3. تحديث العرض إذا تغيّر عدد المقاطع
  ================================================================ */
  function loadPlaylist(gridId, ytId) {
    var grid = document.getElementById(gridId);
    if (!grid) return;

    /* إضافة شارة الاتصال البطيء قبل الشبكة مباشرة */
    var wrapper = grid.parentElement;
    if (wrapper && !wrapper.querySelector('.yt-lowbw-bar')) {
      var bar = document.createElement('div');
      bar.className = 'yt-lowbw-bar';
      bar.innerHTML = '<span class="yt-lowbw-icon">🚨</span>' +
        '<span>تم اكتشاف اتصال بطيء — سيتم بدء التشغيل بجودة منخفضة تلقائياً. يمكنك رفعها بعد التشغيل.</span>';
      wrapper.insertBefore(bar, grid);
    }

    var cached = loadCache(ytId);

    /* —— عرض فوري من الكاش */
    if (cached) {
      renderCards(cached, grid, ytId);
      if (state.isLowBW) showLowBWBar(grid);

      /* تحديث خفي */
      fetchPlaylist(ytId).then(function(fresh){
        if (fresh && fresh.length) {
          saveCache(ytId, fresh);
          if (fresh.length !== cached.length) renderCards(fresh, grid, ytId);
        }
      }).catch(function(){});
      return;
    }

    /* —— أوّل زيارة: عرض مؤشّر */
    grid.innerHTML =
      '<div class="yt-loading"><span class="yt-spinner"></span>جارٍّ تحميل المقاطع...</div>';

    fetchPlaylist(ytId)
      .then(function(items){
        saveCache(ytId, items);
        renderCards(items, grid, ytId);
        if (state.isLowBW) showLowBWBar(grid);
      })
      .catch(function(){
        /* فشل كل شيء — iframe */
        grid.innerHTML = '';
        showIframeFallback(grid, ytId);
        /* زر إعادة المحاولة */
        var errDiv = document.createElement('div');
        errDiv.className = 'yt-error';
        errDiv.innerHTML =
          '⚠️ تعذّر تحميل قائمة التشغيل. يُعرض المحتوى مباشرة من يوتيوب.<br>' +
          '<button class="yt-retry-btn">🔄 إعادة المحاولة</button>';
        errDiv.querySelector('.yt-retry-btn').addEventListener('click', function(){
          grid.innerHTML = '';
          loadPlaylist(gridId, ytId);
        });
        grid.parentElement.insertBefore(errDiv, grid);
      });
  }

  /* ================================================================
     تهيئة الصفحة الرئيسية (clips.html — القائمة الأولى فقط)
  ================================================================ */
  function initClipsPage() {
    injectStyles();
    detectBandwidth();
    loadYTApi();
    /* القائمة الأولى محمّلة مباشرة للتوافق مع جلسات clips.html القديمة */
    if (document.getElementById('ytVideosGrid')) {
      loadPlaylist('ytVideosGrid', PLAYLISTS['1'].ytId);
    }
  }

  /* ================================================================
     تصدير للاستخدام من playlist.html
  ================================================================ */
  window.YTLoadPlaylist = loadPlaylist;
  window.YT_PLAYLISTS   = PLAYLISTS;
  window.YT_injectStyles = injectStyles;
  window.YT_detectBW     = detectBandwidth;
  window.YT_loadApi      = loadYTApi;

  /* ================================================================
     تشغيل
  ================================================================ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClipsPage);
  } else {
    initClipsPage();
  }

})();
