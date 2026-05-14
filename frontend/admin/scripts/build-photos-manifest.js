// Scans shop's public photos folder and writes a manifest into admin's public
// dir. Admin loads `/photos-manifest.json` at runtime to know which photos exist.
const fs = require('fs');
const path = require('path');

const SHOP_PHOTOS_DIR = path.join(__dirname, '../../shop/public/photos');
const OUT_DIR  = path.join(__dirname, '../public');
const OUT_FILE = path.join(OUT_DIR, 'photos-manifest.json');

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

let files = [];
try {
  files = fs.readdirSync(SHOP_PHOTOS_DIR, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((name) => ALLOWED_EXT.has(('.' + name.split('.').pop()).toLowerCase()))
    .sort();
} catch (err) {
  console.warn(`[photos-manifest] could not read ${SHOP_PHOTOS_DIR}: ${err.message}`);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  photos: files.map((filename) => ({ filename, url: `/photos/${filename}` })),
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));
console.log(`[photos-manifest] wrote ${files.length} entries to ${OUT_FILE}`);
