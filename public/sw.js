const CACHE_NAME = "odontoflex-shell-v2";
const APP_SHELL = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

function putInCache(request, response) {
  if (response.ok) {
    const clone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
  }
  return response;
}

// Nenhum dado de avaliacao passa pelo service worker: tudo fica em memoria na pagina.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Paginas: rede primeiro, para sempre mostrar a versao mais nova do app.
  // O cache so entra em acao quando esta offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => putInCache(request, response))
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Demais arquivos (JS/CSS com hash no nome, icones, fontes): cache primeiro.
  event.respondWith(
    caches.match(request).then(
      (cached) => cached || fetch(request).then((response) => putInCache(request, response))
    )
  );
});
