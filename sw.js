/**
 * sw.js
 * سرویس ورکر کتاب‌باز — کش کردن پوسته‌ی برنامه برای بارگذاری سریع‌تر و کارکرد آفلاین
 */

const CACHE_NAME = "ketabbaz-cache-v6";

const APP_SHELL = [
  "./index.html",
  "./manifest.json",
  "./favicon.ico",
  "./css/style.css",
  "./css/responsive.css",
  "./js/app.js",
  "./js/books.js",
  "./js/storage.js",
  "./js/seo.js",
  "./js/audio-player.js",
  "./js/figures.js",
  "./js/bottom-nav.js",
  "./js/library.js",
  "./data/books.json",
  "./data/categories.json",
  "./data/podcasts.json",
  "./data/marginalia.json",
  "./data/figures.json",
  "./pages/podcasts.html",
  "./pages/marginalia.html",
  "./pages/figures.html",
  "./pages/my-library.html",
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

  // پاسخی که ممکن است در زنجیره‌اش ریدایرکت داشته باشد (مثلاً حذف خودکار
  // index.html توسط Cloudflare Pages) را قبل از respondWith "تمیز" می‌کنیم،
  // چون مرورگرها اجازه نمی‌دهند پاسخ ریدایرکت‌شده مستقیم به یک درخواست
  // ناوبری (navigation) داده شود و در غیر این صورت با خطای ERR_FAILED مواجه می‌شویم.
  function stripRedirect(response) {
    if (response && response.redirected) {
      return response.blob().then((body) => new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      }));
    }
    return response;
  }

  // درخواست‌های ناوبری (باز کردن صفحه): شبکه اول، با بازگشت به کش در صورت شکست
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(stripRedirect)
        .catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => stripRedirect(response))
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
