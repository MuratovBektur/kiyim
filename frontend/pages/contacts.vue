<script setup lang="ts">
useHead({ title: 'Контакты — kiyim' });

const contacts = [
  { label: 'Адрес', value: 'Бишкек, ул. Раззакова 19\nБЦ Россия, кабинет 1509' },
  { label: 'Телефон', value: '+996 709 135 937', href: 'tel:+996709135937' },
];
</script>

<template>
  <div class="contacts">
    <div class="contacts__container">
      <h1 class="contacts__title">Контакты</h1>
      <p class="contacts__lead">
        Свяжитесь с нами для уточнения деталей по работе агрегатора.
      </p>

      <div class="contacts__grid">
        <div v-for="c in contacts" :key="c.label" class="contacts__card">
          <p class="contacts__card-label">{{ c.label }}</p>
          <a v-if="c.href" :href="c.href" class="contacts__card-value contacts__card-value--link">{{ c.value }}</a>
          <p v-else class="contacts__card-value contacts__card-value--multiline">{{ c.value }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.contacts {
  &__container {
    @include container;
    padding-block: 3rem 4rem;
    max-width: 48rem;

    @include r($bp-sm) {
      padding-block: 4rem 5rem;
    }
  }

  &__title {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.02em;

    @include r($bp-sm) {
      font-size: 2.75rem;
    }
  }

  &__lead {
    margin-top: 1rem;
    font-size: 1rem;
    line-height: 1.6;
    color: $stone-400;

    @include r($bp-sm) {
      font-size: 1.125rem;
    }
  }

  &__grid {
    display: grid;
    gap: 1rem;
    margin-top: 2.5rem;

    @include r($bp-sm) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__card {
    padding: 1.25rem 1.5rem;
    border-radius: 1rem;
    @include glass;
  }

  &__card-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $stone-500;
    margin-bottom: 0.375rem;
  }

  &__card-value {
    font-size: 1rem;
    font-weight: 600;
    color: $stone-100;

    &--multiline {
      white-space: pre-line;
    }

    &--link {
      transition: color 0.2s;

      &:hover {
        color: $lime-400;
      }
    }
  }
}
</style>
