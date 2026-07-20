<script setup lang="ts">
import { SOCIAL_ICON_PATHS, type SocialKey } from '~/utils/social-icons';

const route = useRoute();
const { data: product, pending, error } = await useProduct(route.params.id as string);

const activePhotoIndex = ref(0);

const allPhotos = computed(() => {
  if (!product.value) return [];
  return [product.value.photos[0], ...product.value.extraPhotos].filter((p): p is string => Boolean(p));
});

const activePhotoUrl = computed(() => photoVariantUrl(allPhotos.value[activePhotoIndex.value], 'gallery'));

const { items, addToCart, removeItem, setQuantity } = useCart();
const { isWishlisted, toggleWishlist } = useWishlist();
const selectedSize = ref<string | null>(null);
const selectedColor = ref<string | null>(null);

const wishlisted = computed(() => (product.value ? isWishlisted(product.value.id) : false));

function handleToggleWishlist() {
  if (product.value) toggleWishlist(product.value);
}

watchEffect(() => {
  if (product.value?.sizes?.length && !selectedSize.value) selectedSize.value = product.value.sizes[0];
  if (product.value?.colors?.length && !selectedColor.value) selectedColor.value = product.value.colors[0];
});

// Once the currently selected size/color is already in the cart, the "Add to
// cart" button switches to a quantity stepper editing that cart line directly.
const cartItem = computed(() => {
  if (!product.value) return undefined;
  return items.value.find(
    (i) => i.productId === product.value!.id && i.size === selectedSize.value && i.color === selectedColor.value,
  );
});

function handleAddToCart() {
  if (!product.value) return;
  addToCart(product.value, selectedSize.value, selectedColor.value, 1);
}

const pendingRemove = ref(false);

function changeCartQuantity(delta: number) {
  if (!cartItem.value) return;
  if (delta < 0 && cartItem.value.quantity <= 1) {
    pendingRemove.value = true;
    return;
  }
  setQuantity(cartItem.value.productId, cartItem.value.size, cartItem.value.color, cartItem.value.quantity + delta);
}

function confirmRemoveFromCart() {
  if (cartItem.value) removeItem(cartItem.value.productId, cartItem.value.size, cartItem.value.color);
  pendingRemove.value = false;
}

const whatsappUrl = computed(() => {
  const seller = product.value?.seller;
  if (!seller) return undefined;
  if (seller.whatsapp) return seller.whatsapp;
  const phone = seller.contactPhone;
  return phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : undefined;
});

const socialLinks = computed(() => {
  const seller = product.value?.seller;
  if (!seller) return [];
  const entries: { key: SocialKey; url: string; label: string }[] = [
    { key: 'whatsapp', url: whatsappUrl.value ?? '', label: 'Написать в WhatsApp' },
    { key: 'telegram', url: seller.telegramContact ?? '', label: 'Написать в Telegram' },
    { key: 'instagram', url: seller.instagram ?? '', label: 'Открыть Instagram' },
  ];
  return entries.filter((entry) => entry.url);
});
</script>

