const CACHE_NAME = 'simple-geomancy-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dots.html',
  '/ScHc.html',
  '/St.html',
  '/Oo.html',
  '/Help.html',
  '/manifest.json',
  '/TitleLogo.png',
  '/Icon_192.png',
  '/Icon_512.png',
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

// インストール時にキャッシュを作成
self.addEventListener('install', event => {
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
    })
  );
});
