import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seller } from './seller.entity';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Seller])],
  controllers: [SellersController],
  providers: [SellersService],
})
export class SellersModule {}
