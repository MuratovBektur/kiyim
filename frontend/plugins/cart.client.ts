import type { CartItem } from '~/types';

const STORAGE_KEY = 'kiyim-cart';

export default defineNuxtPlugin(() => {
  const items = useState<CartItem[]>('cart', () => []);

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
