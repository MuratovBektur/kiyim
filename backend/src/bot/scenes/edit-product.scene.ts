import { Injectable } from '@nestjs/common';
import { Action, Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext, EditProductState, EDIT_PRODUCT_SCENE_ID } from '../bot.context';
import { ProductsBotService } from '../products-bot.service';
import { BotPresetsService } from '../bot-presets.service';
import { ImageService } from '../image.service';
import { BotAuthService } from '../auth/bot-auth.service';
import { TelegramPublishService } from '../telegram-publish.service';
import {
  BRAND_PRESETS,
  COLOR_PRESETS,
  COUNTRY_PRESETS,
  MATERIAL_PRESETS,
  OWN_PRODUCTION_LABEL,
  sizeGridForCategory,
  subtypesForCategory,
} from '../config/product-taxonomy';
import { Product } from '../../products/product.entity';
import { parsePriceInput, PRICE_INVALID_MESSAGE, PRICE_PROMPT } from '../config/price';
import { escapeHtml } from '../config/translit';

const MAX_EXTRA_PHOTOS = 10;

function state(ctx: BotContext): EditProductState {
  return ctx.scene.state as EditProductState;
}

@Injectable()
@Scene(EDIT_PRODUCT_SCENE_ID)
export class EditProductScene {
  constructor(
    private readonly products: ProductsBotService,
    private readonly presets: BotPresetsService,
    private readonly images: ImageService,
    private readonly auth: BotAuthService,
    private readonly publisher: TelegramPublishService,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const s = state(ctx);
    s.messageIds = [];
    await this.renderMenu(ctx);
  }

  private sellerId(ctx: BotContext): string | undefined {
    return this.auth.getSellerId(ctx.from!.id);
  }

  private async loadProduct(ctx: BotContext): Promise<Product | null> {
    const sellerId = this.sellerId(ctx);
    if (!sellerId) return null;
    try {
      return await this.products.findForSeller(sellerId, state(ctx).productId);
    } catch {
      return null;
    }
  }

