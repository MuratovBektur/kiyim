export interface Seller {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  rating: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  title: string;
  description?: string | null;
  price: string;
  currency: string;
  imageUrl?: string | null;
  sizes: string[];
  colors: string[];
  inStock: boolean;
  sellerUrl: string;
  sellerId: string;
  categoryId: string;
  seller: Seller;
  category: Category;
  createdAt: string;
}

export interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
