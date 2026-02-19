// YouTube Playlist Integration
// Developer: Dawood Al-Ahmadi

const PLAYLIST_ID = 'PLVbjqy4Qzz1NWqxom2befYJBuB99zcd9e';
const API_KEY = 'AIzaSyD5W8vNwLqE7YqQ8K7M0zX9PzJ0h6b9xYk'; // YouTube Data API v3 Key

let playlistData = null;

// تحميل بيانات قائمة التشغيل
async function loadPlaylistData() {
  try {
    // جلب بيانات قائمة التشغيل
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${PLAYLIST_ID}&key=${API_KEY}`
    );
    const playlistJson = await playlistResponse.json();
    
    if (!playlistJson.items || playlistJson.items.length === 0) {
      throw new Error('لم يتم العثور على قائمة التشغيل');
    }

    const playlistInfo = playlistJson.items[0].snippet;

    // جلب فيديوهات القائمة
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}`
    );
    const videosJson = await videosResponse.json();

    if (!videosJson.items) {
      throw new Error('لم يتم العثور على فيديوهات');
    }

    playlistData = {
      title: playlistInfo.title,
      description: playlistInfo.description,
      videoCount: videosJson.items.length,
      videos: videosJson.items.map(item => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        position: item.snippet.position
      }))
    };

    updatePlaylistHeader();
    renderVideosList();

  } catch (error) {
    console.error('Error loading playlist:', error);
    document.getElementById('playlistName').textContent = 'خطأ في تحميل قائمة التشغيل';
    document.getElementById('playlistCount').textContent = 'يرجى المحاولة لاحقاً';
  }
}

// تحديث عنوان قائمة التشغيل
function updatePlaylistHeader() {
  if (!playlistData) return;

  document.getElementById('playlistName').textContent = playlistData.title;
  document.getElementById('playlistCount').textContent = `${playlistData.videoCount} فيديو`;
}

// عرض قائمة الفيديوهات
function renderVideosList() {
  if (!playlistData) return;

  const container = document.getElementById('playlistVideos');
  
  const videosHTML = playlistData.videos.map(video => `
    <div class="video-item" data-video-id="${video.id}">
      <div class="video-thumbnail">
        <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
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
  }
}

// تهيئة الأحداث
document.addEventListener('DOMContentLoaded', function() {
  // تحميل بيانات قائمة التشغيل
  loadPlaylistData();

  // زر توسيع القائمة
  document.getElementById('playlistToggle').addEventListener('click', togglePlaylist);

  // زر إغلاق المشغل
  document.getElementById('playerClose').addEventListener('click', closePlayer);
});
