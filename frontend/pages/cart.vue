<script setup lang="ts">
import type { CartItem } from '~/types';

const { items, removeItem, setQuantity, totalsByCurrency, groupedBySeller } = useCart();

function lineTotal(item: CartItem): number {
  return Number(item.product.price) * item.quantity;
}

function inc(item: CartItem) {
  setQuantity(item.productId, item.size, item.color, item.quantity + 1);
}

function dec(item: CartItem) {
  if (item.quantity <= 1) {
    pendingRemove.value = item;
    return;
  }
  setQuantity(item.productId, item.size, item.color, item.quantity - 1);
}

const pendingRemove = ref<CartItem | null>(null);

function requestRemove(item: CartItem) {
  pendingRemove.value = item;
}

function confirmRemove() {
  if (pendingRemove.value) removeItem(pendingRemove.value.productId, pendingRemove.value.size, pendingRemove.value.color);
  pendingRemove.value = null;
}

function cancelRemove() {
  pendingRemove.value = null;
}

const { createOrder } = useOrders();
const { clearCart } = useCart();

const showOrderForm = ref(false);
const name = ref('');
const nameError = ref(false);
const phone = ref('');
const phoneError = ref(false);
const orderSubmitted = ref(false);
const orderError = ref('');
const submitting = ref(false);

function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, '').length >= 9;
}

