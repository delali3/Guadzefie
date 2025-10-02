import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  User,
  Mail,
  Phone,
  Save,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

const FarmCustomerFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Make sure we have at least an email
      if (!formData.email.trim()) {
        toast.error('Email is required');
        return;
      }

      // Get current user from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) throw new Error("No authenticated user found");
      const currentFarm = JSON.parse(storedUser);
      
      // Generate a random password - the customer will need to reset it
      const randomPassword = Math.random().toString(36).slice(-8);
      
      // Create new user with customer role
      const { data: userData, error: createError } = await supabase.auth.signUp({
        email: formData.email,
        password: randomPassword,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            is_farm: false, // Not a farm user
            notes: formData.notes
          }
        }
      });

      if (createError) throw createError;

      // Create profile record if needed
      if (userData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userData.user.id,
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            is_farm: false,
            notes: formData.notes
          });

        if (profileError) throw profileError;
        
        // Store the farm-customer relationship in a separate table
        const { error: relationError } = await supabase
          .from('farm_customers')
          .insert({
            farm_id: currentFarm.id,
            customer_id: userData.user.id,
            created_at: new Date().toISOString()
          });
          
        if (relationError) throw relationError;
      }

      toast.success('Customer added successfully');
      navigate('/farm/customers');
    } catch (error: any) {
      console.error('Error adding customer:', error);
      toast.error(error.message || 'Failed to add customer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Add New Customer</h1>
            <p className="text-gray-500 dark:text-gray-400">Create a new customer for your farm business.</p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={() => navigate('/farm/customers')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Customers
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="pl-12 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="customer@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    className="pl-12 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="+1 (123) 456-7890"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* First Name */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="first_name"
                    id="first_name"
                    className="pl-12 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="last_name"
                    id="last_name"
                    className="pl-12 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Notes - full width */}
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <div className="mt-1">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="Additional information about this customer..."
                    value={formData.notes}
                    onChange={handleChange}
                  ></textarea>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  A temporary password will be generated and the customer will need to reset it.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/farm/customers')}
                className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
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
                    Save Customer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FarmCustomerFormPage; 