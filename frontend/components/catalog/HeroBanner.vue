<script setup lang="ts">
import type { Product } from '~/types';
defineProps<{ featuredProduct?: Product }>();
</script>

<template>
  <section class="hero">
    <div class="hero__noise" aria-hidden="true" />
    <div class="hero__inner">
      <div class="hero__content">
        <span class="hero__badge">
          <span class="hero__badge-dot" />
          DROP 04 · ОГРАНИЧЕННАЯ СЕРИЯ
        </span>
        <h1 class="hero__title">
          СТИЛЬ БЕЗ<br /><span>КОМПРОМИССОВ</span>
        </h1>
        <p class="hero__desc">
          Премиальные вещи от независимых брендов. Лимитированные тиражи, без переплаты посредникам.
        </p>
        <div class="hero__actions">
          <a href="#catalog" class="hero__btn hero__btn--primary">В каталог</a>
          <a href="#catalog" class="hero__btn hero__btn--secondary">Смотреть дроп</a>
        </div>
      </div>

      <div class="hero__visual">
        <div class="hero__image-wrap">
          <img
            :src="featuredProduct?.imageUrl ?? 'https://picsum.photos/seed/kiyim-hero/600/700'"
            :alt="featuredProduct?.title ?? 'kiyim'"
            class="hero__image"
          />
        </div>
        <div v-if="featuredProduct" class="hero__featured">
          <p class="hero__featured-label">Сейчас в топе</p>
          <p class="hero__featured-price">
            {{ Number(featuredProduct.price).toLocaleString('ru-RU') }} {{ featuredProduct.currency }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.hero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &__noise {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      radial-gradient(circle at 20% 20%, rgba(174, 242, 0, 0.08), transparent 40%),
      radial-gradient(circle at 80% 60%, rgba(174, 242, 0, 0.06), transparent 40%);
  }

  &__inner {
    position: relative;
    @include container;
    padding-block: 2rem;
    display: grid;
    gap: 2rem;

    @include r($bp-sm) {
      padding-block: 5rem;
      gap: 2.5rem;
    }

    @include r($bp-hero) {
      grid-template-columns: 1fr 1fr;
      align-items: center;
    }
  }

  &__content { /* left column */ }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    @include glass;
    border-radius: 999px;
    padding: 0.375rem 0.875rem;
    font-size: 11px;
    font-weight: 600;
    color: $lime-400;
    margin-bottom: 1rem;

    @include r($bp-sm) {
      font-size: 0.75rem;
      margin-bottom: 1.5rem;
    }
  }

  &__badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: $lime-400;
    flex-shrink: 0;
    animation: badge-pulse 2s ease-in-out infinite;
  }

  &__title {
    font-size: 7.5vw;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.025em;
    margin-bottom: 1rem;

    @include r($bp-sm) {
      font-size: 3rem;
      margin-bottom: 1.5rem;
    }

    @include r($bp-hero) {
      font-size: 3.75rem;
    }

    span { color: $lime-400; }
  }

  &__desc {
    color: $stone-400;
    font-size: 0.875rem;
    line-height: 1.6;
    max-width: 28rem;
    margin-bottom: 1.5rem;

    @include r($bp-sm) {
      font-size: 1.125rem;
      margin-bottom: 2rem;
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    @include r($bp-sm) {
      flex-direction: row;
      gap: 1rem;
    }
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.875rem 1.75rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.9375rem;
    transition: background-color 0.2s, border-color 0.2s;
    width: 100%;

    @include r($bp-sm) { width: auto; }

    &--primary {
      background-color: $lime-400;
      color: $ink-900;
      &:hover { background-color: $lime-300; }
    }

    &--secondary {
      @include glass;
      &:hover { border-color: rgba($lime-400, 0.5); }
    }
  }

  &__visual {
    position: relative;
    height: 12rem;

    @include r($bp-sm) { height: 16rem; }
    @include r($bp-hero) { height: 26.25rem; }
  }

  &__image-wrap {
    position: absolute;
    inset: 0;
    border-radius: 1.5rem;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
    @include glass;
    @include glow;
    @include card-lift;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.9;
  }

  &__featured {
    position: absolute;
    bottom: -1.25rem;
    left: -1rem;
    @include glass;
    border-radius: 1rem;
    padding: 0.75rem;
    width: 9rem;

    @include r($bp-sm) {
      bottom: -1.5rem;
      left: -1.5rem;
      padding: 1rem;
      width: 12rem;
    }
  }

  &__featured-label {
    font-size: 10px;
    color: $stone-400;

    @include r($bp-sm) { font-size: 0.75rem; }
  }

  &__featured-price {
    font-weight: 700;
    color: $lime-400;
    font-size: 0.875rem;
    margin-top: 0.125rem;

    @include r($bp-sm) { font-size: 1rem; }
  }
}

@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
</style>
