// Vecchio indirizzo /app/: questo service worker si toglie da solo e libera la vecchia copia offline.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => /^cio-v\d+$/.test(n)).map(n => caches.delete(n))))
    .then(() => self.registration.unregister()));
});
