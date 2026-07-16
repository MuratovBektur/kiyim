import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Action, Command, Ctx, Hears, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { Markup, Telegraf } from 'telegraf';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { BotContext, ADD_PRODUCT_SCENE_ID, EDIT_PRODUCT_SCENE_ID, EditProductState } from './bot.context';
import { BotAuthService } from './auth/bot-auth.service';
import { ProductsBotService } from './products-bot.service';
import { AdminSellersService } from './admin-sellers.service';
import { TelegramPublishService } from './telegram-publish.service';
import { Seller } from '../sellers/seller.entity';
import { escapeHtml } from './config/translit';
import { normalizeInstagram, normalizeTelegram, normalizeWhatsapp } from './config/contact-links';

type SellerProfileField = 'description' | 'whatsapp' | 'telegramContact' | 'instagram';

const SELLER_PROFILE_FIELD_LABELS: Record<SellerProfileField, string> = {
  description: 'Описание',
  whatsapp: 'WhatsApp',
  telegramContact: 'Telegram',
  instagram: 'Instagram',
};

type NewSellerSocialField = Extract<SellerProfileField, 'whatsapp' | 'telegramContact' | 'instagram'>;
const NEW_SELLER_SOCIAL_FIELDS: NewSellerSocialField[] = ['whatsapp', 'telegramContact', 'instagram'];

const MAIN_MENU_KEYBOARD = Markup.keyboard([['➕ Добавить товар', '📋 Список товаров'], ['⚙️ Настройки']]).resize();
const UPLOADS_ROOT = join(__dirname, '..', '..', 'uploads');

@Injectable()
@Update()
export class BotUpdate implements OnModuleInit {
  constructor(
    @InjectBot() private readonly bot: Telegraf<BotContext>,
    private readonly auth: BotAuthService,
    private readonly products: ProductsBotService,
    private readonly adminSellers: AdminSellersService,
    private readonly publisher: TelegramPublishService,
    @InjectRepository(Seller) private readonly sellerRepo: Repository<Seller>,
  ) {}

