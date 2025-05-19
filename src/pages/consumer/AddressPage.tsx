import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useShippingAddresses } from '../../contexts/ShippingAddressContext';
// import ShippingAddressManager from '../../components/shipping/ShippingAddressManager';
import { 
  ChevronRight, 
  Star, 
  MapPin, 
  Check,
  Loader2,
  Info,
  Database
} from 'lucide-react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ensureShippingAddressesTable } from '../../lib/migrations';

// Interface definitions
interface ShippingAddress {
  id: number | string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email?: string;
  is_default: boolean;
}

interface NewShippingAddress {
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  is_default: boolean;
}

const AddressPage: React.FC = () => {
  const { 
    state: { addresses, loading, error }, 
    fetchAddresses, 
    addAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress 
  } = useShippingAddresses();
  
  // Get current user from localStorage
  const [user, setUser] = useState<any>(null);

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState<number | string | null>(null);
  const [isMigratingDb, setIsMigratingDb] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{success: boolean; message: string} | null>(null);
  const [formData, setFormData] = useState<NewShippingAddress>({
    first_name: '',
    last_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    phone: '',
    email: '',
    is_default: false
  });

  // Get current user from localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  // Fetch addresses when component mounts
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      phone: '',
      email: '',
      is_default: false
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.first_name || !formData.last_name || !formData.address_line1 || 
        !formData.city || !formData.state || !formData.postal_code || !formData.country) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      // Check if user is logged in first
      if (!user) {
        toast.error('You must be logged in to add an address');
        return;
      }
      
      const result = await addAddress(formData);
      if (result) {
        setIsAddingAddress(false);
        resetForm();
        toast.success('Address added successfully');
      }
    } catch (err) {
      console.error('Error adding address:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add address');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditingAddress === null) return;
    
    // Validate form
    if (!formData.first_name || !formData.last_name || !formData.address_line1 || 
        !formData.city || !formData.state || !formData.postal_code || !formData.country) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const result = await updateAddress(isEditingAddress, formData);
      if (result) {
        setIsEditingAddress(null);
        resetForm();
        toast.success('Address updated successfully');
      }
    } catch (err) {
      console.error('Error updating address:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update address');
    }
  };

  const handleEdit = (address: ShippingAddress) => {
    setIsEditingAddress(address.id);
    setFormData({
      first_name: address.first_name,
      last_name: address.last_name,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone,
      email: address.email || '',
      is_default: address.is_default
    });
  };

  const handleDelete = async (id: number | string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        const success = await deleteAddress(id);
        if (success) {
          toast.success('Address deleted successfully');
        }
      } catch (err) {
        console.error('Error deleting address:', err);
        toast.error('Failed to delete address');
      }
    }
  };

  const handleSetDefault = async (id: number | string) => {
    try {
      const success = await setDefaultAddress(id);
      if (success) {
        toast.success('Default address updated');
      }
    } catch (err) {
      console.error('Error setting default address:', err);
      toast.error('Failed to update default address');
    }
  };

  // Run database migration
  const runMigration = async () => {
    setIsMigratingDb(true);
    
    try {
      const result = await ensureShippingAddressesTable();
      setMigrationResult(result);
      
      if (result.success) {
        // Refresh session and fetch addresses again
        await refreshSession();
        await fetchAddresses();
        toast.success('Database setup completed successfully');
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      setMigrationResult({
        success: false,
        message: `Migration error: ${error.message}`
      });
      toast.error(`Failed to set up database: ${error.message}`);
    } finally {
      setIsMigratingDb(false);
    }
  };

  // Check if the error message indicates a missing table
  const isTableNotExistError = (errorMessage: string | null) => {
    return !!errorMessage && (
      errorMessage.includes('does not exist') || 
      errorMessage.toLowerCase().includes('table') ||
      errorMessage.includes('relation')
    );
  };

  // Function to restart the auth session
  const refreshSession = async () => {
    // Since we're using custom auth, just reload user from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error reloading user data:', error);
      return false;
    }
  };

  // Function to check auth and restart auth session
  const handleAuthRefresh = async () => {
    try {
      const success = await refreshSession();
      if (success) {
        toast.success('Session refreshed successfully');
        await fetchAddresses();
      } else {
        toast.error('Failed to refresh session. Please sign out and sign in again.');
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      toast.error('Error refreshing auth session');
    }
  };

  // Render error with actions
  const renderError = () => {
    // Check if it's a table error or authentication error
    const isAuthError = error && (
      error.toLowerCase().includes('auth') || 
      error.toLowerCase().includes('session') ||
      error.toLowerCase().includes('sign in') ||
      error.toLowerCase().includes('jwt')
    );
      
    const isDbError = error && isTableNotExistError(error);
    
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-200">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              {isDbError && (
                <button
                  type="button"
                  onClick={runMigration}
                  disabled={isMigratingDb}
                  className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 mr-3"
                >
                  {isMigratingDb ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Setting Up...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Set Up Database
                    </>
                  )}
                </button>
              )}
              
              {isAuthError && (
                <button
                  type="button"
                  onClick={handleAuthRefresh}
                  className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <div className="mr-2 h-4 w-4" />
                  Refresh Auth Session
                </button>
              )}
              
              <button
                type="button"
                onClick={() => fetchAddresses()}
                className="inline-flex items-center rounded-md border border-transparent bg-red-100 dark:bg-red-800/30 px-3 py-2 text-sm font-medium leading-4 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAddressForm = (isEditing: boolean = false) => (
    <form onSubmit={isEditing ? handleEditSubmit : handleAddSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {isEditing ? 'Edit Address' : 'Add New Address'}
        </h3>
        <button
          type="button"
          onClick={() => isEditing ? setIsEditingAddress(null) : setIsAddingAddress(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close form"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="first_name" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            First Name
          </label>
          <input
            id="first_name"
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="last_name" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Last Name
          </label>
          <input
            id="last_name"
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            required
            aria-required="true"
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="address_line1" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Street Address
        </label>
        <input
          id="address_line1"
          type="text"
          name="address_line1"
          value={formData.address_line1}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
          required
          aria-required="true"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="address_line2" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Apartment, Suite, etc.
        </label>
        <input
          id="address_line2"
          type="text"
          name="address_line2"
          value={formData.address_line2}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="city" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            City
          </label>
          <input
            id="city"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="state" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            State/Region
          </label>
          <input
            id="state"
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            required
            aria-required="true"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="postal_code" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Postal Code
          </label>
          <input
            id="postal_code"
            type="text"
            name="postal_code"
            value={formData.postal_code}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="country" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Country
          </label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
            required
            aria-required="true"
          >
            <option value="">Select Country</option>
            <option value="Ghana">Ghana</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Kenya">Kenya</option>
            <option value="South Africa">South Africa</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="phone" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
          required
          aria-required="true"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="is_default" className="flex items-center">
          <input
            id="is_default"
            type="checkbox"
            name="is_default"
            checked={formData.is_default}
            onChange={handleInputChange}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            aria-label="Set as default address"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Set as default address
          </span>
        </label>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => isEditing ? setIsEditingAddress(null) : setIsAddingAddress(false)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {isEditing ? 'Update Address' : 'Save Address'}
        </button>
      </div>
    </form>
  );

  const renderAddressCard = (address: ShippingAddress) => (
    <div key={address.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-4 relative">
      {address.is_default && (
        <div className="absolute top-4 right-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
          <Check size={12} className="mr-1" />
          Default
        </div>
      )}
      
      <div className="flex items-start">
        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
          <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {address.first_name} {address.last_name}
          </h3>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            <p>{address.address_line1}</p>
            <p>{address.city}, {address.state} {address.postal_code}</p>
            <p>{address.country}</p>
            <p className="mt-2">�� {address.phone}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end space-x-2">
        {!address.is_default && (
          <button
            onClick={() => handleSetDefault(address.id)}
            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label="Set as default address"
          >
            <Star size={14} className="mr-1" />
            Set as Default
          </button>
        )}
        <button
          onClick={() => handleEdit(address)}
          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          aria-label={`Edit address for ${address.first_name} ${address.last_name}`}
        >
          <Edit2 size={14} className="mr-1" />
          Edit
        </button>
        <button
          onClick={() => handleDelete(address.id)}
          className="inline-flex items-center px-2.5 py-1.5 border border-red-300 dark:border-red-700 shadow-sm text-xs font-medium rounded text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          aria-label={`Delete address for ${address.first_name} ${address.last_name}`}
        >
          <Trash2 size={14} className="mr-1" />
          Delete
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex mb-6 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/consumer" className="hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-gray-900 dark:text-white">Delivery Addresses</span>
      </nav>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Addresses</h1>
        
        <div className="flex space-x-2">
          {/* Migration button - show if table doesn't exist */}
          {isTableNotExistError(error) && (
            <button
              onClick={runMigration}
              disabled={isMigratingDb}
              className={`inline-flex items-center px-3 py-2 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${isMigratingDb ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Run database migration"
            >
              <Database size={18} className="mr-1" />
              {isMigratingDb ? 'Running Migration...' : 'Create Address Table'}
            </button>
          )}
          
          {!isAddingAddress && (
            <button
              onClick={() => setIsAddingAddress(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              aria-label="Add new address"
            >
              <Plus size={18} className="mr-2" />
              Add New Address
            </button>
          )}
        </div>
      </div>
      
      {/* Migration result message */}
      {migrationResult && (
        <div className={`mb-4 p-4 rounded-md ${migrationResult.success ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
          {migrationResult.message}
        </div>
      )}
      
      {/* Error message with better diagnostics */}
      {error && renderError()}
      
      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your addresses...</p>
        </div>
      )}
      
      {/* Add/Edit address form */}
      {isAddingAddress && renderAddressForm()}
      {isEditingAddress !== null && renderAddressForm(true)}
      
      {/* Address list */}
      {!loading && !isAddingAddress && isEditingAddress === null && (
        <>
          {addresses.length > 0 ? (
            <div>
              {addresses.map((address) => renderAddressCard(address))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 text-center">
              <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <MapPin className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Addresses Found</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You don't have any saved delivery addresses yet.
              </p>
              <button
                onClick={() => setIsAddingAddress(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                aria-label="Add your first address"
              >
                <Plus size={18} className="mr-2" />
                Add your first address
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AddressPage; 