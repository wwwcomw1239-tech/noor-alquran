/* =========================================
   نور القرآن — الوظائف التفاعلية
   ========================================= */

(function () {
  'use strict';

  /* ===============================================
     🌙 الوضع الليلي — Dark Mode (محسّن)
     =============================================== */
  (function initDarkMode() {
    var STORAGE_KEY = 'noor-theme';

    var css = [
      /* متغيرات الألوان الأساسية */
      '[data-theme="dark"] {',
      '  --clr-primary:    #1B3A2B;',
      '  --clr-primary-dk: #0D1F16;',
      '  --clr-primary-lt: #2A5040;',
      '  --clr-gold:       #D9B96A;',
      '  --clr-gold-lt:    #EDD08A;',
      '  --clr-bg:         #141414;',
      '  --clr-bg-alt:     #1C1C1C;',
      '  --clr-text:       #EFEFEF;',
      '  --clr-text-muted: #B0B0B0;',
      '  --clr-white:      #1E1E1E;',
      '  --clr-border:     #2E2E2E;',
      '  --clr-footer-bg:  #0A0F0C;',
      '  --shadow-sm: 0 2px 8px rgba(0,0,0,.5);',
      '  --shadow-lg: 0 8px 32px rgba(0,0,0,.7);',
      '}',

      /* الجسم والخلفية العامة */
      '[data-theme="dark"] body { background:#141414; color:#EFEFEF; }',

      /* شريط التنقل */
      '[data-theme="dark"] .navbar { background:#0D1F16; }',
      '[data-theme="dark"] .nav-top { background:#090F0B; border-bottom-color:rgba(217,185,106,.2); }',
      '[data-theme="dark"] .nav-bottom { background:#0D1F16; }',
      '[data-theme="dark"] .nav-links { background:#0D1F16; }',
      '[data-theme="dark"] .nav-links a { color:rgba(255,255,255,.80); }',
      '[data-theme="dark"] .nav-links a:hover { color:#EDD08A; background:rgba(255,255,255,.06); }',
      '[data-theme="dark"] .nav-links a.active { color:#D9B96A; }',

      /* شعار الموقع */
      '[data-theme="dark"] .logo-text {',
      '  background: linear-gradient(135deg,#ffffff 25%,#EDD08A 100%);',
      '  -webkit-background-clip:text; background-clip:text;',
      '  -webkit-text-fill-color:transparent;',
      '}',

      /* البطاقات */
      '[data-theme="dark"] .card { background:#1E1E1E; border-color:#2E2E2E; }',
      '[data-theme="dark"] .card-title { color:#EFEFEF; }',
      '[data-theme="dark"] .card-subtitle { color:#B0B0B0; }',
      '[data-theme="dark"] .card-author { color:#6DB890; }',
      '[data-theme="dark"] .card-text { color:#B8B8B8; }',
      '[data-theme="dark"] .card-footer { border-top-color:#2E2E2E; }',
      '[data-theme="dark"] .card-date { color:#888; }',
      '[data-theme="dark"] .card-link { color:#6DB890; }',
      '[data-theme="dark"] .card-link:hover { color:#D9B96A; }',
      '[data-theme="dark"] .card-tag { background:rgba(109,184,144,.15); color:#6DB890; }',

      /* بيانات الكتاب */
      '[data-theme="dark"] .book-meta .meta-item { background:#2A2A2A; color:#C8C8C8; border:1px solid #333; }',
      '[data-theme="dark"] .btn-download { background:#1B3A2B; color:#EFEFEF; }',
      '[data-theme="dark"] .btn-download:hover { background:#2A5040; color:#EFEFEF; }',

      /* عنوان الأقسام */
      '[data-theme="dark"] .section-title { color:#D9B96A; }',
      '[data-theme="dark"] .section-desc { color:#B0B0B0; }',
      '[data-theme="dark"] .section-header { border-bottom-color:#2E2E2E; }',

      /* الأقسام البديلة */
      '[data-theme="dark"] .section-alt { background:#181818; }',

      /* Hero */
      '[data-theme="dark"] .hero { background:#090F0B; }',
      '[data-theme="dark"] .hero-bg { background: radial-gradient(ellipse at 15% 60%,rgba(217,185,106,.1) 0%,transparent 55%), radial-gradient(ellipse at 85% 20%,rgba(217,185,106,.07) 0%,transparent 45%), linear-gradient(160deg,#090F0B 0%,#0D1F16 55%,#090F0B 100%); }',
      '[data-theme="dark"] .hero-title { color:#EFEFEF; }',
      '[data-theme="dark"] .hero-subtitle { color:rgba(255,255,255,.75); }',

      /* عنوان الصفحة */
      '[data-theme="dark"] .page-header { background:linear-gradient(150deg,#090F0B 0%,#0D1F16 100%); }',
      '[data-theme="dark"] .page-header h1 { color:#EFEFEF; }',
      '[data-theme="dark"] .page-header p { color:rgba(255,255,255,.72); }',

      /* بطاقات المزايا */
      '[data-theme="dark"] .feature-card { background:#1E1E1E; border-color:#2E2E2E; }',
      '[data-theme="dark"] .feature-title { color:#D9B96A; }',
      '[data-theme="dark"] .feature-desc { color:#B8B8B8; }',

      /* CTA */
      '[data-theme="dark"] .cta-box { background:linear-gradient(135deg,rgba(27,58,43,.3) 0%,rgba(217,185,106,.08) 100%); border-color:rgba(217,185,106,.25); }',
      '[data-theme="dark"] .cta-title { color:#D9B96A; }',
      '[data-theme="dark"] .cta-desc { color:#B0B0B0; }',

      /* التبويبات */
      '[data-theme="dark"] .tabs-wrap { border-bottom-color:#2E2E2E; }',
      '[data-theme="dark"] .tab-btn { color:#A0A0A0; }',
      '[data-theme="dark"] .tab-btn:hover { color:#D9B96A; background:rgba(255,255,255,.04); }',
      '[data-theme="dark"] .tab-btn.active { color:#D9B96A; border-bottom-color:#D9B96A; background:rgba(217,185,106,.07); }',

      /* الأزرار */
      '[data-theme="dark"] .btn-primary { background:#1B3A2B; color:#EFEFEF; border-color:#1B3A2B; }',
      '[data-theme="dark"] .btn-primary:hover { background:#2A5040; border-color:#2A5040; color:#EFEFEF; }',
      '[data-theme="dark"] .btn-outline { color:#D9B96A; border-color:#D9B96A; }',
      '[data-theme="dark"] .btn-outline:hover { background:#D9B96A; color:#0D1F16; }',
      '[data-theme="dark"] .btn-secondary { color:rgba(255,255,255,.85); border-color:rgba(255,255,255,.3); }',
      '[data-theme="dark"] .btn-secondary:hover { background:rgba(255,255,255,.1); color:#EFEFEF; }',
      '[data-theme="dark"] .btn-view-all { background:#1B3A2B; color:#EFEFEF; }',
      '[data-theme="dark"] .btn-view-all:hover { background:#2A5040; color:#EFEFEF; }',

      /* البحث */
      '[data-theme="dark"] .search-overlay { background:rgba(0,0,0,.94); }',
      '[data-theme="dark"] .search-input-wrap input { background:#252525; color:#EFEFEF; border-color:#444; }',
      '[data-theme="dark"] .search-input-wrap input::placeholder { color:rgba(255,255,255,.35); }',
      '[data-theme="dark"] .s-result { background:#1E1E1E; border-color:#2E2E2E; }',
      '[data-theme="dark"] .s-result:hover { background:rgba(217,185,106,.08); border-color:rgba(217,185,106,.3); }',
      '[data-theme="dark"] .s-title { color:#EFEFEF; }',
      '[data-theme="dark"] .s-desc { color:rgba(255,255,255,.5); }',
      '[data-theme="dark"] .s-type { background:rgba(27,58,43,.7); color:#D9B96A; }',

      /* صفحة المقاطع */
      '[data-theme="dark"] .playlist-toggle {',
      '  background:linear-gradient(135deg,rgba(27,58,43,.5) 0%,rgba(217,185,106,.08) 100%);',
      '  border-color:rgba(217,185,106,.25);',
      '}',
      '[data-theme="dark"] .playlist-toggle:hover { border-color:#D9B96A; }',
      '[data-theme="dark"] .playlist-name { color:#D9B96A; }',
      '[data-theme="dark"] .playlist-count { color:#A0A0A0; }',
      '[data-theme="dark"] .playlist-arrow { color:#D9B96A; }',
      '[data-theme="dark"] .video-item { background:#1E1E1E; border-color:#2E2E2E; }',
      '[data-theme="dark"] .video-item:hover { border-color:#D9B96A; }',
      '[data-theme="dark"] .video-title { color:#EFEFEF; }',
      '[data-theme="dark"] .video-number { color:#A0A0A0; }',

      /* بطاقات يوتيوب (yt-card) */
      '[data-theme="dark"] .yt-card { background:#1E1E1E; border:1px solid #2E2E2E; }',
      '[data-theme="dark"] .yt-title { color:#EFEFEF; }',
      '[data-theme="dark"] .yt-date { color:#999; }',

      /* مشغل يوتيوب */
      '[data-theme="dark"] .youtube-player-container { background:#111; border-color:#D9B96A; }',
      '[data-theme="dark"] .player-header { background:#111; color:#EFEFEF; }',
      '[data-theme="dark"] .player-title { color:#EFEFEF; }',

      /* صفحة عن الموقع */
      '[data-theme="dark"] .vision-box {',
      '  background:linear-gradient(135deg,rgba(27,58,43,.4) 0%,rgba(217,185,106,.07) 100%);',
      '  border-color:rgba(217,185,106,.25);',
      '}',
      '[data-theme="dark"] .vision-label { background:rgba(109,184,144,.15); color:#6DB890; }',
      '[data-theme="dark"] .vision-text { color:#EFEFEF; }',
      '[data-theme="dark"] .vision-dua { color:#D9B96A; }',
      '[data-theme="dark"] .about-text { color:#D0D0D0; }',
      '[data-theme="dark"] .about-text strong { color:#6DB890; }',
      '[data-theme="dark"] .social-channels {',
      '  background:linear-gradient(135deg,rgba(27,58,43,.3) 0%,rgba(217,185,106,.05) 100%);',
      '  border-color:rgba(217,185,106,.2);',
      '}',
      '[data-theme="dark"] .social-channels-title { color:#D9B96A; }',
      '[data-theme="dark"] .social-channels-desc { color:#B0B0B0; }',
      '[data-theme="dark"] .channel-card { background:#1E1E1E; border-color:#2E2E2E; }',
      '[data-theme="dark"] .channel-card:hover { border-color:#D9B96A; }',
      '[data-theme="dark"] .channel-name { color:#EFEFEF; }',
      '[data-theme="dark"] .channel-desc { color:#A8A8A8; }',
      '[data-theme="dark"] .channel-link { color:#D9B96A; }',
      '[data-theme="dark"] .channel-arrow { color:rgba(255,255,255,.2); }',
      '[data-theme="dark"] .channel-card:hover .channel-arrow { color:#D9B96A; }',

      /* التذييل */
      '[data-theme="dark"] .footer { background:#0A0F0C; border-top:1px solid #1A1A1A; }',
      '[data-theme="dark"] .footer-logo { color:#EFEFEF; }',
      '[data-theme="dark"] .footer-ayah { color:#D9B96A; }',
      '[data-theme="dark"] .footer-nav a { color:rgba(255,255,255,.6); }',
      '[data-theme="dark"] .footer-nav a:hover { color:#D9B96A; }',
      '[data-theme="dark"] .sadaqah-text { color:rgba(255,255,255,.6); }',
      '[data-theme="dark"] .footer-contact-label { color:rgba(255,255,255,.35); }',
      '[data-theme="dark"] .footer-bottom { color:rgba(255,255,255,.35); }',
      '[data-theme="dark"] .footer-top { border-bottom-color:rgba(255,255,255,.08); }',
      '[data-theme="dark"] .footer-contact { border-bottom-color:rgba(255,255,255,.08); }',
      '[data-theme="dark"] .footer-sadaqah { background:rgba(217,185,106,.04); border-bottom-color:rgba(255,255,255,.08); }',

      /* شريط التاريخ الهجري */
      '[data-theme="dark"] .hijri-bar { background:#060E09; border-bottom-color:rgba(217,185,106,.2); }',
      '[data-theme="dark"] .hijri-label { color:#D9B96A; }',
      '[data-theme="dark"] .hijri-date { color:rgba(255,255,255,.92); }',
      '[data-theme="dark"] .hijri-source { color:rgba(255,255,255,.45); }',
      '[data-theme="dark"] .hijri-source:hover { color:#D9B96A; }',

      /* زر العودة للأعلى */
      '[data-theme="dark"] #backToTop { background:linear-gradient(135deg,#D9B96A,#EDD08A); color:#0D1F16; }',

      /* Empty state */
      '[data-theme="dark"] .empty-state p { color:#888; }',

      /* زر الوضع الليلي */
      '.theme-toggle {',
      '  display:flex; align-items:center; justify-content:center;',
      '  width:36px; height:36px;',
      '  background:rgba(255,255,255,.10);',
      '  border:none; border-radius:var(--radius-sm);',
      '  color:var(--clr-white); font-size:1.15rem;',
      '  cursor:pointer; transition:background .22s, transform .22s;',
      '}',
      '.theme-toggle:hover { background:rgba(201,168,76,.3); transform:scale(1.05); }',
      '[data-theme="dark"] .theme-toggle { background:rgba(255,255,255,.07); color:#EDD08A; }',
      '[data-theme="dark"] .theme-toggle:hover { background:rgba(255,255,255,.14); }',

      /* انتقال سلس عام */
      'html { transition:background-color .3s ease, color .3s ease; }'
    ].join('\n');

    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    var savedTheme  = localStorage.getItem(STORAGE_KEY);
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    window.addEventListener('DOMContentLoaded', function () {
      var navActions = document.querySelector('.nav-actions');
      if (!navActions) return;

      var themeBtn = document.createElement('button');
      themeBtn.className    = 'theme-toggle';
      themeBtn.id           = 'themeToggle';
      themeBtn.setAttribute('aria-label', 'تبديل الوضع الليلي');
      themeBtn.innerHTML    = currentTheme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';

      var searchBtn = document.getElementById('searchToggle');
      if (searchBtn) navActions.insertBefore(themeBtn, searchBtn);
      else           navActions.appendChild(themeBtn);

      themeBtn.addEventListener('click', function () {
        var isDark   = document.documentElement.getAttribute('data-theme') === 'dark';
        var newTheme = isDark ? 'light' : 'dark';

        if (newTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
        else                    document.documentElement.removeAttribute('data-theme');

        localStorage.setItem(STORAGE_KEY, newTheme);
        themeBtn.innerHTML = newTheme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
      });
    });
  })();

  /* ================================================
     شريط الإشعار المتحرك — الموقع تحت التجربة
     ================================================ */
  (function injectBetaBanner() {
    var singleMsg = '\uD83D\uDEA7 الموقع لا يزال تحت التجربة ولم ينطلق رسمياً بعد — سينطلق قريباً بإذن الله \u2728';
    var repeatedMsg = Array(12).fill(singleMsg).join(' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ');

    var css = [
      '#beta-ticker {',
      '  position:sticky; top:0; z-index:99999;',
      '  background:linear-gradient(90deg,#1a4731 0%,#2d6a4f 40%,#c9a84c 70%,#1a4731 100%);',
      '  color:#fff; overflow:hidden; padding:3px 0;',
      '  border-bottom:1.5px solid #c9a84c;',
      '  box-shadow:0 1px 5px rgba(0,0,0,.2);',
      '  direction:ltr;',
      '}',
      '#beta-ticker .ticker-track { display:flex; width:max-content; animation:beta-scroll 90s linear infinite; }',
      '#beta-ticker .ticker-text { font-family:"Cairo",sans-serif; font-size:.76rem; font-weight:700; letter-spacing:.2px; padding:0 20px; direction:rtl; line-height:1.2; }',
      '#beta-ticker .ticker-close { position:absolute; left:6px; top:50%; transform:translateY(-50%); background:rgba(255,255,255,.18); border:none; color:#fff; width:16px; height:16px; border-radius:50%; cursor:pointer; font-size:10px; line-height:1; display:flex; align-items:center; justify-content:center; transition:background .2s; z-index:2; }',
      '#beta-ticker .ticker-close:hover { background:rgba(255,255,255,.35); }',
      '@keyframes beta-scroll { 0%{transform:translateX(-50%)} 100%{transform:translateX(0)} }',
      '@media (prefers-reduced-motion:reduce) { #beta-ticker .ticker-track { animation:none; } }'
    ].join('\n');

    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    var bar = document.createElement('div');
    bar.id = 'beta-ticker';
    bar.setAttribute('role', 'marquee');
    bar.setAttribute('aria-label', 'إشعار: الموقع تحت التجربة');

    var track = document.createElement('div');
    track.className = 'ticker-track';

    var textEl1 = document.createElement('span');
    textEl1.className = 'ticker-text';
    textEl1.innerHTML = repeatedMsg;

    var textEl2 = document.createElement('span');
    textEl2.className = 'ticker-text';
    textEl2.innerHTML = repeatedMsg;

    track.appendChild(textEl1);
    track.appendChild(textEl2);
    bar.appendChild(track);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'ticker-close';
    closeBtn.setAttribute('aria-label', 'إغلاق الشريط');
    closeBtn.innerHTML = '&#10005;';
    closeBtn.addEventListener('click', function () { bar.style.display = 'none'; });
    bar.appendChild(closeBtn);

    document.body.insertBefore(bar, document.body.firstChild);
  })();

  /* ----- Mobile Nav Toggle ----- */
  var toggle   = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ----- Highlight active nav link ----- */
  var page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (link) {
    var href = (link.getAttribute('href') || '').split('?')[0];
    link.classList.toggle('active', href === page);
  });

  /* ----- Smooth scroll for in-page anchors ----- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* =================================================
     التاريخ الهجري
     ================================================= */
  function loadHijriDate() {
    var el = document.getElementById('hijriDate');
    if (!el) return;

    var today  = new Date();
    var dd     = String(today.getDate()).padStart(2, '0');
    var mm     = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy   = today.getFullYear();
    var dateStr = dd + '-' + mm + '-' + yyyy;

    fetch('https://api.aladhan.com/v1/gToH/' + dateStr)
      .then(function (res) {
        if (!res.ok) throw new Error('network error');
        return res.json();
      })
      .then(function (json) {
        if (json.code === 200 && json.data && json.data.hijri) {
          var h       = json.data.hijri;
          var day     = parseInt(h.day, 10);
          var month   = h.month.ar;
          var year    = h.year;
          var weekday = h.weekday.ar;
          el.textContent = weekday + '  ' + day + ' ' + month + ' ' + year + ' هـ';
          el.classList.add('loaded');
        } else {
          el.textContent = 'تعذّر تحميل التاريخ';
        }
      })
      .catch(function () {
        el.textContent = 'تعذّر تحميل التاريخ';
      });
  }

  loadHijriDate();

})();
