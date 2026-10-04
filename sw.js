/* Channel Crossings offline mode.
   Pages and figures: fetched fresh from the network first, with the saved copy
   used when there is no connection or the network is very slow (the page then
   looks for newer figures by itself a minute later). Icons and other fixed files: served
   from the saved copy straight away and refreshed in the background.
   Weather requests go straight to Open-Meteo and are never saved. */
const CACHE = "cc-v18";
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

function networkFirst(event) {
  const request = event.request, nav = request.mode === "navigate";
  const saved = () => caches.match(request, {ignoreSearch: true}).then(hit => hit || (nav ? caches.match("index.html") : undefined));
  const got = fetch(request, {cache: "no-cache"}).then(response => ({response, copy: response.ok ? response.clone() : null}));
  event.waitUntil(got.then(g => g.copy && caches.open(CACHE).then(c => c.put(request, g.copy))).catch(() => {}));   // saved even if the old copy was shown first
  const net = got.then(g => g.response);
  // a slow network: after a few seconds the saved copy is shown instead, if there is one
  const slow = new Promise(resolve => setTimeout(() => saved().then(hit => hit && resolve(hit)), nav ? 3500 : 4000));
  return Promise.race([net, slow]).catch(() => saved().then(hit => hit || Response.error()));
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
  event.respondWith(fresh ? networkFirst(event) : staleWhileRevalidate(request));
});
