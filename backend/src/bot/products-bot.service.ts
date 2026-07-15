import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Category } from '../categories/category.entity';
import { slugify } from './config/translit';

export interface ProductDraft {
  categoryId: string;
  subtype: string;
  brand: string;
  originCountry: string;
  price: string;
  currency: string;
  materials: string[];
  colors: string[];
  sizes: string[];
  photos: string[];
  extraPhotos: string[];
  description?: string | null;
}

@Injectable()
export class ProductsBotService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
  ) {}

  categories(): Promise<Category[]> {
    return this.categoryRepo.find({ order: { name: 'ASC' } });
  }

  async findOrCreateCategory(name: string): Promise<Category> {
    const slug = slugify(name);
    const existing = await this.categoryRepo.findOne({ where: { slug } });
    if (existing) return existing;
    return this.categoryRepo.save(this.categoryRepo.create({ name, slug }));
  }

  async create(sellerId: string, draft: ProductDraft): Promise<Product> {
    const category = await this.categoryRepo.findOneOrFail({ where: { id: draft.categoryId } });
    const title = [draft.subtype, draft.brand].filter(Boolean).join(' ') || category.name;

    const product = this.productRepo.create({
      title,
      description: draft.description ?? null,
      price: draft.price,
      currency: draft.currency,
      photos: draft.photos,
      extraPhotos: draft.extraPhotos,
      subtype: draft.subtype,
      brand: draft.brand,
      originCountry: draft.originCountry,
      materials: draft.materials,
      sizes: draft.sizes,
      colors: draft.colors,
      inStock: true,
      sellerUrl: null,
      isPublished: false,
      sellerId,
      categoryId: draft.categoryId,
    });
    return this.productRepo.save(product);
  }

  async findForSeller(sellerId: string, id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, sellerId },
      relations: { category: true, seller: true },
    });
    if (!product) {
      throw new NotFoundException('Товар не найден');
    }
    return product;
  }

  async listForSeller(sellerId: string, offset: number): Promise<{ product: Product | null; total: number }> {
    const [items, total] = await this.productRepo.findAndCount({
      where: { sellerId },
      order: { createdAt: 'DESC' },
      skip: Math.max(offset, 0),
      take: 1,
      relations: { category: true },
    });
    return { product: items[0] ?? null, total };
  }

  async update(sellerId: string, id: string, patch: Partial<Product>): Promise<Product> {
    const product = await this.findForSeller(sellerId, id);
    Object.assign(product, patch);
    return this.productRepo.save(product);
  }

  async delete(sellerId: string, id: string): Promise<void> {
    const product = await this.findForSeller(sellerId, id);
    await this.productRepo.remove(product);
  }
}
