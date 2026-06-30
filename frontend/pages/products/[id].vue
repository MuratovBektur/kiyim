<script setup lang="ts">
const route = useRoute();
const { data: product, pending, error } = await useProduct(route.params.id as string);
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <NuxtLink to="/" class="text-indigo-600 hover:underline">← Назад к каталогу</NuxtLink>

    <div v-if="pending" class="mt-6 text-gray-500">Загрузка...</div>
    <div v-else-if="error || !product" class="mt-6 text-red-600">Товар не найден.</div>

    <div v-else class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      <img :src="product.imageUrl ?? undefined" :alt="product.title" class="w-full rounded-lg object-cover" />

      <div>
        <h1 class="text-2xl font-semibold">{{ product.title }}</h1>
        <p class="text-gray-500 mt-1">{{ product.category.name }}</p>
        <p class="text-3xl font-bold mt-4">
          {{ Number(product.price).toLocaleString('ru-RU') }} {{ product.currency }}
        </p>

        <p v-if="product.description" class="mt-4 text-gray-700">{{ product.description }}</p>

        <div class="mt-4" v-if="product.sizes?.length">
          <h3 class="font-semibold">Размеры</h3>
          <div class="flex gap-2 mt-1 flex-wrap">
            <span v-for="s in product.sizes" :key="s" class="px-3 py-1 border rounded">{{ s }}</span>
          </div>
        </div>

        <div class="mt-4" v-if="product.colors?.length">
          <h3 class="font-semibold">Цвета</h3>
          <div class="flex gap-2 mt-1 flex-wrap">
            <span v-for="c in product.colors" :key="c" class="px-3 py-1 border rounded">{{ c }}</span>
          </div>
        </div>

        <div class="mt-6 p-4 border rounded-lg flex items-center gap-3">
          <img v-if="product.seller.logoUrl" :src="product.seller.logoUrl" class="w-10 h-10 rounded-full" />
          <div>
            <p class="font-medium">{{ product.seller.name }}</p>
            <p class="text-sm text-gray-500">★ {{ product.seller.rating.toFixed(1) }}</p>
          </div>
        </div>

        <a
          :href="product.sellerUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-4 inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
        >
          Купить у продавца →
        </a>
      </div>
    </div>
  </div>
</template>
