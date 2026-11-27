const MJ_CACHE_NAME = "murugesan-jodhidam-v26-41";
const MJ_PRECACHE_URLS = [
  "./",
  "./index.html",
  "./master.html",
  "./manifest.json",
  "./manifest-master.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-round-192.png",
  "./icon-round-512.png",
  "./screenshot-mobile.png",
  "./screenshot-wide.png"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(MJ_CACHE_NAME).then(function(cache) {
      return Promise.all(
        MJ_PRECACHE_URLS.map(function(u) {
          return cache.add(u).catch(function() {});
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== MJ_CACHE_NAME; }).map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;
  const url = event.request.url || "";
  if (url.includes("firestore.googleapis.com") || url.includes("generativelanguage.googleapis.com") || url.includes("emailjs.com")) return;

  // Stale-While-Revalidate: Instant open from cache + silent background update
  event.respondWith(
    caches.open(MJ_CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function(cached) {
        const networkPromise = fetch(event.request).then(function(resp) {
          if (resp && resp.status === 200 && (resp.type === "basic" || resp.type === "cors")) {
            cache.put(event.request, resp.clone()).catch(function() {});
          }
          return resp;
        }).catch(function() {
          return cached || caches.match("./index.html");
        });
        return cached || networkPromise;
      });
    })
  );
});

self.addEventListener("sync", function(event) {
  if (event.tag === "mj-bg-sync") {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener("periodicsync", function(event) {
  if (event.tag === "mj-panchangam-refresh") {
    event.waitUntil(
      caches.open(MJ_CACHE_NAME).then(function(cache) {
        return cache.add("./manifest.json").catch(function() {});
      })
    );
  }
});

self.addEventListener("push", function(event) {
  let payload = { title: "முருகேசன் ஜோதிடம்", body: "புதிய தகவல் உள்ளது" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload.title = parsed.title || payload.title;
      payload.body = parsed.body || payload.body;
    }
  } catch (e) {
    if (event.data) payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "./icon-192.png",
      badge: "./icon-192.png"
    })
  );
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) return clientList[0].focus();
      return self.clients.openWindow("./index.html");
    })
  );
});
