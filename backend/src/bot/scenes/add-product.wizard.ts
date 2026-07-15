import { Injectable } from '@nestjs/common';
import { Action, Ctx, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { BotContext, AddProductState, ADD_PRODUCT_SCENE_ID } from '../bot.context';
import { ProductsBotService } from '../products-bot.service';
import { BotPresetsService } from '../bot-presets.service';
import { ImageService } from '../image.service';
import { BotAuthService } from '../auth/bot-auth.service';
import {
  BRAND_PRESETS,
  COLOR_PRESETS,
  COUNTRY_PRESETS,
  MATERIAL_PRESETS,
  OWN_PRODUCTION_LABEL,
  sizeGridForCategory,
  subtypesForCategory,
} from '../config/product-taxonomy';
import { parsePriceInput, PRICE_INVALID_MESSAGE, PRICE_PROMPT } from '../config/price';
import { escapeHtml } from '../config/translit';
import { Product } from '../../products/product.entity';

const STEP_KEYS = [
  'category',
  'subtype',
  'brand',
  'country',
  'price',
  'materials',
  'colors',
  'sizes',
  'mainPhoto',
  'description',
  'extraPhotos',
] as const;

const MAX_EXTRA_PHOTOS = 10;

function state(ctx: BotContext): AddProductState {
  return ctx.scene.state as AddProductState;
}

@Injectable()
@Scene(ADD_PRODUCT_SCENE_ID)
export class AddProductScene {
  constructor(
    private readonly products: ProductsBotService,
    private readonly presets: BotPresetsService,
    private readonly images: ImageService,
    private readonly auth: BotAuthService,
  ) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const s = state(ctx);
    s.stepIndex = 0;
    s.messageIds = [];
    s.materials = [];
    s.colors = [];
    s.sizes = [];
    s.extraPhotoFileIds = [];
    await this.renderStep(ctx);
  }

  @Action('ap:back')
  async onBack(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const s = state(ctx);
    if (s.stepIndex === 0) return;
    s.stepIndex -= 1;
    s.awaitingCustomInput = false;
    await this.renderStep(ctx);
  }

  @Action('ap:cancel')
  async onCancel(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    await this.push(
      ctx,
      'Отменить добавление товара? Весь прогресс будет потерян.',
      Markup.inlineKeyboard([[Markup.button.callback('Да, отменить', 'ap:cancel:yes'), Markup.button.callback('Нет', 'ap:cancel:no')]]),
    );
  }

  @Action('ap:cancel:no')
  async onCancelNo(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    await this.renderStep(ctx);
  }

  @Action('ap:cancel:yes')
  async onCancelYes(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    await this.cleanupMessages(ctx);
    await ctx.reply('Добавление товара отменено.');
    await ctx.scene.leave();
  }

  @Action('ap:custom')
  async onCustom(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    state(ctx).awaitingCustomInput = true;
    await this.push(ctx, 'Введите свой вариант текстом:');
  }

  @Action(/^ap:pick:(\d+)$/)
  async onPick(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const s = state(ctx);
    const index = Number((ctx as any).match?.[1]);
    const value = s.currentOptions?.[index];
    if (value === undefined) return;
    await this.applyAnswer(ctx, value);
  }

  @Action(/^ap:toggle:(\d+)$/)
  async onToggle(@Ctx() ctx: BotContext) {
    const s = state(ctx);
    const index = Number((ctx as any).match?.[1]);
    const value = s.currentOptions?.[index];
    if (value === undefined) {
      await ctx.answerCbQuery().catch(() => undefined);
      return;
    }
    const list = this.multiSelectListFor(ctx);
    const existingIndex = list.indexOf(value);
    if (existingIndex >= 0) list.splice(existingIndex, 1);
    else list.push(value);

    await ctx.answerCbQuery().catch(() => undefined);
    await this.renderStep(ctx);
  }

  @Action('ap:done')
  async onDone(@Ctx() ctx: BotContext) {
    const list = this.multiSelectListFor(ctx);
    if (list.length === 0) {
      await ctx.answerCbQuery('Выберите хотя бы один вариант', { show_alert: true }).catch(() => undefined);
      return;
    }
    await ctx.answerCbQuery().catch(() => undefined);
    state(ctx).stepIndex += 1;
    await this.renderStep(ctx);
  }

  @Action('ap:skip')
  async onSkip(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    const s = state(ctx);
    const key = STEP_KEYS[s.stepIndex];
    if (key === 'description') {
      s.description = null;
    }
    if (key === 'extraPhotos') {
      await this.finish(ctx);
      return;
    }
    s.stepIndex += 1;
    await this.renderStep(ctx);
  }

  @Action('ap:photo:done')
  async onPhotoDone(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    await this.showExtraPhotosConfirmation(ctx);
  }

  @Action('ap:photo:confirm')
  async onPhotoConfirm(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    await this.finish(ctx);
  }

  @Action('ap:photo:more')
  async onPhotoMore(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    await this.clearExtraPhotosConfirmation(ctx);
    await this.renderExtraPhotosStep(ctx);
  }

  @Action('ap:photo:undo')
  async onPhotoUndo(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    await this.clearExtraPhotosConfirmation(ctx);
    state(ctx).extraPhotoFileIds.pop();
    await this.renderExtraPhotosStep(ctx);
  }

  @Action('ap:main_photo:redo')
  async onMainPhotoRedo(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    state(ctx).mainPhotoFileId = undefined;
    await this.renderStep(ctx);
  }

  @Action('ap:main_photo:confirm')
  async onMainPhotoConfirm(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery().catch(() => undefined);
    state(ctx).stepIndex += 1;
    await this.renderStep(ctx);
  }

  @On('photo')
  async onPhoto(@Ctx() ctx: BotContext) {
    const s = state(ctx);
    const key = STEP_KEYS[s.stepIndex];
    const sizes = (ctx.message as any)?.photo as { file_id: string }[] | undefined;
    if (!sizes?.length) return;
    const fileId = sizes[sizes.length - 1].file_id;
    this.trackIncoming(ctx);

    if (key === 'mainPhoto') {
      s.mainPhotoFileId = fileId;
      await this.renderStep(ctx);
      return;
    }
    if (key === 'extraPhotos') {
      if (s.extraPhotoFileIds.length >= MAX_EXTRA_PHOTOS) {
        await ctx.reply(`Максимум ${MAX_EXTRA_PHOTOS} доп. фото.`);
        return;
      }
      await this.clearExtraPhotosConfirmation(ctx);
      s.extraPhotoFileIds.push(fileId);
      await this.renderExtraPhotosStep(ctx);
    }
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const s = state(ctx);
    const text = (ctx.message as any)?.text?.trim();
    if (!text) return;
    // The user's own answer is just noise once read — drop it so the chat
    // stays down to the single, in-place-edited step message.
    const incomingId = (ctx.message as any)?.message_id;
    if (incomingId) await ctx.deleteMessage(incomingId).catch(() => undefined);

    const key = STEP_KEYS[s.stepIndex];

    if (s.awaitingCustomInput) {
      s.awaitingCustomInput = false;
      if (key === 'materials' || key === 'colors' || key === 'sizes') {
        const values = text.split(',').map((v: string) => v.trim()).filter(Boolean);
        const list = this.multiSelectListFor(ctx);
        for (const value of values) {
          if (!list.includes(value)) list.push(value);
        }
        if (key === 'materials') {
          for (const value of values) await this.presets.remember('material', value);
        }
        await this.renderStep(ctx);
        return;
      }
      await this.applyAnswer(ctx, text);
      return;
    }

    if (key === 'price') {
      const parsed = parsePriceInput(text);
      if (!parsed) {
        await this.push(ctx, PRICE_INVALID_MESSAGE, { parse_mode: 'Markdown' });
        return;
      }
      s.price = parsed.price;
      s.currency = parsed.currency;
      s.stepIndex += 1;
      await this.renderStep(ctx);
      return;
    }

    if (key === 'description') {
      s.description = text;
      s.stepIndex += 1;
      await this.renderStep(ctx);
    }
  }

  private multiSelectListFor(ctx: BotContext): string[] {
    const s = state(ctx);
    const key = STEP_KEYS[s.stepIndex];
    if (key === 'materials') return s.materials;
    if (key === 'colors') return s.colors;
    return s.sizes;
  }

  private async applyAnswer(ctx: BotContext, value: string) {
    const s = state(ctx);
    const key = STEP_KEYS[s.stepIndex];

    switch (key) {
      case 'category': {
        const category = await this.products.findOrCreateCategory(value);
        s.categoryId = category.id;
        s.categorySlug = category.slug;
        break;
      }
      case 'subtype':
        s.subtype = value;
        await this.presets.remember('subtype', value);
        break;
      case 'brand':
        s.brand = value;
        await this.presets.remember('brand', value);
        break;
      case 'country':
        s.originCountry = value;
        if (value !== OWN_PRODUCTION_LABEL) await this.presets.remember('country', value);
        break;
      default:
        break;
    }

    s.stepIndex += 1;
    await this.renderStep(ctx);
  }

  private async finish(ctx: BotContext) {
    const s = state(ctx);
    const sellerId = this.auth.getSellerId(ctx.from!.id);
    if (!sellerId) {
      await ctx.reply('Сессия истекла, выполните /start заново.');
      await ctx.scene.leave();
      return;
    }
    if (
      !s.categoryId ||
      !s.subtype ||
      !s.brand ||
      !s.originCountry ||
      !s.price ||
      !s.currency ||
      !s.materials.length ||
      !s.colors.length ||
      !s.sizes.length ||
      !s.mainPhotoFileId
    ) {
      await ctx.reply('Не все обязательные поля заполнены, вернитесь назад и заполните их.');
      return;
    }

    await this.push(ctx, 'Сохраняю товар и обрабатываю фото...');

    const product = await this.products.create(sellerId, {
      categoryId: s.categoryId,
      subtype: s.subtype,
      brand: s.brand,
      originCountry: s.originCountry,
      price: s.price,
      currency: s.currency,
      materials: s.materials,
      colors: s.colors,
      sizes: s.sizes,
      photos: [],
      extraPhotos: [],
      description: s.description ?? null,
    });

    const mainUrl = await ctx.telegram.getFileLink(s.mainPhotoFileId);
    const mainPhoto = await this.images.storePhoto(mainUrl.toString(), product.id, 'main');

    const extraPhotos: string[] = [];
    for (let i = 0; i < s.extraPhotoFileIds.length; i += 1) {
      const url = await ctx.telegram.getFileLink(s.extraPhotoFileIds[i]);
      extraPhotos.push(await this.images.storePhoto(url.toString(), product.id, `extra-${i}`));
    }

    await this.products.update(sellerId, product.id, { photos: [mainPhoto], extraPhotos });
    const finalProduct = await this.products.findForSeller(sellerId, product.id);

    await this.cleanupMessages(ctx);
    await ctx.replyWithPhoto(s.mainPhotoFileId, {
      caption: buildProductSummary(finalProduct),
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✏️ Изменить', `edit_product:${product.id}`)],
        [Markup.button.callback('📤 Опубликовать', `publish_product:${product.id}`)],
      ]),
    });
    await ctx.scene.leave();
  }

  private trackIncoming(ctx: BotContext) {
    const id = (ctx.message as any)?.message_id;
    if (id) state(ctx).messageIds.push(id);
  }

  // Renders the current step's message. Edits the previous step message in
  // place when possible (keeps toggling colors/materials/sizes and moving
  // between steps from spamming a new message per tap), falling back to a
  // fresh message when there's nothing to edit yet (or it can't be edited,
  // e.g. the previous step sent a photo).
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

  private async cleanupMessages(ctx: BotContext) {
    const s = state(ctx);
    for (const id of s.messageIds) {
      await ctx.deleteMessage(id).catch(() => undefined);
    }
    s.messageIds = [];
  }

  private navRow(ctx: BotContext) {
    const s = state(ctx);
    const row: ReturnType<typeof Markup.button.callback>[] = [];
    if (s.stepIndex > 0) row.push(Markup.button.callback('◀️ Назад', 'ap:back'));
    row.push(Markup.button.callback('✏️ Свой вариант', 'ap:custom'));
    return row;
  }

  private backRow(ctx: BotContext) {
    const s = state(ctx);
    return s.stepIndex > 0 ? [Markup.button.callback('◀️ Назад', 'ap:back')] : [];
  }

  private cancelRow() {
    return [Markup.button.callback('❌ Отмена', 'ap:cancel')];
  }

  private async renderStep(ctx: BotContext) {
    const s = state(ctx);
    const key = STEP_KEYS[s.stepIndex];

    switch (key) {
      case 'category': {
        const categories = await this.products.categories();
        const options = categories.map((c) => c.name);
        s.currentOptions = options;
        await this.pushOptions(ctx, 'Выберите категорию товара:', options);
        break;
      }
      case 'subtype': {
        const custom = await this.presets.listCustom('subtype');
        const options = subtypesForCategory(s.categorySlug, custom);
        s.currentOptions = options;
        await this.pushOptions(ctx, 'Выберите подтип товара:', options);
        break;
      }
      case 'brand': {
        const custom = await this.presets.listCustom('brand');
        const options = [...custom.filter((v) => !BRAND_PRESETS.includes(v)), ...BRAND_PRESETS];
        s.currentOptions = options;
        await this.pushOptions(ctx, 'Выберите бренд/производителя:', options);
        break;
      }
      case 'country': {
        const custom = await this.presets.listCustom('country');
        const options = [
          OWN_PRODUCTION_LABEL,
          ...COUNTRY_PRESETS,
          ...custom.filter((v) => !COUNTRY_PRESETS.includes(v)),
        ];
        s.currentOptions = options;
        await this.pushOptions(ctx, 'Выберите страну происхождения:', options);
        break;
      }
      case 'price':
        s.currentOptions = undefined;
        await this.push(ctx, PRICE_PROMPT, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([this.backRow(ctx), this.cancelRow()].filter((r) => r.length)),
        });
        break;
      case 'materials': {
        const custom = await this.presets.listCustom('material');
        const options = [...MATERIAL_PRESETS, ...custom.filter((v) => !MATERIAL_PRESETS.includes(v))];
        s.currentOptions = options;
        await this.pushMultiSelect(ctx, 'Выберите материалы:', options, s.materials);
        break;
      }
      case 'colors':
        s.currentOptions = COLOR_PRESETS;
        await this.pushMultiSelect(ctx, 'Выберите цвета:', COLOR_PRESETS, s.colors);
        break;
      case 'sizes': {
        const grid = sizeGridForCategory(s.categorySlug);
        s.currentOptions = grid;
        await this.pushMultiSelect(ctx, 'Выберите размеры:', grid, s.sizes);
        break;
      }
      case 'mainPhoto':
        s.currentOptions = undefined;
        if (s.mainPhotoFileId) {
          // A photo message can't be edited from a text one — drop the old
          // step message (if any) instead of leaving it stranded.
          if (s.currentStepMessageId) {
            await ctx.deleteMessage(s.currentStepMessageId).catch(() => undefined);
            s.currentStepMessageId = undefined;
          }
          const message = await ctx.replyWithPhoto(s.mainPhotoFileId, {
            caption: 'Главное фото. Всё верно?',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('✅ Готово', 'ap:main_photo:confirm'), Markup.button.callback('🔄 Изменить', 'ap:main_photo:redo')],
              this.cancelRow(),
            ]),
          });
          s.messageIds.push(message.message_id);
        } else {
          await this.push(
            ctx,
            'Пришлите главное фото товара одним сообщением.',
            Markup.inlineKeyboard([this.backRow(ctx), this.cancelRow()].filter((r) => r.length)),
          );
        }
        break;
      case 'description':
        s.currentOptions = undefined;
        await this.push(
          ctx,
          'Добавьте описание товара (или пропустите).',
          Markup.inlineKeyboard(
            [[Markup.button.callback('⏭ Пропустить', 'ap:skip')], this.backRow(ctx), this.cancelRow()].filter((r) => r.length),
          ),
        );
        break;
      case 'extraPhotos':
        s.currentOptions = undefined;
        await this.renderExtraPhotosStep(ctx);
        break;
    }
  }

  // Plain-text collecting view — no per-photo modal, just a counter that's
  // edited in place as photos come in. "Готово" only appears once there's
  // at least one photo to confirm.
  private async renderExtraPhotosStep(ctx: BotContext) {
    const s = state(ctx);
    const count = s.extraPhotoFileIds.length;
    const text =
      count === 0
        ? `Пришлите фотографии (до ${MAX_EXTRA_PHOTOS} штук).`
        : `Добавлено фото: ${count}/${MAX_EXTRA_PHOTOS}. Пришлите ещё или нажмите «Готово».`;

    const rows = [
      [
        ...(count > 0 ? [Markup.button.callback('✅ Готово', 'ap:photo:done')] : []),
        Markup.button.callback('⏭ Пропустить', 'ap:skip'),
      ],
      count > 0 ? [Markup.button.callback('↩️ Убрать последнее', 'ap:photo:undo')] : [],
      this.backRow(ctx),
      this.cancelRow(),
    ].filter((r) => r.length);

    await this.push(ctx, text, Markup.inlineKeyboard(rows));
  }

  // The single confirmation "modal" shown once, after the user presses
  // "Готово": an album preview of everything added so far (Telegram media
  // groups can't carry inline buttons, so a single photo gets its keyboard
  // directly while an album needs a short follow-up message for it).
  private async showExtraPhotosConfirmation(ctx: BotContext) {
    const s = state(ctx);
    await this.clearExtraPhotosConfirmation(ctx);
    if (s.currentStepMessageId) {
      await ctx.deleteMessage(s.currentStepMessageId).catch(() => undefined);
      s.currentStepMessageId = undefined;
    }

    const caption = `Доп. фото (${s.extraPhotoFileIds.length}/${MAX_EXTRA_PHOTOS}). Всё верно?`;
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Подтвердить', 'ap:photo:confirm'), Markup.button.callback('➕ Добавить ещё', 'ap:photo:more')],
      [Markup.button.callback('↩️ Убрать последнее', 'ap:photo:undo')],
      this.cancelRow(),
    ]);

    const confirmIds: number[] = [];
    if (s.extraPhotoFileIds.length === 1) {
      const message = await ctx.replyWithPhoto(s.extraPhotoFileIds[0], { caption, ...keyboard });
      confirmIds.push(message.message_id);
    } else {
      const media = s.extraPhotoFileIds.map((fileId) => ({ type: 'photo' as const, media: fileId }));
      const albumMessages = await ctx.replyWithMediaGroup(media);
      confirmIds.push(...albumMessages.map((m) => m.message_id));
      const promptMessage = await ctx.reply(caption, keyboard);
      confirmIds.push(promptMessage.message_id);
    }

    s.extraPhotoConfirmMessageIds = confirmIds;
    s.messageIds.push(...confirmIds);
  }

  private async clearExtraPhotosConfirmation(ctx: BotContext) {
    const s = state(ctx);
    if (!s.extraPhotoConfirmMessageIds?.length) return;
    for (const id of s.extraPhotoConfirmMessageIds) {
      await ctx.deleteMessage(id).catch(() => undefined);
      const idx = s.messageIds.indexOf(id);
      if (idx >= 0) s.messageIds.splice(idx, 1);
    }
    s.extraPhotoConfirmMessageIds = undefined;
  }

  private async pushOptions(ctx: BotContext, text: string, options: string[]) {
    const rows: ReturnType<typeof Markup.button.callback>[][] = [];
    for (let i = 0; i < options.length; i += 2) {
      rows.push(options.slice(i, i + 2).map((opt, j) => Markup.button.callback(opt, `ap:pick:${i + j}`)));
    }
    rows.push(this.navRow(ctx));
    rows.push(this.cancelRow());
    await this.push(ctx, text, Markup.inlineKeyboard(rows));
  }

  private async pushMultiSelect(ctx: BotContext, text: string, options: string[], selected: string[]) {
    const rows: ReturnType<typeof Markup.button.callback>[][] = [];
    for (let i = 0; i < options.length; i += 2) {
      const row = options.slice(i, i + 2).map((opt, j) => {
        const index = i + j;
        const checked = selected.includes(opt);
        return Markup.button.callback(`${checked ? '✅ ' : ''}${opt}`, `ap:toggle:${index}`);
      });
      rows.push(row);
    }
    rows.push([Markup.button.callback('✅ Готово', 'ap:done')]);
    rows.push(this.navRow(ctx));
    rows.push(this.cancelRow());
    await this.push(ctx, `${text}${selected.length ? `\nВыбрано: ${selected.join(', ')}` : ''}`, Markup.inlineKeyboard(rows));
  }
}

function buildProductSummary(product: Product): string {
  const lines = [
    `<b>${escapeHtml(product.title)}</b>`,
    `Категория: ${escapeHtml(product.category?.name ?? '—')} / ${escapeHtml(product.subtype ?? '—')}`,
    `Бренд: ${escapeHtml(product.brand ?? '—')}`,
    `Страна: ${escapeHtml(product.originCountry ?? '—')}`,
    `Цена: ${product.price} ${product.currency}`,
    `Материалы: ${product.materials.join(', ') || '—'}`,
    `Цвета: ${product.colors.join(', ') || '—'}`,
    `Размеры: ${product.sizes.join(', ') || '—'}`,
  ];
  if (product.description) lines.push(`Описание: ${escapeHtml(product.description)}`);
  if (product.extraPhotos.length) lines.push(`Доп. фото: ${product.extraPhotos.length}`);
  return lines.join('\n');
}
