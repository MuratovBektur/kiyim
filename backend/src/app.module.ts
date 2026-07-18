import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';
import { ProductsModule } from './products/products.module';
import { SellersModule } from './sellers/sellers.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { BotModule } from './bot/bot.module';

const botEnabled = Boolean(process.env.TELEGRAM_BOT_TOKEN);
if (!botEnabled) {
  new Logger('BotModule').warn('TELEGRAM_BOT_TOKEN не задан — бот управления каталогом отключён.');
}

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    ProductsModule,
    SellersModule,
    CategoriesModule,
    OrdersModule,
    ...(botEnabled ? [BotModule] : []),
  ],
})
export class AppModule {}
