/* Wander Crew service worker: makes the app installable and lets it open offline.
   App files: network first (so updates land immediately), cache as fallback.
   Photos and fonts: cache first. Supabase, AI and live prices: never cached here. */
const VERSION = "20261029020229";
const SHELL = "wc-shell-" + VERSION, MEDIA = "wc-media-v1";
const CORE = ["./", "index.html", "styles.css", "js/config.js", "js/engine.js", "js/search.js", "js/app.js", "data/destinations.js", "data/places.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("wc-shell-") && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (/supabase\.co$/.test(url.hostname) || /serpapi|anthropic/.test(url.hostname)) return; // live data: straight to network
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin) {
    if (url.searchParams.has("check")) return; // update checks must hit the network
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); }
      return res;
    }).catch(async () => (await caches.match(req, { ignoreSearch: true })) || (req.mode === "navigate" ? caches.match("index.html") : Response.error())));
    return;
  }
  if (/wikimedia\.org|wikipedia\.org$|fonts\.(googleapis|gstatic)\.com|gstatic\.com|cdn\.jsdelivr\.net/.test(url.hostname)) {
    e.respondWith(caches.open(MEDIA).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const res = await fetch(req); if (res.ok || res.type === "opaque") { c.put(req, res.clone()); trim(c); } return res; }
      catch { return hit || Response.error(); }
    }));
  }
});
async function trim(c) { const keys = await c.keys(); if (keys.length > 250) for (const k of keys.slice(0, keys.length - 250)) await c.delete(k); }
