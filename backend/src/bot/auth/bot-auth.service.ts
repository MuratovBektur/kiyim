import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotAuthorizedUser } from '../entities/bot-authorized-user.entity';
import { BotAllowedPhone } from '../entities/bot-allowed-phone.entity';
import { Seller } from '../../sellers/seller.entity';
import { slugify } from '../config/translit';

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export interface PhoneLookupResult {
  sellerId: string;
  sellerName: string;
}

interface EnvPhoneEntry {
  sellerSlug: string;
  sellerName: string;
}

@Injectable()
export class BotAuthService implements OnModuleInit {
  private readonly authorized = new Map<string, string>();

  constructor(
    @InjectRepository(BotAuthorizedUser) private readonly userRepo: Repository<BotAuthorizedUser>,
    @InjectRepository(BotAllowedPhone) private readonly phoneRepo: Repository<BotAllowedPhone>,
    @InjectRepository(Seller) private readonly sellerRepo: Repository<Seller>,
  ) {}

  async onModuleInit() {
    const users = await this.userRepo.find();
    for (const user of users) {
      this.authorized.set(user.telegramId, user.sellerId);
    }
  }

  isAuthorized(telegramId: string | number): boolean {
    return this.authorized.has(String(telegramId));
  }

  getSellerId(telegramId: string | number): string | undefined {
    return this.authorized.get(String(telegramId));
  }

  /**
   * ALLOWED_PHONES=phone:sellerSlug[:Seller Name],... — sellerSlug is
   * auto-created (with the given name, or the slug itself if name omitted)
   * on first successful login if it doesn't exist yet in the DB.
   */
  private envAllowedPhones(): Map<string, EnvPhoneEntry> {
    const raw = process.env.ALLOWED_PHONES ?? '';
    const map = new Map<string, EnvPhoneEntry>();
    for (const pair of raw.split(',')) {
      const [phone, sellerSlugRaw, ...nameParts] = pair.split(':').map((part) => part?.trim());
      const sellerSlug = sellerSlugRaw ? slugify(sellerSlugRaw) : undefined;
      if (phone && sellerSlug) {
        map.set(normalizePhone(phone), { sellerSlug, sellerName: nameParts.join(':') || sellerSlugRaw });
      }
    }
    return map;
  }

  async findSellerForPhone(rawPhone: string): Promise<PhoneLookupResult | null> {
    const phone = normalizePhone(rawPhone);

    const dbEntry = await this.phoneRepo.findOne({ where: { phone }, relations: { seller: true } });
    if (dbEntry) {
      return { sellerId: dbEntry.sellerId, sellerName: dbEntry.seller.name };
    }

    const envEntry = this.envAllowedPhones().get(phone);
    if (!envEntry) return null;

    let seller = await this.sellerRepo.findOne({ where: { slug: envEntry.sellerSlug } });
    if (!seller) {
      seller = await this.sellerRepo.save(this.sellerRepo.create({ name: envEntry.sellerName, slug: envEntry.sellerSlug }));
    }
    return { sellerId: seller.id, sellerName: seller.name };
  }

  async authorize(telegramId: string | number, phone: string, sellerId: string): Promise<void> {
    const id = String(telegramId);
    await this.userRepo.upsert({ telegramId: id, phone: normalizePhone(phone), sellerId }, ['telegramId']);
    this.authorized.set(id, sellerId);
  }

  async listPhonesForSeller(sellerId: string, sellerSlug: string): Promise<{ phone: string; source: 'env' | 'db'; id?: string }[]> {
    const dbPhones = await this.phoneRepo.find({ where: { sellerId }, order: { createdAt: 'ASC' } });
    const envPhones = [...this.envAllowedPhones().entries()]
      .filter(([, entry]) => entry.sellerSlug === sellerSlug)
      .map(([phone]) => phone);

    return [
      ...envPhones.map((phone) => ({ phone, source: 'env' as const })),
      ...dbPhones.map((p) => ({ phone: p.phone, source: 'db' as const, id: p.id })),
    ];
  }

  async addAllowedPhone(phone: string, sellerId: string): Promise<void> {
    const normalized = normalizePhone(phone);
    const existing = await this.phoneRepo.findOne({ where: { phone: normalized } });
    if (existing) {
      existing.sellerId = sellerId;
      await this.phoneRepo.save(existing);
      return;
    }
    await this.phoneRepo.save(this.phoneRepo.create({ phone: normalized, sellerId }));
  }

  async removeAllowedPhone(id: string, sellerId: string): Promise<void> {
    await this.phoneRepo.delete({ id, sellerId });
  }

  /** Onboards a brand-new seller business and links a phone as its first admin. */
  async createSellerWithPhone(sellerName: string, phone: string): Promise<Seller> {
    const baseSlug = slugify(sellerName) || 'seller';
    let slug = baseSlug;
    let suffix = 1;
    while (await this.sellerRepo.findOne({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
    const seller = await this.sellerRepo.save(this.sellerRepo.create({ name: sellerName, slug }));
    await this.addAllowedPhone(phone, seller.id);
    return seller;
  }
}
