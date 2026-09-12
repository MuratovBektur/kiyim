<script setup lang="ts">
import type { Product } from '~/types';

const props = defineProps<{ product: Product; index?: number }>();

// First row at normal desktop width (3-column catalog grid) loads eagerly;
// everything below the fold is lazy.
const CARDS_PER_ROW = 3;
const loading = computed(() => ((props.index ?? CARDS_PER_ROW) < CARDS_PER_ROW ? 'eager' : 'lazy'));

const { isWishlisted, toggleWishlist } = useWishlist();
const wishlisted = computed(() => isWishlisted(props.product.id));

function onToggleWishlist(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  toggleWishlist(props.product);
}
</script>

<template>
  <NuxtLink
    :to="`/products/${product.id}`"
    class="product-card"
    :class="{ 'product-card--oos': !product.inStock }"
  >
    <div class="product-card__image-wrap">
      <span v-if="!product.inStock" class="product-card__badge">Нет в наличии</span>
      <ClientOnly>
        <button
          type="button"
          class="product-card__wishlist"
          :class="{ 'product-card__wishlist--active': wishlisted }"
          :aria-label="wishlisted ? 'Убрать из избранного' : 'Добавить в избранное'"
          @click="onToggleWishlist"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" :fill="wishlisted ? 'currentColor' : 'none'">
            <path
              d="M12 20.5s-7.5-4.6-10-9.3C.5 8 1.7 4.5 5 3.4c2.2-.7 4.4.2 5.6 2 .3.4.9.4 1.2 0 1.2-1.8 3.4-2.7 5.6-2 3.3 1.1 4.5 4.6 3 7.8-2.5 4.7-10 9.3-10 9.3Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </ClientOnly>
      <video
        v-if="isVideoUrl(product.photos[0])"
        :src="photoVariantUrl(product.photos[0], 'card')"
        autoplay
        muted
        loop
        playsinline
        class="product-card__image"
      ></video>
      <img
        v-else
        :src="photoVariantUrl(product.photos[0], 'card')"
        :alt="product.title"
        class="product-card__image"
        :loading="loading"
      />
    </div>
    <div class="product-card__info">
      <p class="product-card__seller">{{ product.seller.name }}</p>
      <h3 class="product-card__title">{{ product.title }}</h3>
      <p class="product-card__price">
        {{ Number(product.price).toLocaleString('ru-RU') }} {{ product.currency }}
      </p>
    </div>
  </NuxtLink>
</template>

<style lang="scss" scoped>
.product-card {
  display: block;
  border-radius: 1rem;
  overflow: hidden;
  @include glass;
  @include glow;
  @include card-lift;

  &--oos { opacity: 0.6; }

  &__image-wrap {
    position: relative;
    aspect-ratio: 3 / 4;
    overflow: hidden;
  }

  &__badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    z-index: 1;
    background-color: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(4px);
    color: $stone-200;
    font-size: 10px;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;

    @include r($bp-sm) {
      top: 0.75rem;
      left: 0.75rem;
      font-size: 0.75rem;
      padding-inline: 0.625rem;
    }
  }

  &__image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    // On video, some mobile browsers intercept the tap for native
    // fullscreen/controls instead of letting it reach the wrapping link.
    pointer-events: none;
  }

  &__wishlist {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    color: $stone-100;
    background-color: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(4px);
    transition: color 0.2s, transform 0.15s;

    &:hover { transform: scale(1.1); }

    &--active { color: #f87171; }

    @include r($bp-sm) {
      top: 0.75rem;
      right: 0.75rem;
      width: 2rem;
      height: 2rem;
    }
  }

  &__info {
    padding: 0.75rem;

    @include r($bp-sm) { padding: 1rem; }
  }

  &__seller {
    font-size: 10px;
    color: $stone-500;

    @include r($bp-sm) { font-size: 0.75rem; }
  }

  &__title {
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 0.125rem;
    transition: color 0.2s;

    @include r($bp-sm) { font-size: 1rem; }

    .product-card:hover & { color: $lime-400; }
  }

  &__price {
    font-size: 0.875rem;
    font-weight: 700;
    color: $lime-400;
    margin-top: 0.375rem;

    @include r($bp-sm) {
      font-size: 1rem;
      margin-top: 0.5rem;
    }
  }
}
</style>
