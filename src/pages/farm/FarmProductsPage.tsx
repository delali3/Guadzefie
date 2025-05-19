import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Eye,
  EyeOff,
  Grid,
  List,
  RefreshCw,
  PenSquare,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  inventory_count: number;
  category: string;
  image_url: string;
  is_organic: boolean;
  farmer_id?: string;
  vendor_id?: string;
  owner_id?: string;
  created_at: string;
  is_active: boolean;
  ratings_count?: number;
  avg_rating?: number;
  sales_count?: number;
}

interface ProductCardProps {
  product: Product;
  onSelect: (id: string) => void;
  isSelected: boolean;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}


const FarmProductsPage: React.FC = () => {
  // const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [, setConfirmDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, statusFilter, sortBy, currentPage]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) throw new Error("No authenticated user found");
      const user = JSON.parse(storedUser);

      // Build query for products
      let query = supabase
        .from('products')
        .select('*');
        
      // Try different possible column names for farm/user ID
      try {
        query = query.eq('farmer_id', user.id);
        
        // Test the query with farmer_id
        const {error: testError } = await supabase
          .from('products')
          .select('count')
          .eq('farmer_id', user.id)
          .limit(1);
          
        if (testError && testError.message.includes('does not exist')) {
          // Try vendor_id
          query = supabase
            .from('products')
            .select('*');
            
          // Test vendor_id
          const { error: vendorError } = await supabase
            .from('products')
            .select('count')
            .eq('vendor_id', user.id)
            .limit(1);
            
          if (vendorError && vendorError.message.includes('does not exist')) {
            // Try owner_id
            query = supabase
              .from('products')
              .select('*');
              
            query = query.eq('owner_id', user.id);
          } else {
            // vendor_id works
            query = query.eq('vendor_id', user.id);
          }
        }
        // Otherwise farmer_id works, continue with that
      } catch (e) {
        console.error("Error determining correct ID field:", e);
        // Fall back to trying owner_id as a last resort
        query = query.eq('owner_id', user.id);
      }

      // Apply category filter if needed
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      // Apply status filter if needed
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sortBy === 'price_high') {
        query = query.order('price', { ascending: false });
      } else if (sortBy === 'price_low') {
        query = query.order('price', { ascending: true });
      } else if (sortBy === 'name_asc') {
        query = query.order('name', { ascending: true });
      } else if (sortBy === 'name_desc') {
        query = query.order('name', { ascending: false });
      } else if (sortBy === 'inventory_low') {
        query = query.order('inventory_count', { ascending: true });
      }

      // Get all products to calculate total pages and extract categories
      const { data: allProductsData, error: countError } = await query;
      
      if (countError) throw countError;

      // Extract unique categories
      if (allProductsData) {
        const uniqueCategories = [...new Set(allProductsData.map(product => product.category))].filter(Boolean);
        setCategories(uniqueCategories);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      // Apply pagination to query
      query = query.range(from, to);

      const { data: productsData, error: productsError } = await query;

      if (productsError) throw productsError;

      // Calculate total pages
      const totalCount = allProductsData?.length || 0;
      setTotalPages(Math.ceil(totalCount / itemsPerPage));

      setProducts(productsData || []);
    } catch (err) {
      console.error('Error fetching farm products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  // const handleDeleteProduct = async (productId: string) => {
  //   try {
  //     const { error } = await supabase
  //       .from('products')
  //       .delete()
  //       .eq('id', productId);

  //     if (error) throw error;

  //     // Update local state
  //     setProducts(products.filter(product => product.id !== productId));
  //     setConfirmDelete(null);
  //   } catch (err) {
  //     console.error('Error deleting product:', err);
  //     alert('Failed to delete product');
  //   }
  // };

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      // Update local state
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, is_active: !currentStatus } 
          : product
      ));
    } catch (err) {
      console.error('Error updating product status:', err);
      alert('Failed to update product status');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product.id));
    }
  };

  // const handleBulkDelete = async () => {
  //   if (selectedProducts.length === 0) return;
    
  //   if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
  //     try {
  //       // Delete each product one by one
  //       for (const productId of selectedProducts) {
  //         const { error } = await supabase
  //           .from('products')
  //           .delete()
  //           .eq('id', productId);

  //         if (error) throw error;
  //       }

  //       // Update local state
  //       setProducts(products.filter(product => !selectedProducts.includes(product.id)));
  //       setSelectedProducts([]);
  //     } catch (err) {
  //       console.error('Error deleting products:', err);
  //       alert('Failed to delete some products');
  //     }
  //   }
  // };

  // Filter products based on search term
  const filteredProducts = searchTerm
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  // Helper to format inventory status with visual indicators
  const getInventoryStatusIndicator = (count: number) => {
    if (count <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
          Out of stock
        </span>
      );
    } else if (count < 10) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
          Low: {count}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
          In stock: {count}
        </span>
      );
    }
  };

  // Enhanced product card component for grid view 
 
  const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, isSelected, onDelete, onToggleStatus }) => {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border ${isSelected ? 'border-green-500 dark:border-green-400 ring-2 ring-green-500/20' : 'border-gray-200 dark:border-gray-700'} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
        <div className="relative">
          {/* Product image */}
          <div className="aspect-w-1 aspect-h-1 bg-gray-200 dark:bg-gray-700">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-16 w-16 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>
          
          {/* Status badges */}
          <div className="absolute top-2 right-2 flex space-x-1">
            <div className={`text-xs px-2 py-1 rounded-full ${
              product.is_active 
                ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
            }`}>
              {product.is_active ? 'Active' : 'Inactive'}
            </div>
            {product.is_organic && (
              <div className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs px-2 py-1 rounded-full">
                Organic
              </div>
            )}
          </div>
          
          {/* Selection checkbox */}
          <div className="absolute top-2 left-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(product.id)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
              aria-label={`Select ${product.name}`}
            />
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{product.description}</p>
          
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900 dark:text-white">${product.price.toFixed(2)}</div>
            <div className={`text-xs px-2 py-1 rounded-full ${
              product.inventory_count <= 0 
                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
                : product.inventory_count < 10
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
            }`}>
              {product.inventory_count <= 0 
                ? 'Out of stock' 
                : product.inventory_count < 10 
                  ? `Low: ${product.inventory_count}` 
                  : `In stock: ${product.inventory_count}`}
            </div>
          </div>
        </div>
        
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="flex space-x-2">
                      <Link 
            to={`/farm/products/${product.id}/edit`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            aria-label={`Edit ${product.name}`}
          >
            <PenSquare className="h-4 w-4" />
            </Link>
            <button
              onClick={() => onToggleStatus(product.id, product.is_active)}
              className={`${
                product.is_active 
                  ? 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300' 
                  : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
              }`}
              aria-label={product.is_active ? `Deactivate ${product.name}` : `Activate ${product.name}`}
            >
              {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              aria-label={`Delete ${product.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          
          <Link 
            to={`/product/${product.id}`}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
            aria-label={`View ${product.name}`}
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="p-12 text-center">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No products found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
            ? 'Try adjusting your search or filter criteria.'
            : 'Add your first product to get started.'}
        </p>
        <Link 
          to="/farm/products/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Improved Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Your Farm Products</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your inventory, prices and product listings.</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => fetchProducts()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              aria-label="Refresh products"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Link 
              to="/farm/products/new" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{products.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Products</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {products.filter(p => p.is_active).length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock</p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {products.filter(p => p.inventory_count < 10).length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search, filters and view options */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center flex-1">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 py-2 block w-full border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-300 focus:ring-green-500 focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center ml-4 space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 py-2 border ${showFilters ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'} rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters ? (
                  <ChevronDown className="h-4 w-4 ml-1 transform rotate-180 transition-transform" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-1 transition-transform" />
                )}
              </button>
              
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'} rounded-l-md border-r border-gray-300 dark:border-gray-600`}
                  aria-label="Grid view"
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 ${viewMode === 'table' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'} rounded-r-md`}
                  aria-label="Table view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 dark:text-gray-300"
              aria-label="Sort products"
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
            
            {selectedProducts.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  const action = e.target.value;
                  if (action === 'delete') {
                    if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
                      // Implement bulk delete
                      alert(`Deleting ${selectedProducts.length} products`);
                    }
                  } else if (action === 'activate') {
                    // Implement bulk activate
                    alert(`Activating ${selectedProducts.length} products`);
                  } else if (action === 'deactivate') {
                    // Implement bulk deactivate
                    alert(`Deactivating ${selectedProducts.length} products`);
                  }
                  e.target.value = '';
                }}
                className="block py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 dark:text-gray-300"
                aria-label="Bulk actions"
              >
                <option value="">Actions ({selectedProducts.length})</option>
                <option value="activate">Activate</option>
                <option value="deactivate">Deactivate</option>
                <option value="delete">Delete</option>
              </select>
            )}
          </div>
        </div>
        
        {/* Advanced filter options */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 dark:text-gray-300"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 dark:text-gray-300"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="organicFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organic Status
              </label>
              <select
                id="organicFilter"
                value={statusFilter === 'organic' ? 'organic' : statusFilter === 'non-organic' ? 'non-organic' : 'all'}
                onChange={(e) => {
                  if (e.target.value === 'organic') setStatusFilter('organic');
                  else if (e.target.value === 'non-organic') setStatusFilter('non-organic');
                  else setStatusFilter('all');
                }}
                className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 dark:text-gray-300"
              >
                <option value="all">All Products</option>
                <option value="organic">Organic Only</option>
                <option value="non-organic">Non-Organic Only</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Product Display Area */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No products found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Add your first product to get started.'}
          </p>
          <Link 
            to="/farm/products/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id}
                product={product}
                onSelect={handleSelectProduct}
                isSelected={selectedProducts.includes(product.id)}
                onDelete={() => setConfirmDelete(product.id)}
                onToggleStatus={handleToggleProductStatus}
              />
            ))}
          </div>
        </div>
      ) : (
        // Table View
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAllProducts}
                      aria-label="Select all products"
                    />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Inventory
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        aria-label={`Select ${product.name}`}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {product.image_url ? (
                          <img 
                            className="h-10 w-10 rounded-md object-cover" 
                            src={product.image_url} 
                            alt={product.name} 
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {product.category || 'Uncategorized'}
                    {product.is_organic && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Organic
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {getInventoryStatusIndicator(product.inventory_count)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link 
                        to={`/farm/products/${product.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        aria-label={`Edit ${product.name}`}
                      >
                        <PenSquare className="h-4 w-4" />
                      </Link>
                      <button 
                        onClick={() => handleToggleProductStatus(product.id, product.is_active)}
                        className={`${
                          product.is_active 
                            ? 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300' 
                            : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                        }`}
                        aria-label={product.is_active ? `Deactivate ${product.name}` : `Activate ${product.name}`}
                      >
                        {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(product.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Improved Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                </span>{' '}
                of <span className="font-medium">{filteredProducts.length}</span> products
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${
                    currentPage === 1
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${
                      currentPage === i + 1
                        ? 'z-10 bg-green-50 dark:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium ${
                    currentPage === totalPages
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmProductsPage;
