/**
 * sw.js
 * سرویس ورکر کتاب‌باز — کش کردن پوسته‌ی برنامه برای بارگذاری سریع‌تر و کارکرد آفلاین
 */

const CACHE_NAME = "ketabbaz-cache-v1";

const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./css/responsive.css",
  "./js/app.js",
  "./js/books.js",
  "./js/storage.js",
  "./js/seo.js",
  "./js/audio-player.js",
  "./data/books.json",
  "./data/categories.json",
  "./data/podcasts.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // فایل‌های صوتی و PDF را همیشه از شبکه بگیر (حجیم هستند)
  if (request.destination === "audio" || request.url.endsWith(".pdf")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
