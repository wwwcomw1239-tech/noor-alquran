/* =========================================
   التدبرات — جلب المقالات التلقائي من Google Sheets
   ========================================= */

(function () {
  'use strict';

  // رابط Google Sheets (نستخدم الـ ID الخاص بملفك)
  var SHEET_ID = '1lI2aJYIDnvg3_r8RYDtIB7nPolj9Yi9CyTTMxX8TxRY';
  
  // نستخدم رابط التصدير المباشر كـ CSV
  var SHEET_URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/export?format=csv&id=' + SHEET_ID;

  // دالة متقدمة لتحليل نص الـ CSV (تدعم النصوص التي تحتوي على فواصل وأسطر جديدة)
  function parseCSV(csv) {
    var result = [];
    var headers = [];
    var rows = [];
    var curVal = '';
    var inQuotes = false;
    var row = [];

    // قراءة حرف حرف لتجنب أخطاء الفواصل داخل النصوص
    for (var i = 0; i < csv.length; i++) {
      var char = csv[i];
      var nextChar = csv[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            curVal += '"';
            i++; // تخطي علامة الاقتباس المزدوجة
          } else {
            inQuotes = false;
          }
        } else {
          curVal += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          row.push(curVal);
          curVal = '';
        } else if (char === '\n' || char === '\r') {
          row.push(curVal);
          rows.push(row);
          row = [];
          curVal = '';
          if (char === '\r' && nextChar === '\n') {
            i++; // تخطي \n
          }
        } else {
          curVal += char;
        }
      }
    }
    
    // الدفع بالسطر الأخير إن وجد
    if (curVal !== '' || row.length > 0) {
      row.push(curVal);
      rows.push(row);
    }

    if (rows.length === 0) return result;

    headers = rows[0].map(function(h) { return h.toLowerCase().trim(); });

    for (var r = 1; r < rows.length; r++) {
      var currentRow = rows[r];
      // تجاهل الأسطر الفارغة
      if (currentRow.join('').trim() === '') continue;

      var obj = {};
      var hasContent = false;
      
      for (var c = 0; c < headers.length; c++) {
        var key = headers[c];
        if (key) {
          obj[key] = currentRow[c] ? currentRow[c].trim() : '';
          if (obj[key]) hasContent = true;
        }
      }

      if (hasContent) {
        result.push(obj);
      }
    }
    return result;
  }

  // دالة لرسم بطاقات التدبرات
  function renderReflections(items) {
    var grid = document.getElementById('reflectionsGrid');
    if (!grid) return;

    if (!items || !items.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">&#127807;</div><p>لا توجد تدبرات حالياً. سيتم إضافتها قريباً إن شاء الله.</p></div>';
      return;
    }

    grid.innerHTML = items.map(function(item) {
      // البحث عن القيم بمرونة تامة، أياً كان ما كتبته في رأس العمود (العربي أو الإنجليزي)
      var ayah  = item.ayah || item['الآية'] || item['السورة'] || item['سورة'] || item['العنوان الفرعي'] || 'تأملات قرآنية';
      var title = item.title || item['العنوان'] || item['الموضوع'] || item['الفكرة'] || 'بدون عنوان';
      var text  = item.text || item['النص'] || item['التدبر'] || item['المحتوى'] || item['الشرح'] || '';
      var link  = item.link || item['الرابط'] || item['المصدر'] || '';

      // إذا لم يكن هناك نص، لا ترسم البطاقة
      if (!text) return '';

      // زر اقرأ المزيد (يظهر فقط إذا كان هناك رابط)
      var linkHtml = link 
        ? '<a href="' + link + '" target="_blank" rel="noopener noreferrer" class="card-link">اقرأ المزيد &larr;</a>' 
        : '<span style="color:var(--clr-gold); font-size:0.85rem;">نور القرآن</span>';

      return (
        '<article class="card">' +
          '<div class="card-body">' +
            '<span class="card-tag" style="font-size:0.78rem; color: var(--clr-gold);">' + ayah + '</span>' +
            '<h3 class="card-title" style="font-size: 1.05rem; margin: 10px 0 12px; line-height: 1.7;">' + title + '</h3>' +
            '<p class="card-text" style="direction: rtl; text-align: justify; font-size: 0.95rem; line-height: 1.8; color: var(--clr-text-muted); margin-bottom:0;">' + text + '</p>' +
          '</div>' +
          '<div class="card-footer">' +
            '<span class="card-date" style="font-size:0.8rem;">تدبر</span>' +
            linkHtml +
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
        '<p style="font-size:1.1rem; font-weight:600;">جارٍ جلب التدبرات من القاعدة...</p>' +
      '</div>';

    fetch(SHEET_URL)
      .then(function(res) { 
        if(!res.ok) throw new Error('Network response was not ok');
        return res.text(); 
      })
      .then(function(csvText) {
        var items = parseCSV(csvText);
        // عكس المصفوفة لتظهر التدبرات الأحدث (المضافة أسفل الجدول) أولاً في الموقع
        renderReflections(items.reverse());
      })
      .catch(function(err) {
        console.error("Failed to fetch Google Sheet:", err);
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">&#127807;</div><p>عذراً، لم نتمكن من الاتصال بقاعدة البيانات. (تأكد أن ملف جوجل شيتس متاح للعرض للجميع)</p></div>';
      });
  }

  // تشغيل الدالة بمجرد تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReflections);
  } else {
    loadReflections();
  }

})();