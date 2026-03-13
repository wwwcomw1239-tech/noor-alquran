/* ==========================================================
   نور القرآن — محرك قوائم التشغيل
   v3 — اختيار الجودة قبل التشغيل + ذاكرة التفضيل
   ========================================================== */
(function () {
  'use strict';

  /* ================================================================
     جدول القوائم
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
    CACHE_TTL            : 24 * 60 * 60 * 1000,
    COUNT                : 50,
    RETRY_DELAY          : 3000,
    LOW_BW_Q             : 'small',
    DEFAULT_Q            : 'hd720',
    SPEED_TEST_THRESHOLD : 500,
    PREF_KEY             : 'yt_quality_pref'   // مفتاح حفظ التفضيل
  };

  /* جميع مستويات الجودة بالترتيب */
  var QUALITIES = [
    { id: 'hd1080', label: '1080p',  badge: 'HD الأعلى',  color: '#4ade80', note: 'اتصال سريع جداً'  },
    { id: 'hd720',  label: '720p',   badge: 'HD',            color: '#facc15', note: 'اتصال جيد'      },
    { id: 'large',  label: '480p',   badge: 'جيد',          color: '#fb923c', note: 'اتصال متوسط'   },
    { id: 'medium', label: '360p',   badge: 'عادي',        color: '#94a3b8', note: 'اتصال عادي'     },
    { id: 'small',  label: '240p',   badge: 'منخفض',       color: '#60a5fa', note: 'اتصال بطيء'      },
    { id: 'tiny',   label: '144p',   badge: 'أدنى',          color: '#a78bfa', note: 'اتصال ضعيف جداً' },
    { id: 'default',label: 'تلقائي', badge: 'تلقائي',      color: '#e2e8f0', note: 'يختار يوتيوب'  }
  ];

  /* ================================================================
     حالة عامّة
  ================================================================ */
  var state = {
    ytApiReady   : false,
    pendingPlay  : null,
    currentPlayer: null,
    currentCard  : null,
    isLowBW      : false,
    detectedQ    : null,
    chosenQ      : null    // ما اختاره الزائر فعلاً
  };

  /* ================================================================
     حفظ وقراءة تفضيل الجودة
  ================================================================ */
  function savePref(q) {
    try { localStorage.setItem(CFG.PREF_KEY, q); } catch(e) {}
    state.chosenQ = q;
  }
  function loadPref() {
    try { return localStorage.getItem(CFG.PREF_KEY) || null; } catch(e) { return null; }
  }

  /* ================================================================
     اكتشاف سرعة الاتصال
  ================================================================ */
  function detectBandwidth() {
    var saved = loadPref();
    if (saved) { state.chosenQ = saved; }

    try {
      var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        var eff = conn.effectiveType || '';
        if (eff === 'slow-2g' || eff === '2g') { state.isLowBW = true;  state.detectedQ = 'small';  return; }
        if (eff === '3g')                       { state.isLowBW = false; state.detectedQ = 'medium'; return; }
        if (eff === '4g')                       { state.isLowBW = false; state.detectedQ = 'hd720';  return; }
        var dl = conn.downlink || 0;
        if (dl > 0) {
          state.isLowBW   = dl < 0.5;
          state.detectedQ = dl < 0.5 ? 'small' : dl < 2 ? 'medium' : dl < 5 ? 'large' : 'hd720';
          return;
        }
      }
    } catch(e) {}

    try {
      var t0 = Date.now(), img = new Image();
      img.onload = function () {
        var kbps = Math.round((150*8)/((Date.now()-t0)/1000));
        state.isLowBW   = kbps < CFG.SPEED_TEST_THRESHOLD;
        state.detectedQ = kbps < CFG.SPEED_TEST_THRESHOLD ? 'small' : kbps < 1500 ? 'medium' : 'hd720';
      };
      img.onerror = function () { state.detectedQ = state.detectedQ || 'medium'; };
      img.src = 'https://i.ytimg.com/vi/1/hqdefault.jpg?_t=' + t0;
    } catch(e) {}
  }

  /* ================================================================
     CSS كامل
  ================================================================ */
  function injectStyles() {
    if (document.getElementById('yt-styles')) return;
    var s = document.createElement('style');
    s.id  = 'yt-styles';
    s.textContent = [
      /* شبكة */
      '.yt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;}',

      /* بطاقة */
      '.yt-card{background:#fff;border:1.5px solid #e0d9cc;border-radius:12px;overflow:hidden;',
      'cursor:pointer;transition:transform .26s,box-shadow .26s,border-color .26s;',
      'box-shadow:0 2px 8px rgba(0,0,0,.07);}',
      '.yt-card:hover,.yt-card:focus-visible{transform:translateY(-5px);',
      'box-shadow:0 10px 30px rgba(0,0,0,.13);border-color:#cc0000;outline:none;}',
      '.yt-card.yt-playing{grid-column:1/-1;cursor:default;transform:none;',
      'box-shadow:0 6px 28px rgba(204,0,0,.2);border-color:#cc0000;}',

      /* صورة */
      '.yt-thumb{position:relative;width:100%;padding-bottom:56.25%;background:#111;overflow:hidden;}',
      '.yt-thumb img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .4s;}',
      '.yt-card:hover .yt-thumb img{transform:scale(1.05);}',
      '.yt-play-btn{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;',
      'background:rgba(0,0,0,.32);opacity:0;transition:opacity .26s;font-size:2.8rem;color:#fff;}',
      '.yt-card:hover .yt-play-btn{opacity:1;}',

      /* معلومات */
      '.yt-info{padding:14px 16px 16px;}',
      '.yt-num{font-size:.73rem;color:#cc0000;font-weight:700;margin-bottom:3px;}',
      '.yt-title{font-size:.97rem;font-weight:700;color:#1c1c1c;line-height:1.55;margin-bottom:6px;',
      'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
      '.yt-date{font-size:.76rem;color:#bbb;display:block;}',

      /* مؤشّر */
      '.yt-loading{grid-column:1/-1;text-align:center;padding:56px 20px;color:#6b6b6b;font-family:Cairo,sans-serif;}',
      '.yt-spinner{display:block;width:46px;height:46px;margin:0 auto 14px;',
      'border:4px solid rgba(26,71,49,.1);border-top-color:#cc0000;border-radius:50%;',
      'animation:ytSpin 1s linear infinite;}',
      '@keyframes ytSpin{to{transform:rotate(360deg);}}',

      /* خطأ */
      '.yt-error{grid-column:1/-1;text-align:center;padding:44px 20px;color:#e74c3c;',
      'font-family:Cairo,sans-serif;font-size:.95rem;line-height:2;}',
      '.yt-retry-btn{display:inline-flex;align-items:center;gap:6px;margin-top:12px;',
      'padding:10px 24px;background:#1A4731;color:#fff;border-radius:8px;border:none;',
      'cursor:pointer;font-family:Cairo,sans-serif;font-size:.92rem;font-weight:700;transition:background .2s;}',
      '.yt-retry-btn:hover{background:#2D6A4F;}',

      /* شارة اتصال بطيء */
      '.yt-lowbw-bar{display:none;align-items:center;gap:10px;padding:10px 16px;',
      'background:rgba(255,165,0,.1);border:1px solid rgba(255,165,0,.3);border-radius:8px;',
      'margin-bottom:16px;font-size:.86rem;color:#b36000;font-family:Cairo,sans-serif;}',
      '.yt-lowbw-bar.show{display:flex;}',
      '.yt-lowbw-icon{font-size:1.2rem;flex-shrink:0;}',

      /* مشغّل */
      '.yt-player-wrap{width:100%;border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.5);}',
      '.yt-player-container{position:relative;width:100%;padding-bottom:56.25%;background:#000;}',
      '.yt-player-container>div,.yt-player-container iframe{position:absolute!important;',
      'top:0!important;left:0!important;width:100%!important;height:100%!important;border:none!important;}',

      /* شريط التحكّم */
      '.yt-ctrl{display:flex;align-items:center;justify-content:space-between;',
      'background:#111;padding:8px 14px;gap:8px;flex-wrap:wrap;}',

      /* زر الإغلاق */
      '.yt-close-btn{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.08);',
      'color:#bbb;border:none;border-radius:5px;padding:7px 14px;cursor:pointer;',
      'font-family:Cairo,sans-serif;font-size:.85rem;transition:.2s;white-space:nowrap;}',
      '.yt-close-btn:hover{background:rgba(220,50,50,.35);color:#fff;}',

      /* شارة الجودة الحالية */
      '.yt-q-now{color:#c9a84c;font-size:.74rem;font-family:Cairo,sans-serif;padding:4px 10px;',
      'background:rgba(201,168,76,.1);border-radius:20px;border:1px solid rgba(201,168,76,.25);',
      'white-space:nowrap;cursor:pointer;transition:.2s;}',
      '.yt-q-now:hover{background:rgba(201,168,76,.2);}',

      /* شريط أزرار الجودة */
      '.yt-q-strip{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}',
      '.yt-q-strip-label{color:#888;font-size:.76rem;font-family:Cairo,sans-serif;white-space:nowrap;}',
      '.yt-q-btn{display:inline-flex;align-items:center;gap:3px;padding:4px 10px;',
      'background:rgba(255,255,255,.06);color:#aaa;border:1px solid rgba(255,255,255,.12);',
      'border-radius:20px;cursor:pointer;font-family:Cairo,sans-serif;font-size:.74rem;',
      'font-weight:700;white-space:nowrap;transition:.2s;}',
      '.yt-q-btn:hover{background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.3);}',
      '.yt-q-btn.active{background:rgba(201,168,76,.18);color:#c9a84c;border-color:rgba(201,168,76,.45);}',
      '.yt-q-btn.rec::before{content:"\2605 ";font-size:.65rem;opacity:.8;}',

      /* ==========================================================
         نافذة اختيار الجودة (تظهر قبل التشغيل)
      ========================================================== */
      /* خلفية شبه شفافة */
      '.yt-qpicker-overlay{position:fixed;inset:0;z-index:99990;',
      'background:rgba(0,0,0,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);',
      'display:flex;align-items:center;justify-content:center;padding:16px;',
      'animation:ytFadeIn .18s ease;}',
      '@keyframes ytFadeIn{from{opacity:0}to{opacity:1}}',

      /* بطاقة النافذة */
      '.yt-qpicker{background:#1a1f2b;border:1px solid rgba(255,255,255,.1);',
      'border-radius:16px;padding:24px 20px 20px;width:100%;max-width:430px;',
      'box-shadow:0 24px 64px rgba(0,0,0,.7);animation:ytSlideUp .22s ease;}',
      '@keyframes ytSlideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}',

      /* عنوان النافذة */
      '.yt-qpicker-head{display:flex;align-items:flex-start;justify-content:space-between;',
      'gap:10px;margin-bottom:6px;}',
      '.yt-qpicker-title{font-family:Cairo,sans-serif;font-size:1rem;font-weight:800;',
      'color:#fff;line-height:1.4;flex:1;}',
      '.yt-qpicker-sub{font-family:Cairo,sans-serif;font-size:.78rem;color:#94a3b8;',
      'margin-bottom:18px;line-height:1.5;}',
      '.yt-qpicker-x{background:none;border:none;color:#64748b;cursor:pointer;',
      'font-size:1.2rem;padding:2px 6px;border-radius:4px;transition:.2s;line-height:1;flex-shrink:0;}',
      '.yt-qpicker-x:hover{background:rgba(255,255,255,.1);color:#fff;}',

      /* شبكة خيارات الجودة */
      '.yt-qpicker-grid{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}',

      /* بطاقة جودة */
      '.yt-qopt{display:flex;align-items:center;gap:12px;padding:11px 14px;',
      'background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.07);',
      'border-radius:10px;cursor:pointer;transition:.22s;font-family:Cairo,sans-serif;}',
      '.yt-qopt:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.2);}',
      '.yt-qopt.selected{border-color:rgba(201,168,76,.6);background:rgba(201,168,76,.1);}',
      '.yt-qopt.rec-opt{border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.05);}',
      '.yt-qopt.rec-opt.selected{border-color:#4ade80;background:rgba(74,222,128,.12);}',

      /* نقطة اللون */
      '.yt-qopt-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}',

      /* النصوص */
      '.yt-qopt-body{flex:1;min-width:0;}',
      '.yt-qopt-lbl{font-size:.95rem;font-weight:700;color:#e2e8f0;display:flex;',
      'align-items:center;gap:6px;flex-wrap:wrap;}',
      '.yt-qopt-badge{font-size:.67rem;font-weight:800;padding:2px 7px;',
      'border-radius:20px;background:rgba(255,255,255,.1);color:#94a3b8;white-space:nowrap;}',
      '.yt-qopt.selected .yt-qopt-badge{background:rgba(201,168,76,.3);color:#c9a84c;}',
      '.yt-qopt.rec-opt .yt-qopt-badge{background:rgba(74,222,128,.2);color:#4ade80;}',
      '.yt-qopt-note{font-size:.76rem;color:#64748b;margin-top:2px;}',
      '.yt-qopt.rec-opt .yt-qopt-note::before{content:"★ موصى لك — ";}',

      /* شارة "تذكّر" */
      '.yt-qpicker-save{display:flex;align-items:center;gap:8px;padding:9px 12px;',
      'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);',
      'border-radius:8px;margin-bottom:16px;font-family:Cairo,sans-serif;font-size:.82rem;',
      'color:#94a3b8;cursor:pointer;transition:.2s;user-select:none;}',
      '.yt-qpicker-save:hover{background:rgba(255,255,255,.08);}',
      '.yt-qpicker-save input{cursor:pointer;width:16px;height:16px;accent-color:#c9a84c;flex-shrink:0;}',

      /* زر التشغيل */
      '.yt-qpicker-play{width:100%;padding:12px;background:linear-gradient(135deg,#1A4731,#2D6A4F);',
      'color:#fff;border:none;border-radius:10px;font-family:Cairo,sans-serif;font-size:1rem;',
      'font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;',
      'gap:8px;transition:.22s;box-shadow:0 4px 14px rgba(26,71,49,.4);}',
      '.yt-qpicker-play:hover{background:linear-gradient(135deg,#2D6A4F,#3a8462);',
      'box-shadow:0 6px 20px rgba(26,71,49,.5);transform:translateY(-1px);}',
      '.yt-qpicker-play:active{transform:translateY(0);}',

      /* Responsive */
      '@media(max-width:600px){',
      '.yt-grid{grid-template-columns:1fr 1fr;gap:12px;}',
      '.yt-info{padding:10px 12px 12px;}',
      '.yt-title{font-size:.88rem;}',
      '.yt-qpicker{padding:18px 14px 14px;}',
      '.yt-qopt{padding:9px 12px;}',
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
    try { localStorage.setItem('yt_pl_'+ytId, JSON.stringify({ts:Date.now(),items:items})); } catch(e) {}
  }

  /* ================================================================
     تحليل XML
  ================================================================ */
  function parseXml(xml) {
    var items=[], rx=/<entry>([\u0000-\uFFFF]*?)<\/entry>/g, m;
    while((m=rx.exec(xml))!==null){
      var e=m[1];
      var title = (/<title>([\u0000-\uFFFF]*?)<\/title>/.exec(e)||[])[1]||'';
      var vid   = (/<yt:videoId>([\u0000-\uFFFF]*?)<\/yt:videoId>/.exec(e)||[])[1]||'';
      var pub   = (/<published>([\u0000-\uFFFF]*?)<\/published>/.exec(e)||[])[1]||'';
      if(vid) items.push({
        title:title.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'),
        link:'https://www.youtube.com/watch?v='+vid, pubDate:pub
      });
    }
    return items;
  }

  /* ================================================================
     جلب القائمة — 3 طرق
  ================================================================ */
  function fetchPlaylist(ytId) {
    var RSS = 'https://www.youtube.com/feeds/videos.xml?playlist_id='+ytId;
    var U1  = 'https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(RSS)+'&count='+CFG.COUNT;
    var U2  = 'https://api.allorigins.win/get?url='+encodeURIComponent(RSS);
    var U3  = 'https://cors-anywhere.herokuapp.com/'+RSS;
    var sig = function(ms){ return AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined; };

    function t1(){
      return fetch(U1,{signal:sig(8000)}).then(function(r){if(!r.ok)throw 0;return r.json();})
        .then(function(d){if(d.status==='ok'&&d.items&&d.items.length)return d.items;throw 0;});
    }
    function t2(){
      return fetch(U2,{signal:sig(10000)}).then(function(r){if(!r.ok)throw 0;return r.json();})
        .then(function(d){var it=parseXml(d.contents||'');if(!it.length)throw 0;return it;});
    }
    function t3(){
      return fetch(U3,{signal:sig(12000)}).then(function(r){if(!r.ok)throw 0;return r.text();})
        .then(function(t){var it=parseXml(t);if(!it.length)throw 0;return it;});
    }
    var delay=function(){return new Promise(function(r){setTimeout(r,CFG.RETRY_DELAY);});};
    return t1().catch(function(){return delay().then(t2);})
               .catch(function(){return delay().then(t3);});
  }

  /* ================================================================
     YouTube IFrame API
  ================================================================ */
  function loadYTApi() {
    if(window.YT&&window.YT.Player){state.ytApiReady=true;return;}
    if(document.querySelector('script[src*="iframe_api"]'))return;
    var tag=document.createElement('script');
    tag.src='https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }
  window.onYouTubeIframeAPIReady=function(){
    state.ytApiReady=true;
    if(state.pendingPlay){var p=state.pendingPlay;state.pendingPlay=null;playInline(p.card,p.id,p.q);}
  };

  /* ================================================================
     نافذة اختيار الجودة
     تظهر قبل التشغيل وتستدعي callback بالجودة المختارة
  ================================================================ */
  function showQualityPicker(videoTitle, thumbId, callback) {
    /* لا تفتح نافذتين */
    var old = document.getElementById('yt-qpicker-overlay');
    if (old) old.remove();

    /* تحديد الجودة الموصى */
    var rec    = state.chosenQ || state.detectedQ || (state.isLowBW ? 'small' : 'hd720');
    var saved  = loadPref();

    /* بناء HTML النافذة */
    var optsHtml = QUALITIES.map(function(q){
      var isRec  = q.id === rec;
      var isSel  = saved ? q.id === saved : isRec;
      return [
        '<div class="yt-qopt'+(isRec?' rec-opt':'')+(isSel?' selected':'')+'"',
        ' data-q="'+q.id+'" role="radio" aria-checked="'+(isSel?'true':'false')+'" tabindex="0">',
        '<span class="yt-qopt-dot" style="background:'+q.color+';"></span>',
        '<div class="yt-qopt-body">',
        '<div class="yt-qopt-lbl">',
        q.label,
        '<span class="yt-qopt-badge">'+q.badge+'</span>',
        '</div>',
        '<div class="yt-qopt-note">'+q.note+'</div>',
        '</div>',
        '</div>'
      ].join('');
    }).join('');

    var overlay = document.createElement('div');
    overlay.id        = 'yt-qpicker-overlay';
    overlay.className = 'yt-qpicker-overlay';
    overlay.innerHTML = [
      '<div class="yt-qpicker" role="dialog" aria-modal="true" aria-label="اختيار جودة التشغيل">',
        '<div class="yt-qpicker-head">',
          '<div class="yt-qpicker-title">اختر جودة التشغيل</div>',
          '<button class="yt-qpicker-x" aria-label="إغلاق">&times;</button>',
        '</div>',
        '<div class="yt-qpicker-sub">',
          (videoTitle
            ? 'سيتم تشغيل: <strong style="color:#e2e8f0;">'+escHtml(videoTitle.substring(0,55))+(videoTitle.length>55?'…':'')+'</strong><br>'
            : ''
          ),
          'اختر الجودة المناسبة لسرعة اتصالك.',
        '</div>',
        '<div class="yt-qpicker-grid">'+optsHtml+'</div>',
        '<label class="yt-qpicker-save">',
          '<input type="checkbox" id="ytQSaveChk" '+(saved?'checked':'')+'> تذكّر اختياري للمرات القادمة',
        '</label>',
        '<button class="yt-qpicker-play">',
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>',
          ' تشغيل الآن',
        '</button>',
      '</div>'
    ].join('');

    document.body.appendChild(overlay);

    var picker  = overlay.querySelector('.yt-qpicker');
    var opts    = overlay.querySelectorAll('.yt-qopt');
    var playBtn = overlay.querySelector('.yt-qpicker-play');
    var saveChk = overlay.querySelector('#ytQSaveChk');
    var xBtn    = overlay.querySelector('.yt-qpicker-x');

    var selected = saved || rec;

    /* --- تحديث التحديد --- */
    function selectQ(q) {
      selected = q;
      opts.forEach(function(opt){
        var on = opt.dataset.q === q;
        opt.classList.toggle('selected', on);
        opt.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }

    /* --- أحداث --- */
    opts.forEach(function(opt){
      opt.addEventListener('click', function(){ selectQ(opt.dataset.q); });
      opt.addEventListener('keydown', function(e){
        if(e.key==='Enter'||e.key===' '){e.preventDefault();selectQ(opt.dataset.q);}
      });
    });

    function close(){ overlay.remove(); }

    xBtn.addEventListener('click', close);
    overlay.addEventListener('click', function(e){ if(e.target===overlay) close(); });
    document.addEventListener('keydown', function esc(e){
      if(e.key==='Escape'){ close(); document.removeEventListener('keydown',esc); }
    });

    playBtn.addEventListener('click', function(){
      if(saveChk.checked) savePref(selected);
      else { state.chosenQ = selected; try{localStorage.removeItem(CFG.PREF_KEY);}catch(er){} }
      close();
      callback(selected);
    });

    /* تركيز للوصول */
    setTimeout(function(){ try{playBtn.focus();}catch(e){} }, 120);
  }

  /* ================================================================
     شريط الجودة داخل المشغّل (تغيير بعد التشغيل)
  ================================================================ */
  function buildQualityStrip(player, ctrl, currentQ) {
    var old = ctrl.querySelector('.yt-q-strip'); if(old) old.remove();
    var old2= ctrl.querySelector('.yt-q-now');  if(old2) old2.remove();

    var levels = [];
    try { levels = player.getAvailableQualityLevels() || []; } catch(e) {}
    if (!levels.length) return;

    var order = ['hd1080','hd720','large','medium','small','tiny'];
    var avail = order.filter(function(q){ return levels.indexOf(q)!==-1; });
    if(!avail.length) avail = levels.filter(function(q){ return q!=='default'; });

    var nowEl = document.createElement('span');
    nowEl.className = 'yt-q-now';
    nowEl.title = 'اضغط لتغيير الجودة';
    nowEl.textContent = '📡 جودة: ' + (QUALITIES.find(function(x){return x.id===currentQ;})||{label:currentQ}).label;
    ctrl.appendChild(nowEl);

    var strip = document.createElement('div');
    strip.className = 'yt-q-strip';
    strip.innerHTML = '<span class="yt-q-strip-label">جودة:</span>';
    var rec = state.chosenQ || state.detectedQ;

    avail.concat(['default']).forEach(function(q){
      var meta = QUALITIES.find(function(x){return x.id===q;}) || {label:q, badge:q};
      var btn  = document.createElement('button');
      btn.className = 'yt-q-btn'+(q===currentQ?' active':'')+(q===rec?' rec':'');
      btn.dataset.q = q;
      btn.textContent= meta.label;
      if(q===rec) btn.title = 'موصى حسب اتصالك';
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        try{ player.setPlaybackQuality(q); }catch(er){}
        strip.querySelectorAll('.yt-q-btn').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        nowEl.textContent = '📡 جودة: ' + meta.label;
        savePref(q);
      });
      strip.appendChild(btn);
    });

    ctrl.appendChild(strip);
    player.__qNowEl = nowEl;
    player.__qStrip = strip;
  }

  /* ================================================================
     إعادة البطاقة
  ================================================================ */
  function restoreCard(card){
    if(!card)return;
    card.classList.remove('yt-playing');
    var w=card.querySelector('.yt-player-wrap'), t=card.querySelector('.yt-thumb'), i=card.querySelector('.yt-info');
    if(w)w.remove(); if(t)t.style.display=''; if(i)i.style.display='';
  }

  /* ================================================================
     تشغيل مضمَّن بجودة محدّدة
  ================================================================ */
  function playInline(card, id, chosenQ) {
    if (!id) return;
    if (!state.ytApiReady || !window.YT || !window.YT.Player) {
      state.pendingPlay = { card:card, id:id, q:chosenQ }; return;
    }
    if (state.currentCard && state.currentCard !== card) {
      restoreCard(state.currentCard);
      try{ state.currentPlayer.destroy(); }catch(e){}
      state.currentPlayer = null;
    }
    state.currentCard = card;
    card.classList.add('yt-playing');
    var thumb = card.querySelector('.yt-thumb'), info = card.querySelector('.yt-info');
    if(thumb)thumb.style.display='none';
    if(info) info.style.display='none';

    var wrap = document.createElement('div');
    wrap.className = 'yt-player-wrap';
    var divId = 'yt-p-'+id+'-'+Date.now();
    wrap.innerHTML =
      '<div class="yt-player-container"><div id="'+divId+'"></div></div>'+
      '<div class="yt-ctrl">'+
        '<button class="yt-close-btn">'+
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"'+
          ' stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/>'+
          '<line x1="6" y1="6" x2="18" y2="18"/></svg> إغلاق'+
        '</button>'+
      '</div>';

    card.insertBefore(wrap, thumb);
    var ctrl = wrap.querySelector('.yt-ctrl');

    wrap.querySelector('.yt-close-btn').addEventListener('click', function(e){
      e.stopPropagation();
      try{state.currentPlayer.destroy();}catch(er){}
      state.currentPlayer=null;
      restoreCard(card);
      if(state.currentCard===card)state.currentCard=null;
    });

    var startQ = chosenQ || state.chosenQ || state.detectedQ || (state.isLowBW?CFG.LOW_BW_Q:CFG.DEFAULT_Q);

    state.currentPlayer = new YT.Player(divId, {
      videoId: id,
      playerVars: { autoplay:1, rel:0, modestbranding:1,
                    origin: window.location.origin||'',
                    vq: startQ, playsinline:1 },
      events: {
        onReady: function(ev){
          ev.target.playVideo();
          try{ ev.target.setPlaybackQuality(startQ); }catch(er){}
          setTimeout(function(){
            try{ ev.target.setPlaybackQuality(startQ); }catch(er){}
            buildQualityStrip(ev.target, ctrl, startQ);
          }, 2000);
        },
        onPlaybackQualityChange: function(ev){
          var q=ev.data;
          var nowEl=state.currentPlayer&&state.currentPlayer.__qNowEl;
          var strip=state.currentPlayer&&state.currentPlayer.__qStrip;
          var meta=QUALITIES.find(function(x){return x.id===q;})||{label:q};
          if(nowEl) nowEl.textContent='📡 جودة: '+meta.label;
          if(strip) strip.querySelectorAll('.yt-q-btn').forEach(function(b){
            b.classList.toggle('active', b.dataset.q===q);
          });
        },
        onError: function(ev){
          var code=ev.data;
          var msg='⚠️ تعذّر تشغيل المقطع';
          if(code===101||code===150)msg='⚠️ هذا المقطع لا يسمح بالتشغيل خارج يوتيوب';
          if(code===100)msg='⚠️ المقطع غير متاح أو تم حذفه';
          var cont=wrap.querySelector('.yt-player-container');
          if(cont) cont.innerHTML=
            '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;'+
            'justify-content:center;background:#111;color:#ff9090;font-family:Cairo,sans-serif;'+
            'font-size:.92rem;text-align:center;padding:20px;gap:12px;">'+msg+'<br>'+
            '<a href="https://www.youtube.com/watch?v='+id+'" target="_blank" '+
            'style="color:#c9a84c;font-weight:700;font-size:.88rem;">فتح في يوتيوب ↗</a></div>';
        }
      }
    });
  }

  /* ================================================================
     iframe احتياطي
  ================================================================ */
  function showIframeFallback(container, ytId) {
    container.innerHTML=
      '<div style="grid-column:1/-1;position:relative;width:100%;padding-bottom:56.25%;'+
      'border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.2);'+
      'border:3px solid #c9a84c;background:#000;">'+
        '<iframe style="position:absolute;top:0;left:0;width:100%;height:100%;"'+
        ' src="https://www.youtube.com/embed?listType=playlist&list='+ytId+
        '&rel=0&modestbranding=1&vq='+CFG.LOW_BW_Q+'"'+
        ' title="قائمة تشغيل" frameborder="0" loading="lazy"'+
        ' allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"'+
        ' allowfullscreen></iframe>'+
      '</div>';
  }

  /* ================================================================
     مساعدات
  ================================================================ */
  function fmtDate(str){
    if(!str)return '';
    try{
      var d=new Date(str), mo=['يناير','فبراير','مارس','أبريل','مايو','يونيو',
        'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
      return d.getDate()+' '+mo[d.getMonth()]+' '+d.getFullYear();
    }catch(e){return '';}
  }
  function escHtml(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function vidId(link){
    var m=String(link||'').match(/[?&]v=([^&]+)/);return m?m[1]:'';
  }

  /* ================================================================
     رسم البطاقات
  ================================================================ */
  function renderCards(items, grid, ytId) {
    if(!items||!items.length){showIframeFallback(grid,ytId);return;}
    var countEl=document.getElementById('vidCount');
    if(countEl)countEl.textContent=items.length;

    grid.innerHTML=items.map(function(item,idx){
      var id=vidId(item.link);
      var thumb=id?'https://i.ytimg.com/vi/'+id+'/mqdefault.jpg':'';
      var date=fmtDate(item.pubDate);
      return '<article class="yt-card" data-vid="'+escHtml(id)+'" data-title="'+escHtml(item.title)+'"'+
        ' tabindex="0" role="button" aria-label="'+escHtml(item.title)+'">'+
        '<div class="yt-thumb">'+
          (thumb?'<img src="'+thumb+'" alt="" loading="lazy">':'')+
          '<div class="yt-play-btn">&#9654;</div>'+
        '</div>'+
        '<div class="yt-info">'+
          '<div class="yt-num">#'+(idx+1)+'</div>'+
          '<h3 class="yt-title">'+escHtml(item.title)+'</h3>'+
          (date?'<span class="yt-date">'+date+'</span>':'')+
        '</div>'+
        '</article>';
    }).join('');

    grid.querySelectorAll('.yt-card').forEach(function(card){
      function act(){
        /* إذا كان الزائر لم يحتفظ بتفضيل محدّد → أظهر النافذة */
        var savedPref = loadPref();
        if (!savedPref) {
          showQualityPicker(card.dataset.title, card.dataset.vid, function(q){
            playInline(card, card.dataset.vid, q);
          });
        } else {
          /* تفضيل محفوظ → شغّل مباشرة */
          playInline(card, card.dataset.vid, savedPref);
        }
      }
      card.addEventListener('click', act);
      card.addEventListener('keydown', function(e){
        if(e.key==='Enter'||e.key===' '){e.preventDefault();act();}
      });
    });

    try {
      if(window.SITE_DATA){
        SITE_DATA.clips=(SITE_DATA.clips||[]).concat(
          items.map(function(it){return{type:'مقطع',title:it.title,desc:'',page:it.link};})
        );
      }
    }catch(e){}
  }

  /* ================================================================
     شارة اتصال بطيء
  ================================================================ */
  function showLowBWBar(gridParent){
    var bar=gridParent&&gridParent.previousElementSibling;
    if(bar&&bar.classList.contains('yt-lowbw-bar'))bar.classList.add('show');
  }

  /* ================================================================
     تحميل قائمة
  ================================================================ */
  function loadPlaylist(gridId, ytId) {
    var grid=document.getElementById(gridId);
    if(!grid)return;

    var wrapper=grid.parentElement;
    if(wrapper&&!wrapper.querySelector('.yt-lowbw-bar')){
      var bar=document.createElement('div');
      bar.className='yt-lowbw-bar';
      bar.innerHTML='<span class="yt-lowbw-icon">🚨</span>'+
        '<span>تم اكتشاف اتصال بطيء — سيظهر لك خيار اختيار الجودة الملائمة عند التشغيل.</span>';
      wrapper.insertBefore(bar,grid);
    }

    var cached=loadCache(ytId);
    if(cached){
      renderCards(cached,grid,ytId);
      if(state.isLowBW)showLowBWBar(grid);
      fetchPlaylist(ytId).then(function(fresh){
        if(fresh&&fresh.length){
          saveCache(ytId,fresh);
          if(fresh.length!==cached.length)renderCards(fresh,grid,ytId);
        }
      }).catch(function(){});
      return;
    }

    grid.innerHTML='<div class="yt-loading"><span class="yt-spinner"></span>جارٍّ تحميل المقاطع...</div>';
    fetchPlaylist(ytId)
      .then(function(items){
        saveCache(ytId,items);
        renderCards(items,grid,ytId);
        if(state.isLowBW)showLowBWBar(grid);
      })
      .catch(function(){
        grid.innerHTML='';
        showIframeFallback(grid,ytId);
        var errDiv=document.createElement('div');
        errDiv.className='yt-error';
        errDiv.innerHTML='⚠️ تعذّر تحميل قائمة التشغيل.<br>'+
          '<button class="yt-retry-btn">🔄 إعادة المحاولة</button>';
        errDiv.querySelector('.yt-retry-btn').addEventListener('click',function(){
          grid.innerHTML='';loadPlaylist(gridId,ytId);
        });
        grid.parentElement.insertBefore(errDiv,grid);
      });
  }

  /* ================================================================
     تهيئة clips.html
  ================================================================ */
  function initClipsPage(){
    injectStyles();
    detectBandwidth();
    loadYTApi();
    if(document.getElementById('ytVideosGrid')){
      loadPlaylist('ytVideosGrid',PLAYLISTS['1'].ytId);
    }
  }

  /* تصدير */
  window.YTLoadPlaylist  = loadPlaylist;
  window.YT_PLAYLISTS    = PLAYLISTS;
  window.YT_injectStyles = injectStyles;
  window.YT_detectBW     = detectBandwidth;
  window.YT_loadApi      = loadYTApi;

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',initClipsPage);
  }else{initClipsPage();}

})();
