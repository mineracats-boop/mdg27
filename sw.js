// MDG 27: guarda en el móvil los archivos pesados para que la segunda vez cargue al momento.
// - Modelos 3D, imágenes y música: salen de la caché y en segundo plano se mira si hay versión nueva.
// - Código (three.js, motor, sprites): primero la red; si no hay conexión, la copia guardada.
// - La página principal no se toca: siempre la última.
const C = "mdg27-v1";
const DATOS = /\/(a|m3d|musica|street)\/|\/motor\/m3d\//;
const CODIGO = /\/motor\/(three\.js|motor2?\.js|meshopt\.js|mx_meta\.json)$|\/(three|sprites)\.js$/;
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== C) await caches.delete(k);
  await self.clients.claim();
})()));
const guarda = (c, r, res) => { if (res && res.status === 200) c.put(r, res.clone()).catch(() => {}); return res; };
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (DATOS.test(u.pathname)) e.respondWith((async () => {
    const c = await caches.open(C), hit = await c.match(r);
    if (!hit) return fetch(r).then(res => guarda(c, r, res));
    e.waitUntil((async () => { try {
      const h = { }; const et = hit.headers.get("etag"), lm = hit.headers.get("last-modified");
      if (et) h["if-none-match"] = et; else if (lm) h["if-modified-since"] = lm;
      const res = await fetch(r.url, { headers: h, cache: "no-store" });
      if (res.status === 200) await c.put(r, res);
    } catch (er) {} })());
    return hit;
  })());
  else if (CODIGO.test(u.pathname)) e.respondWith((async () => {
    const c = await caches.open(C);
    try { return guarda(c, r, await fetch(r)); } catch (er) { const hit = await c.match(r); if (hit) return hit; throw er; }
  })());
});
