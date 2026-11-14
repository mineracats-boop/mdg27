// MDG 27: lo justo para poder instalarlo como app; todo se sigue bajando de la red
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
