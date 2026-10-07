// Generates the app icons (PWA, Android, Windows) from the ∞ mark used by the splash screen.
//   node tools/make-icons.js      -> platform/icons/*.png
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'platform', 'icons');
fs.mkdirSync(OUT, { recursive: true });

const PATH = 'M200,100 C232,48 330,36 346,100 C330,164 232,152 200,100 C168,48 70,36 54,100 C70,164 168,152 200,100 Z';

// scale = how much of the canvas the mark may use (maskable / adaptive icons need a safe zone)
function svg({ size, scale, background }) {
  const k = scale * size / 300;                       // mark spans ~292 units of the 400x200 viewBox
  const tx = (size - 400 * k) / 2, ty = (size - 200 * k) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="46%" r="75%"><stop offset="0" stop-color="#14233d"/><stop offset="1" stop-color="#060a12"/></radialGradient>
    <linearGradient id="plat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#bcd7f2"/><stop offset="1" stop-color="#8ea6bf"/></linearGradient>
    <filter id="glow" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${(7 * k).toFixed(2)}"/></filter>
  </defs>
  ${background ? `<rect width="${size}" height="${size}" fill="url(#bg)"/>` : ''}
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(4)})" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="${PATH}" stroke="#7cc4ff" stroke-width="22" opacity=".75" filter="url(#glow)"/>
    <path d="${PATH}" stroke="url(#plat)" stroke-width="17"/>
    <path d="${PATH}" stroke="#060a12" stroke-width="9"/>
  </g>
</svg>`;
}

async function png(name, opts, size) {
  await sharp(Buffer.from(svg({ size, ...opts }))).png().toFile(path.join(OUT, name));
  console.log('icon', name);
}

(async () => {
  await png('icon-512.png', { scale: 0.86, background: true }, 512);
  await png('icon-192.png', { scale: 0.86, background: true }, 192);
  await png('icon-maskable-512.png', { scale: 0.62, background: true }, 512);   // safe zone for adaptive masks
  await png('icon-maskable-192.png', { scale: 0.62, background: true }, 192);
  await png('android-foreground-432.png', { scale: 0.5, background: false }, 432); // adaptive foreground (108dp @4x)
  await png('icon-1024.png', { scale: 0.86, background: true }, 1024);            // store listing / source for .ico
  await png('favicon-64.png', { scale: 0.9, background: true }, 64);
  fs.writeFileSync(path.join(OUT, 'icon.svg'), svg({ size: 512, scale: 0.86, background: true }));
})();
