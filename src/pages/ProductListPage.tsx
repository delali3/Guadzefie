// src/pages/ProductListPage.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProducts } from '../contexts/ProductContext';
import {
    Filter,
    Grid,
    List,
    X,
    ChevronRight,
    Star,
    Leaf,
    Droplets,
    Sun,
    MapPin
} from 'lucide-react';


// Farm Product Card Component - Memoized to prevent unnecessary re-renders
// Farm Product Card Component - Memoized to prevent unnecessary re-renders
const FarmProductCard = React.memo(({ product, gridView }: { product: any, gridView: boolean }) => {
    // State to track selected image index
    const [selectedImage, setSelectedImage] = useState(0);
    
    // Generate product images (in a real app, you would use actual product images)
    const productImages = [
        product.image_url || `https://source.unsplash.com/random/300x300/?farm+${product.id}`,
        `https://source.unsplash.com/random/300x300/?ghana+${product.name.split(' ')[0]}`,
        `https://source.unsplash.com/random/300x300/?agriculture+${product.id}`,
    ];

    if (gridView) {
        return (
            <div key={product.id} className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 border border-green-100 dark:border-green-900/30">
                <div className="aspect-w-1 aspect-h-1 bg-gray-200 dark:bg-gray-700 w-full overflow-hidden relative">
                    {/* Main image */}
                    <img
                        src={productImages[selectedImage]}
                        alt={product.name}
                        className="w-full h-full object-center object-cover group-hover:opacity-75"
                        width={300}
                        height={300}
                    />
                    
                    {/* Image navigation dots */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {productImages.map((_, index) => (
                            <button 
                                key={index}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedImage(index);
                                }}
                                className={`w-2 h-2 rounded-full ${selectedImage === index ? 'bg-white' : 'bg-white/50'}`}
                                aria-label={`View image ${index + 1}`}
                            />
                        ))}
                    </div>
                    
                    {product.discount_percentage && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {product.discount_percentage}% OFF
                        </div>
                    )}
                    {product.farming_method === 'Organic' && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                            <Leaf className="w-3 h-3 mr-1" />
                            Organic
                        </div>
                    )}
                    {product.inventory_count <= 5 && product.inventory_count > 0 && (
                        <div className="absolute bottom-8 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            Only {product.inventory_count} left!
                        </div>
                    )}
                    {product.inventory_count === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <span className="text-white text-lg font-bold">Out of Stock</span>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{product.region || 'Greater Accra, Ghana'}</span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        <Link to={`/products/${product.id}`}>
                            <span aria-hidden="true" className="absolute inset-0" />
                            {product.name}
                        </Link>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{product.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                        {product.discount_percentage ? (
                            <div>
                                <span className="text-lg font-medium text-green-700 dark:text-green-300">
                                    ₵{(product.price * (1 - product.discount_percentage / 100)).toFixed(2)}
                                </span>
                                <span className="ml-2 text-sm text-gray-500 line-through">
                                    ₵{product.price.toFixed(2)}
                                </span>
                            </div>
                        ) : (
                            <span className="text-lg font-medium text-green-700 dark:text-green-300">
                                ₵{product.price.toFixed(2)}
                            </span>
                        )}
                        {product.rating && (
                            <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                                <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{product.rating}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div key={product.id} className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 border border-green-100 dark:border-green-900/30">
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4 relative">
                        {/* Main image */}
                        <div className="aspect-w-16 aspect-h-9 md:aspect-w-1 md:aspect-h-1 bg-gray-200 dark:bg-gray-700 w-full overflow-hidden">
                            <img
                                src={productImages[selectedImage]}
                                alt={product.name}
                                className="w-full h-full object-center object-cover group-hover:opacity-75"
                                width={300}
                                height={300}
                            />
                            
                            {/* Image thumbnails */}
                            <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-1">
                                {productImages.map((img, index) => (
                                    <button 
                                        key={index}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSelectedImage(index);
                                        }}
                                        className={`w-8 h-8 rounded-sm border-2 overflow-hidden ${selectedImage === index ? 'border-green-500' : 'border-white/50'}`}
                                    >
                                        <img 
                                            src={img} 
                                            alt={`Thumbnail ${index+1}`} 
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                            
                            {product.discount_percentage && (
                                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {product.discount_percentage}% OFF
                                </div>
                            )}
                            {product.farming_method === 'Organic' && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                    <Leaf className="w-3 h-3 mr-1" />
                                    Organic
                                </div>
                            )}
                            {product.inventory_count <= 5 && product.inventory_count > 0 && (
                                <div className="absolute bottom-14 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    Only {product.inventory_count} left!
                                </div>
                            )}
                            {product.inventory_count === 0 && (
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                    <span className="text-white text-lg font-bold">Out of Stock</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="md:w-3/4 p-4">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{product.region || 'Greater Accra, Ghana'}</span>
                            {product.harvest_date && (
                                <span className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-1.5 py-0.5 rounded-full text-xs">
                                    Harvested: {new Date(product.harvest_date).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                        </div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            <Link to={`/products/${product.id}`}>
                                <span aria-hidden="true" className="absolute inset-0" />
                                {product.name}
                            </Link>
                        </h3>
                        {product.rating && (
                            <div className="flex items-center mt-1">
                                <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                                <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{product.rating}</span>
                            </div>
                        )}
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{product.description}</p>
                        <div className="mt-2 flex items-center">
                            {product.discount_percentage ? (
                                <div>
                                    <span className="text-lg font-medium text-green-700 dark:text-green-300">
                                        ₵{(product.price * (1 - product.discount_percentage / 100)).toFixed(2)}
                                    </span>
                                    <span className="ml-2 text-sm text-gray-500 line-through">
                                        ₵{product.price.toFixed(2)}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-lg font-medium text-green-700 dark:text-green-300">
                                    ₵{product.price.toFixed(2)}
                                </span>
                            )}
                            
                            {product.weight && (
                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                    per {product.weight} kg
                                </span>
                            )}
                        </div>
                        {/* Show stock status */}
                        <div className="mt-2">
                            {product.inventory_count > 0 ? (
                                <span className="text-sm text-green-600 dark:text-green-400">
                                    Ready for Harvest • {product.inventory_count} available
                                </span>
                            ) : (
                                <span className="text-sm text-red-600 dark:text-red-400">
                                    Out of Stock • Next harvest coming soon
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

// Product Skeleton Loading Component
const ProductSkeleton = ({ gridView }: { gridView: boolean }) => {
    if (gridView) {
        return (
            <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-green-50 dark:border-green-900/10">
                <div className="aspect-w-1 aspect-h-1 bg-gray-200 dark:bg-gray-700 w-full"></div>
                <div className="p-4">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    <div className="mt-2 flex items-center justify-between">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-green-50 dark:border-green-900/10">
                <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4">
                        <div className="aspect-w-16 aspect-h-9 md:aspect-w-1 md:aspect-h-1 bg-gray-200 dark:bg-gray-700 w-full"></div>
                    </div>
                    <div className="md:w-3/4 p-4">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-1"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="mt-2">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                        <div className="mt-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

// Main Farm Product List Component
const ProductListPage: React.FC = () => {
    // For debugging, verify component renders
    console.log('ProductListPage rendering');

    const location = useLocation();
    const navigate = useNavigate();
    const { state, fetchProducts } = useProducts();
    const { products, loading, error } = state;

    // State for filters and sorting
    const [categories, setCategories] = useState<any[]>([]);
    const [regions,] = useState<string[]>([
        'Greater Accra', 'Ashanti', 'Northern', 'Central', 'Western', 'Eastern', 'Volta'
    ]);
    const [farmingMethods] = useState<string[]>([
        'Organic', 'Traditional', 'Conventional'
    ]);
    const [filters, setFilters] = useState({
        category: null as number | null,
        region: '' as string,
        farmingMethod: '' as string,
        search: '',
        minPrice: 0,
        maxPrice: 1000,
        sortBy: 'newest',
        page: 1
    });
    const [gridView, setGridView] = useState<boolean>(true);
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [totalPages, setTotalPages] = useState<number>(1);

    const itemsPerPage = 12;
    const isInitialLoad = useRef(true);
    const isUrlUpdate = useRef(false);

    // URL parameter parsing effect
    useEffect(() => {
        if (!isUrlUpdate.current) {
            const params = new URLSearchParams(location.search);

            // Extract all parameters at once to minimize state updates
            const newFilters = {
                category: params.get('category') ? parseInt(params.get('category')!, 10) : null,
                region: params.get('region') || '',
                farmingMethod: params.get('farming_method') || '',
                search: params.get('search') || '',
                minPrice: params.get('min_price') ? parseInt(params.get('min_price')!, 10) : 0,
                maxPrice: params.get('max_price') ? parseInt(params.get('max_price')!, 10) : 1000,
                sortBy: params.get('sort') || 'newest',
                page: params.get('page') ? parseInt(params.get('page')!, 10) : 1
            };

            // Use single state update
            setFilters(newFilters);
        }
        isUrlUpdate.current = false;
    }, [location.search]);

    // URL update effect
    useEffect(() => {
        // Skip first render and if it's an update from the URL
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        const params = new URLSearchParams();

        if (filters.category) {
            params.set('category', filters.category.toString());
        }

        if (filters.region) {
            params.set('region', filters.region);
        }

        if (filters.farmingMethod) {
            params.set('farming_method', filters.farmingMethod);
        }

        if (filters.search) {
            params.set('search', filters.search);
        }

        if (filters.minPrice > 0) {
            params.set('min_price', filters.minPrice.toString());
        }

        if (filters.maxPrice < 1000) {
            params.set('max_price', filters.maxPrice.toString());
        }

        params.set('sort', filters.sortBy);
        params.set('page', filters.page.toString());

        isUrlUpdate.current = true;
        navigate({ search: params.toString() }, { replace: true });
    }, [filters, navigate]);

    // Memoize computed values
    const filterOptions = useMemo(() => ({
        category_id: filters.category,
        region: filters.region,
        farming_method: filters.farmingMethod,
        search: filters.search,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        sort_by: filters.sortBy,
        limit: itemsPerPage,
        offset: (filters.page - 1) * itemsPerPage
    }), [
        filters.category,
        filters.region,
        filters.farmingMethod,
        filters.search, 
        filters.minPrice, 
        filters.maxPrice, 
        filters.sortBy, 
        filters.page, 
        itemsPerPage
    ]);
    
    // Test direct Supabase connection
    useEffect(() => {
        const testDirectQuery = async () => {
            console.log("Testing direct Supabase query...");
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .limit(3);

                console.log("Direct query results:", data);
                console.log("Direct query error:", error);

                if (data && data.length > 0) {
                    console.log("✅ DATABASE CONNECTION WORKING");
                } else {
                    console.log("⚠️ NO PRODUCTS FOUND IN DATABASE");
                }
            } catch (err) {
                console.error("❌ DATABASE CONNECTION FAILED:", err);
            }
        };

        testDirectQuery();
    }, []);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from('categories')
                    .select('*')
                    .order('name');

                if (error) throw error;
                setCategories(data || []);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };

        fetchCategories();
    }, []);

    // Fetch products based on filters
    useEffect(() => {
        const fetchFilteredProducts = async () => {
            console.log("Fetching farm products with options:", filterOptions);
            await fetchProducts(filterOptions);

            // Get total count for pagination
            try {
                let query = supabase
                    .from('products')
                    .select(`*, categories!products_category_id_fkey(id, name)`, { count: 'exact', head: true });

                if (filters.category) {
                    query = query.eq('category_id', filters.category);
                }

                if (filters.region) {
                    query = query.eq('region', filters.region);
                }

                if (filters.farmingMethod) {
                    query = query.eq('farming_method', filters.farmingMethod);
                }

                if (filters.search) {
                    query = query.ilike('name', `%${filters.search}%`);
                }

                if (filters.minPrice > 0) {
                    query = query.gte('price', filters.minPrice);
                }

                if (filters.maxPrice < 1000) {
                    query = query.lte('price', filters.maxPrice);
                }

                const { count, error } = await query;

                if (error) throw error;

                setTotalPages(Math.ceil((count || 0) / itemsPerPage));
            } catch (err) {
                console.error('Error fetching product count:', err);
            }
        };

        fetchFilteredProducts();
    }, [filterOptions, fetchProducts]);

    // Handle filter changes
    const handleCategoryChange = (categoryId: number | null) => {
        setFilters(prev => ({ ...prev, category: categoryId, page: 1 }));
    };

    const handleRegionChange = (region: string) => {
        setFilters(prev => ({ ...prev, region, page: 1 }));
    };

    const handleFarmingMethodChange = (method: string) => {
        setFilters(prev => ({ ...prev, farmingMethod: method, page: 1 }));
    };

    const handlePriceChange = (min: number, max: number) => {
        setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max, page: 1 }));
    };

    const handleSortChange = (value: string) => {
        setFilters(prev => ({ ...prev, sortBy: value, page: 1 }));
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, page: 1 }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
        window.scrollTo(0, 0);
    };

    const handleClearFilters = () => {
        setFilters({
            category: null,
            region: '',
            farmingMethod: '',
            search: '',
            minPrice: 0,
            maxPrice: 1000,
            sortBy: 'newest',
            page: 1
        });
    };

    const getCategoryName = (id: number | null) => {
        if (!id) return 'All Produce';
        const category = categories.find(cat => cat.id === id);
        return category ? category.name : 'Unknown Category';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumbs */}
            <nav className="flex mb-6 text-sm text-gray-600 dark:text-gray-400">
                <Link to="/" className="hover:text-green-700 dark:hover:text-green-400">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-green-800 dark:text-green-300 font-medium">Farm Produce</span>
                {filters.category && (
                    <>
                        <ChevronRight className="w-4 h-4 mx-2" />
                        <span className="text-green-800 dark:text-green-300 font-medium">{getCategoryName(filters.category)}</span>
                    </>
                )}
                {filters.region && (
                    <>
                        <ChevronRight className="w-4 h-4 mx-2" />
                        <span className="text-green-800 dark:text-green-300 font-medium">{filters.region} Region</span>
                    </>
                )}
            </nav>

            {/* Featured banner */}
            <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-center">
                    <div className="md:w-2/3 mb-4 md:mb-0 md:pr-6">
                        <h1 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-2">
                            {filters.category ? getCategoryName(filters.category) : 'Fresh Farm Produce'}
                        </h1>
                        <p className="text-gray-700 dark:text-gray-300">
                            {filters.category ? 
                                categories.find(c => c.id === filters.category)?.description || 
                                'Browse locally grown farm products direct from Ghanaian farmers.' : 
                                'Support local agriculture and get fresh produce delivered directly from farmers across Ghana. Each purchase helps sustain local farming communities.'}
                        </p>
                        {!filters.category && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {categories.slice(0, 5).map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => handleCategoryChange(category.id)}
                                        className="bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 hover:bg-green-700 hover:text-white dark:hover:bg-green-700 px-3 py-1 rounded-full text-sm border border-green-200 dark:border-green-800 transition-colors"
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="md:w-1/3 flex justify-center">
                        <img 
                            src="/assets/images/african-man-harvesting-vegetables.jpg" 
                            alt="Ghanaian Farming" 
                            className="rounded-lg shadow-sm max-h-40 object-cover"
                        />
                    </div>
                </div>
            </div>

            <div className="lg:grid lg:grid-cols-5 lg:gap-x-8">
                {/* Mobile filter dialog */}
                <button
                    type="button"
                    className="inline-flex items-center lg:hidden px-4 py-2 border border-green-300 dark:border-green-700 rounded-md shadow-sm text-sm font-medium text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30 mb-4"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="w-5 h-5 mr-2" />
                    {showFilters ? 'Hide Filters' : 'Filter Produce'}
                </button>

                {/* Sidebar filter (desktop) or dialog (mobile) */}
                <div className={`${showFilters
                        ? 'fixed inset-0 z-40 flex lg:static lg:inset-auto lg:block lg:z-auto'
                        : 'hidden lg:block'
                    }`}>
                    {/* Mobile background overlay */}
                    {showFilters && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-25 lg:hidden"
                            onClick={() => setShowFilters(false)}
                        ></div>
                    )}

                    <div className={`
            ${showFilters ? 'relative max-w-xs w-full h-full bg-white dark:bg-gray-800 shadow-xl py-4 pb-6 flex flex-col overflow-y-auto' : ''}
            lg:static lg:overflow-visible lg:h-auto lg:bg-transparent lg:shadow-none lg:dark:bg-transparent
          `}>
                        {/* Mobile close button */}
                        {showFilters && (
                            <div className="px-4 flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700 lg:hidden">
                                <h2 className="text-lg font-medium text-green-800 dark:text-green-300">Filter Produce</h2>
                                <button
                                    type="button"
                                    className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                                    onClick={() => setShowFilters(false)}
                                    aria-label="Close filters"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        )}

                        {/* Filter content */}
                        <div className="p-4 lg:pt-0">
                            {/* Search */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Search Produce</h3>
                                <form onSubmit={handleSearchSubmit} className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search farm produce..."
                                        value={filters.search}
                                        onChange={handleSearchChange}
                                        className="w-full px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute inset-y-0 right-0 px-3 flex items-center"
                                        aria-label="Search"
                                    >
                                        <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </form>
                            </div>

                            {/* Categories */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Produce Categories</h3>
                                <div className="space-y-2">
                                    <div
                                        className={`flex items-center cursor-pointer ${filters.category === null ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                        onClick={() => handleCategoryChange(null)}
                                    >
                                        <span className="ml-2">All Produce</span>
                                    </div>
                                    {categories.map((category) => (
                                        <div
                                            key={category.id}
                                            className={`flex items-center cursor-pointer ${filters.category === category.id ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                            onClick={() => handleCategoryChange(category.id)}
                                        >
                                            <span className="ml-2">{category.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Regions */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Farming Region</h3>
                                <div className="space-y-2">
                                    <div
                                        className={`flex items-center cursor-pointer ${filters.region === '' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                        onClick={() => handleRegionChange('')}
                                    >
                                        <span className="ml-2">All Regions</span>
                                    </div>
                                    {regions.map((region) => (
                                        <div
                                            key={region}
                                            className={`flex items-center cursor-pointer ${filters.region === region ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                            onClick={() => handleRegionChange(region)}
                                        >
                                            <span className="ml-2">{region} Region</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Farming Methods */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Farming Method</h3>
                                <div className="space-y-2">
                                    <div
                                        className={`flex items-center cursor-pointer ${filters.farmingMethod === '' ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                        onClick={() => handleFarmingMethodChange('')}
                                    >
                                        <span className="ml-2">All Methods</span>
                                    </div>
                                    {farmingMethods.map((method) => (
                                        <div
                                            key={method}
                                            className={`flex items-center cursor-pointer ${filters.farmingMethod === method ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                            onClick={() => handleFarmingMethodChange(method)}
                                        >
                                            {method === 'Organic' ? (
                                                <Leaf className="w-4 h-4 mr-1 text-green-600 dark:text-green-400" />
                                            ) : method === 'Traditional' ? (
                                                <Sun className="w-4 h-4 mr-1 text-amber-500 dark:text-amber-400" />
                                            ) : (
                                                <Droplets className="w-4 h-4 mr-1 text-blue-500 dark:text-blue-400" />
                                            )}
                                            <span>{method}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Price Range</h3>
                                <div className="flex space-x-2 items-center mb-2">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">₵</span>
                                    <input
                                        type="number"
                                        value={filters.minPrice}
                                        min={0}
                                        max={filters.maxPrice}
                                        onChange={(e) => handlePriceChange(parseInt(e.target.value) || 0, filters.maxPrice)}
                                        className="w-full text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                        aria-label="Minimum price"
                                    />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">to</span>
                                    <input
                                        type="number"
                                        value={filters.maxPrice}
                                        min={filters.minPrice}
                                        onChange={(e) => handlePriceChange(filters.minPrice, parseInt(e.target.value) || 0)}
                                        className="w-full text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                        aria-label="Maximum price"
                                    />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">₵</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={1000}
                                    value={filters.maxPrice}
                                    onChange={(e) => handlePriceChange(filters.minPrice, parseInt(e.target.value))}
                                    className="w-full accent-green-500"
                                    aria-label="Price range slider"
                                />
                            </div>

                            {/* Clear Filters */}
                            <button
                                onClick={handleClearFilters}
                                className="w-full flex items-center justify-center px-4 py-2 border border-green-300 dark:border-green-700 rounded-md shadow-sm text-sm font-medium text-green-700 dark:text-green-300 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Product grid */}
                <div className="mt-6 lg:mt-0 lg:col-span-4">
                    {/* Sort and View options */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <label htmlFor="sort-by" className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                                Sort by:
                            </label>
                            <select
                                id="sort-by"
                                value={filters.sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="newest">Newest Arrivals</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="rating">Best Rated</option>
                                <option value="harvest_date">Recent Harvest</option>
                            </select>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setGridView(true)}
                                className={`p-1.5 rounded-md ${gridView
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                aria-label="Grid view"
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setGridView(false)}
                                className={`p-1.5 rounded-md ${!gridView
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                aria-label="List view"
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <ProductSkeleton key={i} gridView={gridView} />
                            ))}
                        </div>
                    )}

                    {/* Error state */}
                    {error && !loading && (
                        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg text-red-800 dark:text-red-200">
                            <p>{error}</p>
                            <button
                                onClick={() => fetchProducts(filterOptions)}
                                className="mt-2 text-sm font-medium text-red-800 dark:text-red-200 underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && !error && products.length === 0 && (
                        <div className="text-center py-12 border border-green-100 dark:border-green-900/30 bg-white dark:bg-gray-800 rounded-lg">
                            <svg className="w-12 h-12 mx-auto text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="mt-2 text-lg font-medium text-green-800 dark:text-green-300">No produce found</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Try adjusting your search or filter to find what you're looking for.
                            </p>
                            <button
                                onClick={handleClearFilters}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}

                    {/* Product list */}
                    {!loading && !error && products.length > 0 && (
                        <>
                            {gridView ? (
                                // Grid view
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {products.map((product) => (
                                        <FarmProductCard key={product.id} product={product} gridView={true} />
                                    ))}
                                </div>
                            ) : (
                                // List view
                                <div className="space-y-4">
                                    {products.map((product) => (
                                        <FarmProductCard key={product.id} product={product} gridView={false} />
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-8">
                                    <button
                                        onClick={() => handlePageChange(filters.page - 1)}
                                        disabled={filters.page === 1}
                                        className={`px-3 py-1 rounded ${filters.page === 1
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                                            }`}
                                    >
                                        Previous
                                    </button>
                                    <div className="flex items-center space-x-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`px-3 py-1 rounded ${filters.page === i + 1
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => handlePageChange(filters.page + 1)}
                                        disabled={filters.page === totalPages}
                                        className={`px-3 py-1 rounded ${filters.page === totalPages
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                                            }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Farm to Table Section */}
            <div className="mt-16 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-4">Farm to Table: The FarmConnect Ghana Way</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Support Local Farmers</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Your purchases directly support Ghanaian farmers, helping them earn fair income for their hard work.
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Get Fresh Produce</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Enjoy farm-fresh, nutrient-rich produce harvested at peak ripeness and delivered directly to you.
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sustainable Agriculture</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Promote environmentally friendly farming practices that protect Ghana's natural resources for future generations.
                        </p>
                    </div>
                </div>
            </div>

            {/* Newsletter */}
            <div className="mt-16 bg-green-100 dark:bg-green-900/30 rounded-lg p-8 text-center">
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">Stay Connected with Local Farms</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-md mx-auto">
                    Subscribe to receive updates on harvest seasons, special offers, and farming news from across Ghana.
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
    );
};

export default ProductListPage;