import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../products/product.entity';
import { Category } from '../../categories/category.entity';
import { Seller } from '../../sellers/seller.entity';
import { ImageService } from '../../bot/image.service';
import { SupplierApiKeyGuard } from './supplier-api-key.guard';
import { SuppliersIngestController } from './suppliers-ingest.controller';
import { SuppliersIngestService } from './suppliers-ingest.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Seller])],
  controllers: [SuppliersIngestController],
  providers: [SuppliersIngestService, SupplierApiKeyGuard, ImageService],
})
export class SuppliersModule {}
