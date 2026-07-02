<template>
  <footer class="footer">
    <div class="footer__inner">
      <p class="footer__text">kiyim — каталог-агрегатор одежды от разных продавцов</p>
      <nav class="footer__nav">
        <NuxtLink to="/" class="footer__link">Каталог</NuxtLink>
        <NuxtLink to="/about" class="footer__link">О нас</NuxtLink>
        <NuxtLink to="/contacts" class="footer__link">Контакты</NuxtLink>
      </nav>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.footer {
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-block: 2rem;
  font-size: 0.875rem;
  color: $stone-500;
  padding-inline: 1rem;

  &__inner {
    @include container;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    text-align: center;

    @include r($bp-sm) {
      flex-direction: row;
      justify-content: space-between;
      text-align: left;
    }
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  &__link {
    transition: color 0.2s;

    &:hover {
      color: $lime-400;
    }
  }
}
</style>