async function handleOrderSubmit() {
  nameError.value = !name.value.trim();
  phoneError.value = !isValidPhone(phone.value);
  if (nameError.value || phoneError.value) return;

  orderError.value = '';
  submitting.value = true;
  try {
    await createOrder({
      name: name.value.trim(),
      phone: phone.value,
      items: items.value.map((item) => ({
        productId: item.productId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
    });
    orderSubmitted.value = true;
    clearCart();
  } catch {
    orderError.value = 'Не удалось оформить заказ. Попробуйте ещё раз.';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="cart">
    <div class="cart__container">
      <h1 class="cart__title">Корзина</h1>

      <ClientOnly>
      <div v-if="orderSubmitted" class="cart__empty">
        <p>Спасибо! Мы свяжемся с вами по номеру {{ phone }} для оформления заказа.</p>
        <NuxtLink to="/" class="cart__empty-link">Вернуться в каталог →</NuxtLink>
      </div>

      <div v-else-if="!items.length" class="cart__empty">
        <p>Ваша корзина пуста.</p>
        <NuxtLink to="/" class="cart__empty-link">Перейти в каталог →</NuxtLink>
      </div>

      <div v-else class="cart__layout">
        <div class="cart__groups">
          <section v-for="group in groupedBySeller" :key="group.seller.id" class="cart__group">
            <div class="cart__group-head">
              <img v-if="group.seller.logoUrl" :src="group.seller.logoUrl" class="cart__seller-logo" :alt="group.seller.name" />
              <span class="cart__seller-name">{{ group.seller.name }}</span>
            </div>

            <div
              v-for="item in group.items"
              :key="`${item.productId}::${item.size}::${item.color}`"
              class="cart__item"
            >
              <NuxtLink :to="`/products/${item.productId}`" class="cart__item-image">
                <img :src="photoVariantUrl(item.product.photos[0], 'thumb')" :alt="item.product.title" />
              </NuxtLink>

              <div class="cart__item-info">
                <NuxtLink :to="`/products/${item.productId}`" class="cart__item-title">{{ item.product.title }}</NuxtLink>
                <p v-if="item.size || item.color" class="cart__item-attrs">
                  <span v-if="item.size">Размер: {{ item.size }}</span>
                  <span v-if="item.color">Цвет: {{ item.color }}</span>
                </p>
                <p class="cart__item-price">{{ Number(item.product.price).toLocaleString('ru-RU') }} {{ item.product.currency }}</p>
              </div>

              <div class="cart__item-qty">
                <button type="button" class="cart__qty-btn" aria-label="Меньше" @click="dec(item)">−</button>
                <span class="cart__qty-value">{{ item.quantity }}</span>
                <button type="button" class="cart__qty-btn" aria-label="Больше" @click="inc(item)">+</button>
              </div>

              <p class="cart__item-total">{{ lineTotal(item).toLocaleString('ru-RU') }} {{ item.product.currency }}</p>

              <button
                type="button"
                class="cart__item-remove"
                aria-label="Удалить товар"
                @click="requestRemove(item)"
              >Удалить</button>
            </div>
          </section>
        </div>

        <RemoveConfirmModal
          :open="!!pendingRemove"
          :message="pendingRemove ? `«${pendingRemove.product.title}» будет удалён из корзины.` : ''"
          @confirm="confirmRemove"
          @cancel="cancelRemove"
        />

        <aside class="cart__summary">
          <h2 class="cart__summary-title">Итого</h2>
          <p v-for="(sum, currency) in totalsByCurrency" :key="currency" class="cart__summary-total">
            {{ sum.toLocaleString('ru-RU') }} {{ currency }}
          </p>

          <div v-if="!showOrderForm" class="cart__order-form">
            <button type="button" class="cart__order-submit" @click="showOrderForm = true">
              Оформить заказ
            </button>
          </div>

          <form v-else class="cart__order-form" @submit.prevent="handleOrderSubmit">
            <label for="cart-name" class="cart__order-label">Имя</label>
            <input
              id="cart-name"
              v-model="name"
              type="text"
              placeholder="Ваше имя"
              class="cart__order-input"
              :class="{ 'cart__order-input--error': nameError }"
              :disabled="submitting"
            />
            <p v-if="nameError" class="cart__order-error">Введите имя.</p>

            <label for="cart-phone" class="cart__order-label">Номер телефона</label>
            <input
              id="cart-phone"
              v-model="phone"
              type="tel"
              inputmode="tel"
              placeholder="+996 700 123 456"
              class="cart__order-input"
              :class="{ 'cart__order-input--error': phoneError }"
              :disabled="submitting"
            />
            <p v-if="phoneError" class="cart__order-error">Введите корректный номер телефона.</p>

            <p v-if="orderError" class="cart__order-error">{{ orderError }}</p>
            <button type="submit" class="cart__order-submit" :disabled="submitting">
              {{ submitting ? 'Оформляем…' : 'Отправить' }}
            </button>
          </form>
        </aside>
      </div>

      <template #fallback>
        <p class="cart__empty">Загрузка…</p>
      </template>
      </ClientOnly>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cart {
  &__container {
    @include container;
    padding-block: 2rem;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 1.5rem;

    @include r($bp-sm) { font-size: 1.875rem; }
  }

  &__empty {
    padding-block: 3rem;
    color: $stone-400;
    text-align: center;
  }

  &__empty-link {
    display: inline-block;
    margin-top: 0.75rem;
    color: $lime-400;
    font-weight: 600;

    &:hover { color: $lime-300; }
  }

  &__layout {
    display: grid;
    gap: 1.5rem;
    align-items: start;

    @include r($bp-md) {
      grid-template-columns: 1fr 18rem;
      gap: 2rem;
    }
  }

  &__groups {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-width: 0;
  }

  &__group {
    border-radius: 1rem;
    padding: 1.25rem;
    @include glass;
  }

  &__group-head {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin-bottom: 1rem;
  }

  &__seller-logo {
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__seller-name {
    font-weight: 600;
    font-size: 0.9375rem;
  }

  &__item {
    display: grid;
    grid-template-columns: 3.5rem 1fr auto;
    grid-template-areas:
      'image info remove'
      'image qty  qty';
    gap: 0.25rem 0.875rem;
    padding-block: 0.875rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    &:first-of-type { border-top: none; padding-top: 0; }

    @include r($bp-sm) {
      grid-template-columns: 4rem 1fr auto auto auto;
      grid-template-areas: 'image info qty total remove';
      align-items: center;
      gap: 1rem;
    }
  }

  &__item-image {
    grid-area: image;
    position: relative;
    width: 3.5rem;
    aspect-ratio: 3 / 4;
    border-radius: 0.5rem;
    overflow: hidden;
    flex-shrink: 0;

    @include r($bp-sm) { width: 4rem; }

    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__item-info {
    grid-area: info;
    min-width: 0;
  }

  &__item-title {
    display: block;
    font-weight: 600;
    font-size: 0.9375rem;
    transition: color 0.2s;

    &:hover { color: $lime-400; }
  }

  &__item-attrs {
    display: flex;
    gap: 0.75rem;
    font-size: 0.75rem;
    color: $stone-500;
    margin-top: 0.25rem;
  }

  &__item-price {
    font-size: 0.8125rem;
    color: $stone-400;
    margin-top: 0.25rem;

    @include r($bp-sm) { display: none; }
  }

  &__item-qty {
    grid-area: qty;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: fit-content;
    padding: 0.125rem;
    border-radius: 999px;
    @include glass;
  }

  &__qty-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    transition: color 0.2s;

    &:hover { color: $lime-400; }
  }

  &__qty-value {
    min-width: 1.25rem;
    text-align: center;
    font-size: 0.875rem;
    font-weight: 600;
  }

  &__item-total {
    grid-area: total;
    display: none;
    font-weight: 700;
    color: $lime-400;
    font-size: 0.9375rem;

    @include r($bp-sm) { display: block; }
  }

  &__item-remove {
    grid-area: remove;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1.75rem;
    padding-inline: 0.625rem;
    border-radius: 999px;
    color: $stone-500;
    font-size: 0.75rem;
    font-weight: 600;
    transition: color 0.2s, background-color 0.2s;
    justify-self: end;

    &:hover {
      color: #f87171;
      background-color: rgba(248, 113, 113, 0.1);
    }
  }

  &__order-form {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__order-label {
    font-size: 0.8125rem;
    color: $stone-400;
    line-height: 1.4;
  }

  &__order-input {
    padding: 0.625rem 0.875rem;
    border-radius: 0.625rem;
    font-size: 0.9375rem;
    @include glass;

    &::placeholder { color: $stone-500; }

    &--error { border-color: #f87171; }
  }

  &__order-error {
    font-size: 0.75rem;
    color: #f87171;
    margin-top: -0.25rem;
  }

  &__order-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    border-radius: 999px;
    background-color: $lime-400;
    color: $ink-900;
    font-weight: 700;
    font-size: 0.9375rem;
    transition: background-color 0.2s;

    &:hover:not(:disabled) { background-color: $lime-300; }

    &:disabled {
      background-color: $ink-700;
      color: $stone-500;
      cursor: not-allowed;
    }
  }

  &__summary {
    border-radius: 1rem;
    padding: 1.25rem;
    @include glass;
    position: sticky;
    top: 6rem;
  }

  &__summary-title {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
  }

  &__summary-total {
    font-size: 1.5rem;
    font-weight: 700;
    color: $lime-400;
  }

}
</style>
