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

// Product photos uploaded via the Telegram bot are stored as a single
// "master" path (`/uploads/.../<slot>.webp`, full source resolution); the
// backend generates <slot>-card.webp / -gallery.webp / -thumb.webp
// alongside it at fixed 3:4 sizes matched to where each is displayed, so
// nothing ever ships the oversized master to the browser. Seed/demo
// products still use absolute picsum URLs, which have no local variants —
// those are returned as-is for every variant.
export type PhotoVariant = 'card' | 'gallery' | 'thumb';

export function photoVariantUrl(path: string | undefined | null, variant: PhotoVariant): string | undefined {
  if (!path) return undefined;
  if (!path.startsWith('/uploads/')) return path;
  const variantPath = path.replace(/\.webp$/, `-${variant}.webp`);
  return `${apiBase()}${variantPath}`;
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
