import type { Ref, ComputedRef } from 'vue';
import type { Product, ProductsResponse, Seller, Category } from '~/types';

export interface ProductFilters {
  search?: string;
  categorySlug?: string;
  sellerSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  limit?: number;
}

function apiBase(): string {
  const config = useRuntimeConfig();
  // SSR runs inside the container and must reach the backend directly over the
  // docker network; the browser only knows the public host and goes through nginx.
  return import.meta.server ? config.apiBaseServer : config.public.apiBase;
}

export function useProductsList(filters: Ref<ProductFilters> | ComputedRef<ProductFilters>) {
  return useFetch<ProductsResponse>(() => `${apiBase()}/products`, {
    query: filters,
    watch: [filters],
  });
}

export function useProduct(id: string) {
  return useFetch<Product>(() => `${apiBase()}/products/${id}`);
}

export function useSellersList() {
  return useFetch<Seller[]>(() => `${apiBase()}/sellers`);
}

export function useCategoriesList() {
  return useFetch<Category[]>(() => `${apiBase()}/categories`);
}
