// src/services/api.ts
import { supabase } from '../lib/supabase';
import type { 
  Product,
  User, 
  Order, 
  OrderItem,
  Review
} from '../lib/supabase';

// Products API
export const ProductsApi = {
  // Get all products with optional filtering
  getProducts: async (options: {
    category_id?: number;
    featured?: boolean;
    search?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating';
    limit?: number;
    offset?: number;
  } = {}) => {
    let query = supabase
      .from('products')
      .select('*, categories(name, slug)');

    // Apply filters
    if (options.category_id) {
      query = query.eq('category_id', options.category_id);
    }

    if (options.featured !== undefined) {
      query = query.eq('featured', options.featured);
    }

    if (options.search) {
      query = query.ilike('name', `%${options.search}%`);
    }

    if (options.min_price !== undefined) {
      query = query.gte('price', options.min_price);
    }

    if (options.max_price !== undefined) {
      query = query.lte('price', options.max_price);
    }

    // Apply sorting
    if (options.sort_by) {
      switch (options.sort_by) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('sales_count', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
      }
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }

    return { data, count };
  },

  // Get a single product by ID
  getProductById: async (id: number) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(id, name, slug),
        reviews(id, user_id, rating, comment, created_at, users(first_name, last_name, avatar_url))
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching product: ${error.message}`);
    }

    return data;
  },

  // Get related products (same category)
  getRelatedProducts: async (productId: number, limit = 4) => {
    // First get the product's category
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('category_id')
      .eq('id', productId)
      .single();

    if (productError) {
      throw new Error(`Error fetching product category: ${productError.message}`);
    }

    // Then get other products in the same category
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', product.category_id)
      .neq('id', productId)
      .limit(limit);

    if (error) {
      throw new Error(`Error fetching related products: ${error.message}`);
    }

    return data;
  },

  // Get new arrivals
  getNewArrivals: async (limit = 8) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Error fetching new arrivals: ${error.message}`);
    }

    return data;
  },

  // Get best sellers
  getBestSellers: async (limit = 8) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('sales_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Error fetching best sellers: ${error.message}`);
    }

    return data;
  },

  // Get featured products
  getFeaturedProducts: async (limit = 4) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .limit(limit);

    if (error) {
      throw new Error(`Error fetching featured products: ${error.message}`);
    }

    return data;
  }
};

// Categories API
export const CategoriesApi = {
  // Get all categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }

    return data;
  },

  // Get a single category by ID or slug
  getCategory: async (identifier: number | string) => {
    let query = supabase.from('categories').select('*');
    
    if (typeof identifier === 'number') {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('slug', identifier);
    }

    const { data, error } = await query.single();

    if (error) {
      throw new Error(`Error fetching category: ${error.message}`);
    }

    return data;
  },

  // Get product count for each category
  getCategoriesWithProductCounts: async () => {
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (categoriesError) {
      throw new Error(`Error fetching categories: ${categoriesError.message}`);
    }

    // For each category, count the products
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const { count, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);

        if (countError) {
          console.error(`Error counting products for category ${category.id}:`, countError);
          return { ...category, product_count: 0 };
        }

        return { ...category, product_count: count || 0 };
      })
    );

    return categoriesWithCounts;
  },

  // Get featured categories (those with most products or manually set)
  getFeaturedCategories: async (limit = 3) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
      .limit(limit);

    if (error) {
      throw new Error(`Error fetching featured categories: ${error.message}`);
    }

    return data;
  }
};

