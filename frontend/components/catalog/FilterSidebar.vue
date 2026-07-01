<script setup lang="ts">
import type { Seller } from '~/types';
defineProps<{ sellers: Seller[] }>();
const sellerSlug = defineModel<string>('sellerSlug', { default: '' });
const minPrice = defineModel<number | undefined>('minPrice');
const maxPrice = defineModel<number | undefined>('maxPrice');
</script>

<template>
  <aside class="filter-sidebar">
    <FilterPanel
      v-model:seller-slug="sellerSlug"
      v-model:min-price="minPrice"
      v-model:max-price="maxPrice"
      :sellers="sellers"
      card
      compact
    />
  </aside>
</template>

<style lang="scss" scoped>
.filter-sidebar {
  display: none;

  @include r($bp-lg) {
    display: block;
    height: fit-content;
    position: sticky;
    top: 6rem;
  }
}
</style>
