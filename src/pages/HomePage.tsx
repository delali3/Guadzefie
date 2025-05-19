import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import HeroSlider from '../components/layout/home/HeroSlider';
import Testimonials from '../components/layout/home/Testimonials';
import Newsletter from '../components/layout/home/Newsletter';
import FeaturesSection from '../components/layout/home/FeaturesSection';
import { ProductCard, CategoryCard } from "../components/layout/home/ProductComponents";
import SEO from '../components/SEO';

// Enhanced type definitions with farming-specific properties
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
  category_id: number;
  inventory_count: number;
  featured: boolean;
  created_at?: string;
  rating?: number;
  discount_percentage?: number;
  harvest_date?: string;  // When the product was harvested
  farm_location?: string; // Where the product was grown
  organic?: boolean;      // Whether the product is organic
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  image_url?: string;
  product_count?: number;
}

// State interface for better type safety
interface HomePageState {
  featuredProducts: Product[];
  newHarvests: Product[];  // Changed from newArrivals to newHarvests
  categories: Category[];
  bestSellers: Product[];
  isLoading: boolean;
  error: string | null;
}

// Main HomePage Component
const HomePage: React.FC = () => {
  const [state, setState] = useState<HomePageState>({
    featuredProducts: [],
    newHarvests: [],
    categories: [],
    bestSellers: [],
    isLoading: true,
    error: null
  });

  const updateState = (updates: Partial<HomePageState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch multiple datasets in parallel for better performance
        const [featuredResult, newHarvestsResult, categoriesResult, bestSellersResult] = await Promise.all([
          // Fetch featured products
          supabase
            .from('products')
            .select('*')
            .eq('featured', true)
            .limit(4),
            
          // Fetch new harvests
          supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(8),
            
          // Fetch categories
          supabase
            .from('categories')
            .select('*'),
            
          // Fetch best sellers (simulated with a query)
          supabase
            .from('products')
            .select('*')
            .order('sales_count', { ascending: false })
            .limit(4)
        ]);

        // Check for errors in any of the queries
        const errors = [
          featuredResult.error && `Failed to fetch featured products: ${featuredResult.error.message}`,
          newHarvestsResult.error && `Failed to fetch new harvests: ${newHarvestsResult.error.message}`,
          categoriesResult.error && `Failed to fetch categories: ${categoriesResult.error.message}`,
          bestSellersResult.error && `Failed to fetch best sellers: ${bestSellersResult.error.message}`
        ].filter(Boolean);

        if (errors.length > 0) {
          throw new Error(errors.join('. '));
        }

        // Process category product counts (in a real app, this might be a direct query)
        const categoriesWithCount = categoriesResult.data?.map(category => ({
          ...category,
          product_count: Math.floor(Math.random() * 50) + 10 // Simulated count
        })) || [];

        // Update all state at once to prevent multiple re-renders
        updateState({
          featuredProducts: featuredResult.data || [],
          newHarvests: newHarvestsResult.data || [],
          categories: categoriesWithCount,
          bestSellers: bestSellersResult.data || [],
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching homepage data:', error);
        updateState({ 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'An unknown error occurred' 
        });
      }
    };

    fetchData();
  }, []);

  // Placeholder data for fallbacks - Updated for farming context
  const placeholderFeaturedProducts: Product[] = [
    { 
      id: 1, 
      name: "Premium Organic Yams", 
      price: 12.99, 
      description: "Freshly harvested organic yams from the Eastern Region", 
      image_url: "https://source.unsplash.com/random/300x300/?yams", 
      category_id: 1, 
      inventory_count: 85, 
      featured: true,
      rating: 4.5,
      discount_percentage: 10,
      harvest_date: "2025-03-15",
      farm_location: "Eastern Region",
      organic: true
    },
    { 
      id: 2, 
      name: "Fresh Cassava Bundle", 
      price: 8.50, 
      description: "Premium cassava tubers, perfect for fufu and other traditional dishes", 
      image_url: "https://source.unsplash.com/random/300x300/?cassava", 
      category_id: 1, 
      inventory_count: 120, 
      featured: true,
      rating: 4.8,
      farm_location: "Central Region",
      harvest_date: "2025-03-20"
    },
    { 
      id: 3, 
      name: "Organic Plantain Bunch", 
      price: 6.75, 
      description: "Sweet, ripe plantains grown without pesticides", 
      image_url: "https://source.unsplash.com/random/300x300/?plantain", 
      category_id: 2, 
      inventory_count: 45, 
      featured: true,
      rating: 4.7,
      organic: true,
      farm_location: "Ashanti Region",
      harvest_date: "2025-03-18"
    },
    { 
      id: 4, 
      name: "Premium Cocoa Beans", 
      price: 15.99, 
      description: "High-quality fermented cocoa beans from sustainable farms", 
      image_url: "https://source.unsplash.com/random/300x300/?cocoa", 
      category_id: 3, 
      inventory_count: 60, 
      featured: true,
      rating: 4.9,
      farm_location: "Western Region",
      organic: true,
      harvest_date: "2025-03-10"
    }
  ];

  const placeholderCategories: Category[] = [
    { 
      id: 1, 
      name: "Root Crops", 
      description: "Yams, cassava, sweet potatoes and other tubers",
      product_count: 42,
      image_url: "https://source.unsplash.com/random/300x300/?yams"
    },
    { 
      id: 2, 
      name: "Fruits", 
      description: "Fresh tropical fruits from Ghanaian farms",
      product_count: 38,
      image_url: "https://source.unsplash.com/random/300x300/?tropical-fruits"
    },
    { 
      id: 3, 
      name: "Cash Crops", 
      description: "Cocoa, coffee, and other export crops",
      product_count: 25,
      image_url: "https://source.unsplash.com/random/300x300/?cocoa"
    },
    { 
      id: 4, 
      name: "Vegetables", 
      description: "Fresh, locally grown vegetables",
      product_count: 45,
      image_url: "https://source.unsplash.com/random/300x300/?african-vegetables"
    },
    { 
      id: 5, 
      name: "Grains & Cereals", 
      description: "Rice, millet, maize and other grains",
      product_count: 30,
      image_url: "https://source.unsplash.com/random/300x300/?maize"
    },
    { 
      id: 6, 
      name: "Farm Supplies", 
      description: "Seeds, tools, and equipment for farmers",
      product_count: 20,
      image_url: "https://source.unsplash.com/random/300x300/?farm-tools"
    }
  ];

  // Use real data if available, otherwise fallback to placeholders
  const { 
    featuredProducts, 
    newHarvests, 
    categories, 
    bestSellers, 
    isLoading, 
    error 
  } = state;

  const useFeaturedProducts = featuredProducts.length > 0 
    ? featuredProducts 
    : placeholderFeaturedProducts;

  const useNewHarvests = newHarvests.length > 0 
    ? newHarvests 
    : placeholderFeaturedProducts.map(p => ({ ...p, featured: false }));

  const useCategories = categories.length > 0 
    ? categories 
    : placeholderCategories;

  const useBestSellers = bestSellers.length > 0 
    ? bestSellers 
    : placeholderFeaturedProducts.slice(0, 4);

  // Loading state component
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mb-4"></div>
        <p className="text-gray-700 dark:text-gray-300 font-medium">Loading fresh harvests for you...</p>
      </div>
    );
  }

  // Error state component
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96 text-center px-4">
        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg mb-4">
          <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-bold mb-2">Oops! Something went wrong</h3>
          <p className="text-sm">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Featured category for the banner
  const featuredCategory = useCategories.length > 0 ? useCategories[0] : null;

  return (
    <div className="bg-white dark:bg-gray-900">
      <SEO 
        title="Home | Fresh Farm Products Direct to You"
        description="Guadzefie connects you directly with local farmers to bring the freshest produce right to your doorstep. Shop organic fruits, vegetables, and farm products."
        keywords="farm fresh, organic produce, local farmers, direct to consumer, farm to table, Ghana agriculture"
        ogType="website"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 py-8">
        {/* Hero Section */}
        <section>
          <HeroSlider />
        </section>

        {/* Features */}
        <section className="bg-green-50 dark:bg-gray-800 py-12 px-4 sm:px-6 -mx-4 sm:-mx-6 lg:-mx-8 rounded-lg">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-4">Why Farm With Us</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
                We connect Ghanaian farmers directly to buyers, ensuring fair prices and supporting local agriculture.
              </p>
            </div>
            <FeaturesSection />
          </div>
        </section>

        {/* Featured Products */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-300">Featured Produce</h2>
              <p className="text-gray-700 dark:text-gray-400 mt-1">Handpicked by our agricultural experts</p>
            </div>
            <Link 
              to="/products?featured=true" 
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium inline-flex items-center group"
            >
              View all 
              <svg className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useFeaturedProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={(p) => console.log('Added to cart:', p.name)}
                onAddToWishlist={(p) => console.log('Added to wishlist:', p.name)}
                onQuickView={(p) => console.log('Quick view:', p.name)}
              />
            ))}
          </div>
        </section>

        {/* Categories Banner */}
        {featuredCategory && (
          <section className="relative rounded-2xl overflow-hidden shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-yellow-600 opacity-90"></div>
            <img 
              src={featuredCategory.image_url || "https://source.unsplash.com/random/1200x400/?farm"} 
              alt="Farm categories" 
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
            />
            <div className="relative py-16 px-8 text-center text-white z-10">
              <h2 className="text-4xl font-bold mb-4">Explore Our Farm Produce</h2>
              <p className="text-xl max-w-2xl mx-auto mb-8">Discover fresh, locally grown crops from farms across Ghana</p>
              <Link to="/categories" className="inline-block bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Browse All Categories
              </Link>
            </div>
          </section>
        )}

        {/* Shop by Category */}
        <section>
          <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {useCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        {/* New Harvests - renamed from New Arrivals */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-green-800 dark:text-green-300">Fresh Harvests</h2>
              <p className="text-gray-700 dark:text-gray-400 mt-1">Recently harvested produce from local farms</p>
            </div>
            <Link 
              to="/products?sort=newest" 
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium inline-flex items-center group"
            >
              View all 
              <svg className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useNewHarvests.slice(0, 4).map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={(p) => console.log('Added to cart:', p.name)}
                onAddToWishlist={(p) => console.log('Added to wishlist:', p.name)}
                onQuickView={(p) => console.log('Quick view:', p.name)}
              />
            ))}
          </div>
        </section>
        
        {/* Best Sellers Section */}
        <section className="bg-green-50 dark:bg-gray-800 py-12 px-4 sm:px-6 -mx-4 sm:-mx-6 lg:-mx-8 rounded-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-300">Most Popular</h2>
                <p className="text-gray-700 dark:text-gray-400 mt-1">Our farmers' best-selling produce</p>
              </div>
              <Link 
                to="/products?sort=popular" 
                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium inline-flex items-center group"
              >
                View all 
                <svg className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {useBestSellers.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={(p) => console.log('Added to cart:', p.name)}
                  onAddToWishlist={(p) => console.log('Added to wishlist:', p.name)}
                  onQuickView={(p) => console.log('Quick view:', p.name)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-4">What Our Farmers & Buyers Say</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              Hear from the farmers and customers who are part of our growing community.
            </p>
          </div>
          <Testimonials />
        </section>

        {/* Newsletter - Updated to Farm Updates */}
        <section className="bg-gradient-to-r from-green-50 to-yellow-50 dark:from-green-900/20 dark:to-yellow-900/20 py-16 px-4 sm:px-6 -mx-4 sm:-mx-6 lg:-mx-8 rounded-2xl">
          <div className="max-w-3xl mx-auto">
            <Newsletter />
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;