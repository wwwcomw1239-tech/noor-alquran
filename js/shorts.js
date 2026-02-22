/* =========================================
   منطق قسم "لحظات قرآنية" (YouTube Shorts)
   ========================================= */

(function () {
  'use strict';

  // رابط قائمة تشغيل مخصصة للـ Shorts (مؤقتاً سنستخدم القائمة الأولى للتجربة، يمكنك استبدالها لاحقاً)
  var SHORTS_PLAYLIST_ID = 'PLVbjqy4Qzz1NWqxom2befYJBuB99zcd9e'; 
  
  var RSS_URL  = 'https://www.youtube.com/feeds/videos.xml?playlist_id=' + SHORTS_PLAYLIST_ID;
  var API_RSS2 = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(RSS_URL) + '&count=20';

  var players = {};
  var currentIndex = 0;
  var ytApiReady = false;

  /* ════ YouTube IFrame API ════ */
  function loadYTApi() {
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  window.onYouTubeIframeAPIReady = function () {
    ytApiReady = true;
    initPlayersForVisibleItems();
  };

  /* ════ جلب البيانات ════ */
  function fetchShorts() {
    return fetch(API_RSS2)
      .then(r => r.json())
      .then(d => {
        if (d.status === 'ok' && d.items) return d.items;
        throw new Error('No items');
      });
  }

  function vidId(link) {
    var m = String(link || '').match(/[?&]v=([^&]+)/);
    return m ? m[1] : '';
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ════ بناء الواجهة ════ */
  function renderShorts(items) {
    var container = document.getElementById('shortsContainer');
    if (!container) return;

    container.innerHTML = '';
    
    items.forEach((item, index) => {
      var id = vidId(item.link);
      if (!id) return;
      
      var thumb = 'https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg';
      
      var section = document.createElement('div');
      section.className = 'short-item';
      section.dataset.index = index;
      section.dataset.vid = id;
      
      section.innerHTML = `
        <div class="short-video-wrapper">
          <div id="player-${id}" class="yt-player-div"></div>
          
          <!-- الغطاء التفاعلي -->
          <div class="short-overlay" onclick="togglePlayPause('${id}')">
            <div class="short-info">
              <h2 class="short-title">${escHtml(item.title)}</h2>
              <span class="short-date">نور القرآن</span>
            </div>
            
            <div class="short-actions" onclick="event.stopPropagation()">
              <button class="action-btn" onclick="shareVideo('${id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                <span class="action-label">مشاركة</span>
              </button>
            </div>
            
            <div class="play-pause-indicator" id="indicator-${id}">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </div>
      `;
      
      container.appendChild(section);
    });

    setupScrollObserver();
  }

  /* ════ التحكم بالفيديو ════ */
  window.togglePlayPause = function(id) {
    var player = players[id];
    var indicator = document.getElementById('indicator-' + id);
    if (!player || !player.getPlayerState) return;
    
    var state = player.getPlayerState();
    if (state === 1) { // 1 = playing
      player.pauseVideo();
      indicator.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
      indicator.classList.add('show');
    } else {
      player.playVideo();
      indicator.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
      indicator.classList.add('show');
      setTimeout(() => indicator.classList.remove('show'), 500);
    }
  };

  window.shareVideo = function(id) {
    var url = 'https://youtu.be/' + id;
    if (navigator.share) {
      navigator.share({
        title: 'شاهد هذا المقطع من نور القرآن',
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('تم نسخ الرابط!');
    }
  };

  /* ════ مراقب التمرير (Intersection Observer) ════ */
  function setupScrollObserver() {
    if (!('IntersectionObserver' in window)) return;
    
    var options = {
      root: document.getElementById('shortsContainer'),
      threshold: 0.6 // يعتبر المقطع معروضاً إذا ظهر 60% منه
    };
    
    var observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        var id = entry.target.dataset.vid;
        
        if (entry.isIntersecting) {
          // المقطع الحالي ظاهر بالشاشة
          currentIndex = parseInt(entry.target.dataset.index);
          
          if (!players[id] && ytApiReady) {
            createPlayer(id, true);
          } else if (players[id] && players[id].playVideo) {
            players[id].playVideo();
          }
          
        } else {
          // المقطع خرج من الشاشة -> أوقفه
          if (players[id] && players[id].pauseVideo) {
            players[id].pauseVideo();
          }
        }
      });
    }, options);
    
    document.querySelectorAll('.short-item').forEach(item => {
      observer.observe(item);
    });
  }

  function createPlayer(id, autoplay) {
    if (players[id]) return; // تم إنشاؤه مسبقاً
    
    players[id] = new YT.Player('player-' + id, {
      videoId: id,
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 0, // إخفاء شريط يوتيوب ليكون مثل الشورتس
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        fs: 0,
        disablekb: 1,
        loop: 1,
        playlist: id // ضروري للـ loop
      },
      events: {
        onReady: function(event) {
          if (autoplay) event.target.playVideo();
        }
      }
    });
  }

  function initPlayersForVisibleItems() {
    var container = document.getElementById('shortsContainer');
    var items = container.querySelectorAll('.short-item');
    if (items.length > 0) {
      var firstId = items[0].dataset.vid;
      createPlayer(firstId, true); // تشغيل أول مقطع
    }
  }

  /* ════ التهيئة ════ */
  function init() {
    loadYTApi();
    fetchShorts()
      .then(items => renderShorts(items))
      .catch(err => {
        var container = document.getElementById('shortsContainer');
        if (container) {
          container.innerHTML = '<div class="shorts-loading" style="color:red;"><p>حدث خطأ في تحميل المقاطع</p></div>';
        }
      });
  }

  document.addEventListener('DOMContentLoaded', init);

})();