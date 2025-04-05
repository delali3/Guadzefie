// src/pages/admin/ProductFormPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Trash2,
  X,
  AlertTriangle,
  Plus,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Category {
  id: number;
  name: string;
}

interface ProductFormData {
  name: string;
  price: number;
  description: string;
  image_url: string;
  category_id: number | null;
  inventory_count: number;
  featured: boolean;
  discount_percentage: number | null;
  sku: string;
  weight: number;
  dimensions: string;
  tags: string[];
}

interface FormErrors {
  [key: string]: string;
}

const defaultProductData: ProductFormData = {
  name: '',
  price: 0,
  description: '',
  image_url: 'https://source.unsplash.com/random/800x600/?product',
  category_id: null,
  inventory_count: 0,
  featured: false,
  discount_percentage: null,
  sku: '',
  weight: 0,
  dimensions: '',
  tags: []
};

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // Form state
  const [formData, setFormData] = useState<ProductFormData>(defaultProductData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Fetch product data if in edit mode
  useEffect(() => {
    const fetchProductData = async () => {
      if (!isEditMode) {
        // Generate a random SKU for new products
        const randomSku = `SKU-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        setFormData({...defaultProductData, sku: randomSku});
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setFormData({
            name: data.name || '',
            price: data.price || 0,
            description: data.description || '',
            image_url: data.image_url || '',
            category_id: data.category_id || null,
            inventory_count: data.inventory_count || 0,
            featured: data.featured || false,
            discount_percentage: data.discount_percentage || null,
            sku: data.sku || '',
            weight: data.weight || 0,
            dimensions: data.dimensions || '',
            tags: data.tags || []
          });
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductData();
  }, [id, isEditMode]);
  
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
        setError('Failed to load categories');
      }
    };
    
    fetchCategories();
  }, []);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number | boolean | null = value;
    
    // Convert numeric inputs
    if (type === 'number') {
      parsedValue = value === '' ? null : Number(value);
    }
    
    // Handle checkboxes
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
    
    // Clear any error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle tag management
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    // Don't add duplicate tags
    if (formData.tags.includes(tagInput.trim())) {
      setTagInput('');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()]
    }));
    setTagInput('');
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (formData.price <= 0) {
      errors.price = 'Price must be greater than zero';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.image_url.trim()) {
      errors.image_url = 'Image URL is required';
    }
    
    if (!formData.category_id) {
      errors.category_id = 'Category is required';
    }
    
    if (formData.inventory_count < 0) {
      errors.inventory_count = 'Inventory cannot be negative';
    }
    
    if (formData.discount_percentage !== null && (formData.discount_percentage <= 0 || formData.discount_percentage >= 100)) {
      errors.discount_percentage = 'Discount must be between 0 and 100';
    }
    
    if (!formData.sku.trim()) {
      errors.sku = 'SKU is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      if (isEditMode) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', id);
        
        if (error) throw error;
        
        setSuccessMessage('Product updated successfully');
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([formData]);
        
        if (error) throw error;
        
        setSuccessMessage('Product created successfully');
        
        // Redirect to products list after a short delay
        setTimeout(() => {
          navigate('/admin/products');
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!isEditMode) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Redirect to products list
      navigate('/admin/products');
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
      setShowDeleteModal(false);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Product' : 'Create New Product'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isEditMode
              ? 'Update product information, pricing, and inventory'
              : 'Add a new product to your store'}
          </p>
        </div>
        <div className="mt-4 flex space-x-3 sm:mt-0">
          <Link
            to="/admin/products"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
          
          {isEditMode && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          )}
        </div>
      </div>
      
      {/* Success message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="inline-flex bg-green-50 dark:bg-green-900/30 rounded-md p-1.5 text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900"
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="inline-flex bg-red-50 dark:bg-red-900/30 rounded-md p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900"
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Product form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {/* Basic Information Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Product Name */}
              <div className="sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Product Name*
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white ${
                      formErrors.name ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-700 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="name-error">
                      {formErrors.name}
                    </p>
                  )}
                </div>
              </div>
              
              {/* SKU */}
              <div className="sm:col-span-2">
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  SKU*
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="sku"
                    id="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white ${
                      formErrors.sku ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-700 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {formErrors.sku && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="sku-error">
                      {formErrors.sku}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Description */}
              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description*
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white ${
                      formErrors.description ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-700 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {formErrors.description && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="description-error">
                      {formErrors.description}
                    </p>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Write a detailed description of your product.</p>
              </div>
              
              {/* Category */}
              <div className="sm:col-span-3">
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category*
                </label>
                <div className="mt-1">
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id || ''}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white ${
                      formErrors.category_id ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-700 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.category_id && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="category-error">
                      {formErrors.category_id}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Featured */}
              <div className="sm:col-span-3">
                <div className="flex items-start mt-6">
                  <div className="flex items-center h-5">
                    <input
                      id="featured"
                      name="featured"
                      type="checkbox"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 dark:border-gray-600 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="featured" className="font-medium text-gray-700 dark:text-gray-300">
                      Featured Product
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Featured products are displayed prominently on the homepage and category pages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pricing & Inventory Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Pricing & Inventory</h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Price */}
              <div className="sm:col-span-2">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price* ($)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className={`pl-7 focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white ${
                      formErrors.price ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-700 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {formErrors.price && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="price-error">
                      {formErrors.price}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Discount */}
              <div className="sm:col-span-2">
                <label htmlFor="discount_percentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Discount (%)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    name="discount_percentage"
                    id="discount_percentage"
                    min="0"
                    max="99"
                    step="0.1"
                    value={formData.discount_percentage === null ? '' : formData.discount_percentage}
                    onChange={handleInputChange}
                    className={`focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white ${
                      formErrors.discount_percentage ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-700 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                    placeholder="No discount"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">%</span>
                  </div>
                  {formErrors.discount_percentage && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="discount-error">
                      {formErrors.discount_percentage}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Inventory */}
              <div className="sm:col-span-2">
                <label htmlFor="inventory_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Inventory Count*
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="inventory_count"
                    id="inventory_count"
                    min="0"
                    value={formData.inventory_count}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white ${
                      formErrors.inventory_count ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-700 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {formErrors.inventory_count && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="inventory-error">
                      {formErrors.inventory_count}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Details Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Product Details</h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Weight */}
              <div className="sm:col-span-2">
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Weight (kg)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="weight"
                    id="weight"
                    min="0"
                    step="0.01"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              {/* Dimensions */}
              <div className="sm:col-span-4">
                <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dimensions
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="dimensions"
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={handleInputChange}
                    placeholder="e.g. 10 x 5 x 3 cm"
                    className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              {/* Image URL */}
              <div className="sm:col-span-6">
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Image URL*
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="image_url"
                    id="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className={`flex-1 focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                      formErrors.image_url ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-700 focus:ring-red-500 focus:border-red-500' : ''
                    }`}
                  />
                </div>
                {formErrors.image_url && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400" id="image-error">
                    {formErrors.image_url}
                  </p>
                )}
                {formData.image_url && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview:</p>
                    <div className="mt-1 h-40 w-40 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                      <img
                        src={formData.image_url}
                        alt="Product preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Image+Error';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Tags */}
              <div className="sm:col-span-6">
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tags
                </label>
                <div className="mt-1">
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="tags"
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-none rounded-l-md sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Add a tag"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 sm:text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1.5 inline-flex text-green-500 focus:outline-none"
                        >
                          <span className="sr-only">Remove tag {tag}</span>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Add tags to help customers find your product. Press Enter or click Add after each tag.
                </p>
              </div>
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="bg-white dark:bg-gray-800 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Update Product' : 'Create Product'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      
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
                  disabled={saving}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm dark:focus:ring-offset-gray-800 disabled:opacity-50"
                  onClick={handleDeleteProduct}
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:w-auto sm:text-sm dark:focus:ring-offset-gray-800"
                  onClick={() => setShowDeleteModal(false)}
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

export default ProductFormPage;