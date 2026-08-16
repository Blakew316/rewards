/* WPI Rewards — service worker.
   Core assets (pages, styles, scripts) are network-first with cache
   fallback, so installed PWAs always pick up new deploys when online.
   Media and icons stay cache-first for speed. */
const VERSION = "wpi-rewards-v22";
const ASSETS = [
  "./",
  "./index.html",
  "./demo.html",
  "./rewards.html",
  "./earnings.html",
  "./orders.html",
  "./cart.html",
  "./profile.html",
  "./terms.html",
  "./privacy.html",
  "./assets/css/style.css",
  "./assets/js/data.js",
  "./assets/js/app.js",
  "./assets/img/icon-192.png",
  "./assets/img/icon-512.png",
  "./assets/img/apple-touch-icon.png",
  "./assets/media/card-machine.mp4",
  "./assets/media/card-machine.webm",
  "./manifest.webmanifest",
];

const CORE = /\.(?:html|css|js|webmanifest)$|\/$/;

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;

  const cachePut = (res) => {
    if (res && res.ok && sameOrigin) {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
    }
    return res;
  };

  if (req.mode === "navigate" || (sameOrigin && CORE.test(url.pathname))) {
    // Network-first: fresh code wins whenever the device is online.
    e.respondWith(
      fetch(req).then(cachePut).catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then(cachePut))
  );
});
