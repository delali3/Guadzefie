// src/pages/admin/AdminProductsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    ChevronDown,
    Edit,
    Trash2,
    Eye,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    AlertTriangle,
    X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProductData {
    id: number;
    name: string;
    price: number;
    image_url: string;
    category_id: number;
    inventory_count: number;
    featured: boolean;
    created_at: string;
    rating: number;
    discount_percentage: number | null;
    sales_count: number;
    sku: string;
    category?: {
        name: string;
    };
}

interface CategoryData {
    id: number;
    name: string;
}

const AdminProductsPage: React.FC = () => {
    // State for products and UI
    const [products, setProducts] = useState<ProductData[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteProductId, setDeleteProductId] = useState<number | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [bulkSelection, setBulkSelection] = useState<number[]>([]);
    const [showBulkActions, setShowBulkActions] = useState(false);

    // State for filtering and sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [inventoryFilter, setInventoryFilter] = useState<string>('all');
    const [featuredFilter, setFeaturedFilter] = useState<string>('all');
    const [sortColumn, setSortColumn] = useState<string>('id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Fetch products with filters, sorting, and pagination
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Calculate range for pagination
                const from = (currentPage - 1) * itemsPerPage;
                const to = from + itemsPerPage - 1;

                // Start building the query
                let query = supabase
                    .from('products')
                    .select(`
                        *,
                        category:categories!products_category_id_fkey (
                        name
                        )
                    `, { count: 'exact' });
                // Apply filters
                if (searchQuery) {
                    query = query.or(`name.ilike.%${searchQuery}%, sku.ilike.%${searchQuery}%`);
                }

                if (selectedCategory !== null) {
                    query = query.eq('category_id', selectedCategory);
                }

                if (inventoryFilter === 'in_stock') {
                    query = query.gt('inventory_count', 0);
                } else if (inventoryFilter === 'low_stock') {
                    query = query.gt('inventory_count', 0).lte('inventory_count', 10);
                } else if (inventoryFilter === 'out_of_stock') {
                    query = query.eq('inventory_count', 0);
                }

                if (featuredFilter === 'featured') {
                    query = query.eq('featured', true);
                } else if (featuredFilter === 'not_featured') {
                    query = query.eq('featured', false);
                }

                // Apply sorting
                query = query.order(sortColumn, { ascending: sortDirection === 'asc' });

                // Apply pagination
                query = query.range(from, to);

                // Execute the query
                const { data, error: fetchError, count } = await query;

                if (fetchError) throw fetchError;

                if (data) {
                    setProducts(data);
                    setTotalCount(count || 0);
                }
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Failed to load products');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [
        currentPage,
        itemsPerPage,
        searchQuery,
        selectedCategory,
        inventoryFilter,
        featuredFilter,
        sortColumn,
        sortDirection
    ]);

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from('categories')
                    .select('id, name')
                    .order('name', { ascending: true });

                if (error) throw error;

                if (data) {
                    setCategories(data);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };

        fetchCategories();
    }, []);

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page on new search
    };

    // Handle sorting
    const handleSort = (column: string) => {
        if (sortColumn === column) {
            // Toggle direction if clicking the same column
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new column and default to ascending
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Handle delete product
    const handleDeleteProduct = async () => {
        if (!deleteProductId) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', deleteProductId);

            if (error) throw error;

            // Remove product from state
            setProducts(products.filter(product => product.id !== deleteProductId));
            setShowDeleteModal(false);
            setDeleteProductId(null);

            // If we deleted the last item on a page, go back a page
            if (currentPage > 1 && products.length === 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (err) {
            console.error('Error deleting product:', err);
            setError('Failed to delete product');
        }
    };

    // Handle bulk selection
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setBulkSelection(products.map(product => product.id));
        } else {
            setBulkSelection([]);
        }
    };

    const handleSelectProduct = (id: number, isChecked: boolean) => {
        if (isChecked) {
            setBulkSelection([...bulkSelection, id]);
        } else {
            setBulkSelection(bulkSelection.filter(productId => productId !== id));
        }
    };

    // Handle bulk actions
    const handleBulkDelete = async () => {
        if (bulkSelection.length === 0) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .in('id', bulkSelection);

            if (error) throw error;

            // Remove products from state
            setProducts(products.filter(product => !bulkSelection.includes(product.id)));
            setBulkSelection([]);
            setShowBulkActions(false);

            // If we deleted all items on a page, go back a page
            if (currentPage > 1 && bulkSelection.length === products.length) {
                setCurrentPage(currentPage - 1);
            }
        } catch (err) {
            console.error('Error performing bulk delete:', err);
            setError('Failed to delete products');
        }
    };

    const handleBulkFeature = async (featured: boolean) => {
        if (bulkSelection.length === 0) return;

        try {
            const { error } = await supabase
                .from('products')
                .update({ featured })
                .in('id', bulkSelection);

            if (error) throw error;

            // Update products in state
            setProducts(products.map(product =>
                bulkSelection.includes(product.id)
                    ? { ...product, featured }
                    : product
            ));
            setBulkSelection([]);
            setShowBulkActions(false);
        } catch (err) {
            console.error('Error updating products:', err);
            setError('Failed to update products');
        }
    };

    // Reset filters
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory(null);
        setInventoryFilter('all');
        setFeaturedFilter('all');
        setSortColumn('id');
        setSortDirection('desc');
        setCurrentPage(1);
    };

    // Pagination helpers
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const renderPaginationButtons = () => {
        const buttons = [];
        const maxButtons = 5; // Max number of page buttons to show

        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);

        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        // Previous button
        buttons.push(
            <button
                key="prev"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
                <span className="sr-only">Previous</span>
                <ChevronDown className="h-5 w-5 rotate-90" />
            </button>
        );

        // Page buttons
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`relative inline-flex items-center px-4 py-2 border ${i === currentPage
                            ? 'z-10 bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-400 text-green-600 dark:text-green-400'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        } text-sm font-medium`}
                >
                    {i}
                </button>
            );
        }

        // Next button
        buttons.push(
            <button
                key="next"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
                <span className="sr-only">Next</span>
                <ChevronDown className="h-5 w-5 -rotate-90" />
            </button>
        );

        return buttons;
    };

    return (
        <div className="space-y-6">
            {/* Header with title and actions */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
                <div className="mt-4 sm:mt-0">
                    <Link
                        to="/admin/products/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                    </Link>
                </div>
            </div>

            {/* Filters and search */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        {/* Search form */}
                        <form onSubmit={handleSearch} className="w-full md:w-72">
                            <label htmlFor="search" className="sr-only">
                                Search products
                            </label>
                            <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                                    <Search className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="search"
                                    id="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-12 sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Search products..."
                                />
                            </div>
                        </form>

                        {/* Filter controls */}
                        <div className="flex flex-wrap gap-2">
                            {/* Category filter */}
                            <div className="inline-block">
                                <select
                                    id="category-filter"
                                    name="category-filter"
                                    aria-label="Filter by category"
                                    value={selectedCategory === null ? '' : selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                                    className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Inventory filter */}
                            <div className="inline-block">
                                <select
                                    id="inventory-filter"
                                    name="inventory-filter"
                                    aria-label="Filter by inventory status"
                                    value={inventoryFilter}
                                    onChange={(e) => setInventoryFilter(e.target.value)}
                                    className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="all">All Inventory</option>
                                    <option value="in_stock">In Stock</option>
                                    <option value="low_stock">Low Stock</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                </select>
                            </div>

                            {/* Featured filter */}
                            <div className="inline-block">
                                <select
                                    id="featured-filter"
                                    name="featured-filter"
                                    aria-label="Filter by featured status"
                                    value={featuredFilter}
                                    onChange={(e) => setFeaturedFilter(e.target.value)}
                                    className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="all">All Products</option>
                                    <option value="featured">Featured</option>
                                    <option value="not_featured">Not Featured</option>
                                </select>
                            </div>

                            {/* Items per page filter */}
                            <div className="inline-block">
                                <select
                                    id="items-per-page"
                                    name="items-per-page"
                                    aria-label="Select number of items per page"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1); // Reset to first page
                                    }}
                                    className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value={10}>10 per page</option>
                                    <option value={25}>25 per page</option>
                                    <option value={50}>50 per page</option>
                                    <option value={100}>100 per page</option>
                                </select>
                            </div>

                            {/* Reset filters button */}
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Active filters display */}
                    {(searchQuery || selectedCategory !== null || inventoryFilter !== 'all' || featuredFilter !== 'all') && (
                        <div className="mt-4">
                            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Filters:</h3>
                            <div className="mt-1 flex items-center flex-wrap gap-2">
                                {searchQuery && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                        Search: {searchQuery}
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="ml-1 inline-flex text-green-500 focus:outline-none"
                                        >
                                            <span className="sr-only">Remove</span>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}

                                {selectedCategory !== null && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                        Category: {categories.find(c => c.id === selectedCategory)?.name}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory(null)}
                                            className="ml-1 inline-flex text-green-500 focus:outline-none"
                                        >
                                            <span className="sr-only">Remove</span>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}

                                {inventoryFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                        Inventory: {inventoryFilter.replace('_', ' ')}
                                        <button
                                            type="button"
                                            onClick={() => setInventoryFilter('all')}
                                            className="ml-1 inline-flex text-green-500 focus:outline-none"
                                        >
                                            <span className="sr-only">Remove</span>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}

                                {featuredFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                        {featuredFilter === 'featured' ? 'Featured Only' : 'Not Featured'}
                                        <button
                                            type="button"
                                            onClick={() => setFeaturedFilter('all')}
                                            className="ml-1 inline-flex text-green-500 focus:outline-none"
                                        >
                                            <span className="sr-only">Remove</span>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bulk actions */}
                {bulkSelection.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/30 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                {bulkSelection.length} {bulkSelection.length === 1 ? 'product' : 'products'} selected
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowBulkActions(!showBulkActions)}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900"
                            >
                                Bulk Actions
                                <ChevronDown className={`ml-1 h-4 w-4 ${showBulkActions ? 'transform rotate-180' : ''}`} />
                            </button>

                            {showBulkActions && (
                                <div className="absolute right-4 mt-10 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        <button
                                            onClick={() => handleBulkFeature(true)}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            role="menuitem"
                                        >
                                            Set as Featured
                                        </button>
                                        <button
                                            onClick={() => handleBulkFeature(false)}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            role="menuitem"
                                        >
                                            Remove Featured
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                            role="menuitem"
                                        >
                                            Delete Selected
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setBulkSelection([])}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                )}

                {/* Products table */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                        </div>
                    ) : error ? (
                        <div className="p-6 text-center">
                            <p className="text-red-500 dark:text-red-400">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Retry
                            </button>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-12">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products found</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Try adjusting your search or filter to find what you're looking for.
                            </p>
                            <div className="mt-6">
                                <Link
                                    to="/admin/products/new"
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                    Add Product
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center">
                                            <input
                                                id="select-all"
                                                name="select-all"
                                                type="checkbox"
                                                aria-label="Select all products"
                                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                                                checked={bulkSelection.length === products.length && products.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <button
                                            className="group inline-flex items-center"
                                            onClick={() => handleSort('name')}
                                        >
                                            Product
                                            <span className="ml-1.5 flex-none rounded">
                                                {sortColumn === 'name' ? (
                                                    sortDirection === 'asc' ? (
                                                        <ArrowUp className="h-4 w-4 text-gray-400" />
                                                    ) : (
                                                        <ArrowDown className="h-4 w-4 text-gray-400" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                                                )}
                                            </span>
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <button
                                            className="group inline-flex items-center"
                                            onClick={() => handleSort('price')}
                                        >
                                            Price
                                            <span className="ml-1.5 flex-none rounded">
                                                {sortColumn === 'price' ? (
                                                    sortDirection === 'asc' ? (
                                                        <ArrowUp className="h-4 w-4 text-gray-400" />
                                                    ) : (
                                                        <ArrowDown className="h-4 w-4 text-gray-400" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                                                )}
                                            </span>
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <button
                                            className="group inline-flex items-center"
                                            onClick={() => handleSort('inventory_count')}
                                        >
                                            Inventory
                                            <span className="ml-1.5 flex-none rounded">
                                                {sortColumn === 'inventory_count' ? (
                                                    sortDirection === 'asc' ? (
                                                        <ArrowUp className="h-4 w-4 text-gray-400" />
                                                    ) : (
                                                        <ArrowDown className="h-4 w-4 text-gray-400" />
                                                    )
                                                ) : (
                                                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                                                )}
                                            </span>
                                        </button>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select product ${product.name}`}
                                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                                                    checked={bulkSelection.includes(product.id)}
                                                    onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img
                                                        className="h-10 w-10 rounded-md object-cover"
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
                                                        }}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {product.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        SKU: {product.sku}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">${product.price.toFixed(2)}</div>
                                            {product.discount_percentage && (
                                                <div className="text-xs text-red-500 dark:text-red-400">
                                                    {product.discount_percentage}% OFF
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {product.category?.name || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {product.inventory_count <= 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                                    Out of Stock
                                                </span>
                                            ) : product.inventory_count <= 10 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                                    Low Stock ({product.inventory_count})
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                                    In Stock ({product.inventory_count})
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex flex-wrap gap-1">
                                                {product.featured && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                                        Featured
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                                    Rating: {product.rating}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <Link
                                                    to={`/products/${product.id}`}
                                                    target="_blank"
                                                    className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                                                    title="View product"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </Link>
                                                <Link
                                                    to={`/admin/products/${product.id}/edit`}
                                                    className="text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                                                    title="Edit product"
                                                >
                                                    <Edit className="h-5 w-5" />
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setDeleteProductId(product.id);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                                    title="Delete product"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 0 && (
                    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * itemsPerPage, totalCount)}
                                    </span>{' '}
                                    of <span className="font-medium">{totalCount}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    {renderPaginationButtons()}
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete confirmation modal */}
            {showDeleteModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                        Delete Product
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Are you sure you want to delete this product? All of the data will be permanently removed
                                            from our servers forever. This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm dark:focus:ring-offset-gray-800"
                                    onClick={handleDeleteProduct}
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:w-auto sm:text-sm dark:focus:ring-offset-gray-800"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteProductId(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProductsPage;