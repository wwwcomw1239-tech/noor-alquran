/* =========================================
   نور القرآن — الوظائف التفاعلية
   المطوّر: داوود الاحمدي
   ========================================= */

(function () {
  'use strict';

  /* ===============================================
     🌙 الوضع الليلي — Dark Mode
     =============================================== */
  (function initDarkMode() {
    var STORAGE_KEY = 'noor-theme';

    // CSS injection for Dark Mode
    var css = [
      '[data-theme="dark"] {',
      '  --clr-primary: #0F1C15;',
      '  --clr-primary-dk: #070D0A;',
      '  --clr-primary-lt: #1A3025;',
      '  --clr-gold: #D8B75E;',
      '  --clr-gold-lt: #E8CC81;',
      '  --clr-bg: #121212;',
      '  --clr-bg-alt: #1E1E1E;',
      '  --clr-text: #E0E0E0;',
      '  --clr-text-muted: #A0A0A0;',
      '  --clr-white: #1E1E1E;',
      '  --clr-border: #2C2C2C;',
      '  --clr-footer-bg: #070D0A;',
      '  --shadow-sm: 0 2px 8px rgba(0,0,0,0.4);',
      '  --shadow-lg: 0 8px 32px rgba(0,0,0,0.6);',
      '}',
      '[data-theme="dark"] body { background: var(--clr-bg); color: var(--clr-text); }',
      '[data-theme="dark"] .card { background: var(--clr-bg-alt); border-color: var(--clr-border); }',
      '[data-theme="dark"] .navbar { background: var(--clr-primary-dk); }',
      '[data-theme="dark"] .nav-top { background: #040806; }',
      '[data-theme="dark"] .nav-bottom { background: var(--clr-primary-dk); }',
      '[data-theme="dark"] .search-input-wrap input { background: #2A2A2A; color: #FFF; border-color: #444; }',
      '[data-theme="dark"] .s-result { background: #222; border-color: #333; }',
      '[data-theme="dark"] .search-overlay { background: rgba(0,0,0,0.92); }',
      '[data-theme="dark"] .playlist-toggle { background: #1A1A1A; border-color: #333; }',
      '[data-theme="dark"] .video-item { background: #1A1A1A; border-color: #333; }',
      '[data-theme="dark"] .vision-box { background: #1A1A1A; border-color: #333; }',
      '[data-theme="dark"] .social-channels { background: #1A1A1A; border-color: #333; }',
      '[data-theme="dark"] .channel-card { background: #222; border-color: #333; }',
      '[data-theme="dark"] .youtube-player-container { background: #111; border-color: var(--clr-gold); }',
      '[data-theme="dark"] .player-header { background: #222; }',
      '[data-theme="dark"] .hero-bg { background: linear-gradient(160deg, #070D0A 0%, #0F1C15 55%, #070D0A 100%); }',
      '[data-theme="dark"] .page-header { background: linear-gradient(150deg, #070D0A 0%, #0F1C15 100%); }',
      '[data-theme="dark"] .footer { background: #050A07; border-top: 1px solid #1A1A1A; }',
      '[data-theme="dark"] .btn-outline { color: var(--clr-gold); border-color: var(--clr-gold); }',
      '[data-theme="dark"] .btn-outline:hover { background: var(--clr-gold); color: #000; }',
      '[data-theme="dark"] .tab-btn { color: var(--clr-text-muted); }',
      '[data-theme="dark"] .tab-btn.active { color: var(--clr-gold); background: rgba(255,255,255,0.05); }',
      '[data-theme="dark"] .logo-text { background: linear-gradient(135deg, #ffffff 25%, var(--clr-gold) 100%); -webkit-background-clip: text; }',
      '[data-theme="dark"] .book-meta .meta-item { background: #2A2A2A; color: #CCC; }',
      '[data-theme="dark"] .nav-links { background: var(--clr-primary-dk); }',
      // Theme Toggle Button Styles
      '.theme-toggle {',
      '  display: flex; align-items: center; justify-content: center;',
      '  width: 36px; height: 36px;',
      '  background: rgba(255,255,255,0.1);',
      '  border: none; border-radius: var(--radius-sm);',
      '  color: var(--clr-white); font-size: 1.15rem;',
      '  cursor: pointer; transition: background 0.22s, transform 0.22s;',
      '}',
      '.theme-toggle:hover { background: rgba(201,168,76,0.3); transform: scale(1.05); }',
      '[data-theme="dark"] .theme-toggle { background: rgba(255,255,255,0.05); color: var(--clr-gold); }',
      '[data-theme="dark"] .theme-toggle:hover { background: rgba(255,255,255,0.15); }',
      'html { transition: background-color 0.3s ease, color 0.3s ease; }'
    ].join('\n');

    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // Check localStorage & system preference
    var savedTheme = localStorage.getItem(STORAGE_KEY);
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Insert button after DOM is loaded
    window.addEventListener('DOMContentLoaded', function() {
      var navActions = document.querySelector('.nav-actions');
      if (navActions) {
        var themeBtn = document.createElement('button');
        themeBtn.className = 'theme-toggle';
        themeBtn.id = 'themeToggle';
        themeBtn.setAttribute('aria-label', 'تبديل الوضع الليلي');
        themeBtn.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';

        var searchBtn = document.getElementById('searchToggle');
        if (searchBtn) {
          navActions.insertBefore(themeBtn, searchBtn);
        } else {
          navActions.appendChild(themeBtn);
        }

        themeBtn.addEventListener('click', function() {
          var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          var newTheme = isDark ? 'light' : 'dark';
          
          if (newTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.removeAttribute('data-theme');
          }
          
          localStorage.setItem(STORAGE_KEY, newTheme);
          themeBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
        });
      }
    });
  })();

  /* ================================================
     شريط الإشعار المتحرك — الموقع تحت التجربة
     ================================================ */
  (function injectBetaBanner() {
    var msg = '🚧  الموقع لا يزال تحت التجربة ولم ينطلق رسمياً بعد — سينطلق قريباً بإذن الله  ✨  '
            + '🚧  الموقع لا يزال تحت التجربة ولم ينطلق رسمياً بعد — سينطلق قريباً بإذن الله  ✨  '
            + '🚧  الموقع لا يزال تحت التجربة ولم ينطلق رسمياً بعد — سينطلق قريباً بإذن الله  ✨  ';

    var css = [
      '#beta-ticker {',
      '  position: sticky;',
      '  top: 0;',
      '  z-index: 99999;',
      '  background: linear-gradient(90deg, #1a4731 0%, #2d6a4f 40%, #c9a84c 70%, #1a4731 100%);',
      '  color: #fff;',
      '  overflow: hidden;',
      '  white-space: nowrap;',
      '  padding: 9px 0;',
      '  border-bottom: 2px solid #c9a84c;',
      '  box-shadow: 0 2px 10px rgba(0,0,0,0.25);',
      '}',
      '#beta-ticker .ticker-track {',
      '  display: inline-block;',
      '  animation: beta-scroll 30s linear infinite;',
      '}',
      '#beta-ticker .ticker-text {',
      '  font-family: "Cairo", sans-serif;',
      '  font-size: 0.88rem;',
      '  font-weight: 700;',
      '  letter-spacing: 0.3px;',
      '  padding: 0 8px;',
      '}',
      '#beta-ticker .ticker-close {',
      '  position: absolute;',
      '  left: 10px;',
      '  top: 50%;',
      '  transform: translateY(-50%);',
      '  background: rgba(255,255,255,0.18);',
      '  border: none;',
      '  color: #fff;',
      '  width: 22px;',
      '  height: 22px;',
      '  border-radius: 50%;',
      '  cursor: pointer;',
      '  font-size: 13px;',
      '  line-height: 1;',
      '  display: flex;',
      '  align-items: center;',
      '  justify-content: center;',
      '  transition: background 0.2s;',
      '}',
      '#beta-ticker .ticker-close:hover { background: rgba(255,255,255,0.35); }',
      '@keyframes beta-scroll {',
      '  0%   { transform: translateX(100vw); }',
      '  100% { transform: translateX(-100%); }',
      '}',
      '@media (prefers-reduced-motion: reduce) {',
      '  #beta-ticker .ticker-track { animation: none; }',
      '}'
    ].join('\n');

    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    var bar = document.createElement('div');
    bar.id = 'beta-ticker';
    bar.setAttribute('role', 'marquee');
    bar.setAttribute('aria-label', 'إشعار: الموقع تحت التجربة');

    var track = document.createElement('span');
    track.className = 'ticker-track';

    var textEl = document.createElement('span');
    textEl.className = 'ticker-text';
    textEl.textContent = msg;

    track.appendChild(textEl);
    bar.appendChild(track);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'ticker-close';
    closeBtn.setAttribute('aria-label', 'إغلاق الشريط');
    closeBtn.innerHTML = '&#10005;';
    closeBtn.addEventListener('click', function () {
      bar.style.display = 'none';
    });
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
     التاريخ الهجري — تقويم أم القرى (المملكة العربية السعودية)
     المصدر: Aladhan API  |  https://api.aladhan.com
     المرجع الرسمي: https://www.ummalqura.org.sa
     ================================================= */
  function loadHijriDate() {
    var el = document.getElementById('hijriDate');
    if (!el) return;

    var today = new Date();
    var dd    = String(today.getDate()).padStart(2, '0');
    var mm    = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy  = today.getFullYear();
    var dateStr = dd + '-' + mm + '-' + yyyy;

    fetch('https://api.aladhan.com/v1/gToH/' + dateStr)
      .then(function (res) {
        if (!res.ok) throw new Error('network error');
        return res.json();
      })
      .then(function (json) {
        if (json.code === 200 && json.data && json.data.hijri) {
          var h = json.data.hijri;
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