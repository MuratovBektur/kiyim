import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../products/product.entity';
import { Category } from '../../categories/category.entity';
import { Seller } from '../../sellers/seller.entity';
import { ImageService } from '../../bot/image.service';
import { storeOrLinkMedia } from '../media-ingest.util';
import { UpsertSupplierProductDto } from './dto/upsert-supplier-product.dto';

const DEFAULT_CURRENCY = 'сом';

@Injectable()
export class SuppliersIngestService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Seller) private readonly sellerRepo: Repository<Seller>,
    private readonly images: ImageService,
  ) {}

  // SupplierApiKeyGuard проверяет только сам ключ (см. config/suppliers-
  // clients.json) и передаёт дальше sellerSlug из файла — существует ли
  // такой продавец в БД, решает уже сервис (как resolveBrand в showroom
  // bot-products.controller.ts).
  private async resolveSeller(sellerSlug: string): Promise<Seller> {
    const seller = await this.sellerRepo.findOne({ where: { slug: sellerSlug } });
    if (!seller) {
      throw new NotFoundException(
        `Продавец со slug "${sellerSlug}" не найден — проверьте sellerSlug в config/suppliers-clients.json.`,
      );
    }
    return seller;
  }

  // externalSource = seller.slug — тот же уникальный индекс
  // (externalSource, externalId), что уже есть под интеграцию с mir-jeans,
  // естественным образом разделяет id разных поставщиков между собой без
  // отдельной схемы: slug продавца уникален сам по себе (Seller.slug).
  async upsert(sellerSlug: string, dto: UpsertSupplierProductDto): Promise<{ id: string; created: boolean }> {
    const seller = await this.resolveSeller(sellerSlug);
    const category = await this.categoryRepo.findOne({ where: { name: dto.category } });
    if (!category) {
      throw new BadRequestException(
        `Категория "${dto.category}" не найдена в каталоге kiyim — заведите такую же категорию или поправьте название на своей стороне.`,
      );
    }

    const existing = await this.productRepo.findOne({
      where: { externalSource: seller.slug, externalId: dto.externalId, sellerId: seller.id },
    });

    const fields = {
      title: dto.title,
      description: dto.description ?? null,
      price: dto.price.toFixed(2),
      currency: dto.currency ?? DEFAULT_CURRENCY,
      brand: dto.brand ?? null,
      originCountry: dto.originCountry ?? null,
      materials: dto.materials ?? [],
      colors: dto.colors ?? [],
      sizes: dto.sizes ?? [],
      inStock: dto.inStock ?? true,
      sellerUrl: dto.sellerUrl ?? null,
      isPublished: true,
      sellerId: seller.id,
      categoryId: category.id,
      externalSource: seller.slug,
      externalId: dto.externalId,
    };

    const product = existing
      ? Object.assign(existing, fields)
      : this.productRepo.create({ ...fields, photos: [], extraPhotos: [] });
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

  async remove(sellerSlug: string, externalId: string): Promise<boolean> {
    const seller = await this.resolveSeller(sellerSlug);
    const product = await this.productRepo.findOne({
      where: { externalSource: seller.slug, externalId },
    });
    if (!product) return false;
    // Избыточно раз externalSource = seller.slug уникален, но дёшево и
    // явно защищает от путаницы, если у продавца когда-нибудь сменится slug.
    if (product.sellerId !== seller.id) {
      throw new ForbiddenException('Товар принадлежит другому продавцу');
    }

    await this.images.deleteProductPhotos(product.id);
    await this.productRepo.remove(product);
    return true;
  }
}
