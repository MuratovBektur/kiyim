import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TypeOrmModule } from '@nestjs/typeorm';
import { session } from 'telegraf';
import { Product } from '../products/product.entity';
import { Category } from '../categories/category.entity';
import { Seller } from '../sellers/seller.entity';
import { Order } from '../orders/order.entity';
import { BotAllowedPhone } from './entities/bot-allowed-phone.entity';
import { BotAuthorizedUser } from './entities/bot-authorized-user.entity';
import { BotCustomPreset } from './entities/bot-custom-preset.entity';
import { BotAuthService } from './auth/bot-auth.service';
import { BotPresetsService } from './bot-presets.service';
import { ImageService } from './image.service';
import { ProductsBotService } from './products-bot.service';
import { OrdersBotService } from './orders-bot.service';
import { AdminSellersService } from './admin-sellers.service';
import { TelegramPublishService } from './telegram-publish.service';
import { AddProductScene } from './scenes/add-product.wizard';
import { EditProductScene } from './scenes/edit-product.scene';
import { BotUpdate } from './bot.update';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      useFactory: () => ({
        token: process.env.TELEGRAM_BOT_TOKEN ?? '',
        middlewares: [session()],
      }),
    }),
    TypeOrmModule.forFeature([Product, Category, Seller, Order, BotAllowedPhone, BotAuthorizedUser, BotCustomPreset]),
  ],
  providers: [
    BotAuthService,
    BotPresetsService,
    ImageService,
    ProductsBotService,
    OrdersBotService,
    AdminSellersService,
    TelegramPublishService,
    AddProductScene,
    EditProductScene,
    BotUpdate,
  ],
})
export class BotModule {}
