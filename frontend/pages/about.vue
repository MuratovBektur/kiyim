<script setup lang="ts">
useHead({ title: 'О нас — kiyim' });

const points = [
  {
    number: '01',
    text: 'Мы не принимаем деньги и не являемся финансовой организацией. Наша задача — чистое информирование.',
  },
  {
    number: '02',
    text: 'Выступаем как крупнейший агрегатор рынка «Дордой», соединяя вас с продавцами на их условиях.',
  },
];
</script>

<template>
  <div class="about">
    <section class="about__hero">
      <div class="about__hero-inner">
        <h1 class="about__title">О нас</h1>
        <p class="about__lead">
          Мы — команда энтузиастов, уверенных, что каждый должен иметь возможность покупать товары
          напрямую, без посредников и скрытых наценок.
        </p>
      </div>
    </section>

    <section class="about__points">
      <div class="about__points-grid">
        <div v-for="p in points" :key="p.number" class="about__point-card">
          <span class="about__point-number">{{ p.number }}</span>
          <p class="about__point-text">{{ p.text }}</p>
        </div>
      </div>
    </section>

    <section class="about__cta">
      <h2 class="about__cta-title">Остались вопросы?</h2>
      <p class="about__cta-text">Свяжитесь с нами — с радостью на них ответим.</p>
      <NuxtLink to="/contacts" class="about__cta-btn">Перейти к контактам →</NuxtLink>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.about {
  &__hero {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-block: 3rem;

    @include r($bp-sm) {
      padding-block: 4.5rem;
    }
  }

  &__hero-inner {
    @include container;
    max-width: 42rem;
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

  &__points {
    @include container;
    padding-block: 3rem;
  }

  &__points-grid {
    display: grid;
    gap: 1rem;

    @include r($bp-md) {
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
  }

  &__point-card {
    padding: 1.75rem;
    border-radius: 1rem;
    @include glass;
    @include card-lift;
  }

  &__point-number {
    display: block;
    font-size: 1.75rem;
    font-weight: 700;
    color: $lime-400;
    margin-bottom: 0.75rem;
  }

  &__point-text {
    font-size: 0.9375rem;
    line-height: 1.6;
    color: $stone-300;
  }

  &__cta {
    @include container;
    padding-block: 1rem 4rem;
    text-align: center;
  }

  &__cta-title {
    font-size: 1.375rem;
    font-weight: 700;
  }

  &__cta-text {
    margin-top: 0.5rem;
    color: $stone-400;
  }

  &__cta-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 1.5rem;
    padding: 0.875rem 1.75rem;
    border-radius: 999px;
    background-color: $lime-400;
    color: $ink-900;
    font-weight: 700;
    font-size: 0.9375rem;
    transition: background-color 0.2s;

    &:hover {
      background-color: $lime-300;
    }
  }
}
</style>
