export default defineNuxtConfig({
  compatibilityDate: '2024-09-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // used for SSR requests made from inside the container, over the docker network
    apiBaseServer: process.env.NUXT_API_BASE_SERVER || 'http://localhost:3001',
    public: {
      // used for browser requests; behind nginx this is a relative "/api"
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },
});
