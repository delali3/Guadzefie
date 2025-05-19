// src/pages/ProductPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProducts } from '../contexts/ProductContext';
import SEO from '../components/SEO';
import {
  ShoppingCart,
  Heart,
  Share2,
  Check,
  Star,
  Truck,
  ShieldCheck,
  ChevronRight,
  Sun,
  Droplets,
  Leaf
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

// Types
interface FarmProduct {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
  category_id: number;
  inventory_count: number;
  featured: boolean;
  rating?: number;
  discount_percentage?: number;
  sku?: string;
  weight?: number;
  dimensions?: string;
  tags?: string[];
  harvest_date?: string;
  farming_method?: string;
  region?: string;
  categories?: {
    id: number;
    name: string;
    slug: string;
  };
  reviews?: ProductReview[];
}

interface ProductReview {
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

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<FarmProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<FarmProduct[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  // Destructure additional functions and state from useProducts
  const { viewProduct, addToWishlist, addToCart, removeFromWishlist, state } = useProducts();

  // Initialize addedToWishlist based on whether it's already in the wishlist
  const [, setAddedToWishlist] = useState(
    state.wishlist.includes(parseInt(id || '0', 10))
  );

  // Update the fetchProductData function to fix the ambiguous relationship
  const fetchProductData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching farm product ID:", id);

      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid product ID');
      }

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
        .eq('id', numericId)
        .single();

      if (productError) throw productError;

      if (!productData) {
        throw new Error('Farm product not found');
      }

      console.log("Farm product data loaded successfully:", productData.name);
      setProduct(productData);

      // Mark as viewed in context
      viewProduct(numericId);

      // Fetch related products (products in the same category, excluding current product)
      if (productData.category_id) {
        const { data: relatedData, error: relatedError } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', productData.category_id)
          .neq('id', numericId)
          .limit(4);

        if (!relatedError && relatedData) {
          console.log("Related farm products loaded:", relatedData.length);
          setRelatedProducts(relatedData);
        }
      }
    } catch (err) {
      console.error('Error fetching farm product:', err);
      setError(err instanceof Error ? err.message : 'Failed to load farm product data');
    } finally {
      setIsLoading(false);
    }
  }, [id, viewProduct]);
  
  // Single useEffect to fetch product data
  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]); // This will only run when fetchProductData function changes

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuantity(parseInt(e.target.value, 10));
  };

  // Add to cart
  const handleAddToCart = () => {
    if (!product) return;
  
    console.log('Adding to cart:', { product, quantity });
    
    // Use the context function instead of manually updating localStorage
    addToCart(product.id, quantity);
    
    // Just handle the visual feedback
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleAddToWishlist = () => {
    if (!product) return;

    // Check if product is already in wishlist
    const isInWishlist = state.wishlist.includes(product.id);

    console.log(`Farm product ${product.id} in wishlist: ${isInWishlist}`);
    console.log("Current wishlist:", state.wishlist);

    if (isInWishlist) {
      console.log(`Removing farm product ${product.id} from wishlist`);
      removeFromWishlist(product.id);
    } else {
      console.log(`Adding farm product ${product.id} to wishlist`);
      addToWishlist(product.id);
    }
  };

  // Keep UI in sync with wishlist state
  useEffect(() => {
    if (product) {
      setAddedToWishlist(state.wishlist.includes(product.id));
    }
  }, [state.wishlist, product]);

  // Share product
  const handleShare = () => {
    if (navigator.share && product) {
      navigator.share({
        title: `Farm Connect Ghana: ${product.name}`,
        text: product.description,
        url: window.location.href,
      }).catch(err => {
        console.error('Error sharing farm product:', err);
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard! Share this farm product with others.');
    }
  };

  // Generate rich structured data for the product (schema.org)
  const generateProductSchema = () => {
    if (!product) return '{}';
    
    const schema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "image": product.image_url || `https://source.unsplash.com/random/800x800/?farm+${product.id}`,
      "sku": product.sku || `PRD-${product.id}`,
      "brand": {
        "@type": "Brand",
        "name": "Guadzefie Farms"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "GHS",
        "price": product.discount_percentage 
          ? (product.price * (1 - (product.discount_percentage / 100))).toFixed(2)
          : product.price.toFixed(2),
        "availability": product.inventory_count > 0 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock"
      }
    };
    
    // Only add rating info if available
    if (product.rating) {
      return JSON.stringify({
        ...schema,
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product.rating.toString(),
          "reviewCount": product.reviews?.length || "5"
        }
      });
    }
    
    return JSON.stringify(schema);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200">Error Loading Farm Product</h2>
          <p className="text-red-700 dark:text-red-300 mt-2">{error || 'Farm product not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-4 py-2 rounded-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Calculate discounted price
  const discountedPrice = product.discount_percentage
    ? product.price * (1 - (product.discount_percentage / 100))
    : null;

  // Generate an array of 4 product images (in a real app, you would use actual product images)
  const productImages = [
    product.image_url || `https://source.unsplash.com/random/800x800/?farm+${product.id}`,
    `https://source.unsplash.com/random/800x800/?ghana+${product.name.split(' ')[0]}`,
    `https://source.unsplash.com/random/800x800/?agriculture+${product.name.split(' ').slice(-1)[0]}`,
    `https://source.unsplash.com/random/800x800/?harvest`
  ];

  // Calculate average rating
  const avgRating = product.reviews && product.reviews.length > 0
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
    : product.rating || 0;

  return (
    <div className="bg-white dark:bg-gray-900">
      {product && (
        <SEO 
          title={`${product.name} | Farm Fresh Products`}
          description={product.description.length > 160 
            ? product.description.substring(0, 157) + '...' 
            : product.description}
          keywords={`${product.name}, ${product.farming_method || 'farming'}, organic produce, ${product.categories?.name || 'farm products'}, fresh harvest`}
          ogType="product"
          ogImage={product.image_url}
          canonical={`https://guadzefie.com/products/${product.id}`}
        />
      )}
      
      {product && (
        <Helmet>
          <script type="application/ld+json">{generateProductSchema()}</script>
        </Helmet>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6 text-sm text-gray-600 dark:text-gray-400">
          <Link to="/" className="hover:text-green-700 dark:hover:text-green-400">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          {product.categories && (
            <>
              <Link
                to={`/products?category=${product.categories.id}`}
                className="hover:text-green-700 dark:hover:text-green-400"
              >
                {product.categories.name}
              </Link>
              <ChevronRight className="w-4 h-4 mx-2" />
            </>
          )}
          <span className="text-green-800 dark:text-green-300 font-medium">{product.name}</span>
        </nav>

        {/* Product Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-white">
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-center object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-w-1 aspect-h-1 rounded overflow-hidden border-2 ${selectedImage === index
                    ? 'border-green-500 dark:border-green-400'
                    : 'border-transparent'
                    }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} - view ${index + 1}`}
                    className="w-full h-full object-center object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-green-900 dark:text-green-100">{product.name}</h1>
              
              {/* Producer and Region */}
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Grown by local farmers in {product.region || 'Greater Accra Region, Ghana'}
              </p>

              {/* Rating */}
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(avgRating)
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                        }`}
                      fill={i < Math.floor(avgRating) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {avgRating.toFixed(1)} ({product.reviews?.length || 0} reviews)
                </span>
              </div>
            </div>

            {/* Farming Method Badge */}
            {product.farming_method && (
              <div className="flex items-center">
                <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium mr-2 px-2.5 py-1 rounded-full">
                  {product.farming_method === 'Organic' ? (
                    <span className="flex items-center">
                      <Leaf className="w-3 h-3 mr-1" />
                      Organic
                    </span>
                  ) : product.farming_method}
                </span>
                {product.harvest_date && (
                  <span className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs font-medium px-2.5 py-1 rounded-full">
                    Harvested: {new Date(product.harvest_date).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div>
              {discountedPrice ? (
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-green-700 dark:text-green-300">
                    ₵{discountedPrice.toFixed(2)}
                  </span>
                  <span className="ml-2 text-xl text-gray-500 line-through">
                    ₵{product.price.toFixed(2)}
                  </span>
                  <span className="ml-2 bg-red-100 text-red-800 text-sm font-semibold px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-200">
                    Save {product.discount_percentage}%
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-green-700 dark:text-green-300">
                  ₵{product.price.toFixed(2)}
                </span>
              )}
              
              {/* Price per unit clarification */}
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Price per {product.weight ? `${product.weight} kg` : 'unit'}
              </p>
            </div>

            {/* Stock Status */}
            <div>
              {product.inventory_count > 0 ? (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <Check className="w-5 h-5 mr-1" />
                  <span>
                    {product.inventory_count > 10
                      ? 'In Stock - Ready for Harvest'
                      : `Only ${product.inventory_count} units left - Order soon!`}
                  </span>
                </div>
              ) : (
                <div className="text-red-600 dark:text-red-400">Out of Stock - Next harvest coming soon</div>
              )}
            </div>

            {/* Short Description */}
            <p className="text-gray-700 dark:text-gray-300">{product.description}</p>

            {/* Additional Info */}
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {product.sku && <div><span className="font-medium">Product Code:</span> {product.sku}</div>}
              {product.categories && (
                <div>
                  <span className="font-medium">Category:</span>{' '}
                  <Link
                    to={`/products?category=${product.categories.id}`}
                    className="text-green-600 dark:text-green-400 hover:underline"
                  >
                    {product.categories.name}
                  </Link>
                </div>
              )}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.tags.map(tag => (
                    <Link
                      key={tag}
                      to={`/products?tag=${tag}`}
                      className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full hover:bg-green-100 dark:hover:bg-green-800"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Add to Cart */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <select
                  value={quantity}
                  onChange={handleQuantityChange}
                  disabled={product.inventory_count === 0}
                  aria-label="Select quantity"
                  className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5"
                >
                  {[...Array(Math.min(10, product.inventory_count || 0))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.inventory_count === 0 || addedToCart}
                className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg font-medium ${product.inventory_count === 0
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                  : addedToCart
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  } transition-colors`}
              >
                {product.inventory_count === 0 ? (
                  'Out of Stock'
                ) : addedToCart ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Added to Basket
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Basket
                  </>
                )}
              </button>

              <button
                onClick={handleAddToWishlist}
                className={`flex items-center justify-center p-2.5 rounded-lg border ${state.wishlist.includes(product?.id || 0)
                    ? 'border-red-600 dark:border-red-400 text-red-600 dark:text-red-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-500 hover:text-green-500 dark:hover:border-green-400 dark:hover:text-green-400'
                  }`}
                aria-label={state.wishlist.includes(product?.id || 0) ? "Remove from saved items" : "Save for later"}
              >
                <Heart className="w-5 h-5" fill={state.wishlist.includes(product?.id || 0) ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-500 hover:text-green-500 dark:hover:border-green-400 dark:hover:text-green-400"
                aria-label="Share farm product"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Farmer Connect Features */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Truck className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Farm to doorstep delivery</span>
                </div>
                <div className="flex items-center">
                  <Leaf className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Support local farmers</span>
                </div>
                <div className="flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Quality guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-16">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`py-4 text-sm font-medium border-b-2 ${activeTab === 'description'
                  ? 'border-green-600 dark:border-green-400 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                About This Produce
              </button>
              <button
                onClick={() => setActiveTab('specifications')}
                className={`py-4 text-sm font-medium border-b-2 ${activeTab === 'specifications'
                  ? 'border-green-600 dark:border-green-400 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Farming Details
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 text-sm font-medium border-b-2 ${activeTab === 'reviews'
                  ? 'border-green-600 dark:border-green-400 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                Reviews ({product.reviews?.length || 0})
              </button>
            </nav>
          </div>

          <div className="py-6">
            {activeTab === 'description' && (
              <div className="space-y-6">
                {/* Main Description */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">Product Overview</h3>
                  <div className="prose prose-green dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{product.description}</p>
                  </div>
                </div>

                {/* Benefits Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">Nutritional Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400 font-bold">1</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">Rich in Vitamins</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Packed with essential vitamins to support your health and wellbeing.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">Locally Grown</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Freshly harvested from local Ghanaian farms to ensure maximum nutrition and flavor.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400 font-bold">3</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">Pesticide Free</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Grown with minimal or no chemical pesticides for healthier consumption.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400 font-bold">4</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">Community Support</h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Your purchase directly supports Ghanaian farming communities and sustainable agriculture.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Farming Method */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">Farming Methods</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
                      <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                        <Sun className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Sun-Ripened</h4>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Naturally ripened under Ghana's sunshine</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
                      <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                        <Droplets className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Sustainably Irrigated</h4>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Using water conservation methods</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
                      <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                        <Leaf className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Traditional Techniques</h4>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Using indigenous farming knowledge</p>
                    </div>
                  </div>
                </div>

                {/* Recipes and Uses */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">Recipe Ideas</h3>
                  <div className="prose prose-green dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      Here are some traditional Ghanaian recipes you can prepare with this fresh produce:
                    </p>
                    <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-2 mt-0.5">1</span>
                        <span>Traditional Jollof Rice with fresh vegetables</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-2 mt-0.5">2</span>
                        <span>Kontomire Stew using fresh farm greens</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-2 mt-0.5">3</span>
                        <span>Garden Egg Stew with locally grown ingredients</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'specifications' && (
              <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20 w-1/3">Product Code</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{product.sku || 'GH-FARM-' + product.id}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20">Weight</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{product.weight ? `${product.weight} kg` : 'Sold per unit'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20">Origin</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{product.region || 'Greater Accra Region, Ghana'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20">Category</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{product.categories?.name || 'Farm Produce'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20">Farming Method</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{product.farming_method || 'Traditional'}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20">Harvest Date</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                        {product.harvest_date ? new Date(product.harvest_date).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently harvested'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20">Storage</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">Store in a cool, dry place or refrigerate for extended freshness</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20">Available Stock</td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{product.inventory_count} units</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {/* Review Summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-green-800 dark:text-green-300">Customer Reviews</h3>
                        <div className="flex items-center mt-1">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${i < Math.floor(avgRating)
                                  ? 'text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                fill={i < Math.floor(avgRating) ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                            Based on {product.reviews.length} reviews
                          </span>
                        </div>
                      </div>
                      <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Share Your Experience
                      </button>
                    </div>

                    {/* Review List */}
                    <div className="space-y-8">
                      {product.reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                                {review.users?.first_name?.charAt(0) || review.users?.last_name?.charAt(0) || 'C'}
                              </div>
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {review.users?.first_name && review.users?.last_name
                                    ? `${review.users.first_name} ${review.users.last_name}`
                                    : 'Customer'}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating
                                      ? 'text-yellow-400'
                                      : 'text-gray-300 dark:text-gray-600'
                                      }`}
                                    fill={i < review.rating ? 'currentColor' : 'none'}
                                  />
                                ))}
                              </div>
                              {review.comment && (
                                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">No Reviews Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Be the first to review this farm product</p>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      Write a Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-6">More From This Farm</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id} className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200 dark:bg-gray-700 w-full overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
                    <img
                      src={relatedProduct.image_url || `https://source.unsplash.com/random/300x300/?farm+${relatedProduct.id}`}
                      alt={relatedProduct.name}
                      className="w-full h-full object-center object-cover group-hover:opacity-75"
                    />
                    {relatedProduct.inventory_count <= 5 && relatedProduct.inventory_count > 0 && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        Only {relatedProduct.inventory_count} left!
                      </div>
                    )}
                    {relatedProduct.inventory_count === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      <Link to={`/products/${relatedProduct.id}`}>
                        <span aria-hidden="true" className="absolute inset-0" />
                        {relatedProduct.name}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{relatedProduct.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-lg font-medium text-green-700 dark:text-green-300">₵{relatedProduct.price.toFixed(2)}</p>
                      {relatedProduct.rating && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                          <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{relatedProduct.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seasonal Products Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-6">In Season Now</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                <div className="aspect-w-1 aspect-h-1 bg-gray-200 dark:bg-gray-700 w-full overflow-hidden">
                  <img
                    src={`https://img.freepik.com/free-photo/tegallalang-bali-near-cultural-village-ubud-is-area-known-as-tegallalang-that-boasts-most-dramatic-terraced-rice-fields-all-bali_231208-9914.jpg?t=st=1743871766~exp=1743875366~hmac=180aa16264de75dc8865dd8455e97feba89db7118daf0468a8be5d5623f57f7c&w=740`}
                    alt={`Seasonal product ${i + 1}`}
                    className="w-full h-full object-center object-cover group-hover:opacity-75"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-medium text-gray-900 dark:text-white truncate">Seasonal Harvest {i + 1}</h3>
                  <p className="mt-1 text-sm font-medium text-green-700 dark:text-green-300">₵{(19.99 + i * 5).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-16 bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">
                How does Farm Connect Ghana work?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Farm Connect Ghana directly connects you with local farmers. When you place an order, farmers harvest your products fresh and we deliver them straight to your door, ensuring maximum freshness and supporting local agriculture.
              </p>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">
                How long does delivery take?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Deliveries in urban areas typically arrive within 24-48 hours of harvesting. Rural deliveries may take 2-3 days depending on your location. We prioritize freshness and quality.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">
                How do you ensure product quality?
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                We work directly with trusted farmers who follow sustainable farming practices. All produce is inspected before delivery, and we offer a satisfaction guarantee on every purchase.
              </p>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-16 bg-green-100 dark:bg-green-900/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">Join Our Farming Community</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-md mx-auto">
            Subscribe to receive updates on seasonal harvests, farming tips, and exclusive offers from local farmers.
          </p>
          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 min-w-0 px-4 py-2 text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;