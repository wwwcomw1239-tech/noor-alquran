/* =========================================
   محرك البحث - نور القرآن
   ========================================= */

(function () {

  var allItems = [
    ...(SITE_DATA.books        || []),
    ...(SITE_DATA.clips        || [])
  ];

  function init() {
    var toggle  = document.getElementById('searchToggle');
    var overlay = document.getElementById('searchOverlay');
    var closeBtn= document.getElementById('searchClose');
    var input   = document.getElementById('searchInput');
    var results = document.getElementById('searchResults');
    if (!toggle || !overlay) return;

    toggle.addEventListener('click', function () {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      setTimeout(function(){ input.focus(); }, 80);
    });

    function closeSearch() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      input.value = '';
      results.innerHTML = hint();
    }

    closeBtn.addEventListener('click', closeSearch);
    overlay.addEventListener('click', function(e){ if(e.target===overlay) closeSearch(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeSearch(); });
    input.addEventListener('input', function(){ doSearch(input.value, results); });
  }

  function hint() {
    return '<p class="search-hint">ابدأ الكتابة للبحث في الكتب والمقاطع...</p>';
  }

  function doSearch(q, results) {
    q = q.trim();
    if (q.length < 2) { results.innerHTML = hint(); return; }
    var qL = q.toLowerCase();
    var found = allItems.filter(function(item){
      return [item.title||'', item.subtitle||'', item.author||'', item.desc||'', item.ayah||'']
        .join(' ').toLowerCase().indexOf(qL) !== -1;
    });
    if (!found.length) {
      results.innerHTML = '<p class="search-empty">لا توجد نتائج مطابقة لـ &laquo;' + esc(q) + '&raquo;</p>';
      return;
    }
    results.innerHTML = found.map(function(item){
      return '<a href="' + item.page + '" class="s-result">'
        + '<span class="s-type">' + esc(item.type) + '</span>'
        + '<div class="s-info">'
        + '<strong class="s-title">' + hl(item.title, q) + '</strong>'
        + (item.author ? '<span class="s-author">' + esc(item.author) + '</span>' : '')
        + '<p class="s-desc">' + hl((item.desc||item.ayah||'').slice(0,130), q) + '…</p>'
        + '</div>'
        + '<span class="s-arrow">←</span>'
        + '</a>';
    }).join('');
  }

  function hl(text, q) {
    if (!text || !q) return esc(text||'');
    var safe = esc(text);
    var safeQ = esc(q).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    return safe.replace(new RegExp('(' + safeQ + ')', 'gi'),
      '<mark class="s-mark">$1</mark>');
  }

  function esc(s) {
    return String(s||'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
