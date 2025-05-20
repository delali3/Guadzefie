// src/components/ShippingAddressManager.tsx
import React, { useState, useEffect } from 'react';
import { useShippingAddresses, ShippingAddress, NewShippingAddress } from '../../contexts/ShippingAddressContext';
import { Edit, Trash2, Home, PlusCircle, AlertCircle } from 'lucide-react';

interface ShippingAddressManagerProps {
    onAddressSelect: (address_line1: ShippingAddress) => void;
    initialAddress?: Partial<NewShippingAddress>;
}

const ShippingAddressManager: React.FC<ShippingAddressManagerProps> = ({
    onAddressSelect,
    initialAddress = {}
}) => {
    const {
        state: { addresses, selectedAddressId, loading, error },
        fetchAddresses,
        addAddress,
        updateAddress,
        deleteAddress,
        selectAddress,
        setDefaultAddress,
        getSelectedAddress
    } = useShippingAddresses();

    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [formData, setFormData] = useState<NewShippingAddress>({
        first_name: '',
        last_name: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        phone: '',
        is_default: false
    });
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    // Set a timeout to prevent infinite loading
    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                setLoadingTimeout(true);
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            setLoadingTimeout(false);
        }
    }, [loading]);

    // Fetch addresses if needed
    useEffect(() => {
        // Only fetch once on component mount
        if (addresses.length === 0 && !loading && !loadingTimeout) {
            fetchAddresses();
        }
    }, []);  // Intentionally empty dependency array to only run once

    // Pass selected address to parent when it changes
    useEffect(() => {
        // Only call onAddressSelect when selectedAddressId changes and isn't null
        const selected = getSelectedAddress();
        if (selected && selectedAddressId) {
            onAddressSelect(selected);
        }

    }, [selectedAddressId, getSelectedAddress]);

    // Initialize form with initial address data if provided
    useEffect(() => {
        if (Object.keys(initialAddress).length > 0 && !isAddingNew && !isEditing) {
            // Handle mapping between address_line1 and address
            const mappedInitialAddress = {...initialAddress};
            if ('address_line1' in initialAddress && !('address' in initialAddress)) {
                mappedInitialAddress.address = initialAddress.address_line1;
                delete mappedInitialAddress.address_line1;
            }
            
            setFormData(prev => ({
                ...prev,
                ...mappedInitialAddress
            }));
        }
    }, [initialAddress, isAddingNew, isEditing]);

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error for this field if it exists
        if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Validate form data
    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};

        if (!formData.first_name.trim()) errors.first_name = 'First name is required';
        if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
        if (!formData.address.trim()) errors.address = 'Address is required';
        if (!formData.city.trim()) errors.city = 'City is required';
        if (!formData.state.trim()) errors.state = 'State is required';
        if (!formData.postal_code.trim()) errors.postal_code = 'Postal code is required';
        if (!formData.phone.trim()) errors.phone = 'Phone number is required';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e?: React.FormEvent) => {
        // If an event is passed, prevent default form submission
        if (e) {
            e.preventDefault();
        }

        if (!validateForm()) return;

        if (isAddingNew) {
            const newAddress = await addAddress(formData);
            if (newAddress) {
                selectAddress(newAddress.id);
                setIsAddingNew(false);
                resetForm();
            }
        } else if (isEditing !== null) {
            const updatedAddress = await updateAddress(isEditing, formData);
            if (updatedAddress) {
                selectAddress(updatedAddress.id);
                setIsEditing(null);
                resetForm();
            }
        }
    };

    // Reset form data
    const resetForm = () => {
        setFormData({
            first_name: '',
            last_name: '',
            address: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'US',
            phone: '',
            is_default: false
        });
        setFormErrors({});
    };

    // Handle address selection
    const handleSelectAddress = (address: ShippingAddress) => {
        selectAddress(address.id);
    };

    // Handle editing an address
    const handleEditAddress = (address: ShippingAddress) => {
        // Map address_line1 to address if needed
        const addressData = {...address};
        if ('address_line1' in address && !('address' in address)) {
            addressData.address = (address as any).address_line1;
        }
        
        setFormData({
            first_name: addressData.first_name,
            last_name: addressData.last_name,
            address: addressData.address,
            address_line2: addressData.address_line2,
            city: addressData.city,
            state: addressData.state,
            postal_code: addressData.postal_code,
            country: addressData.country,
            phone: addressData.phone,
            is_default: addressData.is_default
        });
        setIsEditing(typeof address.id === 'string' ? parseInt(address.id) : address.id);
        setIsAddingNew(false);
    };

    // Handle setting an address as default
    const handleSetDefault = async (id: number) => {
        await setDefaultAddress(id);
    };

    // Handle deleting an address
    const handleDeleteAddress = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            await deleteAddress(id);
        }
    };

    // Handle cancelling form
    const handleCancel = () => {
        setIsAddingNew(false);
        setIsEditing(null);
        resetForm();
    };

    // If still loading after timeout, show a different message
    if (loading && loadingTimeout) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Loading taking longer than expected</h3>
                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                            <p>You can continue with checkout while we try to load your saved addresses.</p>
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() => setIsAddingNew(true)}
                                className="bg-white dark:bg-gray-800 px-2 py-1.5 rounded-md text-sm font-medium text-green-600 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Add New Address
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Display loading state (but only briefly)
    if (loading && !loadingTimeout) {
        return (
            <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    // Display error state
    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading addresses</h3>
                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                            <p>{error}</p>
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() => setIsAddingNew(true)}
                                className="bg-white dark:bg-gray-800 px-2 py-1.5 rounded-md text-sm font-medium text-green-600 dark:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Add New Address
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Address Form */}
            {(isAddingNew || isEditing !== null) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                        {isAddingNew ? 'Add New Address' : 'Edit Address'}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                First Name*
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                id="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${
                                    formErrors.first_name 
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                } sm:text-sm dark:bg-gray-700 dark:text-white`}
                            />
                            {formErrors.first_name && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.first_name}</p>
                            )}
                        </div>
                        
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Last Name*
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                id="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${
                                    formErrors.last_name 
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                } sm:text-sm dark:bg-gray-700 dark:text-white`}
                            />
                            {formErrors.last_name && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.last_name}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="col-span-6">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Address
                        </label>
                        <input
                            type="text"
                            name="address"
                            id="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className={`mt-1 block w-full rounded-md shadow-sm ${
                                formErrors.address 
                                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                    : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                            } sm:text-sm dark:bg-gray-700 dark:text-white`}
                        />
                        {formErrors.address && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.address}</p>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                City*
                            </label>
                            <input
                                type="text"
                                name="city"
                                id="city"
                                value={formData.city}
                                onChange={handleInputChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${
                                    formErrors.city 
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                } sm:text-sm dark:bg-gray-700 dark:text-white`}
                            />
                            {formErrors.city && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.city}</p>
                            )}
                        </div>
                        
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                State/Province*
                            </label>
                            <input
                                type="text"
                                name="state"
                                id="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${
                                    formErrors.state 
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                } sm:text-sm dark:bg-gray-700 dark:text-white`}
                            />
                            {formErrors.state && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.state}</p>
                            )}
                        </div>
                        
                        <div>
                            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Postal Code*
                            </label>
                            <input
                                type="text"
                                name="postal_code"
                                id="postal_code"
                                value={formData.postal_code}
                                onChange={handleInputChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${
                                    formErrors.postal_code 
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                } sm:text-sm dark:bg-gray-700 dark:text-white`}
                            />
                            {formErrors.postal_code && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.postal_code}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Country*
                            </label>
                            <select
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                            >
                                <option value="US">United States</option>
                                <option value="CA">Canada</option>
                                <option value="MX">Mexico</option>
                                <option value="GB">United Kingdom</option>
                                <option value="AU">Australia</option>
                            </select>
                        </div>
                        
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Phone Number*
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={`mt-1 block w-full rounded-md shadow-sm ${
                                    formErrors.phone 
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' 
                                        : 'border-gray-300 dark:border-gray-600 focus:ring-green-500 focus:border-green-500'
                                } sm:text-sm dark:bg-gray-700 dark:text-white`}
                            />
                            {formErrors.phone && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.phone}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center">
                        <input
                            id="is_default"
                            name="is_default"
                            type="checkbox"
                            checked={formData.is_default}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Set as default address
                        </label>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            {isAddingNew ? 'Add Address' : 'Update Address'}
                        </button>
                    </div>
                </div>
            )}
            {/* Saved Addresses */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                        Saved Addresses
                    </h3>
                    {!isAddingNew && !isEditing && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsAddingNew(true);
                                setIsEditing(null);
                                resetForm();
                            }}
                            className="inline-flex items-center text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300"
                        >
                            <PlusCircle className="w-4 h-4 mr-1" />
                            Add New Address
                        </button>
                    )}
                </div>

                {addresses.length === 0 && !isAddingNew ? (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No saved addresses found.</p>
                        <button
                            type="button"
                            onClick={() => {
                                setIsAddingNew(true);
                                setIsEditing(null);
                            }}
                            className="mt-2 inline-flex items-center text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300"
                        >
                            <PlusCircle className="w-4 h-4 mr-1" />
                            Add New Address
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {addresses.map(address => (
                            <div
                                key={address.id}
                                className={`border rounded-lg p-4 ${selectedAddressId === address.id
                                    ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                                    : 'border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <div className="flex justify-between">
                                    <div className="flex items-start">
                                        <input
                                            type="radio"
                                            id={`address-${address.id}`}
                                            name="selected-address"
                                            checked={selectedAddressId === address.id}
                                            onChange={() => handleSelectAddress(address)}
                                            className="h-4 w-4 mt-1 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600"
                                        />
                                        <label htmlFor={`address-${address.id}`} className="ml-3 block">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                                                {address.first_name} {address.last_name}
                                                {address.is_default && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                                                        <Home className="w-3 h-3 mr-1" />
                                                        Default
                                                    </span>
                                                )}
                                            </span>
                                            <span className="mt-1 text-sm text-gray-500 dark:text-gray-400 block">
                                                {address.address || address.address_line1}, {address.city}, {address.state} {address.postal_code}
                                            </span>
                                            <span className="mt-1 text-sm text-gray-500 dark:text-gray-400 block">
                                                {address.phone}
                                            </span>
                                        </label>
                                    </div>

                                    <div className="flex space-x-2">
                                        {!address.is_default && (
                                            <button
                                                type="button"
                                                onClick={() => handleSetDefault(Number(address.id))}
                                                className="text-xs text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300"
                                            >
                                                Set as default
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleEditAddress(address)}
                                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                            aria-label="Edit address"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteAddress(Number(address.id))}
                                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                            aria-label="Delete address"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShippingAddressManager;