/* =========================================
   التدبرات — بيانات محلية مختارة + رابط خارجي
   (بدون CORS - يعمل بشكل مضمون 100%)
   ========================================= */

(function () {
  'use strict';

  // تدبرات قرآنية مختارة ومتجددة محلياً - يمكن إضافة المزيد منها بسهولة
  var REFLECTIONS = [
    {
      ayah: 'سورة البقرة - آية 285',
      title: 'الإيمان بالله وملائكته وكتبه ورسله',
      text: 'قال تعالى: آمَنَ الرَّسولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبَّهِ وَالْمُؤْمِنونَ. الإيمان ليس مجرد كلمات تُقال، بل تصديق قلبي عميق يظهر في السلوك والتعامل مع أوامر الله.',
      source: 'https://ar.islamway.net/article/1/'
    },
    {
      ayah: 'سورة آل عمران - آية 17',
      title: 'زينة الحياة الدنيا بين المؤمن والغافل',
      text: 'لم يذم القرآن الدنيا لكونها شهوات، بل لأنها تصبح عائقاً حين تغرق القلب فيها فينسى الآخرة. التوازن هو السر - أن تأخذ من الدنيا ما يسعدك دون أن تنسى نصيبك من الآخرة.',
      source: 'https://ar.islamway.net/article/'
    },
    {
      ayah: 'سورة الكهف - آية 28',
      title: 'الصحبة الصالحة تجدد الإيمان',
      text: 'أمر الله نبيه بالثبات مع أهل التقوى - انظر من تجلس معهم فهم ينعكسون عليك سواءً. اختر رفقاءك بعناية فإنهم سيسحبونك إما للأعلى وإما للأسفل.',
      source: 'https://ar.islamway.net/article/'
    },
    {
      ayah: 'سورة الزمر - آية 53',
      title: 'لا تقنط من رحمة الله',
      text: 'قلِ يا عِبَادِيَ الَّذِينَ أَسْرَفوا عَلىٰ أَنفُسِهِمْ لَا تَقْنَطوا مِن رَّحْمَةِ اللهِ. أحياناً يجلس العبد يبكي على ذنوبه وينسى أن وراء كل خطيئة باباً مفتوحاً للتوبة والمغفرة.',
      source: 'https://ar.islamway.net/article/'
    },
    {
      ayah: 'سورة الرعد - آية 28',
      title: 'طمأنينة القلب',
      text: 'أَلَا بِذِكْرِ اللهِ تَطْمَئِنَّ الْقُلُوبُ. كثيراً ما يبحث الإنسان عن طمأنينة في المال والشهرة والنجاح، وينسى أن المفتاح الوحيد الذي يفتح باب الطمأنينة هو ذكر الله.',
      source: 'https://ar.islamway.net/article/'
    },
    {
      ayah: 'سورة التوبة - آية 128',
      title: 'حرصه صلى الله عليه وسلم علينا',
      text: 'حَرِيصٌ عَلَيْكُم بِالْمُؤْمِنِينَ رَءُوفٌ رَّحِيمٌ. تدبر كيف وصف الله نبيه بصفتين خصهما الله بهما: الرأفة والرحمة. فكيف لا تحب من هذه صفاته حالنا.',
      source: 'https://ar.islamway.net/article/'
    },
    {
      ayah: 'سورة النساء - آية 1',
      title: 'بر الوالدين وصلة الرحم',
      text: 'اتَّقُوا اللهَ الَّذِي تَسَاءَلُونَ بِهِ وَالْأَرْحَامَ. القرآن يربط تقوى الله بصلة الرحم، فالذي يقطع رحمه لا يكون تقياً، والمتقي الحقيقي هو من يصل من أمره الله أن يوصل.',
      source: 'https://ar.islamway.net/article/'
    },
    {
      ayah: 'سورة البقرة - آية 286',
      title: 'لا يكلف الله نفساً إلا وسعها',
      text: 'كل ما شق عليك فهو فوق طاقتك، وما جعلك الله في موقف صعب إلا لأنه علم أنك تستطيع تجاوزه. هذه الآية عهد من الله بأنه لن يكلفك فوق طاقتك أبداً.',
      source: 'https://ar.islamway.net/article/'
    },
    {
      ayah: 'سورة الحجرات - آية 13',
      title: 'التعارف لا التفاخر',
      text: 'إن أكرمَكُم عند اللهِ أتقاكُم. لم يجعل الله التفاضل بالنسب ولا المال ولا اللون، بل بشيء واحد فقط: مقدار تقواك لله. والتقوى مفتاحها بسيط لكنه عسير: مخالفة الهوى.',
      source: 'https://ar.islamway.net/article/'
    },
    {
      ayah: 'سورة طه - آية 14',
      title: 'من التراب وإليه نعود',
      text: 'مِنْهَا خَلَقْنَاكُمْ وَفِيهَا نُعِيدُكُمْ. هذه الآية دواء للغرور - تذكَّر أنك من تراب خلقك الله، فكيف تتكبر أو تحسد أو تظلم وأنت من أصل واحد؟',
      source: 'https://ar.islamway.net/article/'
    },
    {
      ayah: 'سورة الفاتحة - آية 1',
      title: 'الحمد لله في كل حال',
      text: 'الحَمْدُ لِلَّهِ رَبَّ الْعَالَمِينَ. لم يقل ربي في الفتحة: إلهي وإنساني - بل رب العالمين. كأن الله يقول لك: احمدني ليس فقط لأنك عبدي، بل لأنني رب كل شيء يحيط بك.',
      source: 'https://ar.islamway.net/article/'
    },
    {
      ayah: 'سورة البقرة - آية 152',
      title: 'الذكر طريق الشكر',
      text: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ. من عجائب هذه الآية أن الله ذكرك بداً، فذكره أنت بالمقابلة. وكلما ازددت ذكرك له، زاد ذكره لك.',
      source: 'https://ar.islamway.net/article/'
    }
  ];

  // دالة لرسم بطاقات التدبرات
  function renderReflections(items) {
    var grid = document.getElementById('reflectionsGrid');
    if (!grid) return;

    // خلط التدبرات في كل زيارة لتجديد التجربة
    var shuffled = items.slice().sort(function() { return Math.random() - 0.5; });

    grid.innerHTML = shuffled.map(function(item) {
      return (
        '<article class="card">' +
          '<div class="card-body">' +
            '<span class="card-tag" style="font-size:0.78rem; color: var(--clr-gold);">' + item.ayah + '</span>' +
            '<h3 class="card-title" style="font-size: 1.05rem; margin: 10px 0 12px; line-height: 1.7;">' + item.title + '</h3>' +
            '<p class="card-text" style="direction: rtl; text-align: justify; font-size: 0.95rem; line-height: 1.8; color: var(--clr-text-muted);">' + item.text + '</p>' +
          '</div>' +
          '<div class="card-footer">' +
            '<span class="card-date" style="font-size:0.8rem;">تدبر قرآني</span>' +
            '<a href="https://ar.islamway.net/articles" target="_blank" rel="noopener noreferrer" class="card-link">مزيد من طريق الإسلام &larr;</a>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  // تشغيل فوري
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { renderReflections(REFLECTIONS); });
  } else {
    renderReflections(REFLECTIONS);
  }

})();