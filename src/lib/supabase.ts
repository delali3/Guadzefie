// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export type Tables = {
  products: Product;
  categories: Category;
  users: User;
  orders: Order;
  order_items: OrderItem;
  reviews: Review;
};

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string | null;
  category_id: number;
  inventory_count: number;
  featured: boolean;
  created_at: string;
  rating: number | null;
  discount_percentage: number | null;
  sales_count: number;
  sku: string;
  weight: number | null;
  dimensions: string | null;
  tags: string[] | null;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  created_at: string;
  slug: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_number?: string;
  created_at: string;
  status: string;
  total_amount: number;
  user_id: string;
  payment_method?: string;
  shipping_address?: any;
  tracking_number?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_per_unit: number;
  subtotal: number;
}

export interface Review {
  id: number;
  user_id: string;
  product_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}