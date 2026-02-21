/* =========================================
   التدبرات — جلب المقالات التلقائي (RSS)
   ========================================= */

(function () {
  'use strict';

  // نستخدم خلاصة (RSS) لموقع "صيد الفوائد" - قسم القرآن وتدبره كمصدر أول
  var PRIMARY_RSS = 'http://www.saaid.net/rss/quran.xml'; 
  
  // مصدر احتياطي: مقالات موقع "طريق الإسلام"
  var FALLBACK_RSS = 'https://ar.islamway.net/articles/rss';

  function getApiUrl(rssUrl) {
    return 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl) + '&count=12';
  }

  // أداة لإزالة أكواد HTML من النصوص (لتجنب تشوه التصميم)
  function stripHtml(html) {
    var tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  // دالة لرسم بطاقات التدبرات
  function renderReflections(items) {
    var grid = document.getElementById('reflectionsGrid');
    if (!grid) return;

    if (!items || !items.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">&#127807;</div><p>عذراً، لم نتمكن من جلب التدبرات في الوقت الحالي. يرجى المحاولة لاحقاً.</p></div>';
      return;
    }

    grid.innerHTML = items.map(function(item) {
      // تهيئة وتنسيق التاريخ
      var dateStr = '';
      if (item.pubDate) {
        var d = new Date(item.pubDate);
        if (!isNaN(d.getTime())) {
          var mo = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
          dateStr = d.getDate() + ' ' + mo[d.getMonth()] + ' ' + d.getFullYear();
        }
      }

      // تنظيف الوصف واقتطاعه ليكون متناسقاً داخل البطاقة
      var rawDesc = stripHtml(item.description || item.content || '');
      var desc = rawDesc.substring(0, 160).trim();
      if (rawDesc.length > 160) desc += '...';

      return (
        '<article class="card">' +
          '<div class="card-body">' +
            '<span class="card-tag">تدبر آية</span>' +
            '<h3 class="card-title">' + (item.title || 'بدون عنوان') + '</h3>' +
            '<p class="card-text" style="direction: rtl; text-align: justify;">' + desc + '</p>' +
          '</div>' +
          '<div class="card-footer">' +
            '<span class="card-date">' + dateStr + '</span>' +
            '<a href="' + item.link + '" target="_blank" rel="noopener noreferrer" class="card-link">اقرأ المزيد &larr;</a>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  // الدالة الرئيسية لجلب البيانات
  function loadReflections() {
    var grid = document.getElementById('reflectionsGrid');
    if (!grid) return;

    // عرض مؤشر التحميل الدائري الجميل
    grid.innerHTML = 
      '<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--clr-text-muted);">' +
        '<div style="display:inline-block; width:44px; height:44px; border:4px solid rgba(26,71,49,.1); border-top-color:var(--clr-gold); border-radius:50%; animation:spin 1s linear infinite; margin-bottom:18px;"></div>' +
        '<p style="font-size:1.1rem; font-weight:600;">جارٍ جلب أحدث التدبرات من المصادر الإسلامية...</p>' +
      '</div>';

    // محاولة الجلب من المصدر الأول
    fetch(getApiUrl(PRIMARY_RSS))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.status === 'ok' && data.items && data.items.length > 0) {
          renderReflections(data.items);
        } else {
          throw new Error('Empty or invalid RSS data');
        }
      })
      .catch(function(err) {
        // إذا فشل المصدر الأول، نحاول الجلب من المصدر الاحتياطي
        fetch(getApiUrl(FALLBACK_RSS))
          .then(function(res) { return res.json(); })
          .then(function(data) {
             if (data.status === 'ok' && data.items) {
               renderReflections(data.items);
             } else {
               renderReflections([]);
             }
          })
          .catch(function() {
            renderReflections([]);
          });
      });
  }

  // تشغيل الدالة بمجرد تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReflections);
  } else {
    loadReflections();
  }

})();