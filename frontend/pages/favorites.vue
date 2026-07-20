<script setup lang="ts">
const { items, count } = useWishlist();
</script>

<template>
  <div class="favorites">
    <div class="favorites__container">
      <h1 class="favorites__title">Избранное</h1>

      <ClientOnly>
        <p v-if="count" class="favorites__count">
          <strong>{{ count }}</strong> {{ count === 1 ? 'товар' : 'товаров' }}
        </p>

        <div v-if="!items.length" class="favorites__empty">
          <p>В избранном пока ничего нет.</p>
          <NuxtLink to="/" class="favorites__empty-link">Перейти в каталог →</NuxtLink>
        </div>

        <div v-else class="favorites__grid">
          <ProductCard v-for="(product, index) in items" :key="product.id" :product="product" :index="index" />
        </div>

        <template #fallback>
          <p class="favorites__empty">Загрузка…</p>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.favorites {
  &__container {
    @include container;
    padding-block: 2rem;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;

    @include r($bp-sm) { font-size: 1.875rem; }
  }

  &__count {
    font-size: 0.875rem;
    color: $stone-400;
    margin-top: 0.5rem;
    margin-bottom: 1.25rem;

    strong {
      color: $stone-100;
      font-weight: 700;
    }
  }

  &__empty {
    padding-block: 3rem;
    color: $stone-400;
    text-align: center;
  }

  &__empty-link {
    display: inline-block;
    margin-top: 0.75rem;
    color: $lime-400;
    font-weight: 600;

    &:hover { color: $lime-300; }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-top: 1.5rem;

    @include r($bp-sm) {
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }
  }
}
</style>
