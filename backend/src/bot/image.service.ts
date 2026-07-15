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
const PHOTO_WIDTH = 800;
const PHOTO_HEIGHT = 1000;

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

    const originalExt = extFromUrl(fileUrl);
    await writeFile(join(dir, `${slot}-original${originalExt}`), buffer);

    const webpBuffer = await sharp(buffer)
      .resize(PHOTO_WIDTH, PHOTO_HEIGHT, { fit: 'cover' })
      .webp({ quality: 82 })
      .toBuffer();
    const fileName = `${slot}.webp`;
    await writeFile(join(dir, fileName), webpBuffer);

    return `/uploads/products/${productId}/${fileName}`;
  }

  async deleteProductPhotos(productId: string): Promise<void> {
    await rm(join(UPLOADS_ROOT, 'products', productId), { recursive: true, force: true });
  }
}

function extFromUrl(fileUrl: string): string {
  const match = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.exec(fileUrl);
  return match ? `.${match[1].toLowerCase()}` : '.jpg';
}
