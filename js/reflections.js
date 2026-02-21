/* =========================================
   التدبرات — جلب المقالات التلقائي من Google Sheets
   ========================================= */

(function () {
  'use strict';

  // رابط Google Sheets (نستخدم الـ ID الخاص بملفك)
  // الرابط الذي أرسلته: 1lI2aJYIDnvg3_r8RYDtIB7nPolj9Yi9CyTTMxX8TxRY
  var SHEET_ID = '1lI2aJYIDnvg3_r8RYDtIB7nPolj9Yi9CyTTMxX8TxRY';
  
  // نستخدم رابط التصدير المباشر كـ CSV
  var SHEET_URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/export?format=csv&id=' + SHEET_ID;

  // دالة لتحويل نص الـ CSV إلى مصفوفة كائنات (Array of Objects)
  function parseCSV(csvText) {
    var lines = csvText.split('\n');
    var result = [];
    var headers = [];

    // تنظيف كل سطر من المسافات والفواصل الزائدة
    for (var i = 0; i < lines.length; i++) {
      // تجاهل الأسطر الفارغة تماماً
      if (!lines[i].trim()) continue;

      // قراءة الخلايا بشكل مبسط (مع دعم الفواصل داخل النص إذا كان محاطاً بعلامات اقتباس)
      var currentline = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      
      // تنظيف علامات الاقتباس حول النصوص
      for (var j = 0; j < currentline.length; j++) {
        currentline[j] = currentline[j].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      }

      // الصف الأول هو العناوين
      if (i === 0) {
        headers = currentline;
      } else {
        var obj = {};
        var hasContent = false;
        for (var j = 0; j < headers.length; j++) {
          if (headers[j]) { // فقط إذا كان للعمود عنوان
            var key = headers[j].toLowerCase().trim();
            obj[key] = currentline[j] || '';
            if (obj[key]) hasContent = true;
          }
        }
        if (hasContent) {
          result.push(obj);
        }
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
      // البحث عن القيم بمرونة (أياً كانت طريقة كتابة العناوين)
      var ayah  = item.ayah || item['الآية'] || item['السورة'] || item['سورة'] || 'تدبر قرآني';
      var title = item.title || item['العنوان'] || item['الموضوع'] || 'بدون عنوان';
      var text  = item.text || item['النص'] || item['التدبر'] || item['المحتوى'] || '';
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
            '<span class="card-date" style="font-size:0.8rem;">تأملات</span>' +
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
        '<p style="font-size:1.1rem; font-weight:600;">جارٍ جلب التدبرات...</p>' +
      '</div>';

    fetch(SHEET_URL)
      .then(function(res) { 
        if(!res.ok) throw new Error('Network response was not ok');
        return res.text(); 
      })
      .then(function(csvText) {
        var items = parseCSV(csvText);
        // عكس المصفوفة لتظهر الأحدث (الأسفل في الجدول) أولاً
        renderReflections(items.reverse());
      })
      .catch(function(err) {
        console.error("Failed to fetch Google Sheet:", err);
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">&#127807;</div><p>عذراً، لم نتمكن من الاتصال بقاعدة البيانات. (تأكد من تغيير صلاحية رابط جوجل شيت إلى "أي شخص لديه الرابط يمكنه العرض")</p></div>';
      });
  }

  // تشغيل الدالة بمجرد تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReflections);
  } else {
    loadReflections();
  }

})();