import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Seller } from './sellers/seller.entity';
import { Category } from './categories/category.entity';
import { Product } from './products/product.entity';
import { BotAllowedPhone } from './bot/entities/bot-allowed-phone.entity';
import { BotAuthorizedUser } from './bot/entities/bot-authorized-user.entity';
import { BotCustomPreset } from './bot/entities/bot-custom-preset.entity';
import { Order } from './orders/order.entity';

function connectionOptions() {
  const url = new URL(process.env.DATABASE_URL ?? 'postgresql://kiyim:kiyim@localhost:5432/kiyim');
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 5432,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ''),
  };
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...connectionOptions(),
  entities: [Seller, Category, Product, BotAllowedPhone, BotAuthorizedUser, BotCustomPreset, Order],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
