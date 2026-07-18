import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';

@Injectable()
export class OrdersBotService {
  constructor(@InjectRepository(Order) private readonly orderRepo: Repository<Order>) {}

  async listForSeller(sellerId: string, offset: number): Promise<{ order: Order | null; total: number }> {
    const [items, total] = await this.orderRepo.findAndCount({
      where: { sellerId },
      order: { createdAt: 'DESC' },
      skip: Math.max(offset, 0),
      take: 1,
    });
    return { order: items[0] ?? null, total };
  }
}
