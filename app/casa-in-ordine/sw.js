// Casa in Ordine: funziona anche senza rete. Cambia VERSIONE a ogni aggiornamento.
const VERSIONE = 'cio2-v2';
const FILE = ['./', 'index.html', 'manifest.webmanifest', 'icona.svg', 'icona-192.png', 'icona-512.png',
  '../../assets/fonts/barlow-latin-400-normal.woff2', '../../assets/fonts/barlow-latin-500-normal.woff2',
  '../../assets/fonts/barlow-latin-600-normal.woff2', '../../assets/fonts/barlow-condensed-latin-500-normal.woff2',
  '../../assets/fonts/barlow-condensed-latin-600-normal.woff2', '../../assets/fonts/ibm-plex-mono-latin-500-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSIONE && n.startsWith('cio')).map(n => caches.delete(n))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // pagina: prima la rete (per gli aggiornamenti), poi la copia salvata
  // manifest (nome e icona dell'app): sempre dalla rete, così un cambio di nome arriva subito
  if (new URL(e.request.url).pathname.endsWith('manifest.webmanifest')) {
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSIONE).then(x => x.put('manifest.webmanifest', c)); } return r; }).catch(() => caches.match('manifest.webmanifest')));
    return;
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { if (r.ok && !r.redirected) { const c = r.clone(); caches.open(VERSIONE).then(x => x.put('index.html', c)); } return r; }).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
