<script setup lang="ts">
const search = defineModel<string>({ default: '' });

let timeout: ReturnType<typeof setTimeout>;
function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value;
  clearTimeout(timeout);
  timeout = setTimeout(() => { search.value = value; }, 300);
}
</script>

<template>
  <div class="search-bar">
    <span class="search-bar__icon">⌕</span>
    <input
      type="text"
      :value="search"
      placeholder="Поиск товаров…"
      class="search-bar__input"
      @input="onInput"
    />
  </div>
</template>

<style lang="scss" scoped>
.search-bar {
  display: flex;
  align-items: center;
  @include glass;
  border-radius: 999px;
  padding: 0.625rem 1rem;
  gap: 0.5rem;
  width: 100%;

  &__icon {
    color: $stone-500;
    font-size: 1.1rem;
    line-height: 1;
    flex-shrink: 0;
  }

  &__input {
    background: transparent;
    border: none;
    outline: none;
    font-size: 0.875rem;
    width: 100%;

    &::placeholder { color: $stone-500; }
  }
}
</style>
