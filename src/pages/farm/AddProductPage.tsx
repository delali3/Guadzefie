import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getCurrentUser, bypassRLS } from '../../lib/supabase';
import { 
  Plus, 
  Leaf, 
  Calendar, 
  Tag,
  MapPin,
  BarChart,
  Info,
  AlertCircle,
  DollarSign,
  Package,
  Scale,
  Upload,
  Check,
  X
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface ProductFormData {
  name: string;
  price: number;
  description: string;
  category_id: number;
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
  image_urls: string[];
  image_files: File[];
}

interface ImagePreview {
  url: string;
  file?: File;
}

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: 0,
    description: '',
    category_id: 0,
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
    storage_instructions: '',
    image_urls: [],
    image_files: []
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Try using bypassRLS for custom auth
        try {
          console.log('Fetching categories using bypassRLS');
          const categoriesTable = await bypassRLS('categories', 'select');
          const { data, error } = await categoriesTable.select('id, name');
          
          if (error) throw error;
          
          if (data) {
            console.log('Categories fetched successfully using bypassRLS:', data.length);
            setCategories(data);
            
            // Set default category if available
            if (data.length > 0) {
              setFormData(prev => ({ ...prev, category_id: data[0].id }));
            }
            return;
          }
        } catch (bypassError) {
          console.error('Error fetching categories with bypassRLS:', bypassError);
          // Fall back to regular query
        }
        
        // Fall back to regular query
        console.log('Falling back to regular categories query');
        const { data, error } = await supabase.from('categories').select('id, name');
        
        if (error) throw error;
        
        setCategories(data || []);
        
        // Set default category if available
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, category_id: data[0].id }));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories. Please try again.');
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString.split(',').map(tag => tag.trim());
    setFormData({
      ...formData,
      tags: tagsArray
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const newPreviews = newFiles.map(file => ({
        url: URL.createObjectURL(file),
        file
      }));
      
      setImagePreviews(prev => [...prev, ...newPreviews]);
      setFormData(prev => ({
        ...prev,
        image_files: [...prev.image_files, ...newFiles]
      }));
    }
  };

  const handleImageUrlAdd = () => {
    if (imageUrlInput.trim()) {
      setImagePreviews(prev => [...prev, { url: imageUrlInput }]);
      setFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, imageUrlInput]
      }));
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      // If there was a file, revoke the object URL to prevent memory leaks
      if (newPreviews[index].file) {
        URL.revokeObjectURL(newPreviews[index].url);
      }
      newPreviews.splice(index, 1);
      return newPreviews;
    });

    // Update form data, removing either from image_files or image_urls
    setFormData(prev => {
      const preview = imagePreviews[index];
      if (preview.file) {
        const newFiles = [...prev.image_files];
        const fileIndex = newFiles.findIndex(f => f === preview.file);
        if (fileIndex !== -1) newFiles.splice(fileIndex, 1);
        return { ...prev, image_files: newFiles };
      } else {
        const newUrls = [...prev.image_urls];
        const urlIndex = newUrls.indexOf(preview.url);
        if (urlIndex !== -1) newUrls.splice(urlIndex, 1);
        return { ...prev, image_urls: newUrls };
      }
    });
  };

  const validateForm = (): boolean => {
    if (!formData.name) {
      setError('Product name is required');
      return false;
    }
    
    if (formData.price <= 0) {
      setError('Price must be greater than zero');
      return false;
    }
    
    if (!formData.description) {
      setError('Description is required');
      return false;
    }
    
    if (!formData.category_id) {
      setError('Please select a category');
      return false;
    }
    
    if (formData.inventory_count <= 0) {
      setError('Inventory count must be greater than zero');
      return false;
    }
    
    if (imagePreviews.length === 0) {
      setError('Please upload at least one image');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Get current authenticated user directly from localStorage
      const user = getCurrentUser();
      
      if (!user) {
        throw new Error('You must be logged in to add products');
      }
      
      console.log('Adding product as user:', user.id);
      
      // Upload images if any
      const imageUrls: string[] = [];
      
      for (const file of formData.image_files) {
        // Create a unique file name
        const fileName = `product_images/${Date.now()}-${file.name}`;
        
        // Upload the file
        const { data: fileData, error: fileError } = await supabase.storage
          .from('products')
          .upload(fileName, file);
        
        if (fileError) throw fileError;
        
        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);
          
        if (urlData) {
          imageUrls.push(urlData.publicUrl);
        }
      }
      
      // Create product in the database - use first image as primary image
      const primaryImageUrl = imageUrls.length > 0 ? imageUrls[0] : '';
      
      // Create the product data object
      const productData = {
        name: formData.name,
        price: formData.price,
        description: formData.description,
        image_url: primaryImageUrl,
        additional_images: imageUrls.slice(1), // Store additional images
        category_id: formData.category_id,
        inventory_count: formData.inventory_count,
        featured: formData.featured,
        farming_method: formData.farming_method,
        harvest_date: formData.harvest_date,
        weight: formData.weight,
        dimensions: formData.dimensions,
        region_of_origin: formData.region_of_origin,
        tags: formData.tags,
        sku: formData.sku || `PROD-${Date.now()}`,
        is_organic: formData.is_organic,
        min_order_quantity: formData.min_order_quantity,
        storage_instructions: formData.storage_instructions,
        farmer_id: user.id,
        is_available: true,
        is_deleted: false,
        sales_count: 0,
        views_count: 0
      };
      
      let product = null;
      
      // Try using bypassRLS first
      try {
        console.log('Trying to add product using bypassRLS...');
        const productsTable = await bypassRLS('products', 'insert');
        const result = await productsTable
          .insert([productData])
          .select('id')
          .single();
          
        if (result.error) throw result.error;
        
        product = result.data;
        console.log('Product added successfully using bypassRLS:', product);
      } catch (bypassError) {
        console.error('Error using bypassRLS to add product:', bypassError);
        console.log('Falling back to regular insert...');
        
        // Fall back to regular insert
        const result = await supabase
          .from('products')
          .insert([productData])
          .select('id')
          .single();
          
        if (result.error) throw result.error;
        
        product = result.data;
      }
      
      if (product) {
        // Create entry in product_stats
        try {
          const statsData = {
            id: product.id,
            name: formData.name,
            category_id: formData.category_id,
            sales_count: 0,
            inventory_count: formData.inventory_count,
            featured: formData.featured,
            avg_rating: 0,
            review_count: 0
          };
          
          // Try using bypassRLS for stats table
          try {
            const statsTable = await bypassRLS('product_stats', 'insert');
            await statsTable.insert([statsData]);
          } catch (bypassError) {
            console.error('Error using bypassRLS for product stats:', bypassError);
            
            // Fall back to regular insert
            await supabase.from('product_stats').insert([statsData]);
          }
        } catch (statsError) {
          console.error('Error creating product stats (non-critical):', statsError);
          // Continue anyway as this is not critical
        }
        
        // Success - reset form and redirect
        setSuccessMessage('Product added successfully!');
        
        // Reset form
        setFormData({
          name: '',
          price: 0,
          description: '',
          category_id: formData.category_id, // Keep selected category
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
          storage_instructions: '',
          image_urls: [],
          image_files: []
        });
        
        // Clear image previews and revoke object URLs
        imagePreviews.forEach(preview => {
          if (preview.file) URL.revokeObjectURL(preview.url);
        });
        setImagePreviews([]);
        
        // Redirect to product list after 2 seconds
        setTimeout(() => {
          navigate('/farm/products');
        }, 2000);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError(error instanceof Error ? error.message : 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Farm Product</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Add your farm product to the marketplace</p>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-4 rounded-md flex items-start">
          <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
            <Info className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
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
                onChange={handleChange}
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category*
              </label>
              <div className="relative">
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full py-2 pl-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" transform="rotate(90 10 10)" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price (GHS)*
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full py-2 pl-9 pr-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                SKU (Stock Keeping Unit)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="e.g., VEG-TOM-001"
                  className="w-full py-2 pl-9 pr-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty to auto-generate</p>
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Inventory Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
            <Package className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
            Inventory Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="inventory_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Inventory Count*
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BarChart className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  id="inventory_count"
                  name="inventory_count"
                  value={formData.inventory_count}
                  onChange={handleChange}
                  min="0"
                  className="w-full py-2 pl-9 pr-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
              </div>
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
                onChange={handleChange}
                min="1"
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Weight (kg)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Scale className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g., 1.5"
                  className="w-full py-2 pl-9 pr-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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
                onChange={handleChange}
                placeholder="e.g., Small, Medium, Large or actual dimensions"
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            
            <div>
              <label htmlFor="storage_instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Storage Instructions
              </label>
              <input
                type="text"
                id="storage_instructions"
                name="storage_instructions"
                value={formData.storage_instructions}
                onChange={handleChange}
                placeholder="e.g., Store in a cool, dry place"
                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-600"
                />
                <label htmlFor="featured" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Featured Product
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_organic"
                  name="is_organic"
                  checked={formData.is_organic}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-600"
                />
                <label htmlFor="is_organic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Organic
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Farm Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
            <Leaf className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
            Farm Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="farming_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Farming Method
              </label>
              <div className="relative">
                <select
                  id="farming_method"
                  name="farming_method"
                  value={formData.farming_method}
                  onChange={handleChange}
                  className="w-full py-2 pl-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="Traditional">Traditional</option>
                  <option value="Organic">Organic</option>
                  <option value="Hydroponic">Hydroponic</option>
                  <option value="Permaculture">Permaculture</option>
                  <option value="Aquaponic">Aquaponic</option>
                  <option value="Mixed">Mixed</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" transform="rotate(90 10 10)" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="region_of_origin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Region of Origin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <select
                  id="region_of_origin"
                  name="region_of_origin"
                  value={formData.region_of_origin}
                  onChange={handleChange}
                  className="w-full py-2 pl-9 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white"
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" transform="rotate(90 10 10)" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="harvest_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Harvest Date
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="date"
                  id="harvest_date"
                  name="harvest_date"
                  value={formData.harvest_date}
                  onChange={handleChange}
                  className="w-full py-2 pl-9 pr-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma-separated)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  placeholder="e.g., organic, fresh, local"
                  className="w-full py-2 pl-9 pr-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Images Section in the form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-md border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center border-b border-gray-200 dark:border-gray-700 pb-3">
            <Upload className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
            Product Images
          </h2>
          
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Upload Images*
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md bg-white dark:bg-gray-800">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="image"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="sr-only"
                        multiple
                        aria-label="Upload product images"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            </div>
            
            {/* Image URL input */}
            <div className="mt-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">Or enter image URL:</p>
              <div className="flex space-x-2">
                <div className="relative rounded-md shadow-sm flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Upload className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full py-2 pl-9 pr-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleImageUrlAdd}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  aria-label="Add image URL"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image Previews ({imagePreviews.length}):
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden group bg-white dark:bg-gray-700">
                      <img 
                        src={preview.url} 
                        alt={`Product preview ${index + 1}`} 
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="text-white p-1 rounded-full hover:bg-white hover:bg-opacity-20"
                          aria-label="Remove image"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      {index === 0 && (
                        <div className="absolute top-0 left-0 bg-green-500 text-white text-xs py-1 px-2 rounded-br-md">
                          Main Image
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  The first image will be used as the main product image.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/farm/products')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductPage; 