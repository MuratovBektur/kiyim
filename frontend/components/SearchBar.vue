<script setup lang="ts">
const search = defineModel<string>({ default: '' });

let timeout: ReturnType<typeof setTimeout>;
function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    search.value = value;
  }, 300);
}
</script>

<template>
  <input
    type="text"
    :value="search"
    @input="onInput"
    placeholder="Поиск по названию товара..."
    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  />
</template>
