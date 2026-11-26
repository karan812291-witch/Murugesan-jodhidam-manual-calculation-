const MJ_CACHE_NAME = "murugesan-jodhidam-v26-19";
self.addEventListener("install", function(event) {
  self.skipWaiting();
});
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== MJ_CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;
  const url = event.request.url || "";
  if (url.includes("firestore.googleapis.com") || url.includes("generativelanguage.googleapis.com") || url.includes("emailjs.com")) return;
  event.respondWith(
    fetch(event.request).then(function(resp) {
      if (resp && resp.status === 200 && resp.type === "basic") {
        const clone = resp.clone();
        caches.open(MJ_CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
      }
      return resp;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});
