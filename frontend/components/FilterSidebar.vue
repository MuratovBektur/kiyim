<script setup lang="ts">
import type { Category, Seller } from '~/types';

defineProps<{
  categories: Category[];
  sellers: Seller[];
}>();

const categorySlug = defineModel<string>('categorySlug', { default: '' });
const sellerSlug = defineModel<string>('sellerSlug', { default: '' });
const minPrice = defineModel<number | undefined>('minPrice');
const maxPrice = defineModel<number | undefined>('maxPrice');
const sort = defineModel<string>('sort', { default: 'newest' });
</script>

<template>
  <aside class="space-y-6">
    <div>
      <h3 class="font-semibold mb-2">Категория</h3>
      <select v-model="categorySlug" class="w-full rounded border border-gray-300 px-3 py-2">
        <option value="">Все категории</option>
        <option v-for="c in categories" :key="c.id" :value="c.slug">{{ c.name }}</option>
      </select>
    </div>

    <div>
      <h3 class="font-semibold mb-2">Продавец</h3>
      <select v-model="sellerSlug" class="w-full rounded border border-gray-300 px-3 py-2">
        <option value="">Все продавцы</option>
        <option v-for="s in sellers" :key="s.id" :value="s.slug">{{ s.name }}</option>
      </select>
    </div>

    <div>
      <h3 class="font-semibold mb-2">Цена, ₸</h3>
      <div class="flex gap-2">
        <input
          type="number"
          v-model.number="minPrice"
          placeholder="от"
          class="w-1/2 rounded border border-gray-300 px-3 py-2"
        />
        <input
          type="number"
          v-model.number="maxPrice"
          placeholder="до"
          class="w-1/2 rounded border border-gray-300 px-3 py-2"
        />
      </div>
    </div>

    <div>
      <h3 class="font-semibold mb-2">Сортировка</h3>
      <select v-model="sort" class="w-full rounded border border-gray-300 px-3 py-2">
        <option value="newest">Сначала новые</option>
        <option value="price_asc">Цена: по возрастанию</option>
        <option value="price_desc">Цена: по убыванию</option>
      </select>
    </div>
  </aside>
</template>
