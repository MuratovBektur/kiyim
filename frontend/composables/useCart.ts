import type { CartItem, Product, Seller } from '~/types';

export function cartItemKey(productId: string, size: string | null, color: string | null): string {
  return `${productId}::${size ?? ''}::${color ?? ''}`;
}

export interface CartSellerGroup {
  seller: Seller;
  items: CartItem[];
  subtotal: number;
}

export function useCart() {
  const items = useState<CartItem[]>('cart', () => []);

  function addToCart(product: Product, size: string | null, color: string | null, quantity = 1) {
    const key = cartItemKey(product.id, size, color);
    const existing = items.value.find((i) => cartItemKey(i.productId, i.size, i.color) === key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.value.push({ productId: product.id, size, color, quantity, product });
    }
  }

  function removeItem(productId: string, size: string | null, color: string | null) {
    const key = cartItemKey(productId, size, color);
    items.value = items.value.filter((i) => cartItemKey(i.productId, i.size, i.color) !== key);
  }

  function setQuantity(productId: string, size: string | null, color: string | null, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId, size, color);
      return;
    }
    const key = cartItemKey(productId, size, color);
    const item = items.value.find((i) => cartItemKey(i.productId, i.size, i.color) === key);
    if (item) item.quantity = quantity;
  }

  function clearCart() {
    items.value = [];
  }

  const count = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0));

  const totalsByCurrency = computed(() => {
    const totals: Record<string, number> = {};
    for (const item of items.value) {
      totals[item.product.currency] = (totals[item.product.currency] ?? 0) + Number(item.product.price) * item.quantity;
    }
    return totals;
  });

  const groupedBySeller = computed<CartSellerGroup[]>(() => {
    const map = new Map<string, CartSellerGroup>();
    for (const item of items.value) {
      const sellerId = item.product.sellerId;
      if (!map.has(sellerId)) map.set(sellerId, { seller: item.product.seller, items: [], subtotal: 0 });
      const group = map.get(sellerId)!;
      group.items.push(item);
      group.subtotal += Number(item.product.price) * item.quantity;
    }
    return Array.from(map.values());
  });

  return { items, addToCart, removeItem, setQuantity, clearCart, count, totalsByCurrency, groupedBySeller };
}
