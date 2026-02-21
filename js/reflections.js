/* =========================================
   التدبرات — جلب المقالات التلقائي من Google Sheets
   ========================================= */

(function () {
  'use strict';

  // الرابط الجديد الخاص بملف الإكسل الجديد (باستخدام ID الملف الصحيح المستخرج من الصورة)
  var SHEET_ID = '1Nw0Fo-ehbO2zLTK_3-NdTkFRldhUpZOGrP6dx3qQSS0';
  var CSV_URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/export?format=csv';
  
  // نستخدم AllOrigins Proxy لضمان تخطي أي حظر من المتصفح (CORS)
  var PROXY_URL = 'https://api.allorigins.win/get?url=' + encodeURIComponent(CSV_URL);

  // أداة قراءة CSV دقيقة
  function parseCSV(text) {
    var result = [];
    var row = [];
    var cur = '';
    var quote = false;

    for (var i = 0; i < text.length; i++) {
      var cc = text[i], nc = text[i+1];
      if (cur.length === 0 && cc === '"') {
        quote = true;
      } else if (quote) {
        if (cc === '"' && nc === '"') {
          cur += '"';
          i++;
        } else if (cc === '"') {
          quote = false;
        } else {
          cur += cc;
        }
      } else {
        if (cc === ',') {
          row.push(cur);
          cur = '';
        } else if (cc === '\r' && nc === '\n') {
          row.push(cur);
          result.push(row);
          row = [];
          cur = '';
          i++;
        } else if (cc === '\n' || cc === '\r') {
          row.push(cur);
          result.push(row);
          row = [];
          cur = '';
        } else {
          cur += cc;
        }
      }
    }
    if (cur.length > 0 || row.length > 0) {
      row.push(cur);
      result.push(row);
    }
    return result;
  }

  function renderReflections(rows) {
    var grid = document.getElementById('reflectionsGrid');
    if (!grid) return;

    if (!rows || rows.length < 2) { 
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">&#127807;</div><p>لا توجد تدبرات حالياً. بانتظار إضافتها في الإكسل.</p></div>';
      return;
    }

    var headers = rows[0].map(function(h) { return h ? h.toLowerCase().trim() : ''; });
    var items = [];

    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (row.join('').trim() === '') continue; // تجاهل الأسطر الفارغة
      
      var obj = {};
      // حفظ البيانات بالعناوين إن وجدت، وبالأرقام كاحتياطي
      for (var j = 0; j < Math.max(headers.length, row.length); j++) {
        var val = row[j] ? row[j].trim() : '';
        if (headers[j]) obj[headers[j]] = val;
        obj['col_' + j] = val; // احتياطي
      }
      items.push(obj);
    }

    if (items.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">&#127807;</div><p>لا توجد تدبرات صالحة للعرض.</p></div>';
      return;
    }

    var cardsHtml = items.map(function(item) {
      // البحث بمرونة عن الأعمدة في الجدول، أو الاعتماد على أرقام الأعمدة إذا كانت العناوين خاطئة
      // نفترض: عمود 0 = السورة/الآية، عمود 1 = العنوان، عمود 2 = النص، عمود 3 = الرابط
      var ayah  = item['ayah'] || item['الآية'] || item['السورة'] || item['سورة'] || item['col_0'] || 'تأملات قرآنية';
      var title = item['title'] || item['العنوان'] || item['الموضوع'] || item['col_1'] || 'بدون عنوان';
      var text  = item['text'] || item['التدبر'] || item['النص'] || item['المحتوى'] || item['الشرح'] || item['col_2'] || '';
      var link  = item['link'] || item['الرابط'] || item['المصدر'] || item['col_3'] || '';

      if (!text) return ''; // إذا لم يوجد نص التدبر لا يتم عرض البطاقة

      var formattedText = text.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');

      var linkHtml = link 
        ? '<a href="' + link + '" target="_blank" rel="noopener noreferrer" class="card-link">اقرأ المزيد &larr;</a>' 
        : '<span style="color:var(--clr-gold); font-size:0.85rem;">نور القرآن</span>';

      return (
        '<article class="card">' +
          '<div class="card-body">' +
            '<span class="card-tag" style="font-size:0.78rem; color: var(--clr-gold);">' + ayah + '</span>' +
            '<h3 class="card-title" style="font-size: 1.05rem; margin: 10px 0 12px; line-height: 1.7;">' + title + '</h3>' +
            '<p class="card-text" style="direction: rtl; text-align: justify; font-size: 0.95rem; line-height: 1.8; color: var(--clr-text-muted); margin-bottom:0;">' + formattedText + '</p>' +
          '</div>' +
          '<div class="card-footer">' +
            '<span class="card-date" style="font-size:0.8rem;">تدبر</span>' +
            linkHtml +
          '</div>' +
        '</article>'
      );
    }).reverse().join('');

    if (!cardsHtml) {
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">&#127807;</div><p>لم يتم العثور على محتوى للتدبرات. تأكد من الكتابة في العمود الثالث.</p></div>';
      return;
    }

    grid.innerHTML = cardsHtml;
  }

  function loadReflections() {
    var grid = document.getElementById('reflectionsGrid');
    if (!grid) return;

    grid.innerHTML = 
      '<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--clr-text-muted);">' +
        '<div style="display:inline-block; width:44px; height:44px; border:4px solid rgba(26,71,49,.1); border-top-color:var(--clr-gold); border-radius:50%; animation:spin 1s linear infinite; margin-bottom:18px;"></div>' +
        '<p style="font-size:1.1rem; font-weight:600;">جارٍ تحميل التدبرات...</p>' +
      '</div>';

    // استخدام البروكسي لجلب محتوى الإكسل دون مشاكل CORS
    fetch(PROXY_URL)
      .then(function(res) { 
        if(!res.ok) throw new Error('Proxy Error: ' + res.status);
        return res.json(); 
      })
      .then(function(data) {
        if (data && data.contents) {
          // محتوى الإكسل موجود في data.contents
          var rows = parseCSV(data.contents);
          renderReflections(rows);
        } else {
          throw new Error('Empty contents from Proxy');
        }
      })
      .catch(function(err) {
        console.error("Fetch Error:", err);
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">&#127807;</div><p>عذراً، لم نتمكن من جلب البيانات. يرجى المحاولة لاحقاً.</p></div>';
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReflections);
  } else {
    loadReflections();
  }

})();