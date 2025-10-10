// Workbox CDNから読み込み
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  console.log('Workbox loaded successfully');

  // デバッグログを有効化（開発時のみ）
  // workbox.setConfig({ debug: false });

  // キャッシュ名のプレフィックス
  workbox.core.setCacheNameDetails({
    prefix: 'simple-geomancy',
    suffix: 'v10',
    precache: 'precache',
    runtime: 'runtime'
  });

  // 古いキャッシュを自動削除
  workbox.core.clientsClaim();
  self.skipWaiting();

  // プリキャッシュ（初回インストール時にキャッシュ）
  workbox.precaching.precacheAndRoute([
    { url: '/SG-TWA/', revision: '10' },
    { url: '/SG-TWA/index.html', revision: '10' },
    { url: '/SG-TWA/dots.html', revision: '10' },
    { url: '/SG-TWA/ScHc.html', revision: '10' },
    { url: '/SG-TWA/St.html', revision: '10' },
    { url: '/SG-TWA/Oo.html', revision: '10' },
    { url: '/SG-TWA/Help.html', revision: '10' },
    { url: '/SG-TWA/common.css', revision: '10' },
    { url: '/SG-TWA/common.js', revision: '10' },
    { url: '/SG-TWA/manifest.json', revision: '10' },
    { url: '/SG-TWA/TitleLogo.png', revision: '3' },
    { url: '/SG-TWA/Icon_192.png', revision: '2' },
    { url: '/SG-TWA/Icon_512.png', revision: '2' }
  ]);

  // HTML: Network First（常に最新を取得、オフライン時のみキャッシュ使用）
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'document',
    new workbox.strategies.NetworkFirst({
      cacheName: 'simple-geomancy-html-v10',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7日
        }),
      ],
    })
  );

  // CSS/JS: Stale While Revalidate（即座にキャッシュを返し、バックグラウンドで更新）
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'style' ||
      request.destination === 'script',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'simple-geomancy-assets-v10',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30日
        }),
      ],
    })
  );

  // 画像: Cache First（長期間キャッシュ、オフライン対応）
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'simple-geomancy-images-v10',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 90 * 24 * 60 * 60, // 90日
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // Google Fonts: Cache First（フォントは変更されないため）
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://fonts.googleapis.com' ||
                 url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.CacheFirst({
      cacheName: 'simple-geomancy-fonts-v10',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1年
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // シンボル画像専用: Cache First（16個の固定シンボル）
  workbox.routing.registerRoute(
    ({ url }) => {
      const pathname = url.pathname;
      return pathname.match(/\/SG-TWA\/\d{4}\.png$/);
    },
    new workbox.strategies.CacheFirst({
      cacheName: 'simple-geomancy-symbols-v10',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 16,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1年（シンボルは変更されない）
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 古いバージョンのキャッシュを削除
  const CURRENT_CACHES = [
    'simple-geomancy-html-v10',
    'simple-geomancy-assets-v10',
    'simple-geomancy-images-v10',
    'simple-geomancy-fonts-v10',
    'simple-geomancy-symbols-v10',
    'simple-geomancy-precache-v10',
    'simple-geomancy-runtime-v10'
  ];

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // simple-geomancyで始まるが、現在のバージョンではないキャッシュを削除
              return cacheName.startsWith('simple-geomancy') &&
                     !CURRENT_CACHES.some(current => cacheName.includes(current.replace(/-v\d+$/, '')));
            })
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
    );
  });

} else {
  console.error('Workbox failed to load');
}
