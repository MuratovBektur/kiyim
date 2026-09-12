import { ArrayMinSize, IsArray, IsOptional, IsString, MinLength } from 'class-validator';

// Форма payload'а, который присылает сервис "Мир Джинс" при публикации
// товара (см. server/src/modules/integrations/kiyim-sync.service.ts в том
// проекте). Их таксономия категорий/типов один в один совпадает со
// строками CATEGORIES/SUBTYPES_BY_CATEGORY_SLUG из bot/config/product-taxonomy.ts
// (общее происхождение — оба каталога начинались с одной и той же
// таксономии), поэтому category сопоставляется с Category.name напрямую, а
// type становится Product.subtype как есть, без отдельного маппинга.
export class UpsertMirJeansProductDto {
  @IsString()
  @MinLength(1)
  externalId: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsString()
  @MinLength(1)
  type: string;

  // Модели с гендерной привязкой (Пол в "Мир Джинс") у kiyim нет отдельного
  // поля — добавлять его ради одной интеграции было бы избыточно для
  // остального каталога. Значение не теряется: сервис дописывает его первой
  // строкой в description.
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  brand?: string | null;

  @IsString()
  @MinLength(1)
  country: string;

  // Свободная строка вида "15000" или "15000 сом" — числовая часть
  // извлекается в сервисе, валюта у kiyim всегда "сом" (совпадает с
  // "Мир Джинс").
  @IsString()
  @MinLength(1)
  price: string;

  @IsArray()
  materials: string[];

  @IsArray()
  colors: string[];

  @IsArray()
  sizes: string[];

  @IsOptional()
  @IsString()
  description?: string | null;

  // Абсолютные URL — "Мир Джинс" отдаёт их через свой PUBLIC_BASE_URL. Фото
  // kiyim скачивает и хранит копию у себя, ровно как ImageService делает
  // для фото, присланных через Telegram-бота; видео — не перекодируем, URL
  // сохраняется как есть и отдаётся фронту напрямую (см. MirJeansIngestService).
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  photos: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extraPhotos?: string[];
}
