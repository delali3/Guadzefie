import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  AlertTriangle,
  X,
  Check,
  Tag,
  Percent,
  Calendar,
} from 'lucide-react';

interface Discount {
  id: number;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  min_order_value?: number;
  max_discount_amount?: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  usage_count: number;
  description?: string;
}

const DiscountPage: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: 10,
    min_order_value: 0,
    max_discount_amount: 0,
    starts_at: new Date().toISOString().split('T')[0],
    expires_at: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    is_active: true,
    description: '',
  });
  
  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchDiscounts();
    
    // Create discounts table if it doesn't exist
    createDiscountsTableIfNeeded();
  }, []);

  const createDiscountsTableIfNeeded = async () => {
    try {
      // Check if the table exists first
      const { error: checkError } = await supabase
        .from('discounts')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.code === '42P01') { // Table doesn't exist
        // We'll use SQL migrations instead of trying to create through JS
        console.log('Discounts table does not exist. Please run the migration script.');
        setError('Discounts table does not exist. Please contact the administrator to run the migration script.');
      }
    } catch (err) {
      console.error('Error checking discounts table:', err);
    }
  };

  const fetchDiscounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('discounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setDiscounts(data);
      }
    } catch (err) {
      console.error('Error fetching discounts:', err);
      
      // Special handling for the case where the table doesn't exist yet
      if (err instanceof Error && err.message.includes('relation "discounts" does not exist')) {
        setError('Discounts feature is not yet configured. Please contact the administrator.');
      } else {
        setError('Failed to load discounts');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : name === 'value' || name === 'min_order_value' || name === 'max_discount_amount'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingDiscount) {
        const { error } = await supabase
          .from('discounts')
          .update({
            code: formData.code,
            type: formData.type,
            value: formData.value,
            min_order_value: formData.min_order_value,
            max_discount_amount: formData.max_discount_amount,
            starts_at: formData.starts_at,
            expires_at: formData.expires_at,
            is_active: formData.is_active,
            description: formData.description,
          })
          .eq('id', editingDiscount.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('discounts')
          .insert([{
            code: formData.code,
            type: formData.type,
            value: formData.value,
            min_order_value: formData.min_order_value,
            max_discount_amount: formData.max_discount_amount,
            starts_at: formData.starts_at,
            expires_at: formData.expires_at,
            is_active: formData.is_active,
            description: formData.description,
            usage_count: 0,
          }]);

        if (error) throw error;
      }

      resetForm();
      await fetchDiscounts();
    } catch (err) {
      console.error('Error saving discount:', err);
      setError('Failed to save discount');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiscount = async () => {
    if (discountToDelete === null) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', discountToDelete);

      if (error) throw error;

      setDiscountToDelete(null);
      setShowDeleteModal(false);
      await fetchDiscounts();
    } catch (err) {
      console.error('Error deleting discount:', err);
      setError('Failed to delete discount');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const startEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      min_order_value: discount.min_order_value || 0,
      max_discount_amount: discount.max_discount_amount || 0,
      starts_at: new Date(discount.starts_at).toISOString().split('T')[0],
      expires_at: new Date(discount.expires_at).toISOString().split('T')[0],
      is_active: discount.is_active,
      description: discount.description || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: 10,
      min_order_value: 0,
      max_discount_amount: 0,
      starts_at: new Date().toISOString().split('T')[0],
      expires_at: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      is_active: true,
      description: '',
    });
    setEditingDiscount(null);
    setShowForm(false);
  };

  const filteredDiscounts = discounts.filter(
    (discount) => 
      discount.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (discount.description && discount.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Check if a discount is expired
  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discount Codes</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage promotional discounts and coupons</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-md flex items-center hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Discount
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg flex items-center text-red-800 dark:text-red-200">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)} 
            className="ml-auto text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
            aria-label="Close error message"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            placeholder="Search discount codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Discount Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingDiscount ? 'Edit Discount Code' : 'Create Discount Code'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Code
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    required
                    value={formData.code}
                    onChange={handleInputChange}
                    className="pl-10 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="SUMMER20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Discount Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                </select>
              </div>

              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formData.type === 'percentage' ? 'Percentage Value' : 'Fixed Amount'}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {formData.type === 'percentage' ? (
                      <Percent className="h-5 w-5 text-gray-400" />
                    ) : (
                      <span className="text-gray-500">GHS</span>
                    )}
                  </div>
                  <input
                    type="number"
                    id="value"
                    name="value"
                    required
                    min="0"
                    value={formData.value}
                    onChange={handleInputChange}
                    className="pl-10 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="min_order_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Minimum Order Value
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">GHS</span>
                  </div>
                  <input
                    type="number"
                    id="min_order_value"
                    name="min_order_value"
                    min="0"
                    value={formData.min_order_value}
                    onChange={handleInputChange}
                    className="pl-10 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {formData.type === 'percentage' && (
                <div>
                  <label htmlFor="max_discount_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Maximum Discount Amount
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">GHS</span>
                    </div>
                    <input
                      type="number"
                      id="max_discount_amount"
                      name="max_discount_amount"
                      min="0"
                      value={formData.max_discount_amount}
                      onChange={handleInputChange}
                      className="pl-10 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="starts_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Date
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="starts_at"
                    name="starts_at"
                    required
                    value={formData.starts_at}
                    onChange={handleInputChange}
                    className="pl-10 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="expires_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expiry Date
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="expires_at"
                    name="expires_at"
                    required
                    value={formData.expires_at}
                    onChange={handleInputChange}
                    className="pl-10 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Summer sale discount"
              />
            </div>

            <div className="mt-4">
              <div className="flex items-center">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Active
                </label>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-opacity-20 border-t-white animate-spin rounded-full mr-2"></span>
                ) : editingDiscount ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingDiscount ? 'Update Discount' : 'Create Discount'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discounts List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {loading && !discounts.length ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No discount codes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Minimum Order
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Validity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usage
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDiscounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{discount.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {discount.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {discount.type === 'percentage' ? `${discount.value}%` : `GHS ${discount.value.toFixed(2)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {discount.min_order_value ? `GHS ${discount.min_order_value.toFixed(2)}` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(discount.starts_at).toLocaleDateString()} - {new Date(discount.expires_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {discount.is_active ? (
                        isExpired(discount.expires_at) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            Active
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {discount.usage_count} times
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => startEdit(discount)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-3"
                        aria-label={`Edit ${discount.code}`}
                        title={`Edit ${discount.code}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDiscountToDelete(discount.id);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        aria-label={`Delete ${discount.code}`}
                        title={`Delete ${discount.code}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Delete Discount Code
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this discount code? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteDiscount}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDiscountToDelete(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

export default DiscountPage; 