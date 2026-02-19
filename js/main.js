/* =========================================
   نور القرآن — الوظائف التفاعلية
   المطوّر: داوود الاحمدي
   ========================================= */

(function () {
  'use strict';

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

    /* نستخدم nوع التقويم 1 (أم القرى) عبر معامل adjustment=0
       الـ endpoint: /v1/gToH/{DD-MM-YYYY}                        */
    fetch('https://api.aladhan.com/v1/gToH/' + dateStr)
      .then(function (res) {
        if (!res.ok) throw new Error('network error');
        return res.json();
      })
      .then(function (json) {
        if (json.code === 200 && json.data && json.data.hijri) {
          var h = json.data.hijri;
          var day     = parseInt(h.day, 10);       /* إزالة الأصفار البادئة */
          var month   = h.month.ar;                /* اسم الشهر بالعربية  */
          var year    = h.year;                    /* السنة الهجرية        */
          var weekday = h.weekday.ar;              /* اسم اليوم بالعربية  */
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
