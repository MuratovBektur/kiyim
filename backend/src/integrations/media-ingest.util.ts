import { ImageService } from '../bot/image.service';
import { isVideoPath } from './media-kind.util';

// Общая логика приёма медиа от внешних интеграций (mir-jeans, suppliers):
// фото ImageService скачивает и хранит копию у себя (ради -card/-gallery/
// -thumb вариантов), видео — не перекодируем и не храним, ссылка
// сохраняется как есть и отдаётся фронту напрямую (frontend/composables/
// useProducts.ts photoVariantUrl уже умеет отдавать внешние URL без
// попытки подставить вариант).
export async function storeOrLinkMedia(
  images: ImageService,
  url: string,
  productId: string,
  slot: string,
): Promise<string> {
  return isVideoPath(url) ? url : images.storePhoto(url, productId, slot);
}
