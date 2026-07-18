import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { Product } from '../products/product.entity';
import { BotAuthorizedUser } from '../bot/entities/bot-authorized-user.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Product, BotAuthorizedUser])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
