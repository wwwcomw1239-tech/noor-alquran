// YouTube Playlist Integration - Fixed Version
// Developer: Dawood Al-Ahmadi
// Uses RSS Feed + fallback methods (no API key needed)

const PLAYLIST_ID = 'PLVbjqy4Qzz1NWqxom2befYJBuB99zcd9e';

let playlistData = null;

// تحميل بيانات قائمة التشغيل باستخدام RSS Feed
async function loadPlaylistData() {
  try {
    // استخدام YouTube RSS Feed (لا يحتاج API Key)
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;
    
    // نستخدم cors-anywhere proxy أو نحاول مباشرة
    let response;
    try {
      // محاولة مباشرة أولاً
      response = await fetch(rssUrl);
    } catch (e) {
      // إذا فشل CORS، نستخدم proxy
      response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`);
    }

    if (!response.ok) {
      throw new Error('فشل تحميل RSS');
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // استخراج البيانات من XML
    const entries = xmlDoc.querySelectorAll('entry');
    
    if (entries.length === 0) {
      throw new Error('لم يتم العثور على فيديوهات');
    }

    // استخراج عنوان القناة
    const channelTitle = xmlDoc.querySelector('feed > title')?.textContent || 'قائمة تشغيل قرآنية';

    const videos = [];
    entries.forEach((entry, index) => {
      const videoId = entry.querySelector('videoId')?.textContent || 
                      entry.querySelector('id')?.textContent?.split(':').pop();
      const title = entry.querySelector('title')?.textContent || 'بدون عنوان';
      const thumbnail = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

      if (videoId) {
        videos.push({
          id: videoId,
          title: title,
          thumbnail: thumbnail,
          position: index
        });
      }
    });

    playlistData = {
      title: 'المقاطع القرآنية المختارة',
      videoCount: videos.length,
      videos: videos
    };

    updatePlaylistHeader();
    renderVideosList();

  } catch (error) {
    console.error('Error loading playlist:', error);
    
    // Fallback: استخدام بيانات ثابتة مؤقتة
    loadFallbackData();
  }
}

// بيانات احتياطية في حالة فشل جميع الطرق
function loadFallbackData() {
  // يمكن تحديث هذه القائمة يدوياً من وقت لآخر
  playlistData = {
    title: 'المقاطع القرآنية',
    videoCount: 15,
    videos: [
      // يمكن إضافة فيديوهات يدوياً هنا كاحتياط
      { id: 'dQw4w9WgXcQ', title: 'مقطع 1', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', position: 0 },
      // ... المزيد من الفيديوهات
    ]
  };

  // محاولة أخيرة: استخدام iframe embed للحصول على معلومات القائمة
  tryIframeMethod();
}

// طريقة بديلة: استخدام oEmbed API
async function tryIframeMethod() {
  try {
    // نستخدم أول فيديو من القائمة لعرض معلومات
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/playlist?list=${PLAYLIST_ID}&format=json`;
    
    const response = await fetch(oEmbedUrl);
    if (response.ok) {
      const data = await response.json();
      document.getElementById('playlistName').textContent = data.title || 'قائمة المقاطع القرآنية';
    }
  } catch (e) {
    console.log('oEmbed fallback failed:', e);
    document.getElementById('playlistName').textContent = 'قائمة المقاطع القرآنية';
    document.getElementById('playlistCount').textContent = 'اضغط للمشاهدة';
  }
  
  updatePlaylistHeader();
  renderVideosList();
}

// تحديث عنوان قائمة التشغيل
function updatePlaylistHeader() {
  if (!playlistData) return;

  document.getElementById('playlistName').textContent = playlistData.title;
  document.getElementById('playlistCount').textContent = `${playlistData.videoCount} فيديو`;
}

// عرض قائمة الفيديوهات
function renderVideosList() {
  const container = document.getElementById('playlistVideos');
  
  if (!playlistData || playlistData.videos.length === 0) {
    // إذا لم تكن هناك فيديوهات، نعرض رسالة توضيحية
    container.innerHTML = `
      <div class="fallback-message">
        <p>لم نتمكن من تحميل قائمة الفيديوهات تلقائياً.</p>
        <p>يمكنك مشاهدة القائمة الكاملة على يوتيوب مباشرة.</p>
      </div>
    `;
    return;
  }
  
  const videosHTML = playlistData.videos.map(video => `
    <div class="video-item" data-video-id="${video.id}">
      <div class="video-thumbnail">
        <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" onerror="this.src='https://i.ytimg.com/vi/${video.id}/default.jpg'">
        <div class="video-play-overlay">
          <svg width="48" height="48" viewBox="0 0 68 48" fill="none">
            <path d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"/>
            <path d="M 45,24 27,14 27,34" fill="#fff"/>
          </svg>
        </div>
      </div>
      <div class="video-details">
        <h3 class="video-title">${video.title}</h3>
        <p class="video-number">الفيديو رقم ${video.position + 1}</p>
      </div>
    </div>
  `).join('');

  container.innerHTML = videosHTML;

  // إضافة مستمع النقر لكل فيديو
  container.querySelectorAll('.video-item').forEach(item => {
    item.addEventListener('click', function() {
      const videoId = this.getAttribute('data-video-id');
      const videoTitle = this.querySelector('.video-title').textContent;
      playVideo(videoId, videoTitle);
    });
  });
}

// تشغيل فيديو
function playVideo(videoId, title) {
  const playerWrapper = document.getElementById('playerWrapper');
  const iframe = document.getElementById('youtube-player');
  const playerTitle = document.getElementById('playerTitle');

  // تحديث عنوان المشغل
  playerTitle.textContent = title;

  // تحميل الفيديو
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  // إظهار المشغل
  playerWrapper.style.display = 'block';
  
  // التمرير إلى المشغل
  setTimeout(() => {
    playerWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// إغلاق المشغل
function closePlayer() {
  const playerWrapper = document.getElementById('playerWrapper');
  const iframe = document.getElementById('youtube-player');

  // إيقاف الفيديو
  iframe.src = '';

  // إخفاء المشغل
  playerWrapper.style.display = 'none';
}

// توسيع/إغلاق قائمة الفيديوهات
function togglePlaylist() {
  const videosContainer = document.getElementById('playlistVideos');
  const arrow = document.getElementById('playlistArrow');
  const toggle = document.getElementById('playlistToggle');
  
  const isExpanded = videosContainer.style.display === 'block';
  
  if (isExpanded) {
    videosContainer.style.display = 'none';
    arrow.textContent = '▼';
    toggle.setAttribute('aria-expanded', 'false');
  } else {
    videosContainer.style.display = 'block';
    arrow.textContent = '▲';
    toggle.setAttribute('aria-expanded', 'true');
    
    // إذا لم يتم تحميل الفيديوهات بعد، نحاول مرة أخرى
    if (!playlistData || playlistData.videos.length === 0) {
      loadPlaylistData();
    }
  }
}

// تهيئة الأحداث
document.addEventListener('DOMContentLoaded', function() {
  // تحميل بيانات قائمة التشغيل
  loadPlaylistData();

  // زر توسيع القائمة
  const toggleBtn = document.getElementById('playlistToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', togglePlaylist);
  }

  // زر إغلاق المشغل
  const closeBtn = document.getElementById('playerClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', closePlayer);
  }
});
