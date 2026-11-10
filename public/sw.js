/* Service worker de MiAgente.
 * - Página de "sin conexión" cuando falla una navegación.
 * - Notificaciones push de llamadas (las envía el programador desde la fase 6).
 * No cachea datos ni páginas de la app: la información personal no queda en caché.
 */
const CACHE = "miagente-v1";
const OFFLINE_URL = "/sin-conexion.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});

self.addEventListener("push", (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { cuerpo: event.data ? event.data.text() : "" };
  }
  const titulo = datos.titulo || "MiAgente";
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.cuerpo || "",
      icon: "/iconos/icono-192.png",
      badge: "/iconos/insignia-96.png",
      tag: datos.etiqueta || "miagente",
      renotify: true,
      requireInteraction: Boolean(datos.persistente),
      data: { url: datos.url || "/hoy" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL(event.notification.data?.url || "/hoy", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      for (const ventana of ventanas) {
        if ("focus" in ventana) {
          ventana.navigate(destino).catch(() => {});
          return ventana.focus();
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
