// Offline rad: sve se kešira pri instalaciji.
const CACHE = "mojplan-v4";
const FILES = [
  "./",
  "./index.html",
  "./css/app.css",
  "./js/version.js",
  "./js/data.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./img/ex/ab_rollout-0.jpg",
  "./img/ex/ab_rollout-1.jpg",
  "./img/ex/arnold-0.jpg",
  "./img/ex/arnold-1.jpg",
  "./img/ex/bench-0.jpg",
  "./img/ex/bench-1.jpg",
  "./img/ex/bicycle-0.jpg",
  "./img/ex/bicycle-1.jpg",
  "./img/ex/calf-0.jpg",
  "./img/ex/calf-1.jpg",
  "./img/ex/chest_row-0.jpg",
  "./img/ex/chest_row-1.jpg",
  "./img/ex/curl-0.jpg",
  "./img/ex/curl-1.jpg",
  "./img/ex/deadlift-0.jpg",
  "./img/ex/deadlift-1.jpg",
  "./img/ex/dips-0.jpg",
  "./img/ex/dips-1.jpg",
  "./img/ex/facepull-0.jpg",
  "./img/ex/facepull-1.jpg",
  "./img/ex/fly-0.jpg",
  "./img/ex/fly-1.jpg",
  "./img/ex/front_squat-0.jpg",
  "./img/ex/front_squat-1.jpg",
  "./img/ex/goblet-0.jpg",
  "./img/ex/goblet-1.jpg",
  "./img/ex/hack-0.jpg",
  "./img/ex/hack-1.jpg",
  "./img/ex/hammer-0.jpg",
  "./img/ex/hammer-1.jpg",
  "./img/ex/hiit-0.jpg",
  "./img/ex/hiit-1.jpg",
  "./img/ex/hipthrust-0.jpg",
  "./img/ex/hipthrust-1.jpg",
  "./img/ex/hlr-0.jpg",
  "./img/ex/hlr-1.jpg",
  "./img/ex/incline_bench-0.jpg",
  "./img/ex/incline_bench-1.jpg",
  "./img/ex/incline_db-0.jpg",
  "./img/ex/incline_db-1.jpg",
  "./img/ex/incline_machine-0.jpg",
  "./img/ex/incline_machine-1.jpg",
  "./img/ex/lateral-0.jpg",
  "./img/ex/lateral-1.jpg",
  "./img/ex/legcurl-0.jpg",
  "./img/ex/legcurl-1.jpg",
  "./img/ex/legext-0.jpg",
  "./img/ex/legext-1.jpg",
  "./img/ex/legpress-0.jpg",
  "./img/ex/legpress-1.jpg",
  "./img/ex/oh_tri-0.jpg",
  "./img/ex/oh_tri-1.jpg",
  "./img/ex/ohp-0.jpg",
  "./img/ex/ohp-1.jpg",
  "./img/ex/plank-0.jpg",
  "./img/ex/plank-1.jpg",
  "./img/ex/pulldown-0.jpg",
  "./img/ex/pulldown-1.jpg",
  "./img/ex/pullup-0.jpg",
  "./img/ex/pullup-1.jpg",
  "./img/ex/pushdown-0.jpg",
  "./img/ex/pushdown-1.jpg",
  "./img/ex/rdl-0.jpg",
  "./img/ex/rdl-1.jpg",
  "./img/ex/reverse_crunch-0.jpg",
  "./img/ex/reverse_crunch-1.jpg",
  "./img/ex/row-0.jpg",
  "./img/ex/row-1.jpg",
  "./img/ex/russian-0.jpg",
  "./img/ex/russian-1.jpg",
  "./img/ex/shrug-0.jpg",
  "./img/ex/shrug-1.jpg",
  "./img/ex/squat-0.jpg",
  "./img/ex/squat-1.jpg",
  "./img/ex/sumo-0.jpg",
  "./img/ex/sumo-1.jpg",
  "./img/ex/tbar-0.jpg",
  "./img/ex/tbar-1.jpg",
  "./img/ex/upright-0.jpg",
  "./img/ex/upright-1.jpg",
  "./img/ex/zone2-0.jpg",
  "./img/ex/zone2-1.jpg",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Prvo mreža za kod (da stignu nove verzije), keš kao rezerva; slike iz keša.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.includes("/img/")) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
    return;
  }
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./index.html")))
  );
});