  async onModuleInit() {
    await this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Главное меню' },
      { command: 'add', description: 'Добавить товар' },
      { command: 'list', description: 'Список товаров' },
      { command: 'settings', description: 'Настройки' },
    ]);
  }

  private requireAuth(ctx: BotContext): string | null {
    const sellerId = this.auth.getSellerId(ctx.from!.id);
    return sellerId ?? null;
  }

  private async denyIfUnauthorized(ctx: BotContext): Promise<boolean> {
    if (this.requireAuth(ctx)) return false;
    await ctx.reply('Вы не авторизованы. Выполните /start и поделитесь номером телефона.');
    return true;
  }

  // ---- auth ----

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    if (this.auth.isAuthorized(ctx.from!.id)) {
      await ctx.reply('Главное меню:', MAIN_MENU_KEYBOARD);
      return;
    }
    await ctx.reply(
      'Добро пожаловать! Для доступа к управлению каталогом поделитесь номером телефона.',
      Markup.keyboard([Markup.button.contactRequest('📱 Поделиться номером')])
        .resize()
        .oneTime(),
    );
  }

  @On('contact')
  async onContact(@Ctx() ctx: BotContext) {
    const contact = (ctx.message as any)?.contact;
    if (!contact || contact.user_id !== ctx.from!.id) {
      await ctx.reply('Пожалуйста, поделитесь своим собственным контактом через кнопку.');
      return;
    }

    const found = await this.auth.findSellerForPhone(contact.phone_number);
    if (!found) {
      await ctx.reply('Этот номер не найден в списке разрешённых. Обратитесь к администратору.');
      return;
    }

    await this.auth.authorize(ctx.from!.id, contact.phone_number, found.sellerId);
    await ctx.reply(`Готово! Вы авторизованы как админ продавца «${found.sellerName}».`, MAIN_MENU_KEYBOARD);
  }

  // ---- commands (must come before the catch-all @On('text')) ----

  @Command('add')
  @Hears('➕ Добавить товар')
  async onAdd(@Ctx() ctx: BotContext) {
    if (await this.denyIfUnauthorized(ctx)) return;
    await ctx.scene.enter(ADD_PRODUCT_SCENE_ID);
  }

  @Command('list')
  @Hears('📋 Список товаров')
  async onList(@Ctx() ctx: BotContext) {
    if (await this.denyIfUnauthorized(ctx)) return;
    await this.renderCard(ctx, 0);
  }

  @Command('settings')
  @Hears('⚙️ Настройки')
  async onSettings(@Ctx() ctx: BotContext) {
    if (await this.denyIfUnauthorized(ctx)) return;
    const sellerId = this.requireAuth(ctx)!;
    const isAdmin = await this.auth.isAdmin(sellerId);
    const adminRow = isAdmin ? [[Markup.button.callback('🛠 Все продавцы', 'settings:admin_sellers')]] : [];

    await ctx.reply(
      'Настройки:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🏬 О продавце', 'settings:profile')],
        [Markup.button.callback('📢 Публикация', 'settings:publish')],
        [Markup.button.callback('🔐 Доступ', 'settings:access')],
        ...adminRow,
      ]),
    );
  }

  @Command('link_group')
  async onLinkGroup(@Ctx() ctx: BotContext) {
    if (ctx.chat!.type !== 'group' && ctx.chat!.type !== 'supergroup') {
      await ctx.reply('Эту команду нужно отправить внутри группы, которую вы хотите привязать.');
      return;
    }
    const sellerId = this.requireAuth(ctx);
    if (!sellerId) {
      await ctx.reply('Вы не авторизованы. Напишите боту в личные сообщения /start.');
      return;
    }
    const seller = await this.sellerRepo.findOneOrFail({ where: { id: sellerId } });
    seller.telegramChatId = String(ctx.chat!.id);
    seller.telegramChatTitle = (ctx.chat as any).title ?? null;
    await this.sellerRepo.save(seller);
    await ctx.reply(`Группа «${seller.telegramChatTitle}» привязана для публикации товаров продавца «${seller.name}».`);
  }

  // ---- product list pagination ----

  @Action(/^card_nav:(-?\d+)$/)
  async onCardNav(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const offset = Number((ctx as any).match?.[1]);
    await this.renderCard(ctx, offset);
  }

  // Edits the same card message in place across navigation instead of
  // sending a new one per product — tracked in session since /list runs
  // outside any scene.
  private async renderCard(ctx: BotContext, offset: number) {
    const sellerId = this.requireAuth(ctx);
    if (!sellerId) return;
    const session = ctx.session as any;
    const { product, total } = await this.products.listForSeller(sellerId, Math.max(offset, 0));

    if (!product) {
      if (session.listCardMessageId) {
        await ctx.deleteMessage(session.listCardMessageId).catch(() => undefined);
        session.listCardMessageId = undefined;
      }
      await ctx.reply('Каталог пуст. Используйте /add, чтобы добавить первый товар.');
      return;
    }

    const clampedOffset = Math.max(offset, 0);
    const caption = [
      `<b>${escapeHtml(product.title)}</b>`,
      `${escapeHtml(product.category?.name ?? '—')} / ${escapeHtml(product.subtype ?? '—')}`,
      `Цена: ${product.price} ${product.currency}`,
      `Статус: ${product.isPublished ? '📤 опубликован' : '— не опубликован'}`,
      `\nТовар ${clampedOffset + 1} из ${total}`,
    ].join('\n');

    const navRow = [
      Markup.button.callback('◀️', `card_nav:${clampedOffset - 1}`),
      Markup.button.callback('▶️', `card_nav:${clampedOffset + 1}`),
    ];
    const keyboard = Markup.inlineKeyboard([
      navRow,
      [Markup.button.callback('✏️ Изменить', `edit_product:${product.id}`), Markup.button.callback('🗑 Удалить', `delete_product:${product.id}`)],
      [Markup.button.callback(product.isPublished ? '🔁 Переопубликовать' : '📤 Опубликовать', `publish_product:${product.id}`)],
    ]);

    const buffer = product.photos[0] ? await readUploadedFile(product.photos[0]) : null;

    if (session.listCardMessageId) {
      try {
        if (buffer) {
          await ctx.telegram.editMessageMedia(
            ctx.chat!.id,
            session.listCardMessageId,
            undefined,
            { type: 'photo', media: { source: buffer }, caption, parse_mode: 'HTML' },
            { reply_markup: keyboard.reply_markup },
          );
        } else {
          await ctx.telegram.editMessageCaption(ctx.chat!.id, session.listCardMessageId, undefined, caption, {
            parse_mode: 'HTML',
            reply_markup: keyboard.reply_markup,
          });
        }
        return;
      } catch {
        // message gone, or switched between photo/text card — send fresh below
        await ctx.deleteMessage(session.listCardMessageId).catch(() => undefined);
        session.listCardMessageId = undefined;
      }
    }

    const message = buffer
      ? await ctx.replyWithPhoto({ source: buffer }, { caption, parse_mode: 'HTML', ...keyboard })
      : await ctx.reply(caption, { parse_mode: 'HTML', ...keyboard });
    session.listCardMessageId = message.message_id;
  }

  // ---- edit / publish / delete actions (used from /list and post-creation cards) ----

  @Action(/^edit_product:(.+)$/)
  async onEditProduct(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    if (await this.denyIfUnauthorized(ctx)) return;
    const id = (ctx as any).match?.[1];
    await ctx.scene.enter(EDIT_PRODUCT_SCENE_ID, { productId: id } as EditProductState);
  }

  @Action(/^publish_product:(.+)$/)
  async onPublishProduct(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const sellerId = this.requireAuth(ctx);
    if (!sellerId) return;
    const id = (ctx as any).match?.[1];
    const product = await this.products.findForSeller(sellerId, id);
    const result = await this.publisher.publish(product, product.seller);
    await ctx.reply(result.ok ? `«${product.title}» опубликован в Telegram-группе.` : `Ошибка публикации: ${result.error}`);
  }

  @Action(/^delete_product:(.+)$/)
  async onDeleteProduct(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const id = (ctx as any).match?.[1];
    await ctx.reply(
      'Удалить товар без возможности восстановления?',
      Markup.inlineKeyboard([[Markup.button.callback('Да, удалить', `delete_product_yes:${id}`), Markup.button.callback('Отмена', 'noop')]]),
    );
  }

  @Action(/^delete_product_yes:(.+)$/)
  async onDeleteProductYes(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const sellerId = this.requireAuth(ctx);
    if (!sellerId) return;
    const id = (ctx as any).match?.[1];
    await this.products.delete(sellerId, id);
    await ctx.reply('Товар удалён.');
  }

  @Action('noop')
  async onNoop(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
  }

  // ---- settings: publish ----

  @Action('settings:publish')
  async onSettingsPublish(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const sellerId = this.requireAuth(ctx);
    if (!sellerId) return;
    const seller = await this.sellerRepo.findOneOrFail({ where: { id: sellerId } });

    const status = seller.telegramChatId
      ? `Привязана группа: «${seller.telegramChatTitle}».`
      : 'Группа не привязана. Добавьте бота в группу как администратора и отправьте там команду /link_group.';

    const buttons = seller.telegramChatId
      ? [[Markup.button.callback('❌ Отвязать', 'settings:publish:unlink')]]
      : [];

    await ctx.reply(status, Markup.inlineKeyboard([...buttons, [Markup.button.callback('◀️ Назад', 'settings:menu')]]));
  }

  @Action('settings:publish:unlink')
  async onSettingsPublishUnlink(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const sellerId = this.requireAuth(ctx);
    if (!sellerId) return;
    const seller = await this.sellerRepo.findOneOrFail({ where: { id: sellerId } });
    seller.telegramChatId = null;
    seller.telegramChatTitle = null;
    await this.sellerRepo.save(seller);
    await ctx.reply('Группа отвязана.');
  }

  // ---- settings: profile (description + contact links shown to buyers) ----

  @Action('settings:profile')
  async onSettingsProfile(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const sellerId = this.requireAuth(ctx);
    if (!sellerId) return;
    const seller = await this.sellerRepo.findOneOrFail({ where: { id: sellerId } });

    const lines = (Object.keys(SELLER_PROFILE_FIELD_LABELS) as SellerProfileField[])
      .map((field) => `${SELLER_PROFILE_FIELD_LABELS[field]}: ${seller[field] ?? '—'}`)
      .join('\n');

    await ctx.reply(
      `Информация о «${seller.name}» для покупателей:\n${lines}`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Описание', 'settings:profile:edit:description')],
        [Markup.button.callback('💬 WhatsApp', 'settings:profile:edit:whatsapp')],
        [Markup.button.callback('✈️ Telegram', 'settings:profile:edit:telegramContact')],
        [Markup.button.callback('📸 Instagram', 'settings:profile:edit:instagram')],
        [Markup.button.callback('◀️ Назад', 'settings:menu')],
      ]),
    );
  }

  @Action(/^settings:profile:edit:(description|whatsapp|telegramContact|instagram)$/)
  async onSettingsProfileEdit(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    if (await this.denyIfUnauthorized(ctx)) return;
    const field = (ctx as any).match?.[1] as SellerProfileField;
    (ctx.session as any).awaitingSellerField = field;
    await ctx.reply(`Введите новое значение «${SELLER_PROFILE_FIELD_LABELS[field]}» (или "-", чтобы очистить):`);
  }

  // ---- settings: admin sellers (admin-only — browse/edit/delete every seller) ----

  private async requireAdmin(ctx: BotContext): Promise<string | null> {
    const sellerId = this.requireAuth(ctx);
    if (!sellerId || !(await this.auth.isAdmin(sellerId))) return null;
    return sellerId;
  }

  @Action('settings:admin_sellers')
  async onSettingsAdminSellers(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    if (!(await this.requireAdmin(ctx))) {
      await ctx.reply('Доступно только админам.');
      return;
    }
    await this.renderAdminSellerCard(ctx, 0);
  }

  @Action(/^admin_seller_nav:(-?\d+)$/)
  async onAdminSellerNav(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    if (!(await this.requireAdmin(ctx))) return;
    const offset = Number((ctx as any).match?.[1]);
    await this.renderAdminSellerCard(ctx, offset);
  }

  @Action(/^admin_seller_edit:(description|whatsapp|telegramContact|instagram)$/)
  async onAdminSellerEdit(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    if (!(await this.requireAdmin(ctx))) return;
    const session = ctx.session as any;
    if (!session.adminSellerId) return;
    const field = (ctx as any).match?.[1] as SellerProfileField;
    session.awaitingAdminSellerField = field;
    await ctx.reply(`Введите новое значение «${SELLER_PROFILE_FIELD_LABELS[field]}» (или "-", чтобы очистить):`);
  }

  @Action('admin_seller_delete')
  async onAdminSellerDelete(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const sellerId = await this.requireAdmin(ctx);
    if (!sellerId) return;
    const targetId = (ctx.session as any).adminSellerId as string | undefined;
    if (!targetId) return;
    if (targetId === sellerId) {
      await ctx.reply('Нельзя удалить свой собственный аккаунт продавца из этого меню.');
      return;
    }
    await ctx.reply(
      'Удалить продавца вместе со всеми его товарами без возможности восстановления?',
      Markup.inlineKeyboard([[Markup.button.callback('Да, удалить', 'admin_seller_delete_yes'), Markup.button.callback('Отмена', 'noop')]]),
    );
  }

  @Action('admin_seller_delete_yes')
  async onAdminSellerDeleteYes(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const sellerId = await this.requireAdmin(ctx);
    if (!sellerId) return;
    const session = ctx.session as any;
    const targetId = session.adminSellerId as string | undefined;
    if (!targetId || targetId === sellerId) return;

    await this.adminSellers.deleteSeller(targetId);
    this.auth.revokeSeller(targetId);
    session.adminSellerMessageId = undefined;
    await ctx.reply('Продавец удалён.');
    await this.renderAdminSellerCard(ctx, Math.max((session.adminSellerOffset ?? 1) - 1, 0));
  }

  @Action('admin_seller_toggle_admin')
  async onAdminSellerToggleAdmin(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const sellerId = await this.requireAdmin(ctx);
    if (!sellerId) return;
    const session = ctx.session as any;
    const targetId = session.adminSellerId as string | undefined;
    if (!targetId) return;

    const seller = await this.sellerRepo.findOneOrFail({ where: { id: targetId } });
    seller.isAdmin = !seller.isAdmin;
    await this.sellerRepo.save(seller);
    await ctx.reply(`«${seller.name}» теперь ${seller.isAdmin ? 'админ 👑' : 'обычный продавец'}.`);
    session.adminSellerMessageId = undefined;
    await this.renderAdminSellerCard(ctx, session.adminSellerOffset ?? 0);
  }

  private applySellerFieldEdit(seller: Seller, field: SellerProfileField, rawText: string): void {
    const text = rawText.trim();
    if (text === '-') {
      seller[field] = null;
      return;
    }
    if (field === 'whatsapp') seller.whatsapp = normalizeWhatsapp(text);
    else if (field === 'telegramContact') seller.telegramContact = normalizeTelegram(text);
    else if (field === 'instagram') seller.instagram = normalizeInstagram(text);
    else seller.description = text;
  }

  private async renderAdminSellerCard(ctx: BotContext, offset: number) {
    const session = ctx.session as any;
    const { seller, total } = await this.adminSellers.list(Math.max(offset, 0));

    if (!seller) {
      if (session.adminSellerMessageId) {
        await ctx.deleteMessage(session.adminSellerMessageId).catch(() => undefined);
        session.adminSellerMessageId = undefined;
      }
      await ctx.reply('Продавцов нет.');
      return;
    }

    const clampedOffset = Math.max(offset, 0);
    session.adminSellerId = seller.id;
    session.adminSellerOffset = clampedOffset;

    const productCount = await this.adminSellers.productCount(seller.id);
    const caption = [
      `<b>${escapeHtml(seller.name)}</b> (${escapeHtml(seller.slug)})`,
      `${seller.isAdmin ? '👑 админ' : 'обычный продавец'} · ★ ${seller.rating.toFixed(1)} · товаров: ${productCount}`,
      `Описание: ${escapeHtml(seller.description ?? '—')}`,
      `WhatsApp: ${escapeHtml(seller.whatsapp ?? '—')}`,
      `Telegram: ${escapeHtml(seller.telegramContact ?? '—')}`,
      `Instagram: ${escapeHtml(seller.instagram ?? '—')}`,
      `\nПродавец ${clampedOffset + 1} из ${total}`,
    ].join('\n');

    const navRow = [
      Markup.button.callback('◀️', `admin_seller_nav:${clampedOffset - 1}`),
      Markup.button.callback('▶️', `admin_seller_nav:${clampedOffset + 1}`),
    ];
    const keyboard = Markup.inlineKeyboard([
      navRow,
      [Markup.button.callback('✏️ Описание', 'admin_seller_edit:description'), Markup.button.callback('💬 WhatsApp', 'admin_seller_edit:whatsapp')],
      [Markup.button.callback('✈️ Telegram', 'admin_seller_edit:telegramContact'), Markup.button.callback('📸 Instagram', 'admin_seller_edit:instagram')],
      [Markup.button.callback(seller.isAdmin ? '🚫 Забрать права админа' : '👑 Сделать админом', 'admin_seller_toggle_admin')],
      [Markup.button.callback('🗑 Удалить продавца', 'admin_seller_delete')],
      [Markup.button.callback('◀️ Назад', 'settings:menu')],
    ]);

    if (session.adminSellerMessageId) {
      try {
        await ctx.telegram.editMessageText(ctx.chat!.id, session.adminSellerMessageId, undefined, caption, {
          parse_mode: 'HTML',
          reply_markup: keyboard.reply_markup,
        });
        return;
      } catch {
        await ctx.deleteMessage(session.adminSellerMessageId).catch(() => undefined);
        session.adminSellerMessageId = undefined;
      }
    }

    const message = await ctx.reply(caption, { parse_mode: 'HTML', ...keyboard });
    session.adminSellerMessageId = message.message_id;
  }

  // ---- settings: access ----

  @Action('settings:access')
  async onSettingsAccess(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const sellerId = this.requireAuth(ctx);
    if (!sellerId) return;
    const seller = await this.sellerRepo.findOneOrFail({ where: { id: sellerId } });
    const phones = await this.auth.listPhonesForSeller(sellerId, seller.slug);

    const lines = phones.length
      ? phones.map((p) => `${p.phone} ${p.source === 'env' ? '(из конфига)' : ''}`).join('\n')
      : 'Список пуст.';

    const removeButtons = phones
      .filter((p) => p.source === 'db')
      .map((p) => [Markup.button.callback(`🗑 ${p.phone}`, `settings:access:remove:${p.id}`)]);

    const newSellerButton = seller.isAdmin
      ? [[Markup.button.callback('🆕 Завести нового продавца', 'settings:access:new_seller')]]
      : [];

    await ctx.reply(
      `Номера с доступом для «${seller.name}»:\n${lines}`,
      Markup.inlineKeyboard([
        ...removeButtons,
        [Markup.button.callback('➕ Номер к этому продавцу', 'settings:access:add')],
        ...newSellerButton,
        [Markup.button.callback('◀️ Назад', 'settings:menu')],
      ]),
    );
  }

  @Action('settings:access:add')
  async onSettingsAccessAdd(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    (ctx.session as any).awaitingPhoneAdd = true;
    await ctx.reply('Введите номер телефона (7–15 цифр):');
  }

  @Action('settings:access:new_seller')
  async onSettingsAccessNewSeller(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    if (!(await this.requireAdmin(ctx))) {
      await ctx.reply('Заводить новых продавцов может только админ.');
      return;
    }
    (ctx.session as any).awaitingNewSellerPhone = true;
    await ctx.reply('Номер телефона первого админа нового продавца (7–15 цифр):');
  }

  @Action('new_seller:admin:yes')
  async onNewSellerAdminYes(@Ctx() ctx: BotContext) {
    await this.startNewSellerSocials(ctx, true);
  }

  @Action('new_seller:admin:no')
  async onNewSellerAdminNo(@Ctx() ctx: BotContext) {
    await this.startNewSellerSocials(ctx, false);
  }

  private async startNewSellerSocials(ctx: BotContext, makeAdmin: boolean) {
    await ctx.answerCbQuery().catch(() => undefined);
    if (!(await this.requireAdmin(ctx))) return;
    (ctx.session as any).pendingNewSellerIsAdmin = makeAdmin;
    await this.promptNewSellerSocial(ctx, 0);
  }

  @Action(/^new_seller:social:skip:(\d)$/)
  async onNewSellerSocialSkip(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    if (!(await this.requireAdmin(ctx))) return;
    (ctx.session as any).awaitingNewSellerSocial = undefined;
    const stepIndex = Number((ctx as any).match?.[1]);
    await this.promptNewSellerSocial(ctx, stepIndex + 1);
  }

  private async promptNewSellerSocial(ctx: BotContext, stepIndex: number) {
    if (stepIndex >= NEW_SELLER_SOCIAL_FIELDS.length) {
      await this.finishNewSeller(ctx);
      return;
    }
    const session = ctx.session as any;
    const field = NEW_SELLER_SOCIAL_FIELDS[stepIndex];
    session.newSellerSocialStep = stepIndex;
    session.awaitingNewSellerSocial = field;
    await ctx.reply(
      `Ссылка на ${SELLER_PROFILE_FIELD_LABELS[field]} нового продавца (или пропустите):`,
      Markup.inlineKeyboard([[Markup.button.callback('⏭ Пропустить', `new_seller:social:skip:${stepIndex}`)]]),
    );
  }

  private async finishNewSeller(ctx: BotContext) {
    if (!(await this.requireAdmin(ctx))) return;
    const session = ctx.session as any;
    const name = session.pendingNewSellerName as string | undefined;
    const phone = session.pendingNewSellerPhone as string | undefined;
    const makeAdmin = Boolean(session.pendingNewSellerIsAdmin);
    const socials = (session.pendingNewSellerSocials ?? {}) as Partial<Record<NewSellerSocialField, string>>;
    session.pendingNewSellerName = undefined;
    session.pendingNewSellerPhone = undefined;
    session.pendingNewSellerIsAdmin = undefined;
    session.pendingNewSellerSocials = undefined;
    session.newSellerSocialStep = undefined;
    if (!name || !phone) return;

    const seller = await this.auth.createSellerWithPhone(name, phone);
    let dirty = false;
    if (makeAdmin && !seller.isAdmin) {
      seller.isAdmin = true;
      dirty = true;
    }
    for (const field of NEW_SELLER_SOCIAL_FIELDS) {
      const rawText = socials[field];
      if (!rawText) continue;
      this.applySellerFieldEdit(seller, field, rawText);
      dirty = true;
    }
    if (dirty) await this.sellerRepo.save(seller);

    const addedSocials = NEW_SELLER_SOCIAL_FIELDS.filter((field) => socials[field]).map((field) => SELLER_PROFILE_FIELD_LABELS[field]);

    await ctx.reply(
      `Продавец «${seller.name}» создан. Номер ${phone} привязан как его первый админ.` +
        (seller.isAdmin ? ' Продавцу выдана роль админа платформы.' : '') +
        (addedSocials.length ? ` Добавлены ссылки: ${addedSocials.join(', ')}.` : ''),
    );
  }

  @Action(/^settings:access:remove:(.+)$/)
  async onSettingsAccessRemove(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const sellerId = this.requireAuth(ctx);
    if (!sellerId) return;
    const id = (ctx as any).match?.[1];
    await this.auth.removeAllowedPhone(id, sellerId);
    await ctx.reply('Номер удалён.');
  }

  @Action('settings:menu')
  async onSettingsMenu(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    await this.onSettings(ctx);
  }

  // ---- catch-all text (must stay after @Command handlers) ----

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const session = ctx.session as any;
    if (session?.awaitingSellerField) {
      const field = session.awaitingSellerField as SellerProfileField;
      session.awaitingSellerField = undefined;
      const sellerId = this.requireAuth(ctx);
      if (!sellerId) return;
      const text = (ctx.message as any)?.text?.trim() ?? '';

      const seller = await this.sellerRepo.findOneOrFail({ where: { id: sellerId } });
      this.applySellerFieldEdit(seller, field, text);
      await this.sellerRepo.save(seller);
      await ctx.reply(`«${SELLER_PROFILE_FIELD_LABELS[field]}» обновлено.`);
      return;
    }

    if (session?.awaitingAdminSellerField) {
      const field = session.awaitingAdminSellerField as SellerProfileField;
      session.awaitingAdminSellerField = undefined;
      const sellerId = await this.requireAdmin(ctx);
      const targetId = session.adminSellerId as string | undefined;
      if (!sellerId || !targetId) return;
      const text = (ctx.message as any)?.text?.trim() ?? '';

      const seller = await this.sellerRepo.findOneOrFail({ where: { id: targetId } });
      this.applySellerFieldEdit(seller, field, text);
      await this.sellerRepo.save(seller);
      await ctx.reply(`«${SELLER_PROFILE_FIELD_LABELS[field]}» обновлено.`);
      session.adminSellerMessageId = undefined;
      await this.renderAdminSellerCard(ctx, session.adminSellerOffset ?? 0);
      return;
    }

    if (session?.awaitingPhoneAdd) {
      session.awaitingPhoneAdd = false;
      const sellerId = this.requireAuth(ctx);
      if (!sellerId) return;
      const text = (ctx.message as any)?.text?.trim() ?? '';
      const digits = text.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        await ctx.reply('Неверный формат номера. Должно быть 7–15 цифр.');
        return;
      }
      await this.auth.addAllowedPhone(digits, sellerId);
      await ctx.reply(`Номер ${digits} добавлен.`);
      return;
    }

    if (session?.awaitingNewSellerPhone) {
      session.awaitingNewSellerPhone = false;
      const text = (ctx.message as any)?.text?.trim() ?? '';
      const digits = text.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        await ctx.reply('Неверный формат номера. Должно быть 7–15 цифр.');
        return;
      }
      session.pendingNewSellerPhone = digits;
      session.awaitingNewSellerName = true;
      await ctx.reply('Название нового продавца (магазина):');
      return;
    }

    if (session?.awaitingNewSellerName) {
      session.awaitingNewSellerName = false;
      const name = (ctx.message as any)?.text?.trim() ?? '';
      if (!(await this.requireAdmin(ctx))) {
        session.pendingNewSellerPhone = undefined;
        await ctx.reply('Заводить новых продавцов может только админ.');
        return;
      }
      if (!name) {
        await ctx.reply('Название не может быть пустым.');
        return;
      }
      session.pendingNewSellerName = name;
      await ctx.reply(
        'Сделать этого продавца админом? Админ может заводить других продавцов из бота.',
        Markup.inlineKeyboard([
          [Markup.button.callback('👑 Да, сделать админом', 'new_seller:admin:yes')],
          [Markup.button.callback('Нет, обычный продавец', 'new_seller:admin:no')],
        ]),
      );
      return;
    }

    if (session?.awaitingNewSellerSocial) {
      const field = session.awaitingNewSellerSocial as NewSellerSocialField;
      const stepIndex = session.newSellerSocialStep as number;
      session.awaitingNewSellerSocial = undefined;
      if (!(await this.requireAdmin(ctx))) return;
      const text = (ctx.message as any)?.text?.trim() ?? '';
      if (text) {
        session.pendingNewSellerSocials = session.pendingNewSellerSocials ?? {};
        session.pendingNewSellerSocials[field] = text;
      }
      await this.promptNewSellerSocial(ctx, stepIndex + 1);
      return;
    }

    if (!this.auth.isAuthorized(ctx.from!.id)) {
      await ctx.reply('Выполните /start, чтобы авторизоваться.');
    }
  }
}

async function readUploadedFile(publicUrl: string): Promise<Buffer | null> {
  const relative = publicUrl.replace(/^\/uploads\//, '');
  try {
    return await readFile(join(UPLOADS_ROOT, relative));
  } catch {
    return null;
  }
}
