<script setup lang="ts">
import type { Seller } from '~/types';
defineProps<{ sellers: Seller[] }>();
const open = defineModel<boolean>('open', { default: false });
const sellerSlug = defineModel<string>('sellerSlug', { default: '' });
const minPrice = defineModel<number | undefined>('minPrice');
const maxPrice = defineModel<number | undefined>('maxPrice');

watch(open, (v) => {
  if (import.meta.client) document.body.classList.toggle('overflow-hidden', v);
});
</script>

<template>
  <Teleport to="body">
    <div
      class="filter-drawer__backdrop"
      :class="{ 'filter-drawer__backdrop--open': open }"
      @click="open = false"
    />
    <div class="filter-drawer" :class="{ 'filter-drawer--open': open }">
      <div class="filter-drawer__head">
        <h3 class="filter-drawer__title">Фильтры</h3>
        <button type="button" class="filter-drawer__close" aria-label="Закрыть" @click="open = false">✕</button>
      </div>
      <div class="filter-drawer__body">
        <FilterPanel
          v-model:seller-slug="sellerSlug"
          v-model:min-price="minPrice"
          v-model:max-price="maxPrice"
          :sellers="sellers"
        />
      </div>
      <div class="filter-drawer__foot">
        <button type="button" class="filter-drawer__submit" @click="open = false">Показать товары</button>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.filter-drawer {
  &__backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 40;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;

    @include r($bp-lg) { display: none; }

    &--open {
      opacity: 1;
      pointer-events: auto;
    }
  }

  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  background-color: $ink-800;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.5rem 1.5rem 0 0;
  max-height: 85vh;
  overflow-y: auto;
  transform: translateY(100%);
  transition: transform 0.3s ease;

  @include r($bp-lg) { display: none; }

  &--open { transform: translateY(0); }

  &__head {
    position: sticky;
    top: 0;
    background-color: $ink-800;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.25rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 700;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    font-size: 0.875rem;
    @include glass;
  }

  &__body {
    padding: 1.25rem;
  }

  &__foot {
    position: sticky;
    bottom: 0;
    background-color: $ink-800;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1.25rem;
  }

  &__submit {
    width: 100%;
    padding-block: 0.875rem;
    border-radius: 999px;
    background-color: $lime-400;
    color: $ink-900;
    font-weight: 700;
    font-size: 0.9375rem;
    transition: background-color 0.2s;

    &:hover { background-color: $lime-300; }
  }
}
</style>
