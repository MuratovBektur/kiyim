import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller } from './seller.entity';

@Injectable()
export class SellersService {
  constructor(@InjectRepository(Seller) private readonly sellerRepo: Repository<Seller>) {}

  findAll() {
    return this.sellerRepo.find({ order: { name: 'ASC' } });
  }
}
