<script setup lang="ts">
import type { Seller } from '~/types';

const props = withDefaults(defineProps<{ sellers: Seller[]; card?: boolean; compact?: boolean }>(), {
  card: false,
  compact: false,
});

const sellerSlug = defineModel<string>('sellerSlug', { default: '' });
const minPrice = defineModel<number | undefined>('minPrice');
const maxPrice = defineModel<number | undefined>('maxPrice');

const sizes = ['S', 'M', 'L', 'XL'];
const selectedSizes = ref<string[]>([]);
function toggleSize(s: string) {
  const i = selectedSizes.value.indexOf(s);
  if (i === -1) selectedSizes.value.push(s);
  else selectedSizes.value.splice(i, 1);
}
</script>

<template>
  <div class="filter" :class="{ 'filter--compact': props.compact }">
    <div class="filter__group" :class="{ 'filter__group--card': props.card }">
      <h3 class="filter__heading">Бренд</h3>
      <div class="filter__brand-list">
        <label class="filter__brand-label">
          <input v-model="sellerSlug" type="radio" name="seller" value="" class="filter__radio" />
          Все бренды
        </label>
        <label v-for="s in sellers" :key="s.id" class="filter__brand-label">
          <input v-model="sellerSlug" type="radio" name="seller" :value="s.slug" class="filter__radio" />
          {{ s.name }}
          <span class="filter__rating">★ {{ s.rating.toFixed(1) }}</span>
        </label>
      </div>
    </div>

    <div class="filter__group" :class="{ 'filter__group--card': props.card }">
      <h3 class="filter__heading">Цена, ₸</h3>
      <div class="filter__price-range">
        <input v-model.number="minPrice" type="number" placeholder="от" class="filter__price-input" />
        <input v-model.number="maxPrice" type="number" placeholder="до" class="filter__price-input" />
      </div>
    </div>

    <div class="filter__group" :class="{ 'filter__group--card': props.card }">
      <h3 class="filter__heading">Размер</h3>
      <div class="filter__sizes">
        <button
          v-for="s in sizes"
          :key="s"
          type="button"
          class="filter__size-btn"
          :class="{ 'filter__size-btn--active': selectedSizes.includes(s) }"
          @click="toggleSize(s)"
        >{{ s }}</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.filter {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  &__group {
    &--card {
      @include glass;
      border-radius: 1rem;
      padding: 1.25rem;
    }
  }

  &__heading {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: $stone-400;
    margin-bottom: 0.75rem;
  }

  &__brand-list {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  &__brand-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: $stone-300;
    cursor: pointer;
  }

  &__radio {
    accent-color: $lime-400;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  &__rating {
    font-size: 0.75rem;
    color: $stone-500;
    margin-left: auto;
  }

  &__price-range {
    display: flex;
    gap: 0.5rem;
  }

  &__price-input {
    width: 50%;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    padding: 0.625rem 0.75rem;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s;

    &::placeholder { color: $stone-500; }
    &:focus { border-color: rgba($lime-400, 0.5); }
  }

  &__sizes {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  &__size-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.875rem;
    width: 2.75rem;
    height: 2.75rem;
    transition: border-color 0.2s, color 0.2s, background-color 0.2s;

    .filter--compact & {
      width: 2.25rem;
      height: 2.25rem;
      font-size: 0.75rem;
    }

    &:not(&--active):hover {
      border-color: $lime-400;
      color: $lime-400;
    }

    &--active {
      background-color: $lime-400;
      color: $ink-900;
      font-weight: 700;
      border-color: $lime-400;
    }
  }
}
</style>
