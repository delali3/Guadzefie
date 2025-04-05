// src/contexts/CartContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
// import { useAuth } from './AuthContext';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  inventory_count: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ecommerce_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  // const { user } = useAuth();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart from localStorage', e);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Calculate derived values
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Add item to cart with inventory check
  const addItem = async (product: Product, quantity = 1) => {
    // First check current inventory
    const { data, error } = await supabase
      .from('products')
      .select('inventory_count')
      .eq('id', product.id)
      .single();

    if (error || !data) {
      toast.error('Could not verify product availability');
      return;
    }

    const currentInventory = data.inventory_count;

    if (currentInventory < quantity) {
      toast.error(`Sorry, only ${currentInventory} items in stock`);
      return;
    }

    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product.id === product.id
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        const newQuantity = updatedItems[existingItemIndex].quantity + quantity;
        
        if (newQuantity > currentInventory) {
          toast.error(`Sorry, that would exceed available stock`);
          return prevItems;
        }
        
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity,
        };
        
        toast.success(`Updated ${product.name} quantity in cart`);
        return updatedItems;
      } else {
        toast.success(`Added ${product.name} to cart`);
        return [...prevItems, { product, quantity }];
      }
    });
  };

  // Remove item from cart
  const removeItem = (productId: number) => {
    setItems((prevItems) => {
      const updatedItems = prevItems.filter(
        (item) => item.product.id !== productId
      );
      toast.success('Item removed from cart');
      return updatedItems;
    });
  };

  // Update item quantity with inventory check
  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    // Check inventory before updating
    const { data, error } = await supabase
      .from('products')
      .select('inventory_count')
      .eq('id', productId)
      .single();

    if (error || !data) {
      toast.error('Could not verify product availability');
      return;
    }

    const currentInventory = data.inventory_count;

    if (quantity > currentInventory) {
      toast.error(`Sorry, only ${currentInventory} items in stock`);
      return;
    }

    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product.id === productId
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity,
        };
        
        return updatedItems;
      }
      
      return prevItems;
    });
  };

  // Clear the entire cart
  const clearCart = () => {
    setItems([]);
    toast.success('Cart cleared');
  };

  const value = {
    items,
    itemCount,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};