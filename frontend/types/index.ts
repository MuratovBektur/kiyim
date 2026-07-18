export interface Seller {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  rating: number;
  contactPhone?: string | null;
  whatsapp?: string | null;
  telegramContact?: string | null;
  instagram?: string | null;
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

export interface CartItem {
  productId: string;
  size: string | null;
  color: string | null;
  quantity: number;
  product: Product;
}

export interface CreateOrderItemInput {
  productId: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
}

export interface CreateOrderPayload {
  name: string;
  phone: string;
  items: CreateOrderItemInput[];
}

export interface OrderItem {
  productId: string;
  title: string;
  size: string | null;
  color: string | null;
  quantity: number;
  price: string;
  currency: string;
}

export interface Order {
  id: string;
  name: string;
  phone: string;
  sellerId: string;
  items: OrderItem[];
  total: string;
  currency: string;
  createdAt: string;
}
