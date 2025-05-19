import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Save, 
  X, 
  Upload, 
  Leaf, 
  AlertCircle, 
  ArrowLeft,
  Trash2
} from 'lucide-react';

interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  inventory_count: number;
  category: string;
  image_url: string | null;
  image_urls?: string[];
  is_organic: boolean;
  is_active: boolean;
  farmer_id?: string;
  vendor_id?: string;
  owner_id?: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  inventory_count: string;
  category: string;
  is_organic: boolean;
  is_active: boolean;
  image: File | null;
  images: File[];
}

const FarmProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    inventory_count: '',
    category: '',
    is_organic: false,
    is_active: true,
    image: null,
    images: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get current user from localStorage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) throw new Error("No authenticated user found");
        const user = JSON.parse(storedUser);

        // Load existing categories for suggestions
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('products')
          .select('category');

        if (categoriesError) throw categoriesError;

        // Extract unique categories
        if (categoriesData) {
          const uniqueCategories = [...new Set(categoriesData.map(item => item.category))].filter(Boolean);
          setCategories(uniqueCategories);
        }

        if (id) {
          // Fetch product data for editing
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

          if (productError) throw productError;

          if (productData) {
            // Check if the product belongs to the current user using any of the possible ID fields
            const belongsToUser = 
              (productData.farmer_id && productData.farmer_id === user.id) || 
              (productData.vendor_id && productData.vendor_id === user.id) || 
              (productData.owner_id && productData.owner_id === user.id);
              
            if (!belongsToUser) {
              throw new Error("You don't have permission to edit this product");
            }

            // Set form data
            setFormData({
              name: productData.name,
              description: productData.description,
              price: productData.price.toString(),
              inventory_count: productData.inventory_count.toString(),
              category: productData.category,
              is_organic: productData.is_organic || false,
              is_active: productData.is_active ?? true,
              image: null,
              images: []
            });

            // Set preview URL for main image
            if (productData.image_url) {
              setPreviewUrl(productData.image_url);
            }
            
            // Set preview URLs for additional images
            if (productData.image_urls && Array.isArray(productData.image_urls) && productData.image_urls.length > 0) {
              setPreviewUrls(productData.image_urls);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching product data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Convert FileList to Array and add to existing images
    const newFiles = Array.from(files);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...newFiles] }));
    
    // Create preview URLs for each file
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAdditionalImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeExistingImage = (index: number) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const clearImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Product description is required';
    }

    if (!formData.price.trim()) {
      errors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be a positive number';
    }

    if (!formData.inventory_count.trim()) {
      errors.inventory_count = 'Inventory count is required';
    } else if (
      isNaN(parseInt(formData.inventory_count)) || 
      parseInt(formData.inventory_count) < 0 ||
      !Number.isInteger(parseFloat(formData.inventory_count))
    ) {
      errors.inventory_count = 'Inventory must be a non-negative whole number';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `product_images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const findCorrectIdField = async (userId: string): Promise<string> => {
    try {
      // Try farmer_id first
      const { error: farmerError } = await supabase
        .from('products')
        .select('count')
        .eq('farmer_id', userId)
        .limit(1);
        
      if (!farmerError || !farmerError.message.includes('does not exist')) {
        return 'farmer_id';
      }
      
      // Try vendor_id next
      const { error: vendorError } = await supabase
        .from('products')
        .select('count')
        .eq('vendor_id', userId)
        .limit(1);
        
      if (!vendorError || !vendorError.message.includes('does not exist')) {
        return 'vendor_id';
      }
      
      // Owner_id as last resort
      return 'owner_id';
    } catch (e) {
      console.error("Error determining correct ID field:", e);
      return 'owner_id'; // Default fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Get current user from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) throw new Error("No authenticated user found");
      const user = JSON.parse(storedUser);

      let imageUrl = previewUrl;
      let imageUrls = [...previewUrls];

      // Upload the main image if a new one is selected
      if (formData.image) {
        imageUrl = await uploadImage(formData.image);
      }
      
      // Upload additional images if any are selected
      if (formData.images && formData.images.length > 0) {
        const uploadPromises = formData.images.map(file => uploadImage(file));
        const newImageUrls = await Promise.all(uploadPromises);
        
        // In edit mode, add new images to existing ones
        // In create mode, just use the new images
        imageUrls = isEditMode ? [...imageUrls, ...newImageUrls] : newImageUrls;
      }

      // Find the correct ID field name
      const idFieldName = await findCorrectIdField(user.id);

      const productData: Product = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        inventory_count: parseInt(formData.inventory_count),
        category: formData.category.trim(),
        image_url: imageUrl,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        is_organic: formData.is_organic,
        is_active: formData.is_active,
      };
      
      // Set the ID dynamically using the correct field name
      if (idFieldName === 'farmer_id') {
        productData.farmer_id = user.id;
      } else if (idFieldName === 'vendor_id') {
        productData.vendor_id = user.id;
      } else {
        productData.owner_id = user.id;
      }

      let result;

      if (isEditMode && id) {
        // Update existing product
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
      } else {
        // Create new product
        result = await supabase
          .from('products')
          .insert([productData]);
      }

      if (result.error) throw result.error;

      // Redirect to products page
      navigate('/farm/products');
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err instanceof Error ? err.message : 'Failed to save product');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/farm/products')}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Go back to products"
              >
                <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h1>
            </div>
            <div className="mt-2 ml-12 text-sm text-gray-500 dark:text-gray-400">
              <Link to="/farm" className="hover:text-green-600 dark:hover:text-green-400">Farm Dashboard</Link>
              <span className="mx-2">/</span>
              <Link to="/farm/products" className="hover:text-green-600 dark:hover:text-green-400">Products</Link>
              <span className="mx-2">/</span>
              <span className="text-green-600 dark:text-green-400">
                {isEditMode ? 'Edit' : 'New'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
        {/* Basic Info Section */}
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm 
                  ${fieldErrors.name 
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700'
                  } text-gray-900 dark:text-gray-300`}
                placeholder="Enter product name"
              />
              {fieldErrors.name && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category *
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="category"
                  id="category"
                  list="category-options"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`block w-full rounded-md shadow-sm sm:text-sm 
                    ${fieldErrors.category 
                      ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700'
                    } text-gray-900 dark:text-gray-300`}
                  placeholder="e.g., Vegetables, Fruits, Dairy"
                />
                <datalist id="category-options">
                  {categories.map((category, index) => (
                    <option key={index} value={category} />
                  ))}
                </datalist>
              </div>
              {fieldErrors.category && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{fieldErrors.category}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description *
            </label>
            <textarea
              name="description"
              id="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm 
                ${fieldErrors.description 
                  ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 dark:bg-red-900/20' 
                  : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700'
                } text-gray-900 dark:text-gray-300`}
              placeholder="Describe your product, including details about freshness, origin, etc."
            />
            {fieldErrors.description && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{fieldErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price (USD) *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                </div>
                <input
                  type="text"
                  name="price"
                  id="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className={`pl-7 block w-full rounded-md shadow-sm sm:text-sm 
                    ${fieldErrors.price 
                      ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700'
                    } text-gray-900 dark:text-gray-300`}
                  placeholder="0.00"
                  aria-describedby="price-currency"
                />
              </div>
              {fieldErrors.price && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{fieldErrors.price}</p>
              )}
            </div>

            <div>
              <label htmlFor="inventory_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Inventory Count *
              </label>
              <input
                type="text"
                name="inventory_count"
                id="inventory_count"
                value={formData.inventory_count}
                onChange={handleInputChange}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm 
                  ${fieldErrors.inventory_count 
                    ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700'
                  } text-gray-900 dark:text-gray-300`}
                placeholder="0"
              />
              {fieldErrors.inventory_count && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{fieldErrors.inventory_count}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-6">
            <div className="flex items-center">
              <input
                id="is_organic"
                name="is_organic"
                type="checkbox"
                checked={formData.is_organic}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="is_organic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Organic Product
              </label>
            </div>

            <div className="flex items-center mt-4 sm:mt-0">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                List product as active (visible to customers)
              </label>
            </div>
          </div>
        </div>

        {/* Product Image Section */}
        <div className="p-6 space-y-6">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white">Product Images</h2>
          
          <div className="flex flex-col space-y-6">
            {/* Main product image */}
            <div>
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Main Product Image</h3>
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Preview */}
                <div className="w-full max-w-xs">
                  <div className="aspect-square w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden flex items-center justify-center relative">
                    {previewUrl ? (
                      <>
                        <img 
                          src={previewUrl} 
                          alt="Product preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md"
                          aria-label="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Leaf className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-500" />
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No image</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload controls */}
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload Main Product Image
                  </label>
                  <div className="border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 p-6">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-3">
                        <Upload className="h-10 w-10 text-gray-400" />
                      </div>
                      <div className="mb-2">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                        >
                          <span className="text-base">Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            ref={fileInputRef}
                            className="sr-only"
                            onChange={handleImageChange}
                            accept="image/*"
                          />
                        </label>
                        <span className="text-gray-500 dark:text-gray-400 text-base ml-1">or drag and drop</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional product images */}
            <div>
              <h3 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">Additional Product Images</h3>
              
              {/* Additional images grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md overflow-hidden">
                    <img src={url} alt={`Product image ${index + 1}`} className="w-full h-full object-cover" />
                    {isEditMode && (
                      <div className="absolute top-0 left-0 m-2 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full">
                        Existing
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md"
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {formData.images.map((file, index) => (
                  <div key={`new-${index}`} className="relative aspect-square w-full bg-white dark:bg-gray-700 border border-green-200 dark:border-green-800 rounded-md overflow-hidden">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt={`New product image ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-0 left-0 m-2 px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-full">
                      New
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md"
                      aria-label={`Remove new image ${index + 1}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {/* Add more images button */}
                <div className="aspect-square w-full border border-dashed border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center bg-white dark:bg-gray-700">
                  <label 
                    htmlFor="additional-images-upload" 
                    className="cursor-pointer flex flex-col items-center justify-center text-center p-4"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Add more</span>
                    <input
                      id="additional-images-upload"
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={handleMultipleImagesChange}
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add up to 5 additional images to showcase your product from different angles
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="p-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/farm/products')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FarmProductFormPage;
