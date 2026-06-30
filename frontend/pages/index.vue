<script setup lang="ts">
import type { ProductFilters } from '~/composables/useProducts';

const search = ref('');
const categorySlug = ref('');
const sellerSlug = ref('');
const minPrice = ref<number>();
const maxPrice = ref<number>();
const sort = ref<'price_asc' | 'price_desc' | 'newest'>('newest');
const page = ref(1);
const limit = 12;

const query = computed<ProductFilters>(() => ({
  search: search.value || undefined,
  categorySlug: categorySlug.value || undefined,
  sellerSlug: sellerSlug.value || undefined,
  minPrice: minPrice.value || undefined,
  maxPrice: maxPrice.value || undefined,
  sort: sort.value,
  page: page.value,
  limit,
}));

watch([search, categorySlug, sellerSlug, minPrice, maxPrice, sort], () => {
  page.value = 1;
});

const { data: categories } = await useCategoriesList();
const { data: sellers } = await useSellersList();
const { data: productsData, pending } = useProductsList(query);
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <SearchBar v-model="search" />

    <div class="mt-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
      <FilterSidebar
        :categories="categories ?? []"
        :sellers="sellers ?? []"
        v-model:category-slug="categorySlug"
        v-model:seller-slug="sellerSlug"
        v-model:min-price="minPrice"
        v-model:max-price="maxPrice"
        v-model:sort="sort"
      />

      <div>
        <div v-if="pending" class="text-gray-500">Загрузка...</div>
        <div v-else-if="!productsData?.items.length" class="text-gray-500">Товары не найдены.</div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ProductCard v-for="product in productsData.items" :key="product.id" :product="product" />
        </div>

        <Pagination v-if="productsData" v-model="page" :total-pages="productsData.totalPages" />
      </div>
    </div>
  </div>
</template>
