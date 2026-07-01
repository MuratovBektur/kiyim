<script setup lang="ts">
const props = defineProps<{ totalPages: number }>();
const page = defineModel<number>({ default: 1 });

const visiblePages = computed(() => {
  const span = 2;
  const start = Math.max(1, page.value - span);
  const end = Math.min(props.totalPages, page.value + span);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
});
</script>

<template>
  <div v-if="totalPages > 1" class="pagination">
    <button type="button" class="pagination__btn" :disabled="page <= 1" aria-label="Назад" @click="page--">‹</button>
    <button
      v-for="p in visiblePages"
      :key="p"
      type="button"
      class="pagination__btn"
      :class="{ 'pagination__btn--active': p === page }"
      @click="page = p"
    >{{ p }}</button>
    <button type="button" class="pagination__btn" :disabled="page >= totalPages" aria-label="Вперёд" @click="page++">›</button>
  </div>
</template>

<style lang="scss" scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2.5rem;

  @include r($bp-sm) { margin-top: 3rem; }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    font-weight: 700;
    transition: border-color 0.2s, background-color 0.2s;
    @include glass;

    &:hover:not(:disabled) { border-color: rgba($lime-400, 0.5); }

    &:disabled {
      opacity: 0.3;
      pointer-events: none;
    }

    &--active {
      background-color: $lime-400;
      color: $ink-900;
      border-color: transparent;
      backdrop-filter: none;
    }
  }
}
</style>
