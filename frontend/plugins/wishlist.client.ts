import type { Product } from '~/types';

const STORAGE_KEY = 'kiyim-wishlist';

export default defineNuxtPlugin(() => {
  const items = useState<Product[]>('wishlist', () => []);

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      items.value = JSON.parse(stored);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  watch(items, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true });
});
