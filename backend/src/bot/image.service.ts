import { Injectable } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
// A default `import` resolves to `.default` at runtime under this tsconfig
// (no esModuleInterop), which sharp's CJS build doesn't set — and its own
// type declarations resolve to a non-callable ESM (.d.mts) shape under
// classic module resolution regardless, so a typed import doesn't line up
// either way. Untyped require() sidesteps both problems.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

const UPLOADS_ROOT = join(__dirname, '..', '..', 'uploads');

// Fixed crop targets per real measured display size (getBoundingClientRect
// at steady desktop width) — see PHOTO_VARIANTS.md-equivalent commit notes.
// All 3:4 to match how photos are actually framed across the site.
export const CARD_SIZE = { width: 330, height: 440 };
export const GALLERY_SIZE = { width: 660, height: 880 };
export const THUMB_SIZE = { width: 90, height: 120 };

@Injectable()
export class ImageService {
  async storePhoto(fileUrl: string, productId: string, slot: string): Promise<string> {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Не удалось скачать фото из Telegram (HTTP ${response.status})`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    const dir = join(UPLOADS_ROOT, 'products', productId);
    await mkdir(dir, { recursive: true });

    await writeRawArchive(buffer, dir, slot, extFromUrl(fileUrl));
    await writeVariants(buffer, dir, slot);

    return `/uploads/products/${productId}/${slot}.webp`;
  }

  async deleteProductPhotos(productId: string): Promise<void> {
    await rm(join(UPLOADS_ROOT, 'products', productId), { recursive: true, force: true });
  }
}

async function writeRawArchive(buffer: Buffer, dir: string, slot: string, ext: string): Promise<void> {
  await writeFile(join(dir, `${slot}-raw${ext}`), buffer);
}

async function writeVariants(buffer: Buffer, dir: string, slot: string): Promise<void> {
  // Master — same resolution as the source, just re-encoded to webp. This
  // is the path stored in the DB; -card/-gallery/-thumb are derived from it
  // by filename convention on the frontend, never referenced server-side.
  await sharp(buffer).webp({ quality: 80 }).toFile(join(dir, `${slot}.webp`));

  await cropVariant(buffer, join(dir, `${slot}-card.webp`), CARD_SIZE);
  await cropVariant(buffer, join(dir, `${slot}-gallery.webp`), GALLERY_SIZE);
  await cropVariant(buffer, join(dir, `${slot}-thumb.webp`), THUMB_SIZE);
}

async function cropVariant(buffer: Buffer, dest: string, size: { width: number; height: number }): Promise<void> {
  // fit:'cover' crops to the exact target size (no letterboxing); position
  // 'top' anchors the crop at the top, which suits clothing/people photos
  // better than a center crop. withoutEnlargement is deliberately NOT used
  // here — combined with fit:'cover' it can leave the output short of the
  // target height when the source is already at/above the target width,
  // producing a wrong aspect ratio instead of the exact one requested.
  await sharp(buffer)
    .resize(size.width, size.height, { fit: 'cover', position: 'top' })
    .webp({ quality: 82, effort: 6 })
    .toFile(dest);
}

function extFromUrl(fileUrl: string): string {
  const match = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.exec(fileUrl);
  return match ? `.${match[1].toLowerCase()}` : '.jpg';
}
