import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../../contexts/ProductContext';
import { supabase } from '../../lib/supabase';
import { 
  Star, 
  ShoppingCart, 
  X, 
  AlertCircle, 
  ChevronRight,
  Check
} from 'lucide-react';

interface WishlistProduct {
  id: number;
  name: string;
  price: number;
  image_url: string;
  discount_percentage?: number;
  rating?: number;
  inventory_count?: number;
  description?: string;
}

const WishlistPage: React.FC = () => {
  const { state, removeFromWishlist, addToCart } = useProducts();
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<Record<number, boolean>>({});
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        if (state.wishlist.length === 0 && !userId) {
          setWishlistProducts([]);
          setLoading(false);
          return;
        }

        let productIds = [...state.wishlist];

        // If user is logged in, also fetch from database
        if (userId) {
          try {
            const { data, error } = await supabase
              .from('wishlists')
              .select('product_id')
              .eq('user_id', userId);

            if (error) throw error;

            if (data && data.length > 0) {
              const dbProductIds = data.map(item => parseInt(item.product_id));
              // Combine products from context and DB, removing duplicates
              productIds = [...new Set([...productIds, ...dbProductIds])];
            }
          } catch (err) {
            console.error('Error fetching wishlist from DB:', err);
            // Continue with the local wishlist
          }
        }

        if (productIds.length === 0) {
          setWishlistProducts([]);
          setLoading(false);
          return;
        }

        // Fetch product details for the IDs
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (error) throw error;

        if (!data || data.length === 0) {
          // If no data returned, show sample products
          setWishlistProducts(getSampleWishlistProducts());
        } else {
          setWishlistProducts(data as WishlistProduct[]);
        }
      } catch (err) {
        console.error('Error fetching wishlist products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load wishlist products');
        // Show sample data even on error for demo
        setWishlistProducts(getSampleWishlistProducts());
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [state.wishlist, userId]);

  // Generate sample wishlist products for development/demo
  const getSampleWishlistProducts = (): WishlistProduct[] => {
    return [
      {
        id: 1,
        name: 'Premium Wireless Headphones',
        price: 149.99,
        image_url: 'https://source.unsplash.com/random/300x300/?headphones',
        discount_percentage: 15,
        rating: 4.7,
        inventory_count: 45,
        description: 'High-quality wireless headphones with noise cancellation.'
      },
      {
        id: 2,
        name: 'Smart Watch Series 5',
        price: 299.99,
        image_url: 'https://source.unsplash.com/random/300x300/?smartwatch',
        rating: 4.5,
        inventory_count: 28,
        description: 'Latest smartwatch with health tracking and notifications.'
      },
      {
        id: 3,
        name: 'Ergonomic Office Chair',
        price: 249.99,
        image_url: 'https://source.unsplash.com/random/300x300/?chair',
        discount_percentage: 10,
        rating: 4.3,
        inventory_count: 12,
        description: 'Comfortable office chair with lumbar support.'
      }
    ];
  };

  const handleRemoveFromWishlist = (productId: number) => {
    removeFromWishlist(productId);
    
    // Also remove from DB if user is logged in
    if (userId) {
      supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId)
        .then(({ error }) => {
          if (error) console.error('Error removing from wishlist in DB:', error);
        });
    }
  };

  const handleAddToCart = (productId: number | undefined) => {
    if (!productId) return;
    
    console.log('Adding to cart:', productId);
    
    // Add to cart via context
    addToCart(productId, 1);
    
    // Update state to show added confirmation
    setAddedToCart(prev => ({
      ...prev,
      [productId]: true
    }));
    
    // Reset after timeout
    setTimeout(() => {
      setAddedToCart(prev => ({
        ...prev,
        [productId]: false
      }));
    }, 3000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Wishlist</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/consumer" className="hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 dark:text-white">Wishlist</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Wishlist ({wishlistProducts.length})</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading wishlist</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {wishlistProducts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 text-center">
          <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <svg
              className="h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Your wishlist is empty</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Items added to your wishlist will be saved here for you to revisit anytime.
          </p>
          <div className="mt-6">
            <Link
              to="/products"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {wishlistProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="flex-shrink-0">
                  <div className="relative w-full sm:w-40 h-40 overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img
                      src={product.image_url || `https://source.unsplash.com/random/300x300/?product=${product.id}`}
                      alt={product.name}
                      className="w-full h-full object-center object-cover"
                    />
                    {product.discount_percentage && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {product.discount_percentage}% OFF
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        <Link to={`/products/${product.id}`} className="hover:underline">
                          {product.name}
                        </Link>
                      </h2>

                      {/* Price */}
                      <div className="mt-2 flex items-center">
                        {product.discount_percentage ? (
                          <div className="flex items-center">
                            <span className="text-lg font-medium text-gray-900 dark:text-white">
                              ${(product.price * (1 - product.discount_percentage / 100)).toFixed(2)}
                            </span>
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-medium text-gray-900 dark:text-white">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Rating */}
                      {product.rating && (
                        <div className="mt-1 flex items-center">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i}
                                className={`w-4 h-4 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                                fill={i < Math.floor(product.rating || 0) ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            {product.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      
                      {/* Availability */}
                      <div className="mt-1">
                        {(product.inventory_count !== undefined && product.inventory_count > 0) ? (
                          <span className="text-sm text-green-600 dark:text-green-400">
                            In Stock ({product.inventory_count} available)
                          </span>
                        ) : (
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 p-1"
                      aria-label="Remove from wishlist"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Description - only on large screens */}
                  {product.description && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                      {product.description}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addedToCart[product.id] || !product.id}
                      className={`flex items-center justify-center flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        addedToCart[product.id]
                          ? 'bg-green-700 cursor-default'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {addedToCart[product.id] ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Added to Cart
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </button>
                    
                    <Link
                      to={`/products/${product.id}`}
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended products - could add in a future update */}
    </div>
  );
};

export default WishlistPage; 