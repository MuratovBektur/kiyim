<script setup lang="ts">
import type { ProductFilters } from '~/composables/useProducts';

const search = useState<string>('catalogSearch', () => '');
const categorySlug = ref('');
const sellerSlug = ref('');
const minPrice = ref<number>();
const maxPrice = ref<number>();
const sort = ref<'price_asc' | 'price_desc' | 'newest'>('newest');
const page = ref(1);
const limit = 12;
const filtersOpen = ref(false);

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

watch([search, categorySlug, sellerSlug, minPrice, maxPrice, sort], () => { page.value = 1; });

const { data: categories } = await useCategoriesList();
const { data: sellers } = await useSellersList();
const { data: productsData, pending } = useProductsList(query);

const featuredProduct = computed(() => productsData.value?.items[0]);
</script>

<template>
  <div>
    <HeroBanner :featured-product="featuredProduct" />

    <CategoryChips v-model:category-slug="categorySlug" :categories="categories ?? []" />

    <div id="catalog" class="catalog-layout">
      <FilterSidebar
        v-model:seller-slug="sellerSlug"
        v-model:min-price="minPrice"
        v-model:max-price="maxPrice"
        :sellers="sellers ?? []"
      />

      <div class="catalog-main">
        <div class="catalog-toolbar">
          <button type="button" class="catalog-toolbar__filter-btn" @click="filtersOpen = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            Фильтры
          </button>
          <p class="catalog-toolbar__count catalog-toolbar__count--lg">
            Найдено <strong>{{ productsData?.total ?? 0 }}</strong> товаров
          </p>
          <select v-model="sort" class="catalog-toolbar__sort">
            <option value="newest">Сначала новые</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
          </select>
        </div>

        <p class="catalog-toolbar__count catalog-toolbar__count--sm">
          Найдено <strong>{{ productsData?.total ?? 0 }}</strong> товаров
        </p>

        <div v-if="pending" class="catalog-state">Загрузка…</div>
        <div v-else-if="!productsData?.items.length" class="catalog-state">Товары не найдены.</div>
        <div v-else class="catalog-grid">
          <ProductCard v-for="product in productsData.items" :key="product.id" :product="product" />
        </div>

        <Pagination v-if="productsData" v-model="page" :total-pages="productsData.totalPages" />
      </div>
    </div>

    <FilterDrawer
      v-model:open="filtersOpen"
      v-model:seller-slug="sellerSlug"
      v-model:min-price="minPrice"
      v-model:max-price="maxPrice"
      :sellers="sellers ?? []"
    />
  </div>
</template>

<style lang="scss" scoped>
.catalog-layout {
  @include container;
  padding-bottom: 4rem;
  display: grid;
  gap: 1.5rem;

  @include r($bp-lg) {
    grid-template-columns: 260px 1fr;
    gap: 2.5rem;
  }
}

.catalog-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;

  @include r($bp-sm) { margin-bottom: 1.5rem; }

  &__filter-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-inline: 1rem;
    height: 2.5rem;
    border-radius: 999px;
    font-size: 0.875rem;
    font-weight: 500;
    flex-shrink: 0;
    @include glass;
    transition: border-color 0.2s;

    &:hover { border-color: rgba($lime-400, 0.5); }

    @include r($bp-lg) { display: none; }
  }

  &__count {
    font-size: 0.875rem;
    color: $stone-400;

    strong {
      color: $stone-100;
      font-weight: 700;
    }

    &--lg {
      display: none;
      @include r($bp-lg) { display: block; }
    }

    &--sm {
      margin-bottom: 1rem;
      @include r($bp-lg) { display: none; }
    }
  }

  &__sort {
    height: 2.5rem;
    padding-left: 0.75rem;
    padding-right: 2rem;
    border-radius: 999px;
    font-size: 0.75rem;
    background-color: $ink-800;
    border: 1px solid rgba(255, 255, 255, 0.08);
    cursor: pointer;
    margin-left: auto;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    transition: border-color 0.2s;

    &:hover { border-color: rgba($lime-400, 0.5); }

    @include r($bp-sm) {
      font-size: 0.875rem;
      padding-left: 1rem;
    }
  }
}

.catalog-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @include r($bp-sm) {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }
}

.catalog-state {
  text-align: center;
  padding-block: 3rem;
  color: $stone-500;
}
</style>