<template>
  <div class="pd">
    <div class="pd__container">
      <NuxtLink to="/" class="pd__back">← Назад к каталогу</NuxtLink>

      <div v-if="pending" class="pd__state">Загрузка…</div>
      <div v-else-if="error || !product" class="pd__state pd__state--error">Товар не найден.</div>

      <div v-else class="pd__grid">
        <div>
          <div class="pd__image-wrap" :class="{ 'pd__image-wrap--oos': !product.inStock }">
            <span v-if="!product.inStock" class="pd__oos-badge">Нет в наличии</span>
            <img :src="activePhotoUrl" :alt="product.title" class="pd__image" />
          </div>

          <div v-if="allPhotos.length > 1" class="pd__thumbs">
            <button v-for="(photo, index) in allPhotos" :key="photo" type="button" class="pd__thumb"
              :class="{ 'pd__thumb--active': index === activePhotoIndex }" @click="activePhotoIndex = index">
              <img :src="photoVariantUrl(photo, 'thumb')" :alt="`${product.title} ${index + 1}`" />
            </button>
          </div>
        </div>

        <div class="pd__info">
          <div class="pd__title-row">
            <h1 class="pd__title">{{ product.title }}</h1>
            <ClientOnly>
              <button
                type="button"
                class="pd__wishlist"
                :class="{ 'pd__wishlist--active': wishlisted }"
                :aria-label="wishlisted ? 'Убрать из избранного' : 'Добавить в избранное'"
                @click="handleToggleWishlist"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" :fill="wishlisted ? 'currentColor' : 'none'">
                  <path
                    d="M12 20.5s-7.5-4.6-10-9.3C.5 8 1.7 4.5 5 3.4c2.2-.7 4.4.2 5.6 2 .3.4.9.4 1.2 0 1.2-1.8 3.4-2.7 5.6-2 3.3 1.1 4.5 4.6 3 7.8-2.5 4.7-10 9.3-10 9.3Z"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </ClientOnly>
          </div>
          <p class="pd__category">{{ product.category.name }}</p>
          <p class="pd__price">{{ Number(product.price).toLocaleString('ru-RU') }} {{ product.currency }}</p>

          <p v-if="product.description" class="pd__desc">{{ product.description }}</p>

          <div v-if="product.sizes?.length" class="pd__attr">
            <h3 class="pd__attr-label">Размер</h3>
            <div class="pd__chips">
              <button v-for="s in product.sizes" :key="s" type="button" class="pd__chip pd__chip--select"
                :class="{ 'pd__chip--active': s === selectedSize }" @click="selectedSize = s">{{ s }}</button>
            </div>
          </div>

          <div v-if="product.colors?.length" class="pd__attr">
            <h3 class="pd__attr-label">Цвет</h3>
            <div class="pd__chips">
              <button v-for="c in product.colors" :key="c" type="button" class="pd__chip pd__chip--select"
                :class="{ 'pd__chip--active': c === selectedColor }" @click="selectedColor = c">{{ c }}</button>
            </div>
          </div>

          <ClientOnly>
            <button v-if="!cartItem" type="button" class="pd__add-to-cart" :disabled="!product.inStock"
              @click="handleAddToCart">
              {{ product.inStock ? 'Добавить в корзину' : 'Нет в наличии' }}
            </button>

            <div v-else class="pd__in-cart">
              <div class="pd__qty">
                <button type="button" class="pd__qty-btn" aria-label="Меньше" @click="changeCartQuantity(-1)">−</button>
                <span class="pd__qty-value">{{ cartItem.quantity }}</span>
                <button type="button" class="pd__qty-btn" aria-label="Больше" @click="changeCartQuantity(1)">+</button>
              </div>
              <NuxtLink to="/cart" class="pd__add-to-cart pd__add-to-cart--goto">Перейти в корзину</NuxtLink>
            </div>

            <template #fallback>
              <button type="button" class="pd__add-to-cart" disabled>
                {{ product.inStock ? 'Добавить в корзину' : 'Нет в наличии' }}
              </button>
            </template>
          </ClientOnly>

          <RemoveConfirmModal :open="pendingRemove"
            :message="product ? `«${product.title}» будет удалён из корзины.` : ''" @confirm="confirmRemoveFromCart"
            @cancel="pendingRemove = false" />

          <div class="pd__seller">
            <img v-if="product.seller.logoUrl" :src="product.seller.logoUrl" class="pd__seller-logo"
              :alt="product.seller.name" />
            <div>
              <p class="pd__seller-name">{{ product.seller.name }}</p>
              <p class="pd__seller-rating">★ {{ product.seller.rating.toFixed(1) }}</p>
            </div>
          </div>

          <a v-if="product.sellerUrl" :href="product.sellerUrl" target="_blank" rel="noopener noreferrer"
            class="pd__cta">
            Купить у продавца →
          </a>

          <div v-if="socialLinks.length" class="pd__social-buttons">
            <a v-for="link in socialLinks" :key="link.key" :href="link.url" target="_blank" rel="noopener noreferrer"
              class="pd__social-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                <path :d="SOCIAL_ICON_PATHS[link.key]" />
              </svg>
              <span>{{ link.label }} →</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pd {
  &__container {
    @include container;
    padding-block: 2rem;
  }

  &__back {
    display: inline-block;
    font-size: 0.875rem;
    color: $stone-400;
    margin-bottom: 1.5rem;
    transition: color 0.2s;

    &:hover {
      color: $lime-400;
    }
  }

  &__state {
    padding-block: 3rem;
    color: $stone-500;

    &--error {
      color: #f87171;
    }
  }

  &__grid {
    display: grid;
    gap: 2rem;

    @include r($bp-md) {
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
    }
  }

  &__image-wrap {
    position: relative;
    aspect-ratio: 3 / 4;
    border-radius: 1rem;
    overflow: hidden;
    outline: 1px solid rgba(255, 255, 255, 0.1);
    outline-offset: -1px;

    &--oos {
      opacity: 0.6;
    }
  }

  &__oos-badge {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 1;
    background-color: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
    color: $stone-200;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
  }

  &__image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__thumbs {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  &__thumb {
    position: relative;
    width: 4rem;
    aspect-ratio: 3 / 4;
    border-radius: 0.5rem;
    overflow: hidden;
    outline: 2px solid transparent;
    outline-offset: -2px;
    opacity: 0.6;
    transition: opacity 0.2s, outline-color 0.2s;

    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    &:hover {
      opacity: 0.9;
    }

    &--active {
      opacity: 1;
      outline-color: $lime-400;
    }
  }

  &__title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;

    @include r($bp-sm) {
      font-size: 1.875rem;
    }
  }

  &__wishlist {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 50%;
    color: $stone-300;
    flex-shrink: 0;
    @include glass;
    transition: color 0.2s, transform 0.15s;

    &:hover { transform: scale(1.08); }

    &--active { color: #f87171; }
  }

  &__category {
    font-size: 0.875rem;
    color: $stone-500;
    margin-top: 0.25rem;
  }

  &__price {
    font-size: 1.875rem;
    font-weight: 700;
    color: $lime-400;
    margin-top: 1rem;
  }

  &__desc {
    font-size: 0.9375rem;
    color: $stone-300;
    line-height: 1.6;
    margin-top: 1rem;
  }

  &__attr {
    margin-top: 1rem;
  }

  &__attr-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $stone-400;
    margin-bottom: 0.5rem;
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__chip {
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    @include glass;

    &--select {
      transition: border-color 0.2s, color 0.2s;

      &:hover {
        border-color: rgba($lime-400, 0.5);
      }
    }

    &--active {
      border-color: $lime-400;
      color: $lime-400;
    }
  }

  &__qty {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: fit-content;
    padding: 0.25rem;
    border-radius: 999px;
    @include glass;
  }

  &__qty-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    font-size: 1.125rem;
    transition: color 0.2s;

    &:hover {
      color: $lime-400;
    }
  }

  &__qty-value {
    min-width: 1.5rem;
    text-align: center;
    font-weight: 600;
  }

  &__add-to-cart {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.875rem 1.75rem;
    border-radius: 999px;
    background-color: $lime-400;
    color: $ink-900;
    font-weight: 700;
    font-size: 1rem;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
      background-color: $lime-300;
    }

    &:disabled {
      background-color: $ink-700;
      color: $stone-500;
      cursor: not-allowed;
    }

    &:not(#{&}--goto) {
      margin-top: 1.5rem;
    }

    @include r($bp-sm) {
      width: fit-content;
    }

    &--goto {
      flex: 1 1 auto;
      white-space: nowrap;
    }
  }

  &__in-cart {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: 1.25rem;
    @include glass;

    .pd__qty {
      border: none;
      background: none;
      backdrop-filter: none;
      padding-left: 0.5rem;
      flex-shrink: 0;
    }
  }

  &__seller {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: 1rem;
    @include glass;
  }

  &__seller-logo {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__seller-name {
    font-weight: 600;
    font-size: 0.9375rem;
  }

  &__seller-rating {
    font-size: 0.875rem;
    color: $stone-500;
    margin-top: 0.125rem;
  }

  &__social-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  &__social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    padding: 0.875rem 1.75rem;
    border-radius: 999px;
    color: $stone-100;
    font-weight: 700;
    font-size: 1rem;
    @include glass;
    transition: color 0.2s, transform 0.2s;

    &:hover {
      color: $lime-400;
      transform: translateY(-2px);
    }
  }

  &__cta {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1.5rem;
    padding: 0.875rem 1.75rem;
    border-radius: 999px;
    background-color: $lime-400;
    color: $ink-900;
    font-weight: 700;
    font-size: 1rem;
    transition: background-color 0.2s;

    &:hover {
      background-color: $lime-300;
    }

    @include r($bp-sm) {
      width: fit-content;
    }
  }
}
</style>
