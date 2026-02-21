/* =========================================
   التدبرات — جلب المقالات التلقائي (RSS)
   ========================================= */

(function () {
  'use strict';

  // نستخدم RSS to JSON API مع موقع إسلام ويب كخيار قوي جداً ومدعوم
  // أو أي خلاصة أخرى موثوقة
  var PRIMARY_RSS = 'https://islamweb.net/ar/rss/articles/2/155'; // قسم القرآن وعلومه - إسلام ويب
  var FALLBACK_RSS = 'http://www.saaid.net/rss/quran.xml'; // صيد الفوائد - قسم القرآن
  
  // دالة لجلب الرابط عبر خدمة rss2json 
  function getApiUrl(rssUrl) {
    return 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl) + '&count=12';
  }

  // أداة لإزالة أكواد HTML من النصوص (لتجنب تشوه التصميم)
  function stripHtml(html) {
    var tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    var text = tmp.textContent || tmp.innerText || '';
    // إزالة المسافات الفارغة الزائدة
    return text.replace(/\s+/g, ' ').trim();
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
        var d = new Date(item.pubDate.replace(/-/g, '/')); // Fix for safari date parsing
        if (!isNaN(d.getTime())) {
          var mo = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
          dateStr = d.getDate() + ' ' + mo[d.getMonth()] + ' ' + d.getFullYear();
        } else {
           // Fallback date format if parsing fails
           dateStr = item.pubDate.split(' ')[0] || '';
        }
      }

      // تنظيف الوصف واقتطاعه ليكون متناسقاً داخل البطاقة
      var rawDesc = stripHtml(item.description || item.content || '');
      var desc = rawDesc.substring(0, 160).trim();
      if (rawDesc.length > 160) desc += '...';
      
      // التأكد من وجود صورة أو وضع صورة افتراضية
      var thumbnail = item.thumbnail || '';

      return (
        '<article class="card">' +
          '<div class="card-body">' +
            '<span class="card-tag">تدبر آية</span>' +
            '<h3 class="card-title" style="font-size: 1.1rem; margin-bottom: 12px; line-height: 1.6;">' + (item.title || 'بدون عنوان') + '</h3>' +
            '<p class="card-text" style="direction: rtl; text-align: justify; margin-bottom:0;">' + desc + '</p>' +
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

    // محاولة الجلب من المصدر الأول (إسلام ويب - أكثر استقراراً)
    fetch(getApiUrl(PRIMARY_RSS))
      .then(function(res) { 
        if(!res.ok) throw new Error('Network response was not ok');
        return res.json(); 
      })
      .then(function(data) {
        if (data.status === 'ok' && data.items && data.items.length > 0) {
          renderReflections(data.items);
        } else {
          throw new Error('Empty data from primary RSS');
        }
      })
      .catch(function(err) {
        console.warn("Primary RSS failed, trying fallback...", err);
        // إذا فشل المصدر الأول، نحاول الجلب من المصدر الاحتياطي (صيد الفوائد)
        fetch(getApiUrl(FALLBACK_RSS))
          .then(function(res) { 
            if(!res.ok) throw new Error('Network response was not ok');
            return res.json(); 
          })
          .then(function(data) {
             if (data.status === 'ok' && data.items && data.items.length > 0) {
               renderReflections(data.items);
             } else {
               renderReflections([]); // إظهار رسالة الخطأ
             }
          })
          .catch(function(fallbackErr) {
            console.error("All RSS sources failed", fallbackErr);
            renderReflections([]); // إظهار رسالة الخطأ
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