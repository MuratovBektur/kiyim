import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Product } from '../products/product.entity';
import { Seller } from '../sellers/seller.entity';
import { escapeHtml, hashtag } from './config/translit';

const UPLOADS_ROOT = join(__dirname, '..', '..', 'uploads');

export type PublishResult = { ok: true } | { ok: false; error: string };

@Injectable()
export class TelegramPublishService {
  constructor(
    @InjectBot() private readonly bot: Telegraf,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  async publish(product: Product, seller: Seller): Promise<PublishResult> {
    if (!seller.telegramChatId) {
      return { ok: false, error: 'Группа для публикации не привязана. Настройте её в 📢 Публикация.' };
    }
    if (!product.photos[0]) {
      return { ok: false, error: 'У товара нет главного фото.' };
    }

    try {
      const buffers = await this.loadPhotoBuffers(product);
      const caption = this.buildCaption(product, seller);

      if (product.publishedTelegram) {
        await this.deleteMessages(product.publishedTelegram.chatId, product.publishedTelegram.messageIds);
      }

      const messageIds = await this.send(seller.telegramChatId, buffers, caption);

      product.isPublished = true;
      product.publishedTelegram = { chatId: seller.telegramChatId, messageIds };
      await this.productRepo.save(product);

      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Неизвестная ошибка публикации' };
    }
  }

  private async send(chatId: string, buffers: Buffer[], caption: string): Promise<string[]> {
    if (buffers.length <= 1) {
      const message = await this.bot.telegram.sendPhoto(
        chatId,
        { source: buffers[0] },
        { caption, parse_mode: 'HTML' },
      );
      return [String(message.message_id)];
    }

    const media = buffers.map((source, index) => ({
      type: 'photo' as const,
      media: { source },
      ...(index === buffers.length - 1 ? { caption, parse_mode: 'HTML' as const } : {}),
    }));
    const messages = await this.bot.telegram.sendMediaGroup(chatId, media);
    return messages.map((message) => String(message.message_id));
  }

  private async deleteMessages(chatId: string, messageIds: string[]): Promise<void> {
    for (const id of messageIds) {
      await this.bot.telegram.deleteMessage(chatId, Number(id)).catch(() => undefined);
    }
  }

  private async loadPhotoBuffers(product: Product): Promise<Buffer[]> {
    const urls = [...product.extraPhotos, product.photos[0]].filter(Boolean);
    const buffers: Buffer[] = [];
    for (const url of urls) {
      const relative = url.replace(/^\/uploads\//, '');
      buffers.push(await readFile(join(UPLOADS_ROOT, relative)));
    }
    return buffers;
  }

  private buildCaption(product: Product, seller: Seller): string {
    const lines = [`<b>${escapeHtml(product.title)}</b>`];
    if (product.description) {
      lines.push(escapeHtml(product.description));
    }
    lines.push(`Цена: ${formatPrice(product.price)} ${product.currency}`);
    if (product.sizes.length) lines.push(`Размеры: ${product.sizes.join(', ')}`);
    if (product.colors.length) lines.push(`Цвета: ${product.colors.join(', ')}`);
    if (product.materials.length) lines.push(`Материалы: ${product.materials.join(', ')}`);
    lines.push(`Продавец: ${escapeHtml(seller.name)}`);

    const tags = [product.category?.name, product.subtype, product.brand, ...product.colors]
      .filter((value): value is string => Boolean(value))
      .map((value) => hashtag(value))
      .filter(Boolean);
    if (tags.length) lines.push(tags.join(' '));

    return lines.join('\n');
  }
}

function formatPrice(price: string): string {
  return Number(price).toLocaleString('ru-RU');
}
