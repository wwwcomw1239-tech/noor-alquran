/* =========================================
   التدبرات — جلب المقالات التلقائي من Google Sheets
   ========================================= */

(function () {
  'use strict';

  // الرابط الذي نشره المستخدم (نحوله من pubhtml إلى pub?output=csv لضمان عمله كبيانات خام)
  var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR09nKZKLeCPF2kO5-4eT-k9nxV6nxyKmeu6aUfz3bOq8XzfT1ObKKC9_KZoroCsmqi55cjlnnAnsRA/pub?output=csv';

  // أداة قراءة CSV دقيقة (تدعم الفواصل والأسطر المتعددة داخل الخلية الواحدة)
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
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">&#127807;</div><p>لا توجد تدبرات حالياً. بانتظار إضافتها في ملف الإكسل.</p></div>';
      return;
    }

    var headers = rows[0].map(function(h) { return h.toLowerCase().trim(); });
    var items = [];

    // تحويل المصفوفات إلى كائنات (Objects)
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      if (row.join('').trim() === '') continue; // تجاهل الأسطر الفارغة
      
      var obj = {};
      var hasText = false;
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j];
        if (key) {
          obj[key] = row[j] ? row[j].trim() : '';
          if (obj[key]) hasText = true;
        }
      }
      if (hasText) items.push(obj);
    }

    if (items.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">&#127807;</div><p>لا توجد تدبرات صالحة للعرض.</p></div>';
      return;
    }

    grid.innerHTML = items.map(function(item) {
      // البحث بمرونة عن الأعمدة في الجدول
      var ayah  = item['ayah'] || item['الآية'] || item['السورة'] || item['سورة'] || item['العنوان الفرعي'] || 'تأملات قرآنية';
      var title = item['title'] || item['العنوان'] || item['الموضوع'] || 'بدون عنوان';
      var text  = item['text'] || item['التدبر'] || item['النص'] || item['المحتوى'] || '';
      var link  = item['link'] || item['الرابط'] || item['المصدر'] || '';

      if (!text) return '';

      // تنظيف النص للعرض (تحويل الأسطر الجديدة في الإكسل إلى <br>)
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
    }).reverse().join(''); // نعكس الترتيب ليكون الأحدث (أسفل الجدول) في الأعلى
  }

  function loadReflections() {
    var grid = document.getElementById('reflectionsGrid');
    if (!grid) return;

    grid.innerHTML = 
      '<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--clr-text-muted);">' +
        '<div style="display:inline-block; width:44px; height:44px; border:4px solid rgba(26,71,49,.1); border-top-color:var(--clr-gold); border-radius:50%; animation:spin 1s linear infinite; margin-bottom:18px;"></div>' +
        '<p style="font-size:1.1rem; font-weight:600;">جارٍ تحميل التدبرات...</p>' +
      '</div>';

    fetch(CSV_URL)
      .then(function(res) { 
        if(!res.ok) throw new Error('Network Error: ' + res.status);
        return res.text(); 
      })
      .then(function(csvText) {
        var rows = parseCSV(csvText);
        renderReflections(rows);
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