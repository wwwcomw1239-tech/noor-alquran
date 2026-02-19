'use strict';

const PLAYLIST_ID = 'PLVbjqy4Qzz1NWqxom2befYJBuB99zcd9e';
let playlistData = null;

// ======================================================
// دوال تحليل البيانات من كل مصدر
// ======================================================

function parsePiped(d) {
  const streams = d.relatedStreams || d.videos || [];
  const videos = streams.map((v, i) => {
    const rawId = v.url || v.videoId || '';
    const id = rawId.replace('/watch?v=', '').replace('https://www.youtube.com/watch?v=', '');
    return {
      id,
      title: v.title || ('مقطع ' + (i + 1)),
      thumbnail: v.thumbnail || ('https://i.ytimg.com/vi/' + id + '/mqdefault.jpg'),
      position: i
    };
  }).filter(v => v.id && v.id.length > 5);
  return { title: d.name || d.title || 'قائمة التشغيل', videos, videoCount: videos.length };
}

function parseInvidious(d) {
  const videos = (d.videos || []).map((v, i) => ({
    id: v.videoId,
    title: v.title || ('مقطع ' + (i + 1)),
    thumbnail: 'https://i.ytimg.com/vi/' + v.videoId + '/mqdefault.jpg',
    position: i
  })).filter(v => v.id);
  return { title: d.title || 'قائمة التشغيل', videos, videoCount: videos.length };
}

function parseRSS(xmlStr) {
  const videoIds = Array.from(xmlStr.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)).map(m => m[1].trim());
  const allTitles = Array.from(xmlStr.matchAll(/<title(?:[^>]*)>([^<]*)<\/title>/g)).map(m => m[1].trim());
  const feedTitle = allTitles[0] || 'قائمة التشغيل';
  const videoTitles = allTitles.slice(1);
  const videos = videoIds.map((id, i) => ({
    id,
    title: videoTitles[i] || ('مقطع ' + (i + 1)),
    thumbnail: 'https://i.ytimg.com/vi/' + id + '/mqdefault.jpg',
    position: i
  }));
  return { title: feedTitle, videos, videoCount: videos.length };
}

// ======================================================
// دالة جلب مع timeout
// ======================================================
function fetchWithTimeout(url, ms) {
  ms = ms || 7000;
  return new Promise(function(resolve, reject) {
    const timer = setTimeout(function() { reject(new Error('timeout')); }, ms);
    fetch(url)
      .then(function(r) {
        clearTimeout(timer);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json ? r.json() : r.text();
      })
      .then(resolve)
      .catch(function(e) { clearTimeout(timer); reject(e); });
  });
}

