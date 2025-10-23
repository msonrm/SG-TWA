// Simple Geomancy Service Worker (Workboxなし)
// バージョン管理
const CACHE_VERSION = 'v11';
const CACHE_PREFIX = 'simple-geomancy';

// キャッシュ名
const CACHE_NAMES = {
  precache: `${CACHE_PREFIX}-precache-${CACHE_VERSION}`,
  html: `${CACHE_PREFIX}-html-${CACHE_VERSION}`,
  assets: `${CACHE_PREFIX}-assets-${CACHE_VERSION}`,
  images: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  fonts: `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`,
  symbols: `${CACHE_PREFIX}-symbols-${CACHE_VERSION}`
};

// プリキャッシュするファイル（初回インストール時）
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/dots.html',
  '/ScHc.html',
  '/St.html',
  '/Oo.html',
  '/Help.html',
  '/common.css',
  '/common.js',
  '/manifest.json',
  '/TitleLogo.png',
  '/Icon_192.png',
  '/Icon_512.png',
  // シンボル画像（16個）
  '/1111.png',
  '/1112.png',
  '/1121.png',
  '/1122.png',
  '/1211.png',
  '/1212.png',
  '/1221.png',
  '/1222.png',
  '/2111.png',
  '/2112.png',
  '/2121.png',
  '/2122.png',
  '/2211.png',
  '/2212.png',
  '/2221.png',
  '/2222.png'
];

// インストールイベント: プリキャッシュ
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(CACHE_NAMES.precache)
      .then((cache) => {
        console.log('Service Worker: Precaching files');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Precaching complete');
        return self.skipWaiting(); // 即座にアクティブ化
      })
  );
});

// アクティベートイベント: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  const currentCaches = Object.values(CACHE_NAMES);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // simple-geomancyで始まるが、現在のバージョンではないキャッシュを削除
              return cacheName.startsWith(CACHE_PREFIX) &&
                     !currentCaches.includes(cacheName);
            })
            .map((cacheName) => {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim(); // 即座に制御開始
      })
  );
});

// フェッチイベント: キャッシュ戦略を適用
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // HTMLドキュメント: Network First
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, CACHE_NAMES.html));
    return;
  }

  // CSS/JS: Stale While Revalidate
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.assets));
    return;
  }

  // Google Fonts: Cache First
  if (url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, CACHE_NAMES.fonts));
    return;
  }

  // シンボル画像 (1111.png - 2222.png): Cache First
  if (url.pathname.match(/\/\d{4}\.png$/)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.symbols));
    return;
  }

  // その他の画像: Cache First
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, CACHE_NAMES.images));
    return;
  }

  // その他のリクエスト: ネットワーク優先、フォールバックでキャッシュ
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request, { ignoreSearch: true });
    })
  );
});

// キャッシュ戦略: Network First
// 常に最新を取得、オフライン時のみキャッシュ使用
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Network First: Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request, { ignoreSearch: true });

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// キャッシュ戦略: Cache First
// 長期間キャッシュ、オフライン対応
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request, { ignoreSearch: true });

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Cache First: Both cache and network failed:', request.url);
    throw error;
  }
}

// キャッシュ戦略: Stale While Revalidate
// 即座にキャッシュを返し、バックグラウンドで更新
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request, { ignoreSearch: true });

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      const cache = caches.open(cacheName).then((cache) => {
        cache.put(request, networkResponse.clone());
      });
    }
    return networkResponse;
  }).catch((error) => {
    console.log('Stale While Revalidate: Network update failed:', request.url);
    return null;
  });

  // キャッシュがあれば即座に返す、なければネットワークを待つ
  return cachedResponse || fetchPromise;
}

console.log('Service Worker: Script loaded successfully (Workbox-free)');
