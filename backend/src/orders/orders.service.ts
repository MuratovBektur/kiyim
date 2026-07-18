import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Telegraf } from 'telegraf';
import { Product } from '../products/product.entity';
import { Seller } from '../sellers/seller.entity';
import { BotAuthorizedUser } from '../bot/entities/bot-authorized-user.entity';
import { escapeHtml } from '../bot/config/translit';
import { CreateOrderDto } from './create-order.dto';
import { Order, OrderItemSnapshot } from './order.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly bot = process.env.TELEGRAM_BOT_TOKEN ? new Telegraf(process.env.TELEGRAM_BOT_TOKEN) : null;

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(BotAuthorizedUser) private readonly authorizedUserRepo: Repository<BotAuthorizedUser>,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order[]> {
    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.productRepo.find({ where: { id: In(productIds) }, relations: { seller: true } });
    const productMap = new Map(products.map((product) => [product.id, product]));

    const missing = productIds.filter((id) => !productMap.has(id));
    if (missing.length) {
      throw new BadRequestException(`Товар не найден: ${missing.join(', ')}`);
    }

    const bySeller = new Map<string, { seller: Seller; items: OrderItemSnapshot[] }>();
    for (const item of dto.items) {
      const product = productMap.get(item.productId)!;
      const group = bySeller.get(product.sellerId) ?? { seller: product.seller, items: [] };
      group.items.push({
        productId: product.id,
        title: product.title,
        size: item.size ?? null,
        color: item.color ?? null,
        quantity: item.quantity,
        price: product.price,
        currency: product.currency,
      });
      bySeller.set(product.sellerId, group);
    }

    const orders: Order[] = [];
    for (const { seller, items } of bySeller.values()) {
      const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
      const order = await this.orderRepo.save(
        this.orderRepo.create({
          name: dto.name,
          phone: dto.phone,
          sellerId: seller.id,
          items,
          total: total.toFixed(2),
          currency: items[0].currency,
        }),
      );
      orders.push(order);
      await this.notifySeller(seller, order);
    }

    return orders;
  }

  private async notifySeller(seller: Seller, order: Order): Promise<void> {
    if (!this.bot) return;

    const recipients = new Set<string>();
    if (seller.telegramChatId) recipients.add(seller.telegramChatId);
    const authorizedUsers = await this.authorizedUserRepo.find({ where: { sellerId: seller.id } });
    for (const user of authorizedUsers) recipients.add(user.telegramId);
    if (!recipients.size) return;

    const lines = order.items.map((item) => {
      const attrs = [item.size && `размер ${item.size}`, item.color && `цвет ${item.color}`]
        .filter(Boolean)
        .join(', ');
      const lineTotal = (Number(item.price) * item.quantity).toLocaleString('ru-RU');
      return `• ${escapeHtml(item.title)}${attrs ? ` (${attrs})` : ''} × ${item.quantity} — ${lineTotal} ${item.currency}`;
    });

    const text = [
      '🛒 <b>Новый заказ</b>',
      ...lines,
      '',
      `Итого: ${Number(order.total).toLocaleString('ru-RU')} ${order.currency}`,
      `Имя клиента: ${escapeHtml(order.name)}`,
      `Телефон клиента: ${escapeHtml(order.phone)}`,
    ].join('\n');

    for (const chatId of recipients) {
      try {
        await this.bot.telegram.sendMessage(chatId, text, { parse_mode: 'HTML' });
      } catch (err) {
        this.logger.warn(`Не удалось отправить уведомление о заказе продавцу ${seller.id} (chat ${chatId}): ${String(err)}`);
      }
    }
  }
}
