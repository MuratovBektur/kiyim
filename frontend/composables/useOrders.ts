import type { CreateOrderPayload, Order } from '~/types';

export function useOrders() {
  async function createOrder(payload: CreateOrderPayload): Promise<Order[]> {
    return $fetch<Order[]>(`${apiBase()}/orders`, { method: 'POST', body: payload });
  }

  return { createOrder };
}
