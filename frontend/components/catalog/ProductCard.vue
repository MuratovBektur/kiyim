<script setup lang="ts">
import type { Product } from '~/types';
defineProps<{ product: Product }>();
</script>

<template>
  <NuxtLink
    :to="`/products/${product.id}`"
    class="product-card"
    :class="{ 'product-card--oos': !product.inStock }"
  >
    <div class="product-card__image-wrap">
      <span v-if="!product.inStock" class="product-card__badge">Нет в наличии</span>
      <img :src="product.imageUrl ?? undefined" :alt="product.title" class="product-card__image" />
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

  &__image-wrap { position: relative; }

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
    width: 100%;
    height: 10rem;
    object-fit: cover;
    display: block;

    @include r($bp-sm) { height: 14rem; }
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