function fetchTextWithTimeout(url, ms) {
  ms = ms || 7000;
  return new Promise(function(resolve, reject) {
    const timer = setTimeout(function() { reject(new Error('timeout')); }, ms);
    fetch(url)
      .then(function(r) {
        clearTimeout(timer);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(resolve)
      .catch(function(e) { clearTimeout(timer); reject(e); });
  });
}

// ======================================================
// مصادر متعددة بدون API Key
// ======================================================
async function tryPiped1() {
  const d = await fetchWithTimeout('https://pipedapi.kavin.rocks/playlists/' + PLAYLIST_ID);
  const r = parsePiped(d);
  if (!r.videos.length) throw new Error('empty');
  return r;
}

async function tryPiped2() {
  const d = await fetchWithTimeout('https://piped-api.privacy.com.de/playlists/' + PLAYLIST_ID);
  const r = parsePiped(d);
  if (!r.videos.length) throw new Error('empty');
  return r;
}

async function tryPiped3() {
  const d = await fetchWithTimeout('https://pipedapi.in/playlists/' + PLAYLIST_ID);
  const r = parsePiped(d);
  if (!r.videos.length) throw new Error('empty');
  return r;
}

async function tryInvidious1() {
  const d = await fetchWithTimeout('https://invidious.privacydev.net/api/v1/playlists/' + PLAYLIST_ID);
  const r = parseInvidious(d);
  if (!r.videos.length) throw new Error('empty');
  return r;
}

async function tryInvidious2() {
  const d = await fetchWithTimeout('https://inv.tux.pizza/api/v1/playlists/' + PLAYLIST_ID);
  const r = parseInvidious(d);
  if (!r.videos.length) throw new Error('empty');
  return r;
}

async function tryRSS() {
  const rssUrl = 'https://www.youtube.com/feeds/videos.xml?playlist_id=' + PLAYLIST_ID;
  const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(rssUrl);
  const raw = await fetchWithTimeout(proxyUrl, 9000);
  const xmlStr = raw.contents || '';
  if (!xmlStr) throw new Error('empty rss');
  const r = parseRSS(xmlStr);
  if (!r.videos.length) throw new Error('rss empty videos');
  return r;
}

async function tryRSS2() {
  const rssUrl = 'https://www.youtube.com/feeds/videos.xml?playlist_id=' + PLAYLIST_ID;
  const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(rssUrl);
  const xmlStr = await fetchTextWithTimeout(proxyUrl, 9000);
  if (!xmlStr) throw new Error('empty');
  const r = parseRSS(xmlStr);
  if (!r.videos.length) throw new Error('empty');
  return r;
}

const SOURCES = [tryPiped1, tryPiped2, tryPiped3, tryInvidious1, tryInvidious2, tryRSS, tryRSS2];

// ======================================================
// جلب البيانات من أول مصدر يرد
// ======================================================
async function loadPlaylistData() {
  for (var i = 0; i < SOURCES.length; i++) {
    try {
      const data = await SOURCES[i]();
      playlistData = data;
      updatePlaylistHeader();
      renderVideosList();
      console.log('✅ Loaded from source #' + (i + 1) + ': ' + data.title);
      return;
    } catch (err) {
      console.warn('⚠️ Source #' + (i + 1) + ' failed:', err.message);
    }
  }
  // كل المصادر فشلت
  showError();
}

// ======================================================
// عرض حالة الخطأ
// ======================================================
function showError() {
  var nameEl = document.getElementById('playlistName');
  var countEl = document.getElementById('playlistCount');
  var toggle = document.getElementById('playlistToggle');
  var container = document.getElementById('playlistVideos');

  nameEl.textContent = 'قائمة المقاطع القرآنية';
  countEl.textContent = 'اضغط لفتح القائمة في يوتيوب مباشرة';
  container.innerHTML =
    '<div class="videos-error">' +
      '<div class="error-icon">⚠️</div>' +
      '<p>تعذّر جلب قائمة المقاطع تلقائياً</p>' +
      '<a href="https://youtube.com/playlist?list=' + PLAYLIST_ID + '" target="_blank" rel="noopener noreferrer" class="btn-youtube" style="display:inline-flex;margin-top:16px">فتح القائمة في يوتيوب</a>' +
    '</div>';
  container.style.display = 'block';
  if (toggle) toggle.setAttribute('aria-expanded', 'true');
  var arrow = document.getElementById('playlistArrow');
  if (arrow) arrow.textContent = '▲';
}

// ======================================================
// تحديث رأس القائمة
// ======================================================
function updatePlaylistHeader() {
  if (!playlistData) return;
  var nameEl = document.getElementById('playlistName');
  var countEl = document.getElementById('playlistCount');
  if (nameEl) nameEl.textContent = playlistData.title;
  if (countEl) countEl.textContent = playlistData.videoCount + ' مقطع';
}

// ======================================================
// رسم قائمة الفيديوهات
// ======================================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderVideosList() {
  if (!playlistData) return;
  var container = document.getElementById('playlistVideos');

  var html = playlistData.videos.map(function(video) {
    return '<div class="video-item" data-video-id="' + escapeHtml(video.id) + '" role="button" tabindex="0" aria-label="تشغيل: ' + escapeHtml(video.title) + '">' +
      '<div class="video-thumbnail">' +
        '<img src="' + escapeHtml(video.thumbnail) + '" alt="" loading="lazy" onerror="this.src=\'https://i.ytimg.com/vi/' + escapeHtml(video.id) + '/hqdefault.jpg\'">' +
        '<div class="video-play-overlay">' +
          '<svg width="44" height="31" viewBox="0 0 68 48" fill="none">' +
            '<path d="M66.52 7.74C65.74 4.81 64.04 2.33 61.1 1.55 55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#f00"/>' +
            '<path d="M45 24 27 14v20z" fill="#fff"/>' +
          '</svg>' +
        '</div>' +
      '</div>' +
      '<div class="video-details">' +
        '<h3 class="video-title">' + escapeHtml(video.title) + '</h3>' +
        '<p class="video-number">المقطع رقم ' + (video.position + 1) + '</p>' +
      '</div>' +
    '</div>';
  }).join('');

  container.innerHTML = html;

  container.querySelectorAll('.video-item').forEach(function(item) {
    function playIt() {
      var id = item.getAttribute('data-video-id');
      var title = item.querySelector('.video-title').textContent;
      playVideo(id, title);
    }
    item.addEventListener('click', playIt);
    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playIt(); }
    });
  });
}

// ======================================================
// تشغيل الفيديو
// ======================================================
function playVideo(videoId, title) {
  var wrapper = document.getElementById('playerWrapper');
  var iframe = document.getElementById('youtube-player');
  var titleEl = document.getElementById('playerTitle');

  if (titleEl) titleEl.textContent = title;
  if (iframe) iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0&modestbranding=1';
  if (wrapper) {
    wrapper.style.display = 'block';
    setTimeout(function() {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }
}

// ======================================================
// إغلاق المشغل
// ======================================================
function closePlayer() {
  var wrapper = document.getElementById('playerWrapper');
  var iframe = document.getElementById('youtube-player');
  if (iframe) iframe.src = '';
  if (wrapper) wrapper.style.display = 'none';
}

// ======================================================
// فتح/إغلاق قائمة المقاطع
// ======================================================
function togglePlaylist() {
  var container = document.getElementById('playlistVideos');
  var arrow = document.getElementById('playlistArrow');
  var toggle = document.getElementById('playlistToggle');

  var isOpen = container.style.display === 'block';
  container.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
  if (toggle) toggle.setAttribute('aria-expanded', String(!isOpen));
}

// ======================================================
// تهيئة عند تحميل الصفحة
// ======================================================
document.addEventListener('DOMContentLoaded', function() {
  loadPlaylistData();

  var toggleBtn = document.getElementById('playlistToggle');
  if (toggleBtn) toggleBtn.addEventListener('click', togglePlaylist);

  var closeBtn = document.getElementById('playerClose');
  if (closeBtn) closeBtn.addEventListener('click', closePlayer);
});
