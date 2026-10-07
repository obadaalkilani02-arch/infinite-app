// Builds the web bundle used by every platform (PWA, Android/Capacitor, Windows/Electron).
//   node tools/build-web.js      -> dist/web/
// The app itself stays one self-contained HTML file; this only adds the PWA wrapper files.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'web');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8').replace(/^﻿/, ''));
const VERSION = pkg.version;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true });

let html = fs.readFileSync(path.join(ROOT, 'src', 'SmartEngineering_App.html'), 'utf8');
const head = `<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#060a12">
<meta name="mobile-web-app-capable" content="yes">
<link rel="icon" type="image/png" href="icons/favicon-64.png">
<link rel="apple-touch-icon" href="icons/icon-192.png">`;
const reg = `<script>
/* offline cache — only on http(s); Capacitor/Electron load the files directly */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && location.hostname !== 'localhost') {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}
</script>`;
if (!html.includes('</head>') || !html.includes('</body>')) throw new Error('unexpected html shape');
html = html.replace('</head>', head + '\n</head>').replace('</body>', reg + '\n</body>');
fs.writeFileSync(path.join(OUT, 'index.html'), html);

fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
  name: '+Infinite — Engineering Calculators',
  short_name: '+Infinite',
  description: 'Plumbing, HVAC and fire-fighting engineering calculators (Arabic / English)',
  start_url: './index.html',
  scope: './',
  display: 'standalone',
  orientation: 'any',
  background_color: '#060a12',
  theme_color: '#060a12',
  lang: 'ar',
  dir: 'auto',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

fs.writeFileSync(path.join(OUT, 'sw.js'), `/* +Infinite service worker — cache-first, versioned */
const CACHE = 'infinite-${VERSION}';
const FILES = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/favicon-64.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match('./index.html'))));
});
`);

for (const f of ['icon-192.png', 'icon-512.png', 'icon-maskable-192.png', 'icon-maskable-512.png', 'favicon-64.png']) {
  fs.copyFileSync(path.join(ROOT, 'platform', 'icons', f), path.join(OUT, 'icons', f));
}
console.log('web bundle', VERSION, '->', OUT, '(' + Math.round(html.length / 1024) + ' KB html)');
