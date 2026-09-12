import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../products/product.entity';
import { Category } from '../../categories/category.entity';
import { Seller } from '../../sellers/seller.entity';
import { ImageService } from '../../bot/image.service';
import { MirJeansIngestController } from './mir-jeans-ingest.controller';
import { MirJeansIngestService } from './mir-jeans-ingest.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Seller])],
  controllers: [MirJeansIngestController],
  providers: [MirJeansIngestService, ImageService],
})
export class MirJeansModule {}
