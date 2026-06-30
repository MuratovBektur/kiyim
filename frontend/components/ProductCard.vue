<script setup lang="ts">
import type { Product } from '~/types';

defineProps<{ product: Product }>();
</script>

<template>
  <NuxtLink
    :to="`/products/${product.id}`"
    class="block rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
  >
    <img :src="product.imageUrl ?? undefined" :alt="product.title" class="w-full h-56 object-cover" />
    <div class="p-3">
      <p class="text-xs text-gray-500">{{ product.seller.name }}</p>
      <h3 class="font-medium truncate">{{ product.title }}</h3>
      <p class="mt-1 font-semibold">
        {{ Number(product.price).toLocaleString('ru-RU') }} {{ product.currency }}
      </p>
    </div>
  </NuxtLink>
</template>
