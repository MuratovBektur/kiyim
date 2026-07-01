<script setup lang="ts">
const route = useRoute();
const { data: product, pending, error } = await useProduct(route.params.id as string);
</script>

<template>
  <div class="pd">
    <div class="pd__container">
      <NuxtLink to="/" class="pd__back">← Назад к каталогу</NuxtLink>

      <div v-if="pending" class="pd__state">Загрузка…</div>
      <div v-else-if="error || !product" class="pd__state pd__state--error">Товар не найден.</div>

      <div v-else class="pd__grid">
        <div class="pd__image-wrap" :class="{ 'pd__image-wrap--oos': !product.inStock }">
          <span v-if="!product.inStock" class="pd__oos-badge">Нет в наличии</span>
          <img :src="product.imageUrl ?? undefined" :alt="product.title" class="pd__image" />
        </div>

        <div class="pd__info">
          <h1 class="pd__title">{{ product.title }}</h1>
          <p class="pd__category">{{ product.category.name }}</p>
          <p class="pd__price">{{ Number(product.price).toLocaleString('ru-RU') }} {{ product.currency }}</p>

          <p v-if="product.description" class="pd__desc">{{ product.description }}</p>

          <div v-if="product.sizes?.length" class="pd__attr">
            <h3 class="pd__attr-label">Размеры</h3>
            <div class="pd__chips">
              <span v-for="s in product.sizes" :key="s" class="pd__chip">{{ s }}</span>
            </div>
          </div>

          <div v-if="product.colors?.length" class="pd__attr">
            <h3 class="pd__attr-label">Цвета</h3>
            <div class="pd__chips">
              <span v-for="c in product.colors" :key="c" class="pd__chip">{{ c }}</span>
            </div>
          </div>

          <div class="pd__seller">
            <img v-if="product.seller.logoUrl" :src="product.seller.logoUrl" class="pd__seller-logo" :alt="product.seller.name" />
            <div>
              <p class="pd__seller-name">{{ product.seller.name }}</p>
              <p class="pd__seller-rating">★ {{ product.seller.rating.toFixed(1) }}</p>
            </div>
          </div>

          <a :href="product.sellerUrl" target="_blank" rel="noopener noreferrer" class="pd__cta">
            Купить у продавца →
          </a>
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

    &:hover { color: $lime-400; }
  }

  &__state {
    padding-block: 3rem;
    color: $stone-500;

    &--error { color: #f87171; }
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
    border-radius: 1rem;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);

    &--oos { opacity: 0.6; }
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
    width: 100%;
    object-fit: cover;
    display: block;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;

    @include r($bp-sm) { font-size: 1.875rem; }
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

    &:hover { background-color: $lime-300; }

    @include r($bp-sm) {
      width: fit-content;
    }
  }
}
</style>
