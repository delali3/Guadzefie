// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a custom storage implementation to debug session issues
class CustomLocalStorage {
  constructor() {
    try {
      // Check if localStorage is accessible
      localStorage.setItem('supabase-test', 'test');
      localStorage.removeItem('supabase-test');
      console.log('localStorage is accessible');
    } catch (error) {
      console.error('localStorage is not accessible:', error);
    }
  }

  getItem(key: string): string | null {
    try {
      const value = localStorage.getItem(key);
      console.log(`[localStorage] Getting item ${key}:`, value ? 'value exists' : 'null');
      return value;
    } catch (error) {
      console.error(`[localStorage] Error getting ${key}:`, error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      console.log(`[localStorage] Setting item ${key}`);
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`[localStorage] Error setting ${key}:`, error);
    }
  }

  removeItem(key: string): void {
    try {
      console.log(`[localStorage] Removing item ${key}`);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[localStorage] Error removing ${key}:`, error);
    }
  }
}

// Create Supabase client with persistent storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new CustomLocalStorage(),
    persistSession: true,
    autoRefreshToken: true,
    debug: true
  },
  global: {
    // Add custom headers from localStorage for every request
    headers: getAuthHeaders()
  }
});

// Function to get auth headers from localStorage
function getAuthHeaders(): Record<string, string> {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return {};
    
    const user = JSON.parse(userStr);
    
    // If there's a token in the user object, return authorization header
    if (user && user.token) {
      return { 
        Authorization: `Bearer ${user.token}` 
      };
    }
    
    return {};
  } catch (error) {
    console.error('Error getting auth headers from localStorage:', error);
    return {};
  }
}

// Function to get current user from localStorage
export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
}

// Create a Supabase client with custom auth headers
export function getSupabaseWithAuth() {
  return supabase.from('anything')
    .select('*', { count: 'exact', head: true })
    .then(() => {
      // This is just to create a supabase query with the headers
      return supabase;
    })
    .then(null, () => {
      // Return normal supabase client if there's an error
      return supabase;
    });
}

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
  updated_at: string;
  rating: number | null;
  discount_percentage: number | null;
  sales_count: number;
  sku: string | null;
  weight: number | null;
  dimensions: string | null;
  tags: string[] | null;
  brand: string | null;
  is_organic: boolean | null;
  harvest_date: string | null;
  expiry_date: string | null;
  shelf_life: number | null;
  nutritional_info: any | null;
  certifications: string[] | null;
  region_of_origin: string | null;
  storage_instructions: string | null;
  shipping_weight: number | null;
  shipping_dimensions: string | null;
  farmer_id: string | null;
  vendor_id: string | null;
  owner_id: string | null;
  cost_price: number | null;
  profit_margin: number | null;
  min_order_quantity: number | null;
  max_order_quantity: number | null;
  units_sold: number | null;
  views_count: number | null;
  related_products: number[] | null;
  is_featured_in_homepage: boolean | null;
  is_available: boolean | null;
  is_deleted: boolean | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  custom_fields: any | null;
  farming_method: string | null;
  soil_type: string | null;
  water_source: string | null;
  growing_conditions: string | null;
  pesticide_free: boolean | null;
  non_gmo: boolean | null;
  planting_date: string | null;
  availability_schedule: any | null;
  farm_location: any | null;
  handling_instructions: string | null;
  seasonal: boolean | null;
  current_season: string | null;
  production_capacity: number | null;
  farm_distance: number | null;
  freshness_guarantee: string | null;
  cultivation_practices: string | null;
  supply_consistency: string | null;
  marketplace_status: string | null;
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