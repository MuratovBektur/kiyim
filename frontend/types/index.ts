export interface Seller {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  rating: number;
  contactPhone?: string | null;
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
  photos: string[];
  extraPhotos: string[];
  subtype?: string | null;
  brand?: string | null;
  originCountry?: string | null;
  materials?: string[];
  sizes: string[];
  colors: string[];
  inStock: boolean;
  sellerUrl?: string | null;
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
