// src/contexts/ProductContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Types
export interface Product {
    id: number;
    name: string;
    price: number;
    description: string;
    image_url: string;
    category_id: number;
    inventory_count: number;
    featured: boolean;
    created_at?: string;
    updated_at?: string;
    rating?: number;
    discount_percentage?: number;
    sales_count?: number;
    sku?: string;
    weight?: number;
    dimensions?: string;
    tags?: string[];
    brand?: string;
    is_organic?: boolean;
    harvest_date?: string;
    expiry_date?: string;
    shelf_life?: number;
    nutritional_info?: any;
    certifications?: string[];
    region_of_origin?: string;
    storage_instructions?: string;
    shipping_weight?: number;
    shipping_dimensions?: string;
    farmer_id?: string;
    vendor_id?: string;
    owner_id?: string;
    cost_price?: number;
    profit_margin?: number;
    min_order_quantity?: number;
    max_order_quantity?: number;
    units_sold?: number;
    views_count?: number;
    related_products?: number[];
    is_featured_in_homepage?: boolean;
    is_available?: boolean;
    is_deleted?: boolean;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string[];
    custom_fields?: any;
    farming_method?: string;
    soil_type?: string;
    water_source?: string;
    growing_conditions?: string;
    pesticide_free?: boolean;
    non_gmo?: boolean;
    planting_date?: string;
    availability_schedule?: any;
    farm_location?: any;
    handling_instructions?: string;
    seasonal?: boolean;
    current_season?: string;
    production_capacity?: number;
    farm_distance?: number;
    freshness_guarantee?: string;
    cultivation_practices?: string;
    supply_consistency?: string;
    marketplace_status?: string;
    categories?: {
        id: number;
        name: string;
        slug: string;
    };
    reviews?: ProductReview[];
}

export interface ProductReview {
    id: number;
    user_id: string;
    product_id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    users?: {
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
    };
}

export interface CartItem {
    product_id: number;
    quantity: number;
    product?: Product;
}

interface ProductState {
    cart: CartItem[];
    wishlist: number[];
    recentlyViewed: number[];
    products: Product[];
    featuredProducts: Product[];
    newArrivals: Product[];
    loading: boolean;
    error: string | null;
}

// Action types
type ProductAction =
    | { type: 'SET_PRODUCTS'; payload: Product[] }
    | { type: 'SET_FEATURED_PRODUCTS'; payload: Product[] }
    | { type: 'SET_NEW_ARRIVALS'; payload: Product[] }
    | { type: 'ADD_TO_CART'; payload: { productId: number; quantity: number } }
    | { type: 'UPDATE_CART_ITEM'; payload: { productId: number; quantity: number } }
    | { type: 'REMOVE_FROM_CART'; payload: number }
    | { type: 'CLEAR_CART' }
    | { type: 'SET_WISHLIST'; payload: number[] }
    | { type: 'ADD_TO_WISHLIST'; payload: number }
    | { type: 'REMOVE_FROM_WISHLIST'; payload: number }
    | { type: 'ADD_TO_RECENTLY_VIEWED'; payload: number }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'FETCH_PRODUCTS_SUCCESS'; payload: { products: Product[]; loading: boolean } };

// Initial state
const initialState: ProductState = {
    cart: [],
    wishlist: [],
    recentlyViewed: [],
    products: [],
    featuredProducts: [],
    newArrivals: [],
    loading: false,
    error: null
};

