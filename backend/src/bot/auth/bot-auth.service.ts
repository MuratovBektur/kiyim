import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotAuthorizedUser } from '../entities/bot-authorized-user.entity';
import { BotAllowedPhone } from '../entities/bot-allowed-phone.entity';
import { Seller } from '../../sellers/seller.entity';
import { slugify } from '../config/translit';
import { normalizeInstagram, normalizeTelegram, normalizeWhatsapp } from '../config/contact-links';

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

interface EnvSellerProfile {
  whatsapp?: string;
  telegramContact?: string;
  instagram?: string;
  description?: string;
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
    await this.applyEnvSellerDefaults();
  }

  isAuthorized(telegramId: string | number): boolean {
    return this.authorized.has(String(telegramId));
  }

  getSellerId(telegramId: string | number): string | undefined {
    return this.authorized.get(String(telegramId));
  }

  async isAdmin(sellerId: string): Promise<boolean> {
    const seller = await this.sellerRepo.findOne({ where: { id: sellerId } });
    return seller?.isAdmin ?? false;
  }

  /** Deauthorizes every bot user tied to a seller — call right after deleting that seller. */
  revokeSeller(sellerId: string): void {
    for (const [telegramId, sid] of this.authorized.entries()) {
      if (sid === sellerId) this.authorized.delete(telegramId);
    }
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

  /**
   * SELLER_PROFILES=sellerSlug|whatsapp|telegram|instagram|description;... —
   * bootstraps contact links/description for a seller identified by slug.
   * Fields left empty are skipped. Only fills in columns still empty in the
   * DB (see applySellerEnvDefaults) so bot-made edits are never overwritten.
   */
  private envSellerProfiles(): Map<string, EnvSellerProfile> {
    const raw = process.env.SELLER_PROFILES ?? '';
    const map = new Map<string, EnvSellerProfile>();
    for (const entry of raw.split(';')) {
      const [sellerSlugRaw, whatsapp, telegramContact, instagram, description] = entry.split('|').map((part) => part?.trim());
      const sellerSlug = sellerSlugRaw ? slugify(sellerSlugRaw) : undefined;
      if (!sellerSlug) continue;
      map.set(sellerSlug, {
        whatsapp: whatsapp || undefined,
        telegramContact: telegramContact || undefined,
        instagram: instagram || undefined,
        description: description || undefined,
      });
    }
    return map;
  }

  /** BOT_ADMIN_SELLER_SLUGS=slug1,slug2 — grants the "can onboard new sellers" flag. */
  private envAdminSlugs(): Set<string> {
    const raw = process.env.BOT_ADMIN_SELLER_SLUGS ?? '';
    return new Set(
      raw
        .split(',')
        .map((slug) => slugify(slug.trim()))
        .filter(Boolean),
    );
  }

  /** Applies env-configured profile/admin defaults for one seller, without overwriting existing values. */
  private async applySellerEnvDefaults(seller: Seller): Promise<void> {
    const profile = this.envSellerProfiles().get(seller.slug);
    const shouldBeAdmin = this.envAdminSlugs().has(seller.slug);
    let dirty = false;

    if (profile) {
      if (!seller.whatsapp && profile.whatsapp) {
        seller.whatsapp = normalizeWhatsapp(profile.whatsapp);
        dirty = true;
      }
      if (!seller.telegramContact && profile.telegramContact) {
        seller.telegramContact = normalizeTelegram(profile.telegramContact);
        dirty = true;
      }
      if (!seller.instagram && profile.instagram) {
        seller.instagram = normalizeInstagram(profile.instagram);
        dirty = true;
      }
      if (!seller.description && profile.description) {
        seller.description = profile.description;
        dirty = true;
      }
    }

    if (shouldBeAdmin && !seller.isAdmin) {
      seller.isAdmin = true;
      dirty = true;
    }

    if (dirty) await this.sellerRepo.save(seller);
  }

  /** Runs at boot so slugs already in the DB pick up new env-configured profile/admin defaults. */
  private async applyEnvSellerDefaults(): Promise<void> {
    const slugs = new Set([...this.envSellerProfiles().keys(), ...this.envAdminSlugs()]);
    if (!slugs.size) return;
    const sellers = await this.sellerRepo.find({ where: [...slugs].map((slug) => ({ slug })) });
    for (const seller of sellers) {
      await this.applySellerEnvDefaults(seller);
    }
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
      await this.applySellerEnvDefaults(seller);
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
    await this.applySellerEnvDefaults(seller);
    await this.addAllowedPhone(phone, seller.id);
    return seller;
  }
}
