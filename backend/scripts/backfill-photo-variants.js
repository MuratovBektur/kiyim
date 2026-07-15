#!/usr/bin/env node
// Regenerates -card/-gallery/-thumb variants for every already-uploaded
// product photo master. Pure Node + sharp — no Nest/TypeORM bootstrap,
// no DB access, just walks the uploads folder on disk. Idempotent: safe
// to re-run any number of times, always overwrites.
//
// Run via `npm run backfill:photos` (sets cwd to this package's root,
// which is what the process.cwd() resolution below relies on) — not
// `node scripts/backfill-photo-variants.js` from some other directory.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// process.cwd(), not __dirname: in the Docker image WORKDIR is the backend
// package root and uploads/ is volume-mounted directly into it, so cwd is
// the reliable anchor — an __dirname-relative path can silently resolve
// to the wrong place depending on where this script physically sits.
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

const CARD_SIZE = { width: 330, height: 440 };
const GALLERY_SIZE = { width: 660, height: 880 };
const THUMB_SIZE = { width: 90, height: 120 };

const VARIANT_SUFFIX_RE = /-(card|gallery|thumb)\.webp$/;

async function cropVariant(buffer, dest, size) {
  await sharp(buffer)
    .resize(size.width, size.height, { fit: 'cover', position: 'top' })
    .webp({ quality: 82, effort: 6 })
    .toFile(dest);
}

function isMasterFile(fileName) {
  return fileName.endsWith('.webp') && !VARIANT_SUFFIX_RE.test(fileName);
}

async function processProductDir(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const masters = entries.filter((e) => e.isFile() && isMasterFile(e.name)).map((e) => e.name);

  let count = 0;
  for (const fileName of masters) {
    const slot = fileName.slice(0, -'.webp'.length);
    const masterPath = path.join(dir, fileName);
    const buffer = await fs.promises.readFile(masterPath);

    await cropVariant(buffer, path.join(dir, `${slot}-card.webp`), CARD_SIZE);
    await cropVariant(buffer, path.join(dir, `${slot}-gallery.webp`), GALLERY_SIZE);
    await cropVariant(buffer, path.join(dir, `${slot}-thumb.webp`), THUMB_SIZE);
    count += 1;
  }
  return count;
}

async function main() {
  const productsRoot = path.join(UPLOADS_ROOT, 'products');
  console.log(`Uploads root: ${UPLOADS_ROOT}`);

  if (!fs.existsSync(productsRoot)) {
    console.log(`No products directory at ${productsRoot} — nothing to backfill.`);
    return;
  }

  const productDirs = (await fs.promises.readdir(productsRoot, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => path.join(productsRoot, e.name));

  let totalMasters = 0;
  for (const dir of productDirs) {
    totalMasters += await processProductDir(dir);
  }

  console.log(`Backfilled variants for ${totalMasters} master photo(s) across ${productDirs.length} product folder(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
