<template>
  <div class="app">
    <AppHeader />
    <main class="app__main">
      <NuxtPage />
    </main>
    <AppFooter />
  </div>
</template>

<style lang="scss" scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  &__main {
    flex: 1;
  }
}
</style>
