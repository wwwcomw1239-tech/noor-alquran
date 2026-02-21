/* =========================================
   التدبرات — جلب المقالات التلقائي من Google Sheets
   (باستخدام طريقة Google Apps Script السهلة جداً)
   ========================================= */

(function () {
  'use strict';

  // رابط الـ API الجديد الذي سننشئه (مؤقتاً سنضع مصفوفة محلية حتى يتم إعداد الـ API)
  var APPS_SCRIPT_URL = ''; 

  // تدبرات احتياطية تظهر ريثما يربط المستخدم ملفه
  var FALLBACK_REFLECTIONS = [
    {
      ayah: "سورة الشرح - آية 5",
      title: "إن مع العسر يسراً",
      text: "لم يقل الله بعد العسر، بل قال (مع) العسر. الطمأنينة مخبأة داخل الابتلاء نفسه، والمحنة تحمل في طياتها المنحة لمن أدرك حكمة الله.",
      link: ""
    }
  ];

  function renderReflections(items) {
    var grid = document.getElementById('reflectionsGrid');
    if (!grid) return;

    if (!items || items.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="empty-icon">&#127807;</div><p>لا توجد تدبرات حالياً.</p></div>';
      return;
    }

    grid.innerHTML = items.map(function(item) {
      var ayah  = item.ayah || item['الآية'] || item['السورة'] || item['سورة'] || 'تأملات قرآنية';
      var title = item.title || item['العنوان'] || item['الموضوع'] || 'بدون عنوان';
      var text  = item.text || item['التدبر'] || item['النص'] || item['المحتوى'] || '';
      var link  = item.link || item['الرابط'] || item['المصدر'] || '';

      if (!text) return '';

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

  function loadReflections() {
    var grid = document.getElementById('reflectionsGrid');
    if (!grid) return;

    if (!APPS_SCRIPT_URL) {
      // عرض رسالة تشرح للمستخدم كيفية الربط
      grid.innerHTML = 
        '<div class="empty-state" style="grid-column: 1 / -1; background: rgba(26,71,49,0.03); border: 1px dashed rgba(201,168,76,0.3); border-radius: 12px; padding: 30px;">' +
          '<div class="empty-icon" style="color: var(--clr-gold);">&#9881;</div>' +
          '<h3 style="color: var(--clr-primary); margin-bottom: 15px;">ربط قاعدة البيانات</h3>' +
          '<p style="color: var(--clr-text-muted); line-height: 1.8; font-size: 0.95rem; max-width: 600px; margin: 0 auto;">' +
            'الموقع جاهز لاستقبال تدبراتك. نحن الآن نستخدم طريقة أسهل بكثير للربط لا تحتاج إلى "نشر على الويب".<br>' +
            'يرجى إرسال <b>رابط المشاركة العادي</b> لملف الإكسل (الذي أرسلته لي مسبقاً)، وسأقوم أنا بإنشاء رابط API خاص بك ووضعه هنا لتعمل التدبرات فوراً.' +
          '</p>' +
        '</div>';
      return;
    }

    grid.innerHTML = 
      '<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--clr-text-muted);">' +
        '<div style="display:inline-block; width:44px; height:44px; border:4px solid rgba(26,71,49,.1); border-top-color:var(--clr-gold); border-radius:50%; animation:spin 1s linear infinite; margin-bottom:18px;"></div>' +
        '<p style="font-size:1.1rem; font-weight:600;">جارٍ جلب التدبرات...</p>' +
      '</div>';

    fetch(APPS_SCRIPT_URL)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && data.length > 0) {
          renderReflections(data.reverse()); // الأحدث أولاً
        } else {
          renderReflections(FALLBACK_REFLECTIONS);
        }
      })
      .catch(function(err) {
        console.error("API Fetch Error:", err);
        renderReflections(FALLBACK_REFLECTIONS);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReflections);
  } else {
    loadReflections();
  }

})();