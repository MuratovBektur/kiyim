import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { FindProductsDto } from './find-products.dto';

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private readonly productRepo: Repository<Product>) {}

  async findAll(query: FindProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.seller', 'seller')
      .leftJoinAndSelect('product.category', 'category');

    if (query.search) {
      qb.andWhere('product.title ILIKE :search', { search: `%${query.search}%` });
    }
    if (query.categorySlug) {
      qb.andWhere('category.slug = :categorySlug', { categorySlug: query.categorySlug });
    }
    if (query.sellerSlug) {
      qb.andWhere('seller.slug = :sellerSlug', { sellerSlug: query.sellerSlug });
    }
    if (query.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    if (query.sort === 'price_asc') {
      qb.orderBy('product.price', 'ASC');
    } else if (query.sort === 'price_desc') {
      qb.orderBy('product.price', 'DESC');
    } else {
      qb.orderBy('product.createdAt', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: { seller: true, category: true },
    });
    if (!product) {
      throw new NotFoundException(`Товар с id "${id}" не найден`);
    }
    return product;
  }
}
