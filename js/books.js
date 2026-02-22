/* =========================================
   الكتب — عرض وتصفية ونافذة التفاصيل
   ========================================= */

(function () {
  'use strict';

  var CATEGORIES = {
    all:      'الكل',
    tadabbur: 'التدبر ومقاصد السور',
    tafsir:   'التفاسير',
    tajweed:  'التجويد والقراءات',
    ulum:     'علوم القرآن',
    lugha:    'غريب القرآن ولغته',
    fadail:   'فضائل القرآن'
  };

  var CAT_ICONS = {
    all:      '\ud83d\udcda',
    tadabbur: '\ud83c\udf3f',
    tafsir:   '\ud83d\udcd6',
    tajweed:  '\ud83c\udfa4',
    ulum:     '\ud83d\udd2c',
    lugha:    '\ud83d\udcdd',
    fadail:   '\u2728'
  };

  var currentCat = 'all';

  /* ════ حقن الأنماط ════ */
  function injectStyles() {
    if (document.getElementById('books-styles')) return;
    var s = document.createElement('style');
    s.id = 'books-styles';
    s.textContent = [
      '.category-filters{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:22px;padding:0 10px;}',
      '.cat-btn{display:inline-flex;align-items:center;gap:5px;padding:8px 18px;border:2px solid rgba(201,168,76,.4);background:rgba(255,255,255,.08);color:rgba(255,255,255,.85);border-radius:24px;font-family:Cairo,sans-serif;font-size:.84rem;font-weight:700;cursor:pointer;transition:all .22s;white-space:nowrap;}',
      '.cat-btn:hover{background:rgba(201,168,76,.18);border-color:var(--clr-gold);color:#fff;}',
      '.cat-btn.active{background:var(--clr-gold);border-color:var(--clr-gold);color:#1a4731;}',
      '.books-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(282px,1fr));gap:24px;}',
      '.book-card{background:var(--clr-white);border:1px solid var(--clr-border);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 2px 8px rgba(0,0,0,.07);transition:transform .24s,box-shadow .24s;}',
      '.book-card:hover{transform:translateY(-5px);box-shadow:0 8px 28px rgba(0,0,0,.14);}',
      '.book-card-head{padding:18px 18px 12px;background:linear-gradient(135deg,rgba(26,71,49,.04),rgba(201,168,76,.06));border-bottom:1px solid var(--clr-border);}',
      '.book-tag{display:inline-block;padding:3px 12px;background:rgba(26,71,49,.09);color:var(--clr-primary);border-radius:20px;font-size:.74rem;font-weight:700;margin-bottom:7px;}',
      '.book-title{font-size:1.05rem;font-weight:800;color:var(--clr-text);line-height:1.45;margin-bottom:4px;}',
      '.book-subtitle{font-size:.81rem;color:var(--clr-text-muted);font-style:italic;margin-bottom:5px;}',
      '.book-author{font-size:.87rem;color:var(--clr-primary-lt);font-weight:700;}',
      '.book-card-body{padding:14px 18px;flex:1;}',
      '.book-desc{font-size:.85rem;color:var(--clr-text-muted);line-height:1.8;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}',
      '.book-meta-tag{display:inline-block;font-size:.73rem;color:var(--clr-text-muted);background:var(--clr-bg-alt);padding:3px 10px;border-radius:20px;margin-top:8px;}',
      '.book-card-foot{padding:12px 14px;border-top:1px solid var(--clr-border);display:flex;gap:8px;}',
      '.btn-view{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:9px 10px;background:rgba(26,71,49,.07);color:var(--clr-primary);border:1.5px solid rgba(26,71,49,.2);border-radius:7px;font-family:Cairo,sans-serif;font-size:.83rem;font-weight:700;cursor:pointer;transition:all .22s;}',
      '.btn-view:hover{background:var(--clr-primary);color:#fff;}',
      '.btn-dl{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:9px 10px;background:var(--clr-primary);color:#fff;border:none;border-radius:7px;font-family:Cairo,sans-serif;font-size:.83rem;font-weight:700;text-decoration:none;transition:all .22s;}',
      '.btn-dl:hover{background:var(--clr-primary-lt);color:#fff;transform:translateY(-1px);}',
      '.no-books-msg{display:none;text-align:center;padding:64px 20px;font-size:1.05rem;color:var(--clr-text-muted);}',
      '.no-books-msg.visible{display:block;}',
      '#bookModal{display:none;position:fixed;inset:0;z-index:1200;background:rgba(7,22,16,.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:20px;}',
      '#bookModal.open{display:flex;animation:modalIn .22s ease;}',
      '@keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}',
      '.modal-content{background:var(--clr-white);border-radius:14px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.5);position:relative;}',
      '.modal-close{position:absolute;top:14px;left:14px;width:34px;height:34px;border-radius:50%;background:rgba(0,0,0,.08);border:none;font-size:1.3rem;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;}',
      '.modal-close:hover{background:rgba(220,50,50,.15);}',
      '.modal-body{padding:28px 28px 24px;}',
      '#modalTitle{font-size:1.3rem;font-weight:800;color:var(--clr-primary);margin-bottom:6px;line-height:1.4;padding-left:30px;}',
      '.modal-author{display:block;font-size:.92rem;color:var(--clr-primary-lt);font-weight:700;margin-bottom:14px;}',
      '.modal-meta{display:inline-block;font-size:.78rem;color:var(--clr-text-muted);background:var(--clr-bg-alt);padding:4px 12px;border-radius:20px;margin-bottom:16px;}',
      '.modal-desc{font-size:.95rem;color:var(--clr-text);line-height:2;margin-bottom:20px;}',
      '.btn-primary{display:inline-flex;align-items:center;gap:8px;padding:11px 28px;background:var(--clr-primary);color:#fff;border-radius:8px;font-family:Cairo,sans-serif;font-size:.95rem;font-weight:700;transition:all .22s;text-decoration:none;}',
      '.btn-primary:hover{background:var(--clr-primary-lt);color:#fff;transform:translateY(-1px);}',
      '.content-refresh-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:rgba(255,255,255,.1);border:none;border-radius:6px;color:#fff;font-size:1.1rem;cursor:pointer;transition:all .22s;}',
      '.content-refresh-btn:hover{background:rgba(201,168,76,.3);}',
      '[data-theme="dark"] .book-card{background:#1e1e1e;border-color:#2c2c2c;}',
      '[data-theme="dark"] .book-card-head{background:rgba(255,255,255,.03);border-color:#2c2c2c;}',
      '[data-theme="dark"] .book-title{color:#e0e0e0;}',
      '[data-theme="dark"] .book-card-foot{border-color:#2c2c2c;}',
      '[data-theme="dark"] .btn-view{background:rgba(255,255,255,.05);color:#c9a84c;border-color:#333;}',
      '[data-theme="dark"] .modal-content{background:#1e1e1e;}',
      '[data-theme="dark"] #modalTitle{color:#c9a84c;}',
      '[data-theme="dark"] .modal-desc{color:#ccc;}',
      '[data-theme="dark"] .book-meta-tag,[data-theme="dark"] .modal-meta{background:#2a2a2a;color:#aaa;}',
      '@media(max-width:600px){.books-grid{grid-template-columns:1fr;}.modal-body{padding:20px;}.book-card-foot{flex-direction:column;}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ════ بناء أزرار التصنيف ════ */
  function buildFilters() {
    var container = document.getElementById('categoryFilters');
    if (!container) return;
    container.innerHTML = Object.keys(CATEGORIES).map(function (cat) {
      return '<button class="cat-btn' + (cat === currentCat ? ' active' : '') + '" data-cat="' + cat + '">' +
        CAT_ICONS[cat] + ' ' + CATEGORIES[cat] + '</button>';
    }).join('');
    container.querySelectorAll('.cat-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentCat = btn.dataset.cat;
        container.querySelectorAll('.cat-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderBooks();
        window.scrollTo({ top: document.querySelector('.section').offsetTop - 80, behavior: 'smooth' });
      });
    });
  }

  /* ════ عرض الكتب ════ */
  function renderBooks() {
    var grid  = document.getElementById('booksGrid');
    var noMsg = document.getElementById('noBooksMsg');
    if (!grid) return;

    var books    = (window.SITE_DATA && window.SITE_DATA.books) ? window.SITE_DATA.books : [];
    var filtered = currentCat === 'all' ? books : books.filter(function (b) { return b.category === currentCat; });

    if (!filtered.length) {
      grid.innerHTML = '';
      if (noMsg) noMsg.classList.add('visible');
      return;
    }
    if (noMsg) noMsg.classList.remove('visible');

    grid.innerHTML = filtered.map(function (book) {
      var gIdx = books.indexOf(book);
      return '<div class="book-card">' +
        '<div class="book-card-head">' +
          '<span class="book-tag">' + esc(CATEGORIES[book.category] || book.category) + '</span>' +
          '<h3 class="book-title">'   + esc(book.title)    + '</h3>' +
          (book.subtitle ? '<p class="book-subtitle">' + esc(book.subtitle) + '</p>' : '') +
          '<p class="book-author">'   + esc(book.author || '') + '</p>' +
        '</div>' +
        '<div class="book-card-body">' +
          '<p class="book-desc">'     + esc(book.desc || '')   + '</p>' +
          (book.meta ? '<span class="book-meta-tag">' + esc(book.meta) + '</span>' : '') +
        '</div>' +
        '<div class="book-card-foot">' +
          '<button class="btn-view" data-gidx="' + gIdx + '">🔍 التفاصيل</button>' +
          '<a href="' + esc(book.download || '#') + '" target="_blank" rel="noopener noreferrer" class="btn-dl">📺 تصفح</a>' +
        '</div>' +
      '</div>';
    }).join('');

    /* أحداث فتح النافذة */
    grid.querySelectorAll('.btn-view').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx   = parseInt(btn.dataset.gidx, 10);
        var books = (window.SITE_DATA && window.SITE_DATA.books) ? window.SITE_DATA.books : [];
        if (!isNaN(idx) && books[idx]) openModal(books[idx]);
      });
    });
  }

  /* ════ نافذة تفاصيل الكتاب ════ */
  function openModal(book) {
    if (!book) return;
    var modal = document.getElementById('bookModal');
    if (!modal) return;
    document.getElementById('modalTitle').textContent  = book.title  || '';
    document.getElementById('modalAuthor').textContent = book.author || '';
    document.getElementById('modalDesc').textContent   = book.desc   || '';
    var metaEl = modal.querySelector('.modal-meta');
    if (metaEl) metaEl.textContent = book.meta || '';
    var link = document.getElementById('modalLink');
    if (link) link.href = book.download || '#';
    var img = document.getElementById('modalImg');
    if (img) img.style.display = 'none';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    var modal = document.getElementById('bookModal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function initModal() {
    var modal    = document.getElementById('bookModal');
    var closeBtn = document.getElementById('modalClose');
    if (!modal || !closeBtn) return;

    /* إضافة span.modal-meta إذا لم يكن موجوداً */
    var body = modal.querySelector('.modal-body');
    if (body && !modal.querySelector('.modal-meta')) {
      var metaEl = document.createElement('span');
      metaEl.className = 'modal-meta';
      var authorEl = modal.querySelector('.modal-author');
      if (authorEl) authorEl.insertAdjacentElement('afterend', metaEl);
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }

  /* ════ زر التحديث ════ */
  function initRefreshBtn() {
    var btn = document.getElementById('contentRefreshBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      btn.style.transition = 'transform .5s';
      btn.style.transform  = 'rotate(360deg)';
      setTimeout(function () { btn.style.transform = ''; }, 550);
      renderBooks();
    });
  }

  /* ════ مساعد الخروج ════ */
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ════ التهيئة ════ */
  function init() {
    injectStyles();
    buildFilters();
    renderBooks();
    initModal();
    initRefreshBtn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