// Reducer
const productReducer = (state: ProductState, action: ProductAction): ProductState => {
    switch (action.type) {
        case 'SET_PRODUCTS':
            return { ...state, products: action.payload };
        case 'SET_FEATURED_PRODUCTS':
            return { ...state, featuredProducts: action.payload };
        case 'SET_NEW_ARRIVALS':
            return { ...state, newArrivals: action.payload };
        case 'ADD_TO_CART': {
            const { productId, quantity } = action.payload;
            const existingItemIndex = state.cart.findIndex(item => item.product_id === productId);

            if (existingItemIndex >= 0) {
                // Update existing item
                const updatedCart = [...state.cart];
                updatedCart[existingItemIndex] = {
                    ...updatedCart[existingItemIndex],
                    quantity: updatedCart[existingItemIndex].quantity + quantity
                };
                return { ...state, cart: updatedCart };
            } else {
                // Add new item
                return {
                    ...state,
                    cart: [...state.cart, { product_id: productId, quantity }]
                };
            }
        }
        case 'UPDATE_CART_ITEM': {
            const { productId, quantity } = action.payload;
            if (quantity <= 0) {
                // Remove item if quantity is 0 or less
                return {
                    ...state,
                    cart: state.cart.filter(item => item.product_id !== productId)
                };
            } else {
                // Update quantity
                return {
                    ...state,
                    cart: state.cart.map(item =>
                        item.product_id === productId
                            ? { ...item, quantity }
                            : item
                    )
                };
            }
        }
        case 'REMOVE_FROM_CART':
            return {
                ...state,
                cart: state.cart.filter(item => item.product_id !== action.payload)
            };
        case 'CLEAR_CART':
            return { ...state, cart: [] };
        case 'SET_WISHLIST':
            return { 
                ...state, 
                wishlist: action.payload 
            };
        case 'ADD_TO_WISHLIST':
            return {
                ...state,
                wishlist: state.wishlist.includes(action.payload)
                    ? [...state.wishlist] // Return a new array with same items
                    : [...state.wishlist, action.payload]
            };
        case 'REMOVE_FROM_WISHLIST':
            return {
                ...state,
                wishlist: state.wishlist.filter(id => id !== action.payload)
            };
        case 'ADD_TO_RECENTLY_VIEWED': {
            const newRecentlyViewed = [
                action.payload,
                ...state.recentlyViewed.filter(id => id !== action.payload)
            ].slice(0, 10); // Keep only the 10 most recent
            return {
                ...state,
                recentlyViewed: newRecentlyViewed
            };
        }
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'FETCH_PRODUCTS_SUCCESS':
            return {
                ...state,
                products: action.payload.products,
                loading: action.payload.loading
            };
        default:
            return state;
    }
};

// Context
interface ProductContextType {
    state: ProductState;
    dispatch: React.Dispatch<ProductAction>;
    fetchProducts: (options?: any) => Promise<void>;
    fetchProductById: (id: number) => Promise<Product | null>;
    addToCart: (productId: number, quantity?: number) => void;
    updateCartItem: (productId: number, quantity: number) => void;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;
    addToWishlist: (productId: number) => void;
    removeFromWishlist: (productId: number) => void;
    viewProduct: (productId: number) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Provider
export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(productReducer, initialState);

