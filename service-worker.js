/**
 * service-worker.js — Caché offline básica (PWA)
 *
 * Estrategia: cache-first para assets estáticos, network-first para navegación.
 * Si el usuario está offline, sirve el index.html cacheado.
 */
const CACHE = 'filacero-v1';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/main.css',
  './css/auth.css',
  './css/paciente.css',
  './js/config.js',
  './js/data/db.js',
  './js/auth/auth.js',
  './js/utils/utils.js',
  './js/paciente/solicitar.js',
  './js/paciente/mis-turnos.js',
  './pages/auth/login.html',
  './pages/auth/registro.html',
  './pages/auth/recuperar.html',
  './pages/paciente/inicio.html',
  './pages/paciente/solicitar.html',
  './pages/paciente/mis-turnos.html',
  './pages/paciente/perfil.html',
  './pages/paciente/avisos.html',
  './assets/images/logo.jpeg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Network-first para navegación
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first para el resto
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      if (res.status === 200) caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => cached))
  );
});