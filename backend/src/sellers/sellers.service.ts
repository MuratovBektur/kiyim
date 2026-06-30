import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.seller.findMany({ orderBy: { name: 'asc' } });
  }
}
