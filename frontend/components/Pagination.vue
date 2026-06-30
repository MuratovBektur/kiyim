<script setup lang="ts">
defineProps<{ totalPages: number }>();
const page = defineModel<number>({ default: 1 });
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-center gap-3 mt-8">
    <button
      :disabled="page <= 1"
      @click="page--"
      class="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-40"
    >
      ←
    </button>
    <span class="text-sm text-gray-600">{{ page }} / {{ totalPages }}</span>
    <button
      :disabled="page >= totalPages"
      @click="page++"
      class="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-40"
    >
      →
    </button>
  </div>
</template>
