const CACHE = 'tal-trainer-v1';
const ASSETS = [
  './', './index.html', './app.js', './data.js',
  './manifest.json', './icon.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.13.4/chess.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE)
      .map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request)
    .then(r => r || fetch(e.request)));
});
