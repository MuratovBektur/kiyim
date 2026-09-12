import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../products/product.entity';
import { Category } from '../../categories/category.entity';
import { Seller } from '../../sellers/seller.entity';
import { ImageService } from '../../bot/image.service';
import { storeOrLinkMedia } from '../media-ingest.util';
import { UpsertMirJeansProductDto } from './dto/upsert-mir-jeans-product.dto';

const SOURCE = 'mir-jeans';
const SELLER_SLUG = 'mir-jeans';
const SELLER_NAME = 'Мир Джинс';
const CURRENCY = 'сом';

@Injectable()
export class MirJeansIngestService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Seller) private readonly sellerRepo: Repository<Seller>,
    private readonly images: ImageService,
  ) {}

  async upsert(dto: UpsertMirJeansProductDto): Promise<{ id: string; created: boolean }> {
    const category = await this.categoryRepo.findOne({ where: { name: dto.category } });
    if (!category) {
      throw new BadRequestException(
        `Категория "${dto.category}" не найдена в каталоге kiyim — заведите такую же категорию или поправьте название на стороне "Мир Джинс".`,
      );
    }
    const seller = await this.findOrCreateSeller();

    const existing = await this.productRepo.findOne({
      where: { externalSource: SOURCE, externalId: dto.externalId },
    });

    const fields = {
      title: [dto.type, dto.brand].filter(Boolean).join(' ') || category.name,
      description: buildDescription(dto),
      price: parsePrice(dto.price),
      currency: CURRENCY,
      subtype: dto.type,
      brand: dto.brand ?? null,
      originCountry: dto.country,
      materials: dto.materials,
      colors: dto.colors,
      sizes: dto.sizes,
      inStock: true,
      isPublished: true,
      sellerId: seller.id,
      categoryId: category.id,
      externalSource: SOURCE,
      externalId: dto.externalId,
    };

    const product = existing
      ? Object.assign(existing, fields)
      : this.productRepo.create({ ...fields, photos: [], extraPhotos: [], sellerUrl: null });
    const saved = await this.productRepo.save(product);

    const [mainUrl, ...extraUrls] = [dto.photos[0], ...(dto.extraPhotos ?? [])];
    const mainPhoto = await storeOrLinkMedia(this.images, mainUrl, saved.id, 'main');
    const extraPhotos: string[] = [];
    for (let i = 0; i < extraUrls.length; i += 1) {
      extraPhotos.push(await storeOrLinkMedia(this.images, extraUrls[i], saved.id, `extra-${i}`));
    }

    saved.photos = [mainPhoto];
    saved.extraPhotos = extraPhotos;
    await this.productRepo.save(saved);

    return { id: saved.id, created: !existing };
  }

  async remove(externalId: string): Promise<boolean> {
    const product = await this.productRepo.findOne({ where: { externalSource: SOURCE, externalId } });
    if (!product) return false;
    await this.images.deleteProductPhotos(product.id);
    await this.productRepo.remove(product);
    return true;
  }

  private async findOrCreateSeller(): Promise<Seller> {
    const existing = await this.sellerRepo.findOne({ where: { slug: SELLER_SLUG } });
    if (existing) return existing;
    return this.sellerRepo.save(this.sellerRepo.create({ name: SELLER_NAME, slug: SELLER_SLUG }));
  }
}

// "Мир Джинс" хранит цену как "<цифры> сом" (валюта у них всегда сом,
// совпадает с дефолтом kiyim) — берём числовую часть, отбрасываем остальное.
function parsePrice(raw: string): string {
  const match = /^(\d+(?:[.,]\d+)?)/.exec(raw.trim());
  if (!match) {
    throw new BadRequestException(`Не удалось разобрать цену "${raw}" — ожидалась строка вида "15000" или "15000 сом".`);
  }
  return match[1].replace(',', '.');
}

// У kiyim нет отдельного поля "пол" (в отличие от "Мир Джинс") — заводить
// его ради одной интеграции избыточно для остального каталога, поэтому
// значение не теряется, а дописывается первой строкой в описание.
function buildDescription(dto: UpsertMirJeansProductDto): string | null {
  const genderLine = dto.gender ? `Пол: ${dto.gender}` : null;
  const parts = [genderLine, dto.description].filter((v): v is string => Boolean(v && v.trim()));
  return parts.length ? parts.join('\n\n') : null;
}
