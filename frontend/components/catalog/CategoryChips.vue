<script setup lang="ts">
import type { Category } from '~/types';
defineProps<{ categories: Category[] }>();
const categorySlug = defineModel<string>('categorySlug', { default: '' });
</script>

<template>
  <div class="categories">
    <div class="categories__list scrollbar-hide">
      <button
        type="button"
        class="categories__chip"
        :class="{ 'categories__chip--active': !categorySlug }"
        @click="categorySlug = ''"
      >Всё</button>
      <button
        v-for="c in categories"
        :key="c.id"
        type="button"
        class="categories__chip"
        :class="{ 'categories__chip--active': categorySlug === c.slug }"
        @click="categorySlug = c.slug"
      >{{ c.name }}</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.categories {
  @include container;
  padding-block: 1.25rem;

  @include r($bp-sm) { padding-block: 1.5rem; }

  &__list {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    margin-inline: -1rem;
    padding-inline: 1rem;

    @include r($bp-sm) {
      margin-inline: 0;
      padding-inline: 0;
    }
  }

  &__chip {
    flex-shrink: 0;
    padding: 0.625rem 1rem;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: border-color 0.2s, background-color 0.2s, color 0.2s;

    @include r($bp-sm) { padding-inline: 1.25rem; }

    &:not(&--active) {
      @include glass;
      &:hover { border-color: rgba($lime-400, 0.5); }
    }

    &--active {
      background-color: $lime-400;
      color: $ink-900;
      font-weight: 700;
      border: 1px solid transparent;
    }
  }
}
</style>
