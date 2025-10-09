const CACHE_NAME = 'simple-geomancy-v6';
const urlsToCache = [
  '/SG-TWA/',
  '/SG-TWA/index.html',
  '/SG-TWA/dots.html',
  '/SG-TWA/ScHc.html',
  '/SG-TWA/St.html',
  '/SG-TWA/Oo.html',
  '/SG-TWA/Help.html',
  '/SG-TWA/common.css',
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

// キャッシュから応答を返す
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }

        // キャッシュになければネットワークから取得
        return fetch(event.request).then(
          response => {
            // 有効なレスポンスかチェック
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスのクローンをキャッシュに保存
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
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
