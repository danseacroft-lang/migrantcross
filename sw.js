/* Channel Crossings offline mode.
   Pages and figures: fetched fresh from the network first, with the saved copy
   used only when there is no connection. Icons and other fixed files: served
   from the saved copy straight away and refreshed in the background.
   Weather requests go straight to Open-Meteo and are never saved. */
const CACHE = "cc-v12";
const CORE = [
  "./", "index.html", "how-it-works.html", "privacy.html",
  "favicon.svg", "manifest.webmanifest", "icon-192.png", "apple-touch-icon.png",
  "vendor/leaflet/leaflet.js", "vendor/leaflet/leaflet.css"
];

self.addEventListener("install", event => {
  // One missing file must not stop the rest being saved
  event.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(url => c.add(url)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function networkFirst(request) {
  return fetch(request, {cache: "no-cache"}).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(c => c.put(request, copy));
    }
    return response;
  }).catch(() => caches.match(request, {ignoreSearch: true})
    .then(hit => hit || (request.mode === "navigate" ? caches.match("index.html") : Response.error())));
}

function staleWhileRevalidate(request) {
  return caches.match(request).then(hit => {
    const fresh = fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
      }
      return response;
    }).catch(() => hit);
    return hit || fresh;
  });
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;           // weather and other sites: not handled
  const fresh = request.mode === "navigate" || /\.(html|json|csv)$/.test(url.pathname) || url.pathname.endsWith("/");
  event.respondWith(fresh ? networkFirst(request) : staleWhileRevalidate(request));
});
