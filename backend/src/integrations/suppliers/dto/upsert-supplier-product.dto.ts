import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';

// В отличие от UpsertMirJeansProductDto (своя таксономия — category/type/
// gender/country), это общая форма для любого поставщика, подключённого
// через SupplierApiKeyGuard: один формат на всех, различаются только
// значениями полей. category сопоставляется с Category.name напрямую, как
// и у mir-jeans.
export class UpsertSupplierProductDto {
  @IsString()
  @MinLength(1)
  externalId: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsOptional()
  @IsString()
  brand?: string | null;

  @IsOptional()
  @IsString()
  originCountry?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @IsOptional()
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @IsUrl()
  sellerUrl?: string | null;

  // Абсолютные URL — фото kiyim скачивает и хранит копию у себя, видео —
  // не перекодируем, ссылка сохраняется как есть (см. media-ingest.util.ts).
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  photos: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extraPhotos?: string[];
}
