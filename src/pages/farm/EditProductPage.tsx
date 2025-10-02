import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Leaf, 
  Calendar, 
  Tag,
  MapPin,
  BarChart,
  Info,
  AlertCircle,
  Package,
  Scale,
  Upload,
  Check,
  X,
  Save,
  Loader
} from 'lucide-react';

// Define types
interface Category {
  id: number;
  name: string;
}

interface ProductFormData {
  name: string;
  price: number;
  description: string;
  category_id: number | null;
  inventory_count: number;
  farming_method: string;
  harvest_date: string;
  weight: number;
  dimensions: string;
  region_of_origin: string;
  tags: string[];
  sku: string;
  is_organic: boolean;
  featured: boolean;
  min_order_quantity: number;
  storage_instructions: string;
}

const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: 0,
    description: '',
    category_id: null,
    inventory_count: 0,
    farming_method: 'Traditional',
    harvest_date: new Date().toISOString().split('T')[0],
    weight: 0,
    dimensions: '',
    region_of_origin: '',
    tags: [],
    sku: '',
    is_organic: false,
    featured: false,
    min_order_quantity: 1,
    storage_instructions: ''
  });

  // Fetch product data and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch categories first
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name');
        
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
        
        // Fetch product data
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (productError) throw productError;
        
        if (!product) {
          throw new Error('Product not found');
        }
        
        console.log('Fetched product data:', product);
        
        // Set product images
        const images: string[] = [];
        if (product.image_url) {
          images.push(product.image_url);
        }
        if (product.additional_images && Array.isArray(product.additional_images)) {
          images.push(...product.additional_images);
        }
        setProductImages(images);
        
        // Set form data
        setFormData({
          name: product.name || '',
          price: product.price || 0,
          description: product.description || '',
          category_id: product.category_id || null,
          inventory_count: product.inventory_count || 0,
          farming_method: product.farming_method || 'Traditional',
          harvest_date: product.harvest_date ? 
            new Date(product.harvest_date).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0],
          weight: product.weight || 0,
          dimensions: product.dimensions || '',
          region_of_origin: product.region_of_origin || '',
          tags: Array.isArray(product.tags) ? product.tags : [],
          sku: product.sku || '',
          is_organic: product.is_organic || false,
          featured: product.featured || false,
          min_order_quantity: product.min_order_quantity || 1,
          storage_instructions: product.storage_instructions || ''
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Form input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      tags: tagsArray
    }));
  };

  // Image handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewImages(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const handleRemoveExistingImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.price <= 0 || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Upload new images if any
      const uploadedImageUrls: string[] = [];
      for (const file of newImages) {
        const fileName = `product_images/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);
          
        if (urlData) {
          uploadedImageUrls.push(urlData.publicUrl);
        }
      }
      
      // Combine existing and new images
      const allImages = [...productImages, ...uploadedImageUrls];
      
      // Update product data
      const productData = {
        name: formData.name,
        price: formData.price,
        description: formData.description,
        category_id: formData.category_id,
        inventory_count: formData.inventory_count,
        farming_method: formData.farming_method,
        harvest_date: formData.harvest_date,
        weight: formData.weight,
        dimensions: formData.dimensions,
        region_of_origin: formData.region_of_origin,
        tags: formData.tags,
        sku: formData.sku,
        is_organic: formData.is_organic,
        featured: formData.featured,
        min_order_quantity: formData.min_order_quantity,
        storage_instructions: formData.storage_instructions,
        updated_at: new Date().toISOString(),
        image_url: allImages.length > 0 ? allImages[0] : null,
        additional_images: allImages.length > 1 ? allImages.slice(1) : []
      };
      
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      setSuccess('Product updated successfully!');
      
      // Redirect back to products page after short delay
      setTimeout(() => {
        navigate('/farm/products');
      }, 1500);
      
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="h-8 w-8 text-green-500 animate-spin" />
        <span className="ml-2 text-gray-700 dark:text-gray-300">Loading product...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Product</h1>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 p-4 rounded-md text-red-700 dark:text-red-300 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/30 p-4 rounded-md text-green-700 dark:text-green-300 flex items-center">
          <Check className="h-5 w-5 mr-2" />
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 rounded-md">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Info className="mr-2 h-5 w-5 text-green-600 dark:text-green-500" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Product Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category*
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id || ''}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price (GHS)*
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 pointer-events-none z-10">₵</span>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  className="w-full p-2 pl-12 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SKU
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Inventory Information */}
        <div className="bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 rounded-md">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Package className="mr-2 h-5 w-5 text-green-600 dark:text-green-500" />
            Inventory Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="inventory_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Inventory Count*
              </label>
              <div className="relative">
                <BarChart className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="number"
                  id="inventory_count"
                  name="inventory_count"
                  value={formData.inventory_count}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weight (kg)
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full p-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dimensions
              </label>
              <input
                type="text"
                id="dimensions"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleInputChange}
                placeholder="e.g., 10x5x3 cm"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="min_order_quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum Order Quantity
              </label>
              <input
                type="number"
                id="min_order_quantity"
                name="min_order_quantity"
                value={formData.min_order_quantity}
                onChange={handleInputChange}
                min="1"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <div className="flex space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_organic"
                  name="is_organic"
                  checked={formData.is_organic}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="is_organic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Organic
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Featured Product
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Farm Information */}
        <div className="bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 rounded-md">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Leaf className="mr-2 h-5 w-5 text-green-600 dark:text-green-500" />
            Farm Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="farming_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Farming Method
              </label>
              <select
                id="farming_method"
                name="farming_method"
                value={formData.farming_method}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="Traditional">Traditional</option>
                <option value="Organic">Organic</option>
                <option value="Hydroponic">Hydroponic</option>
                <option value="Permaculture">Permaculture</option>
                <option value="Aquaponic">Aquaponic</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="region_of_origin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Region of Origin
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <select
                  id="region_of_origin"
                  name="region_of_origin"
                  value={formData.region_of_origin}
                  onChange={handleInputChange}
                  className="w-full p-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select Region</option>
                  <option value="Greater Accra">Greater Accra</option>
                  <option value="Ashanti">Ashanti</option>
                  <option value="Eastern">Eastern</option>
                  <option value="Western">Western</option>
                  <option value="Central">Central</option>
                  <option value="Northern">Northern</option>
                  <option value="Upper East">Upper East</option>
                  <option value="Upper West">Upper West</option>
                  <option value="Volta">Volta</option>
                  <option value="Bono">Bono</option>
                  <option value="Bono East">Bono East</option>
                  <option value="Ahafo">Ahafo</option>
                  <option value="Savannah">Savannah</option>
                  <option value="Oti">Oti</option>
                  <option value="Western North">Western North</option>
                  <option value="North East">North East</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="harvest_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Harvest Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="date"
                  id="harvest_date"
                  name="harvest_date"
                  value={formData.harvest_date}
                  onChange={handleInputChange}
                  className="w-full p-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma-separated)
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  placeholder="e.g., organic, fresh, local"
                  className="w-full p-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Images */}
        <div className="bg-white dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 rounded-md">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <Upload className="mr-2 h-5 w-5 text-green-600 dark:text-green-500" />
            Product Images
          </h2>
          
          {/* Image upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload New Images
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-6 flex justify-center">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label htmlFor="image-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-green-600 dark:text-green-500 hover:text-green-500">
                    <span>Upload images</span>
                    <input 
                      id="image-upload" 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="sr-only" 
                      onChange={handleImageUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          </div>
          
          {/* Existing images */}
          {productImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Existing Images
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {productImages.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative group border rounded-md overflow-hidden">
                    <img 
                      src={url} 
                      alt={`Product ${idx + 1}`} 
                      className="h-32 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button 
                        type="button" 
                        onClick={() => handleRemoveExistingImage(idx)}
                        className="text-white hover:text-red-500"
                        aria-label={`Remove image ${idx + 1}`}
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    {idx === 0 && (
                      <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-2 py-1">
                        Main
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* New images preview */}
          {newImages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Images to Upload
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {newImages.map((file, idx) => (
                  <div key={`new-${idx}`} className="relative group border rounded-md overflow-hidden">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`New upload ${idx + 1}`} 
                      className="h-32 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button 
                        type="button" 
                        onClick={() => handleRemoveNewImage(idx)}
                        className="text-white hover:text-red-500"
                        aria-label={`Remove new image ${idx + 1}`}
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {productImages.length === 0 && newImages.length === 0 && (
            <p className="text-amber-600 dark:text-amber-400 text-sm">
              Please upload at least one product image.
            </p>
          )}
        </div>
        
        {/* Submit buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/farm/products')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label="Cancel and return to products page"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
            aria-label="Save product changes"
          >
            {submitting ? (
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
                Update Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductPage;