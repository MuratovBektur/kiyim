<script setup lang="ts">
const search = useState<string>('catalogSearch', () => '');
const mobileMenuOpen = ref(false);
const mobileSearchOpen = ref(false);

let debounceTimer: ReturnType<typeof setTimeout>;
function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { search.value = val; }, 300);
}

watch(mobileMenuOpen, (v) => {
  if (import.meta.client) document.body.classList.toggle('overflow-hidden', v);
});
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <button type="button" class="header__hamburger" aria-label="Открыть меню" @click="mobileMenuOpen = true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>

      <NuxtLink to="/" class="header__logo">kiy<span>im</span></NuxtLink>

      <nav class="header__nav">
        <NuxtLink to="/" class="header__nav-link">Каталог</NuxtLink>
        <a href="#" class="header__nav-link">Дропы</a>
        <a href="#" class="header__nav-link">Бренды</a>
      </nav>

      <div class="header__controls">
        <div class="header__search">
          <svg class="header__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <input type="text" :value="search" placeholder="Поиск товаров…" class="header__search-input"
            @input="onInput" />
        </div>
        <button type="button" class="header__btn-icon header__btn-search-mobile" aria-label="Поиск"
          @click="mobileSearchOpen = !mobileSearchOpen">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
        <button type="button" class="header__btn-icon header__btn-wishlist" aria-label="Избранное">♡</button>
        <button type="button" class="header__btn-cart" aria-label="Корзина">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H6"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="10" cy="21" r="1.4" fill="currentColor" />
            <circle cx="18" cy="21" r="1.4" fill="currentColor" />
          </svg>
          <span class="header__cart-badge">2</span>
        </button>
      </div>
    </div>

    <div v-if="mobileSearchOpen" class="header__mobile-search">
      <div class="header__mobile-search-bar">
        <svg class="header__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <input type="text" :value="search" placeholder="Поиск товаров…" class="header__search-input" @input="onInput" />
        <button type="button" class="header__mobile-search-close" @click="mobileSearchOpen = false">✕</button>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <div class="nav-drawer__overlay" :class="{ 'nav-drawer__overlay--open': mobileMenuOpen }"
      @click="mobileMenuOpen = false" />
    <aside class="nav-drawer" :class="{ 'nav-drawer--open': mobileMenuOpen }">
      <div class="nav-drawer__head">
        <span class="nav-drawer__logo">kiy<span>im</span></span>
        <button type="button" class="nav-drawer__close" aria-label="Закрыть" @click="mobileMenuOpen = false">✕</button>
      </div>
      <nav class="nav-drawer__nav">
        <NuxtLink to="/" class="nav-drawer__link" @click="mobileMenuOpen = false">Каталог</NuxtLink>
        <a href="#" class="nav-drawer__link">Дропы</a>
        <a href="#" class="nav-drawer__link">Бренды</a>
        <a href="#" class="nav-drawer__link">Избранное</a>
      </nav>
      <div class="nav-drawer__footer">kiyim · drop 04</div>
    </aside>
  </Teleport>
</template>

<style lang="scss" scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  background-color: rgba($main-bg, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &__inner {
    @include container;
    padding-block: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    @include r($bp-sm) {
      padding-block: 1.25rem;
      gap: 1.5rem;
    }
  }

  &__hamburger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    margin-left: -0.5rem;
    color: $stone-300;
    flex-shrink: 0;
    transition: color 0.2s;

    &:hover {
      color: $lime-400;
    }

    @include r($bp-md) {
      display: none;
    }
  }

  &__logo {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    white-space: nowrap;
    flex-shrink: 0;

    @include r($bp-sm) {
      font-size: 1.5rem;
    }

    span {
      color: $lime-400;
    }
  }

  &__nav {
    display: none;
    align-items: center;
    gap: 2rem;

    @include r($bp-md) {
      display: flex;
    }
  }

  &__nav-link {
    font-size: 0.875rem;
    font-weight: 500;
    color: $stone-400;
    transition: color 0.2s;

    &:hover {
      color: $lime-400;
    }
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    justify-content: flex-end;

    @include r($bp-sm) {
      gap: 0.75rem;
    }
  }

  &__search {
    display: none;
    align-items: center;
    @include glass;
    border-radius: 999px;
    padding: 0.5rem 1rem;
    width: 18rem;
    gap: 0.5rem;

    @include r($bp-lg) {
      display: flex;
    }
  }

  &__search-icon {
    color: $stone-500;
    flex-shrink: 0;
  }

  &__search-input {
    background: transparent;
    border: none;
    outline: none;
    font-size: 0.875rem;
    width: 100%;

    &::placeholder {
      color: $stone-500;
    }
  }

  &__btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    font-size: 1.1rem;
    flex-shrink: 0;
    @include glass;
    transition: border-color 0.2s;

    &:hover {
      border-color: rgba($lime-400, 0.5);
    }
  }

  &__btn-search-mobile {
    @include r($bp-lg) {
      display: none;
    }
  }

  &__btn-wishlist {
    display: none;

    @include r($bp-sm) {
      display: flex;
    }
  }

  &__btn-cart {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background-color: $lime-400;
    color: $ink-900;
    flex-shrink: 0;
    transition: background-color 0.2s;

    &:hover {
      background-color: $lime-300;
    }
  }

  &__cart-badge {
    position: absolute;
    top: -0.25rem;
    right: -0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1.1rem;
    height: 1.1rem;
    padding-inline: 0.2rem;
    border-radius: 999px;
    background-color: $ink-900;
    color: $lime-400;
    font-size: 0.65rem;
    font-weight: 700;
    line-height: 1;
  }

  &__mobile-search {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.75rem 1rem;

    @include r($bp-lg) {
      display: none;
    }
  }

  &__mobile-search-bar {
    display: flex;
    align-items: center;
    @include glass;
    border-radius: 999px;
    padding: 0.625rem 1rem;
    gap: 0.5rem;
  }

  &__mobile-search-close {
    color: $stone-500;
    font-size: 0.875rem;
    margin-left: auto;
    flex-shrink: 0;
  }
}

.nav-drawer {
  &__overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 40;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;

    @include r($bp-md) {
      display: none;
    }

    &--open {
      opacity: 1;
      pointer-events: auto;
    }
  }

  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 18rem;
  max-width: 80%;
  background-color: $ink-800;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 50;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s ease;

  @include r($bp-md) {
    display: none;
  }

  &--open {
    transform: translateX(0);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
  }

  &__logo {
    font-size: 1.25rem;
    font-weight: 700;

    span {
      color: $lime-400;
    }
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    @include glass;
  }

  &__nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__link {
    display: block;
    padding: 0.75rem;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 500;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: $lime-400;
    }
  }

  &__footer {
    margin-top: auto;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.75rem;
    color: $stone-500;
  }
}
</style>