  private async renderMenu(ctx: BotContext, notice?: string) {
    const product = await this.loadProduct(ctx);
    if (!product) {
      await ctx.reply('Товар не найден.');
      await ctx.scene.leave();
      return;
    }

    const lines = [
      `<b>${escapeHtml(product.title)}</b>`,
      `Категория: ${escapeHtml(product.category?.name ?? '—')} / ${escapeHtml(product.subtype ?? '—')}`,
      `Бренд: ${escapeHtml(product.brand ?? '—')}`,
      `Страна: ${escapeHtml(product.originCountry ?? '—')}`,
      `Цена: ${product.price} ${product.currency}`,
      `Материалы: ${product.materials.join(', ') || '—'}`,
      `Цвета: ${product.colors.join(', ') || '—'}`,
      `Размеры: ${product.sizes.join(', ') || '—'}`,
      `Описание: ${escapeHtml(product.description ?? '—')}`,
      `Фото: главное ${product.photos.length ? '✅' : '—'}, доп. ${product.extraPhotos.length}`,
      `Опубликован: ${product.isPublished ? '✅' : '—'}`,
    ];
    if (notice) lines.unshift(`${notice}\n`);

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📁 Категория/Подтип', 'ep:field:category'), Markup.button.callback('🏷 Бренд', 'ep:field:brand')],
      [Markup.button.callback('🌍 Страна', 'ep:field:country'), Markup.button.callback('💰 Цена', 'ep:field:price')],
      [Markup.button.callback('🧵 Материалы', 'ep:field:materials'), Markup.button.callback('🎨 Цвета', 'ep:field:colors')],
      [Markup.button.callback('📏 Размеры', 'ep:field:sizes'), Markup.button.callback('📝 Описание', 'ep:field:description')],
      [Markup.button.callback('🖼 Главное фото', 'ep:field:mainPhoto'), Markup.button.callback('📷 Доп. фото', 'ep:field:extraPhotos')],
      [Markup.button.callback('✅ Закрыть редактирование', 'ep:close')],
      [Markup.button.callback('🗑 Удалить', 'ep:delete')],
    ]);

    await this.cleanupMessages(ctx);
    const message = await ctx.replyWithHTML(lines.join('\n'), keyboard);
    state(ctx).messageIds.push(message.message_id);
  }

  private async cleanupMessages(ctx: BotContext) {
    const s = state(ctx);
    for (const id of s.messageIds) {
      await ctx.deleteMessage(id).catch(() => undefined);
    }
    s.messageIds = [];
    s.currentStepMessageId = undefined;
  }

  // Edits the previous field-editing message in place when possible (keeps
  // toggling materials/colors/sizes from spamming a new message per tap),
  // falling back to a fresh message when there's nothing to edit yet.
  private async push(ctx: BotContext, text: string, extra?: Parameters<BotContext['reply']>[1]) {
    const s = state(ctx);
    if (s.currentStepMessageId) {
      try {
        await ctx.telegram.editMessageText(ctx.chat!.id, s.currentStepMessageId, undefined, text, extra as any);
        return;
      } catch {
        // message may no longer exist or isn't a text message — send fresh below
      }
    }
    const message = await ctx.reply(text, extra);
    s.currentStepMessageId = message.message_id;
    s.messageIds.push(message.message_id);
  }

  private backAndDoneRow(action: string, label = '💾 Сохранить') {
    return [Markup.button.callback(label, action)];
  }

  private pairRows(options: string[], dataFor: (index: number) => string) {
    const rows: ReturnType<typeof Markup.button.callback>[][] = [];
    for (let i = 0; i < options.length; i += 2) {
      rows.push(options.slice(i, i + 2).map((opt, j) => Markup.button.callback(opt, dataFor(i + j))));
    }
    return rows;
  }

  // ---- category / subtype cascade ----

  @Action('ep:field:category')
  async onFieldCategory(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const categories = await this.products.categories();
    const options = categories.map((c) => c.name);
    state(ctx).currentOptions = options;
    const rows = this.pairRows(options, (i) => `ep:pick:category:${i}`);
    rows.push([Markup.button.callback('◀️ Назад', 'ep:menu')]);
    await this.push(ctx, 'Выберите новую категорию:', Markup.inlineKeyboard(rows));
  }

  @Action(/^ep:pick:category:(\d+)$/)
  async onPickCategory(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const s = state(ctx);
    const index = Number((ctx as any).match?.[1]);
    const name = s.currentOptions?.[index];
    if (!name) return;
    const category = await this.products.findOrCreateCategory(name);

    const custom = await this.presets.listCustom('subtype', category.slug);
    const options = subtypesForCategory(category.slug, custom);
    s.currentOptions = options;
    const rows = this.pairRows(options, (i) => `ep:pick:subtype:${i}:${category.id}`);
    rows.push([Markup.button.callback('◀️ Назад', 'ep:field:category')]);
    await this.push(ctx, `Категория: ${category.name}. Выберите подтип:`, Markup.inlineKeyboard(rows));
  }

  @Action(/^ep:pick:subtype:(\d+):(.+)$/)
  async onPickSubtype(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const s = state(ctx);
    const match = (ctx as any).match as RegExpExecArray;
    const index = Number(match[1]);
    const categoryId = match[2];
    const subtype = s.currentOptions?.[index];
    const sellerId = this.sellerId(ctx);
    if (!subtype || !sellerId) return;

    // Always picked from the preset list here (no custom-subtype input flow
    // in this scene), so nothing new to remember.
    await this.products.update(sellerId, s.productId, { categoryId, subtype });
    await this.renderMenu(ctx, 'Категория и подтип обновлены.');
  }

  // ---- simple text fields ----

  @Action('ep:field:brand')
  async onFieldBrand(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const custom = await this.presets.listCustom('brand');
    const options = [...custom.filter((v) => !BRAND_PRESETS.includes(v)), ...BRAND_PRESETS];
    state(ctx).currentOptions = options;
    const rows = this.pairRows(options, (i) => `ep:pick:brand:${i}`);
    rows.push([Markup.button.callback('✏️ Свой вариант', 'ep:custom:brand')]);
    rows.push([Markup.button.callback('◀️ Назад', 'ep:menu')]);
    await this.push(ctx, 'Выберите бренд:', Markup.inlineKeyboard(rows));
  }

  @Action(/^ep:pick:brand:(\d+)$/)
  async onPickBrand(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const s = state(ctx);
    const index = Number((ctx as any).match?.[1]);
    const value = s.currentOptions?.[index];
    const sellerId = this.sellerId(ctx);
    if (!value || !sellerId) return;
    await this.products.update(sellerId, s.productId, { brand: value });
    await this.presets.remember('brand', value);
    await this.renderMenu(ctx, 'Бренд обновлён.');
  }

  @Action('ep:field:country')
  async onFieldCountry(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const custom = await this.presets.listCustom('country');
    const options = [OWN_PRODUCTION_LABEL, ...COUNTRY_PRESETS, ...custom.filter((v) => !COUNTRY_PRESETS.includes(v))];
    state(ctx).currentOptions = options;
    const rows = this.pairRows(options, (i) => `ep:pick:country:${i}`);
    rows.push([Markup.button.callback('✏️ Свой вариант', 'ep:custom:country')]);
    rows.push([Markup.button.callback('◀️ Назад', 'ep:menu')]);
    await this.push(ctx, 'Выберите страну происхождения:', Markup.inlineKeyboard(rows));
  }

  @Action(/^ep:pick:country:(\d+)$/)
  async onPickCountry(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const s = state(ctx);
    const index = Number((ctx as any).match?.[1]);
    const value = s.currentOptions?.[index];
    const sellerId = this.sellerId(ctx);
    if (!value || !sellerId) return;
    await this.products.update(sellerId, s.productId, { originCountry: value });
    if (value !== OWN_PRODUCTION_LABEL) await this.presets.remember('country', value);
    await this.renderMenu(ctx, 'Страна обновлена.');
  }

  @Action('ep:field:price')
  async onFieldPrice(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    state(ctx).awaitingField = 'price';
    await this.push(ctx, PRICE_PROMPT, { parse_mode: 'Markdown' });
  }

  @Action('ep:field:description')
  async onFieldDescription(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    state(ctx).awaitingField = 'description';
    await this.push(
      ctx,
      'Введите новое описание или нажмите «Пропустить», чтобы очистить его.',
      Markup.inlineKeyboard([[Markup.button.callback('⏭ Пропустить (очистить)', 'ep:description:clear')], [Markup.button.callback('◀️ Назад', 'ep:menu')]]),
    );
  }

  @Action('ep:description:clear')
  async onDescriptionClear(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const s = state(ctx);
    const sellerId = this.sellerId(ctx);
    if (!sellerId) return;
    s.awaitingField = undefined;
    await this.products.update(sellerId, s.productId, { description: null });
    await this.renderMenu(ctx, 'Описание очищено.');
  }

  @Action(/^ep:custom:(brand|country)$/)
  async onCustomField(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const kind = (ctx as any).match?.[1] as 'brand' | 'country';
    state(ctx).awaitingCustomFor = kind;
    await this.push(ctx, 'Введите свой вариант текстом:');
  }

  // ---- multi-select fields ----

  @Action(/^ep:field:(materials|colors|sizes)$/)
  async onFieldMultiSelect(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const kind = (ctx as any).match?.[1] as 'materials' | 'colors' | 'sizes';
    const product = await this.loadProduct(ctx);
    if (!product) return;

    const s = state(ctx);
    if (kind === 'materials') s.draftMaterials = [...product.materials];
    if (kind === 'colors') s.draftColors = [...product.colors];
    if (kind === 'sizes') s.draftSizes = [...product.sizes];

    await this.renderMultiSelect(ctx, kind, product);
  }

  private draftFor(ctx: BotContext, kind: 'materials' | 'colors' | 'sizes'): string[] {
    const s = state(ctx);
    if (kind === 'materials') return (s.draftMaterials ??= []);
    if (kind === 'colors') return (s.draftColors ??= []);
    return (s.draftSizes ??= []);
  }

  private async optionsFor(kind: 'materials' | 'colors' | 'sizes', product: Product): Promise<string[]> {
    if (kind === 'materials') {
      const custom = await this.presets.listCustom('material');
      return [...custom, ...MATERIAL_PRESETS.filter((v) => !custom.includes(v))];
    }
    if (kind === 'colors') {
      const custom = await this.presets.listCustom('color');
      return [...custom, ...COLOR_PRESETS.filter((v) => !custom.includes(v))];
    }
    const grid = sizeGridForCategory(product.category?.slug);
    const custom = await this.presets.listCustom('size', product.category?.slug);
    return [...custom, ...grid.filter((v) => !custom.includes(v))];
  }

  private async renderMultiSelect(ctx: BotContext, kind: 'materials' | 'colors' | 'sizes', product: Product) {
    const options = await this.optionsFor(kind, product);
    const selected = this.draftFor(ctx, kind);
    state(ctx).currentOptions = options;

    const rows: ReturnType<typeof Markup.button.callback>[][] = [];
    for (let i = 0; i < options.length; i += 2) {
      rows.push(
        options.slice(i, i + 2).map((opt, j) => {
          const index = i + j;
          const checked = selected.includes(opt);
          return Markup.button.callback(`${checked ? '✅ ' : ''}${opt}`, `ep:toggle:${kind}:${index}`);
        }),
      );
    }
    rows.push([Markup.button.callback('✏️ Свой вариант', `ep:custom:${kind}`)]);
    rows.push(this.backAndDoneRow(`ep:save:${kind}`));
    rows.push([Markup.button.callback('◀️ Назад без сохранения', 'ep:menu')]);

    const label = kind === 'materials' ? 'материалы' : kind === 'colors' ? 'цвета' : 'размеры';
    await this.push(
      ctx,
      `Выберите ${label}${selected.length ? `\nВыбрано: ${selected.join(', ')}` : ''}`,
      Markup.inlineKeyboard(rows),
    );
  }

  @Action(/^ep:toggle:(materials|colors|sizes):(\d+)$/)
  async onToggleMulti(@Ctx() ctx: BotContext) {
    const match = (ctx as any).match as RegExpExecArray;
    const kind = match[1] as 'materials' | 'colors' | 'sizes';
    const index = Number(match[2]);
    const s = state(ctx);
    const value = s.currentOptions?.[index];
    if (!value) {
      await ctx.answerCbQuery().catch(() => undefined);
      return;
    }
    const list = this.draftFor(ctx, kind);
    const i = list.indexOf(value);
    if (i >= 0) list.splice(i, 1);
    else list.push(value);

    await ctx.answerCbQuery().catch(() => undefined);
    const product = await this.loadProduct(ctx);
    if (product) await this.renderMultiSelect(ctx, kind, product);
  }

  @Action(/^ep:custom:(materials|colors|sizes)$/)
  async onCustomMulti(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const kind = (ctx as any).match?.[1] as 'materials' | 'colors' | 'sizes';
    state(ctx).awaitingCustomFor = kind;
    await this.push(ctx, 'Введите варианты через запятую:');
  }

  @Action(/^ep:save:(materials|colors|sizes)$/)
  async onSaveMulti(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const kind = (ctx as any).match?.[1] as 'materials' | 'colors' | 'sizes';
    const list = this.draftFor(ctx, kind);
    if (!list.length) {
      await ctx.answerCbQuery('Выберите хотя бы один вариант', { show_alert: true }).catch(() => undefined);
      return;
    }
    const sellerId = this.sellerId(ctx);
    const s = state(ctx);
    if (!sellerId) return;
    await this.products.update(sellerId, s.productId, { [kind]: list } as Partial<Product>);
    await this.renderMenu(ctx, 'Список обновлён.');
  }

  // ---- photos ----

  @Action('ep:field:mainPhoto')
  async onFieldMainPhoto(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    state(ctx).awaitingField = undefined;
    await this.push(
      ctx,
      'Пришлите новое главное фото товара.',
      Markup.inlineKeyboard([[Markup.button.callback('◀️ Назад', 'ep:menu')]]),
    );
    (ctx.scene.state as any).__awaitingMainPhoto = true;
  }

  @Action('ep:field:extraPhotos')
  async onFieldExtraPhotos(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const product = await this.loadProduct(ctx);
    await this.push(
      ctx,
      `Доп. фото сейчас: ${product?.extraPhotos.length ?? 0}.`,
      Markup.inlineKeyboard([
        [Markup.button.callback('➕ Добавить', 'ep:extra:add')],
        [Markup.button.callback('🗑 Очистить все', 'ep:extra:clear')],
        [Markup.button.callback('◀️ Назад', 'ep:menu')],
      ]),
    );
  }

  @Action('ep:extra:add')
  async onExtraAdd(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    state(ctx).awaitingExtraPhotos = true;
    await this.push(
      ctx,
      'Присылайте фото по одному. Когда закончите — нажмите «Готово».',
      Markup.inlineKeyboard([[Markup.button.callback('✅ Готово', 'ep:extra:done')]]),
    );
  }

  @Action('ep:extra:done')
  async onExtraDone(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    state(ctx).awaitingExtraPhotos = false;
    await this.renderMenu(ctx, 'Доп. фото сохранены.');
  }

  @Action('ep:extra:clear')
  async onExtraClear(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const sellerId = this.sellerId(ctx);
    const s = state(ctx);
    if (!sellerId) return;
    await this.products.update(sellerId, s.productId, { extraPhotos: [] });
    await this.renderMenu(ctx, 'Доп. фото очищены.');
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: BotContext) {
    const s = state(ctx);
    const sellerId = this.sellerId(ctx);
    if (!sellerId) return;
    const sizes = (ctx.message as any)?.photo as { file_id: string }[] | undefined;
    if (!sizes?.length) return;
    const fileId = sizes[sizes.length - 1].file_id;

    if ((ctx.scene.state as any).__awaitingMainPhoto) {
      (ctx.scene.state as any).__awaitingMainPhoto = false;
      const url = await ctx.telegram.getFileLink(fileId);
      const photo = await this.images.storePhoto(url.toString(), s.productId, `main-${Date.now()}`);
      await this.products.update(sellerId, s.productId, { photos: [photo] });
      await this.renderMenu(ctx, 'Главное фото обновлено.');
      return;
    }

    if (s.awaitingExtraPhotos) {
      const product = await this.products.findForSeller(sellerId, s.productId);
      if (product.extraPhotos.length >= MAX_EXTRA_PHOTOS) {
        await ctx.reply(`Максимум ${MAX_EXTRA_PHOTOS} доп. фото.`);
        return;
      }
      const url = await ctx.telegram.getFileLink(fileId);
      const photo = await this.images.storePhoto(url.toString(), s.productId, `extra-${Date.now()}`);
      await this.products.update(sellerId, s.productId, { extraPhotos: [...product.extraPhotos, photo] });
      await ctx.reply(`Добавлено. Всего доп. фото: ${product.extraPhotos.length + 1}.`);
    }
  }

  // ---- free text routing ----

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const s = state(ctx);
    const text = (ctx.message as any)?.text?.trim();
    if (!text) return;
    const sellerId = this.sellerId(ctx);
    if (!sellerId) return;
    // The user's own answer is just noise once read — drop it so the chat
    // stays down to the single, in-place-edited field message.
    const incomingId = (ctx.message as any)?.message_id;
    if (incomingId) await ctx.deleteMessage(incomingId).catch(() => undefined);

    if (s.awaitingCustomFor) {
      const kind = s.awaitingCustomFor;
      s.awaitingCustomFor = undefined;
      if (kind === 'brand' || kind === 'country') {
        await this.products.update(sellerId, s.productId, { [kind]: text } as Partial<Product>);
        if (!(kind === 'country' && text === OWN_PRODUCTION_LABEL)) await this.presets.remember(kind, text);
        await this.renderMenu(ctx, 'Поле обновлено.');
        return;
      }
      const values = text.split(',').map((v: string) => v.trim()).filter(Boolean);
      const list = this.draftFor(ctx, kind);
      for (const value of values) {
        if (!list.includes(value)) list.push(value);
      }
      const product = await this.loadProduct(ctx);
      const presetKind = kind === 'materials' ? 'material' : kind === 'colors' ? 'color' : 'size';
      const presetScope = kind === 'sizes' ? product?.category?.slug : undefined;
      for (const value of values) await this.presets.remember(presetKind, value, presetScope);
      if (product) await this.renderMultiSelect(ctx, kind, product);
      return;
    }

    if (s.awaitingField === 'price') {
      const parsed = parsePriceInput(text);
      if (!parsed) {
        await this.push(ctx, PRICE_INVALID_MESSAGE, { parse_mode: 'Markdown' });
        return;
      }
      s.awaitingField = undefined;
      await this.products.update(sellerId, s.productId, { price: parsed.price, currency: parsed.currency });
      await this.renderMenu(ctx, 'Цена обновлена.');
      return;
    }

    if (s.awaitingField === 'description') {
      s.awaitingField = undefined;
      await this.products.update(sellerId, s.productId, { description: text });
      await this.renderMenu(ctx, 'Описание обновлено.');
    }
  }

  // ---- menu / close / delete ----

  @Action('ep:menu')
  async onMenu(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const s = state(ctx);
    s.awaitingField = undefined;
    s.awaitingCustomFor = undefined;
    (ctx.scene.state as any).__awaitingMainPhoto = false;
    await this.renderMenu(ctx);
  }

  @Action('ep:delete')
  async onDelete(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    await this.push(
      ctx,
      'Удалить этот товар без возможности восстановления?',
      Markup.inlineKeyboard([[Markup.button.callback('Да, удалить', 'ep:delete:yes'), Markup.button.callback('Нет', 'ep:menu')]]),
    );
  }

  @Action('ep:delete:yes')
  async onDeleteYes(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const sellerId = this.sellerId(ctx);
    const s = state(ctx);
    if (!sellerId) return;
    await this.products.delete(sellerId, s.productId);
    await this.images.deleteProductPhotos(s.productId);
    await this.cleanupMessages(ctx);
    await ctx.reply('Товар удалён.');
    await ctx.scene.leave();
  }

  @Action('ep:close')
  async onClose(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const product = await this.loadProduct(ctx);
    if (!product) {
      await ctx.scene.leave();
      return;
    }

    if (product.isPublished) {
      const result = await this.publisher.publish(product, product.seller);
      await this.cleanupMessages(ctx);
      await ctx.reply(result.ok ? 'Изменения переопубликованы в Telegram-группе.' : `Не удалось переопубликовать: ${result.error}`);
    } else {
      await this.cleanupMessages(ctx);
      await ctx.reply(
        'Редактирование завершено. Товар ещё не опубликован.',
        Markup.inlineKeyboard([[Markup.button.callback('📤 Опубликовать', `publish_product:${product.id}`)]]),
      );
    }
    await ctx.scene.leave();
  }
}
