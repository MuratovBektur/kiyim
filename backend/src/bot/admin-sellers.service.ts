import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from '../sellers/seller.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class AdminSellersService {
  constructor(
    @InjectRepository(Seller) private readonly sellerRepo: Repository<Seller>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  async list(offset: number): Promise<{ seller: Seller | null; total: number }> {
    const [items, total] = await this.sellerRepo.findAndCount({
      order: { name: 'ASC' },
      skip: Math.max(offset, 0),
      take: 1,
    });
    return { seller: items[0] ?? null, total };
  }

  productCount(sellerId: string): Promise<number> {
    return this.productRepo.count({ where: { sellerId } });
  }

  /** Removes the seller and its catalog. Allowed phones / bot users cascade at the DB level. */
  async deleteSeller(sellerId: string): Promise<void> {
    await this.sellerRepo.manager.transaction(async (manager) => {
      await manager.delete(Product, { sellerId });
      await manager.delete(Seller, { id: sellerId });
    });
  }
}