    // Initialize cart from localStorage
    useEffect(() => {
        // Load all localStorage data at once to prevent multiple re-renders
        try {
            // Load cart
            const cartJson = localStorage.getItem('cart');
            if (cartJson) {
                const cartItems = JSON.parse(cartJson) as CartItem[];
                if (Array.isArray(cartItems) && cartItems.length > 0) {
                    // Process all cart items at once with a custom action type if needed
                    cartItems.forEach(item => {
                        dispatch({
                            type: 'ADD_TO_CART',
                            payload: { productId: item.product_id, quantity: item.quantity }
                        });
                    });
                }
            }

            // Load wishlist
            const wishlistJson = localStorage.getItem('wishlist');
        if (wishlistJson) {
            try {
                const wishlistItems = JSON.parse(wishlistJson);
                if (Array.isArray(wishlistItems)) {
                    // Use a single dispatch for the whole array
                    dispatch({ type: 'SET_WISHLIST', payload: wishlistItems });
                }
            } catch (e) {
                console.error('Error parsing wishlist from localStorage', e);
            }
        }

            // Load recently viewed
            const recentlyViewedJson = localStorage.getItem('recentlyViewed');
            if (recentlyViewedJson) {
                const recentlyViewedItems = JSON.parse(recentlyViewedJson) as number[];
                if (Array.isArray(recentlyViewedItems) && recentlyViewedItems.length > 0) {
                    recentlyViewedItems.forEach(productId => {
                        dispatch({
                            type: 'ADD_TO_RECENTLY_VIEWED',
                            payload: productId
                        });
                    });
                }
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
        }
    }, []); // Only run once on mount

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(state.cart));
    }, [state.cart]);

    // Save wishlist to localStorage whenever it changes
    useEffect(() => {
        console.log("Wishlist changed, saving to localStorage:", state.wishlist);
        localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
    }, [state.wishlist]);
    
    // Save recently viewed to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('recentlyViewed', JSON.stringify(state.recentlyViewed));
    }, [state.recentlyViewed]);

    // API Functions - Using useCallback to prevent unnecessary re-renders
    const fetchProducts = useCallback(async (options: any = {}) => {
        // Skip if already loading to prevent repeated requests
        if (state.loading) return;

        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            console.log("Fetching products with options:", options);

            // Start with a basic query
            let query = supabase.from('products').select('*');

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

            if (options.offset !== undefined) {
                query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Use a single dispatch for better performance and to prevent flickering
            dispatch({
                type: 'FETCH_PRODUCTS_SUCCESS',
                payload: {
                    products: data || [],
                    loading: false
                }
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: error instanceof Error ? error.message : 'An unknown error occurred'
            });
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []); // No dependencies - this function shouldn't change

    // Fix for the fetchProductById method in ProductContext.tsx
    const fetchProductById = useCallback(async (id: number): Promise<Product | null> => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            console.log("Fetching product by ID:", id);

            // Use the specific foreign key relationship from the error message
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select(`
                *,
                categories!products_category_id_fkey(id, name, slug),
                reviews(
                    id, 
                    user_id, 
                    rating, 
                    comment, 
                    created_at,
                    users(first_name, last_name, avatar_url)
                )
            `)
                .eq('id', id)
                .single();

            if (productError) {
                console.error("Supabase error:", productError);
                throw productError;
            }

            // No need to fetch category separately anymore
            console.log("Product found:", productData);
            return productData;
        } catch (error) {
            console.error(`Error fetching product ${id}:`, error);
            dispatch({
                type: 'SET_ERROR',
                payload: error instanceof Error ? error.message : `Failed to fetch product ${id}`
            });
            return null;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);
    // Cart and Wishlist Functions - Using useCallback for stability
    const addToCart = useCallback((productId: number, quantity: number = 1) => {
        dispatch({
            type: 'ADD_TO_CART',
            payload: { productId, quantity }
        });
    }, []);

    const updateCartItem = useCallback((productId: number, quantity: number) => {
        dispatch({
            type: 'UPDATE_CART_ITEM',
            payload: { productId, quantity }
        });
    }, []);

    const removeFromCart = useCallback((productId: number) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    }, []);

    const clearCart = useCallback(() => {
        dispatch({ type: 'CLEAR_CART' });
    }, []);

    const addToWishlist = useCallback((productId: number) => {
        // Check if already in wishlist
        const isInWishlist = state.wishlist.includes(productId);
        
        if (!isInWishlist) {
            console.log(`Adding product ${productId} to wishlist`);
            dispatch({ type: 'ADD_TO_WISHLIST', payload: productId });
        } else {
            console.log(`Product ${productId} already in wishlist`);
        }
    }, [state.wishlist]);

    const removeFromWishlist = useCallback((productId: number) => {
        dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: productId });
    }, []);

    const viewProduct = useCallback((productId: number) => {
        dispatch({ type: 'ADD_TO_RECENTLY_VIEWED', payload: productId });
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const value = React.useMemo(() => ({
        state,
        dispatch,
        fetchProducts,
        fetchProductById,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        viewProduct
    }), [
        state,
        fetchProducts,
        fetchProductById,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        viewProduct
    ]);

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};

// Custom hook
export const useProducts = () => {
    const context = useContext(ProductContext);
    if (context === undefined) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};

export default { ProductProvider, useProducts };