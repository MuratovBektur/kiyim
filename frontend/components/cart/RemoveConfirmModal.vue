<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean;
    message?: string;
  }>(),
  { message: '' },
);

const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="confirm-modal__overlay" @click.self="emit('cancel')">
      <div class="confirm-modal" role="dialog" aria-modal="true">
        <p class="confirm-modal__title">Удалить товар из корзины?</p>
        <p v-if="message" class="confirm-modal__message">{{ message }}</p>
        <div class="confirm-modal__actions">
          <button type="button" class="confirm-modal__btn confirm-modal__btn--cancel" @click="emit('cancel')">
            Отмена
          </button>
          <button type="button" class="confirm-modal__btn confirm-modal__btn--confirm" @click="emit('confirm')">
            Удалить
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.confirm-modal {
  &__overlay {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background-color: rgba(0, 0, 0, 0.6);
  }

  width: 100%;
  max-width: 22rem;
  border-radius: 1rem;
  padding: 1.5rem;
  background-color: $ink-800;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &__title {
    font-weight: 700;
    font-size: 1rem;
  }

  &__message {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: $stone-400;
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  &__btn {
    flex: 1;
    padding: 0.625rem 1rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.875rem;
    transition: background-color 0.2s, border-color 0.2s;

    &--cancel {
      @include glass;

      &:hover { border-color: rgba(255, 255, 255, 0.2); }
    }

    &--confirm {
      background-color: #f87171;
      color: $ink-900;

      &:hover { background-color: #fca5a5; }
    }
  }
}
</style>
