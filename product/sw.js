// product/sw.js — Service Worker PWA của INFINIA (offline-first cho file game tĩnh).
// CACHE_VERSION do tools/make-product.sh chèn lúc đóng gói (__VERSION__).
// Chiến lược: index.html network-first (luôn thấy bản mới) + asset cache-first.
// Game single-file nên toàn bộ gameplay (~2.4MB) chạy offline từ lần tải thứ 2.
const CACHE = 'infinia-__VERSION__';
const CORE = ['./index.html', './manifest.webmanifest', './version.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('index.html') || url.pathname.endsWith('/')) {
    // HTML: mạng trước, rớt mạng thì lấy bản cache (không bao giờ kẹt bản cũ quá 1 phiên)
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Còn lại: cache trước, không có mới ra mạng
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
