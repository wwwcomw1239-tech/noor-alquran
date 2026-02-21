/* =========================================
   التدبرات — جلب المقالات التلقائي (RSS)
   ========================================= */

(function () {
  'use strict';

  // رابط RSS لإسلام ويب - قسم القرآن وعلومه
  var ISLAMWEB_RSS = 'https://islamweb.net/ar/rss/articles/2/155';
  
  // نستخدم AllOrigins Proxy كبديل قوي لتخطي حظر CORS و rss2json
  var PROXY_URL = 'https://api.allorigins.win/get?url=' + encodeURIComponent(ISLAMWEB_RSS);

  // أداة لإزالة أكواد HTML من النصوص
  function stripHtml(html) {
    var tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    var text = tmp.textContent || tmp.innerText || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  // أداة لتحليل نصوص XML يدوياً
  function parseXml(xmlStr) {
    var items = [];
    var rx = /<item>([\s\S]*?)<\/item>/g;
    var m;
    while ((m = rx.exec(xmlStr)) !== null) {
      var e = m[1];
      var title = (/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/.exec(e) || /<title>([\s\S]*?)<\/title>/.exec(e) || [])[1] || '';
      var link  = (/<link>([\s\S]*?)<\/link>/.exec(e) || [])[1] || '';
      var desc  = (/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/.exec(e) || /<description>([\s\S]*?)<\/description>/.exec(e) || [])[1] || '';
      var pub   = (/<pubDate>([\s\S]*?)<\/pubDate>/.exec(e) || [])[1] || '';
      
      if (title && link) {
        items.push({
          title: title.trim(),
          link: link.trim(),
          description: desc,
          pubDate: pub.trim()
        });
      }
    }
    return items;
  }

  // دالة لرسم بطاقات التدبرات
  function renderReflections(items) {
    var grid = document.getElementById('reflectionsGrid');
    if (!grid) return;

    if (!items || !items.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">&#127807;</div><p>عذراً، لم نتمكن من جلب التدبرات في الوقت الحالي. يرجى المحاولة لاحقاً.</p></div>';
      return;
    }

    // عرض أول 12 مقال فقط
    var slicedItems = items.slice(0, 12);

    grid.innerHTML = slicedItems.map(function(item) {
      // تهيئة وتنسيق التاريخ
      var dateStr = '';
      if (item.pubDate) {
        try {
          var d = new Date(item.pubDate);
          if (!isNaN(d.getTime())) {
            var mo = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
            dateStr = d.getDate() + ' ' + mo[d.getMonth()] + ' ' + d.getFullYear();
          } else {
            dateStr = item.pubDate.split(' ')[0] || '';
          }
        } catch(e) {
          dateStr = item.pubDate.split(' ')[0] || '';
        }
      }

      // تنظيف الوصف واقتطاعه ليكون متناسقاً داخل البطاقة
      var rawDesc = stripHtml(item.description);
      var desc = rawDesc.substring(0, 150).trim();
      if (rawDesc.length > 150) desc += '...';

      return (
        '<article class="card">' +
          '<div class="card-body">' +
            '<span class="card-tag">تدبر ومقال</span>' +
            '<h3 class="card-title" style="font-size: 1.05rem; margin-bottom: 12px; line-height: 1.6;">' + item.title + '</h3>' +
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

    // عرض مؤشر التحميل
    grid.innerHTML = 
      '<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--clr-text-muted);">' +
        '<div style="display:inline-block; width:44px; height:44px; border:4px solid rgba(26,71,49,.1); border-top-color:var(--clr-gold); border-radius:50%; animation:spin 1s linear infinite; margin-bottom:18px;"></div>' +
        '<p style="font-size:1.1rem; font-weight:600;">جارٍ جلب أحدث المقالات والتدبرات...</p>' +
      '</div>';

    fetch(PROXY_URL)
      .then(function(res) { 
        if(!res.ok) throw new Error('Proxy network error');
        return res.json(); 
      })
      .then(function(data) {
        if (data && data.contents) {
          var items = parseXml(data.contents);
          if (items.length > 0) {
            renderReflections(items);
          } else {
            throw new Error('No items found in XML');
          }
        } else {
          throw new Error('Empty response from proxy');
        }
      })
      .catch(function(err) {
        console.error("Failed to fetch RSS feed:", err);
        renderReflections([]); // إظهار رسالة الخطأ للمستخدم
      });
  }

  // تشغيل الدالة بمجرد تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReflections);
  } else {
    loadReflections();
  }

})();