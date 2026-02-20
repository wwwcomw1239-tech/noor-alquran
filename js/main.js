/* =========================================
   نور القرآن — الوظائف التفاعلية
   المطوّر: داوود الاحمدي
   ========================================= */

(function () {
  'use strict';

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
