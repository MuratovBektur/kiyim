import type { Product } from '~/types';

export function useWishlist() {
  const items = useState<Product[]>('wishlist', () => []);

  function isWishlisted(productId: string): boolean {
    return items.value.some((p) => p.id === productId);
  }

  function addToWishlist(product: Product) {
    if (!isWishlisted(product.id)) items.value.push(product);
  }

  function removeFromWishlist(productId: string) {
    items.value = items.value.filter((p) => p.id !== productId);
  }

  function toggleWishlist(product: Product) {
    if (isWishlisted(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  }

  function clearWishlist() {
    items.value = [];
  }

  const count = computed(() => items.value.length);

  return { items, isWishlisted, addToWishlist, removeFromWishlist, toggleWishlist, clearWishlist, count };
}
