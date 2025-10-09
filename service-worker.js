const CACHE_NAME = 'simple-geomancy-v8';
const urlsToCache = [
  '/SG-TWA/',
  '/SG-TWA/index.html',
  '/SG-TWA/dots.html',
  '/SG-TWA/ScHc.html',
  '/SG-TWA/St.html',
  '/SG-TWA/Oo.html',
  '/SG-TWA/Help.html',
  '/SG-TWA/common.css',
  '/SG-TWA/common.js',
  '/SG-TWA/manifest.json',
  '/SG-TWA/TitleLogo.png',
  '/SG-TWA/Icon_192.png',
  '/SG-TWA/Icon_512.png',
  '/SG-TWA/1111.png',
  '/SG-TWA/1112.png',
  '/SG-TWA/1121.png',
  '/SG-TWA/1122.png',
  '/SG-TWA/1211.png',
  '/SG-TWA/1212.png',
  '/SG-TWA/1221.png',
  '/SG-TWA/1222.png',
  '/SG-TWA/2111.png',
  '/SG-TWA/2112.png',
  '/SG-TWA/2121.png',
  '/SG-TWA/2122.png',
  '/SG-TWA/2211.png',
  '/SG-TWA/2212.png',
  '/SG-TWA/2221.png',
  '/SG-TWA/2222.png'
];

// インストール時にキャッシュを作成
self.addEventListener('install', event => {
  // 新しいService Workerを即座にアクティブにする
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Stale-While-Revalidate戦略: キャッシュを即座に返しつつバックグラウンドで更新
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        // バックグラウンドでネットワークから取得してキャッシュを更新
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // 有効なレスポンスであればキャッシュに保存
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(error => {
            // ネットワークエラーは無視（キャッシュを使用）
            console.log('Fetch failed; returning cached response instead.', error);
            return cachedResponse;
          });

        // キャッシュがあればそれを即座に返し、なければネットワークを待つ
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 全てのクライアントを即座に制御下に置く
      return self.clients.claim();
    })
  );
});