// Orders API
export const OrdersApi = {
  // Get orders for current user
  getUserOrders: async () => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          product_id,
          quantity,
          price_per_unit,
          subtotal,
          products(id, name, image_url, sku)
        )
      `)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching orders: ${error.message}`);
    }

    return data;
  },

  // Get a single order by ID
  getOrderById: async (orderId: number) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          id,
          product_id,
          quantity,
          price_per_unit,
          subtotal,
          products(id, name, image_url, description, sku)
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.user.id)
      .single();

    if (error) {
      throw new Error(`Error fetching order: ${error.message}`);
    }

    return data;
  },

  // Create a new order
  createOrder: async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>, items: Omit<OrderItem, 'id' | 'order_id'>[]) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      throw new Error('User not authenticated');
    }

    // Start a transaction
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({ ...order, user_id: user.user.id })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Error creating order: ${orderError.message}`);
    }

    // Insert order items
    const orderItems = items.map(item => ({
      ...item,
      order_id: orderData.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // In a real app, you would want to roll back the order here
      throw new Error(`Error creating order items: ${itemsError.message}`);
    }

    return orderData;
  }
};

// Reviews API
export const ReviewsApi = {
  // Get reviews for a product
  getProductReviews: async (productId: number) => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        users(id, first_name, last_name, avatar_url)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching reviews: ${error.message}`);
    }

    return data;
  },

  // Create a review
  createReview: async (review: Omit<Review, 'id' | 'created_at'>) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({ ...review, user_id: user.user.id })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating review: ${error.message}`);
    }

    return data;
  },

  // Update a review
  updateReview: async (reviewId: number, updates: Partial<Omit<Review, 'id' | 'created_at' | 'user_id' | 'product_id'>>) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating review: ${error.message}`);
    }

    return data;
  },

  // Delete a review
  deleteReview: async (reviewId: number) => {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', user.user.id);

    if (error) {
      throw new Error(`Error deleting review: ${error.message}`);
    }

    return true;
  }
};

// User API
export const UserApi = {
  // Get current user profile
  getUserProfile: async () => {
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData || !authData.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (error) {
      throw new Error(`Error fetching user profile: ${error.message}`);
    }

    return data;
  },

  // Update user profile
  updateUserProfile: async (updates: Partial<Omit<User, 'id' | 'email' | 'created_at'>>) => {
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData || !authData.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', authData.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
    }

    return data;
  }
};

// Cart API (using localStorage since carts are client-side until checkout)
export interface CartItem {
  product_id: number;
  quantity: number;
  product?: Product;
}

export const CartApi = {
  getCart: async (): Promise<CartItem[]> => {
    // Get cart from localStorage
    const cartJson = localStorage.getItem('cart');
    const cartItems: CartItem[] = cartJson ? JSON.parse(cartJson) : [];
    
    // If cart has items, fetch the product details
    if (cartItems.length > 0) {
      // Extract all product IDs from the cart
      const productIds = cartItems.map(item => item.product_id);
      
      // Fetch products from Supabase
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      
      if (error) {
        console.error('Error fetching cart products:', error);
        return cartItems;
      }
      
      // Add product details to each cart item
      return cartItems.map(item => ({
        ...item,
        product: products.find(p => p.id === item.product_id)
      }));
    }
    
    return cartItems;
  },
  
  addToCart: async (productId: number, quantity: number = 1): Promise<CartItem[]> => {
    // Get current cart
    const cartJson = localStorage.getItem('cart');
    const cartItems: CartItem[] = cartJson ? JSON.parse(cartJson) : [];
    
    // Check if product is already in cart
    const existingItemIndex = cartItems.findIndex(item => item.product_id === productId);
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      cartItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cartItems.push({ product_id: productId, quantity });
    }
    
    // Save updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    // Return updated cart with product details
    return CartApi.getCart();
  },
  
  updateCartItem: async (productId: number, quantity: number): Promise<CartItem[]> => {
    // Get current cart
    const cartJson = localStorage.getItem('cart');
    const cartItems: CartItem[] = cartJson ? JSON.parse(cartJson) : [];
    
    // Find the item to update
    const itemIndex = cartItems.findIndex(item => item.product_id === productId);
    
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        cartItems.splice(itemIndex, 1);
      } else {
        // Update quantity
        cartItems[itemIndex].quantity = quantity;
      }
      
      // Save updated cart
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
    
    // Return updated cart with product details
    return CartApi.getCart();
  },
  
  removeFromCart: async (productId: number): Promise<CartItem[]> => {
    // Get current cart
    const cartJson = localStorage.getItem('cart');
    const cartItems: CartItem[] = cartJson ? JSON.parse(cartJson) : [];
    
    // Filter out the item to remove
    const updatedCart = cartItems.filter(item => item.product_id !== productId);
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    // Return updated cart with product details
    return CartApi.getCart();
  },
  
  clearCart: async (): Promise<CartItem[]> => {
    // Clear cart in localStorage
    localStorage.removeItem('cart');
    return [];
  }
};

export default {
  Products: ProductsApi,
  Categories: CategoriesApi,
  Orders: OrdersApi,
  Reviews: ReviewsApi,
  User: UserApi,
  Cart: CartApi
};