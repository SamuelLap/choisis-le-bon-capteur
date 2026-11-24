// Service worker : l'application fonctionne sans Internet.
// Les pages et le code sont d'abord demandés au réseau (pour recevoir les mises à jour), sinon la copie en cache est utilisée.
const CACHE = 'capteurs-v1';
const FILES = [
  './',
  './index.html',
  './moteur.js',
  './branchement.js',
  './branchement-ui.js',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './fiches/fiche1.jpg',
  './fiches/fiche2.jpg',
  './fiches/fiche3.jpg',
  './fiches/fiche4.jpg',
  './fiches/fiche5.jpg',
  './fiches/fiche6.jpg',
  './fiches/fiche7.jpg',
  './fiches/fiche8.jpg',
  './fiches/fiche9.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    // Polices Google : copie en cache pour le mode hors ligne
    if (/fonts\.(googleapis|gstatic)\.com/.test(url.host))
      e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); return res; })));
    return;
  }
  if (req.mode === 'navigate' || /\.(html|js)$/.test(url.pathname) || url.pathname.endsWith('/')) {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
  })));
});
