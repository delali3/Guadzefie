// src/contexts/ShippingAddressContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';
import { ensureShippingAddressesTable, checkShippingAddressesTable } from '../lib/migrations';
import toast from 'react-hot-toast';

// Types
export interface ShippingAddress {
  id: number | string;  // Update to allow both number and string (UUID)
  user_id: string;
  first_name: string;
  last_name: string;
  address_line1: string;  // Updated field name to match our table
  address_line2?: string; // Added as optional
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email?: string;  // Added as optional
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewShippingAddress {
  first_name: string;
  last_name: string;
  address_line1: string;  // Updated field name
  address_line2?: string; // Optional
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email?: string;  // Optional
  is_default?: boolean;
}

interface ShippingAddressState {
  addresses: ShippingAddress[];
  selectedAddressId: number | string | null;
  defaultAddressId: number | string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean; // Added to track initialization
}

// Action types
type ShippingAddressAction =
  | { type: 'SET_ADDRESSES'; payload: ShippingAddress[] }
  | { type: 'ADD_ADDRESS'; payload: ShippingAddress }
  | { type: 'UPDATE_ADDRESS'; payload: ShippingAddress }
  | { type: 'DELETE_ADDRESS'; payload: number | string }
  | { type: 'SELECT_ADDRESS'; payload: number | string | null }
  | { type: 'SET_DEFAULT_ADDRESS'; payload: number | string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean };

// Initial state
const initialState: ShippingAddressState = {
  addresses: [],
  selectedAddressId: null,
  defaultAddressId: null,
  loading: false,
  error: null,
  initialized: false
};

// Reducer
const shippingAddressReducer = (
  state: ShippingAddressState,
  action: ShippingAddressAction
): ShippingAddressState => {
  switch (action.type) {
    case 'SET_ADDRESSES':
      const addresses = action.payload;
      const defaultAddress = addresses.find(address => address.is_default);
      
      return {
        ...state,
        addresses,
        defaultAddressId: defaultAddress ? defaultAddress.id : null
      };
    
    case 'ADD_ADDRESS':
      return {
        ...state,
        addresses: [...state.addresses, action.payload],
        selectedAddressId: action.payload.is_default ? action.payload.id : state.selectedAddressId,
        defaultAddressId: action.payload.is_default ? action.payload.id : state.defaultAddressId
      };
    
    case 'UPDATE_ADDRESS': {
      const updatedAddress = action.payload;
      const updatedAddresses = state.addresses.map(address =>
        address.id === updatedAddress.id ? updatedAddress : address
      );
      
      return {
        ...state,
        addresses: updatedAddresses,
        defaultAddressId: updatedAddress.is_default ? updatedAddress.id : state.defaultAddressId
      };
    }
    
    case 'DELETE_ADDRESS': {
      const deletedAddressId = action.payload;
      const filteredAddresses = state.addresses.filter(address => address.id !== deletedAddressId);
      
      let newSelectedId = state.selectedAddressId;
      if (state.selectedAddressId === deletedAddressId) {
        // If the selected address was deleted, select the default or the first available
        newSelectedId = state.defaultAddressId !== deletedAddressId 
          ? state.defaultAddressId 
          : (filteredAddresses.length > 0 ? filteredAddresses[0].id : null);
      }
      
      let newDefaultId = state.defaultAddressId;
      if (state.defaultAddressId === deletedAddressId) {
        // If the default address was deleted, there should be no default
        newDefaultId = null;
      }
      
      return {
        ...state,
        addresses: filteredAddresses,
        selectedAddressId: newSelectedId,
        defaultAddressId: newDefaultId
      };
    }
    
    case 'SELECT_ADDRESS':
      return {
        ...state,
        selectedAddressId: action.payload
      };
    
    case 'SET_DEFAULT_ADDRESS': {
      const defaultId = action.payload;
      const updatedAddresses = state.addresses.map(address => ({
        ...address,
        is_default: address.id === defaultId
      }));
      
      return {
        ...state,
        addresses: updatedAddresses,
        defaultAddressId: defaultId
      };
    }
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    
    case 'SET_INITIALIZED':
      return {
        ...state,
        initialized: action.payload
      };
    
    default:
      return state;
  }
};

// Context
interface ShippingAddressContextType {
  state: ShippingAddressState;
  fetchAddresses: () => Promise<void>;
  addAddress: (address: NewShippingAddress) => Promise<ShippingAddress | null>;
  updateAddress: (id: number | string, address: Partial<NewShippingAddress>) => Promise<ShippingAddress | null>;
  deleteAddress: (id: number | string) => Promise<boolean>;
  selectAddress: (id: number | string | null) => void;
  setDefaultAddress: (id: number | string) => Promise<boolean>;
  getSelectedAddress: () => ShippingAddress | null;
}

const ShippingAddressContext = createContext<ShippingAddressContextType | undefined>(undefined);

// Provider
export const ShippingAddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(shippingAddressReducer, initialState);
  const [fetchCount, setFetchCount] = useState(0);
  const [tableChecked, setTableChecked] = useState(false);

  // Ensure the shipping_addresses table exists
  const ensureTable = useCallback(async () => {
    if (tableChecked) return;
    
    try {
      // Check if the table exists first
      const tableExists = await checkShippingAddressesTable();
      
      if (!tableExists) {
        console.log('Shipping addresses table does not exist, creating...');
        const result = await ensureShippingAddressesTable();
        
        if (!result.success) {
          console.error('Failed to create shipping addresses table:', result.message);
        } else {
          console.log('Shipping addresses table created successfully');
        }
      } else {
        console.log('Shipping addresses table already exists');
      }
    } catch (error) {
      console.error('Error ensuring shipping addresses table:', error);
    } finally {
      setTableChecked(true);
    }
  }, [tableChecked]);

  // Fetch all shipping addresses for the current user
  const fetchAddresses = useCallback(async () => {
    // First ensure the table exists
    await ensureTable();
    
    // Don't try to fetch if we've already tried a few times
    if (fetchCount > 3) {
      console.log("Too many fetch attempts, stopping.");
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      return;
    }

    if (state.initialized && state.addresses.length > 0) {
      return;
    }

    // If already loading, don't trigger another fetch
    if (state.loading) {
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Get current user directly from our utility function
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.log('No authenticated user found in fetchAddresses');
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'User not authenticated. Please sign in to view your addresses.' 
        });
        dispatch({ type: 'SET_ADDRESSES', payload: [] });
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        return;
      }
      
      console.log('Fetching addresses for user:', currentUser.id);
      
      // Fetch addresses from the database
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        // Check if it's a table existence error
        if (error.message.includes('does not exist')) {
          // Try to create the table
          const tableResult = await ensureShippingAddressesTable();
          if (tableResult.success) {
            console.log('Created shipping_addresses table, retrying fetch');
            setFetchCount(c => c + 1);
            // Don't update state here, just exit and let the useEffect trigger a retry
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
          } else {
            throw new Error(`Could not create shipping_addresses table: ${tableResult.message}`);
          }
        }
        
        // Check if it's an auth error
        if (error.message.includes('JWT expired') || 
            error.message.includes('JWTExpired') ||
            error.message.includes('not authenticated')) {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: 'Your session has expired. Please sign in again to manage addresses.' 
          });
          dispatch({ type: 'SET_ADDRESSES', payload: [] });
        } else {
          console.error('Error fetching shipping addresses:', error);
          dispatch({ 
            type: 'SET_ERROR', 
            payload: error.message || 'Failed to load shipping addresses' 
          });
        }
      } else {
        dispatch({ type: 'SET_ADDRESSES', payload: data || [] });
        
        // If we have addresses, select the default one or the first one
        if (data && data.length > 0) {
          const defaultAddress = data.find(addr => addr.is_default);
          if (defaultAddress) {
            dispatch({ type: 'SELECT_ADDRESS', payload: defaultAddress.id });
          } else {
            dispatch({ type: 'SELECT_ADDRESS', payload: data[0].id });
          }
        }
      }
    } catch (error: any) {
      console.error('Exception fetching shipping addresses:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || 'An unexpected error occurred while loading addresses' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      setFetchCount(c => c + 1);
    }
  }, [state.loading, state.initialized, fetchCount, ensureTable]);

  // Add a new shipping address
  const addAddress = useCallback(async (address: NewShippingAddress): Promise<ShippingAddress | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      // First ensure the table exists
      await ensureTable();
      
      // Get current user from our utility function
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        throw new Error('User not authenticated. Please sign in to add an address.');
      }
      
      const userId = currentUser.id;
      console.log('Adding address for user:', userId, address);
      
      // If this is the first address or it's marked as default, ensure it's set as default
      let isDefault = !!address.is_default;
      
      if (state.addresses.length === 0) {
        isDefault = true;
      }
      
      const { data, error } = await supabase
        .from('shipping_addresses')
        .insert([
          {
            ...address,
            user_id: userId,
            is_default: isDefault
          }
        ])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding shipping address:', error);
        throw new Error(error.message || 'Failed to add shipping address');
      }
      
      if (!data) {
        throw new Error('No data returned after adding address');
      }
      
      // Update state
      dispatch({ type: 'ADD_ADDRESS', payload: data });
      
      // If this is the first address, select it
      if (state.addresses.length === 0 || isDefault) {
        dispatch({ type: 'SELECT_ADDRESS', payload: data.id });
      }
      
      toast.success('Address added successfully');
      return data;
    } catch (error: any) {
      console.error('Exception adding shipping address:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast.error(error.message || 'Failed to add address');
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.addresses.length, ensureTable]);

  // Update an existing shipping address
  const updateAddress = useCallback(async (id: number | string, addressUpdate: Partial<NewShippingAddress>): Promise<ShippingAddress | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Get the current user from localStorage
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.error('No user found in session for updateAddress');
        dispatch({
          type: 'SET_ERROR',
          payload: 'You appear to be logged out. Please sign in to update addresses.'
        });
        return null;
      }

      const { data, error } = await supabase
        .from('shipping_addresses')
        .update({
          ...addressUpdate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', currentUser.id)  // Ensure the address belongs to the current user
        .select()
        .single();
      
      if (error) {
        if (error.code === '42P01') {
          throw new Error('Shipping addresses table does not exist. Please run the migration script first.');
        }
        throw error;
      }
      
      if (!data) {
        throw new Error('Failed to update shipping address');
      }
      
      dispatch({ type: 'UPDATE_ADDRESS', payload: data });
      return data;
    } catch (error) {
      console.error('Error updating shipping address:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to update shipping address'
      });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Delete a shipping address
  const deleteAddress = useCallback(async (id: number | string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Get the current user from localStorage
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.error('No user found in session for deleteAddress');
        dispatch({
          type: 'SET_ERROR',
          payload: 'You appear to be logged out. Please sign in to delete addresses.'
        });
        return false;
      }

      const { error } = await supabase
        .from('shipping_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);  // Ensure the address belongs to the current user
      
      if (error) {
        if (error.code === '42P01') {
          throw new Error('Shipping addresses table does not exist. Please run the migration script first.');
        }
        throw error;
      }
      
      dispatch({ type: 'DELETE_ADDRESS', payload: id });
      return true;
    } catch (error) {
      console.error('Error deleting shipping address:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to delete shipping address'
      });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Select a specific address
  const selectAddress = useCallback((id: number | string | null) => {
    dispatch({ type: 'SELECT_ADDRESS', payload: id });
  }, []);

  // Set an address as default
  const setDefaultAddress = useCallback(async (id: number | string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Get the current user from localStorage
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.error('No user found in session for setDefaultAddress');
        dispatch({
          type: 'SET_ERROR',
          payload: 'You appear to be logged out. Please sign in to set default address.'
        });
        return false;
      }

      const { error } = await supabase
        .from('shipping_addresses')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', currentUser.id);  // Ensure the address belongs to the current user
      
      if (error) {
        if (error.code === '42P01') {
          throw new Error('Shipping addresses table does not exist. Please run the migration script first.');
        }
        throw error;
      }
      
      dispatch({ type: 'SET_DEFAULT_ADDRESS', payload: id });
      return true;
    } catch (error) {
      console.error('Error setting default address:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to set default address'
      });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Get the currently selected address
  const getSelectedAddress = useCallback((): ShippingAddress | null => {
    if (!state.selectedAddressId) return null;
    return state.addresses.find(address => address.id === state.selectedAddressId) || null;
  }, [state.addresses, state.selectedAddressId]);

  // Load addresses when the context is first mounted if the user is logged in
  useEffect(() => {
    const checkUserAndFetchAddresses = async () => {
      // Check if user is logged in via localStorage
      const currentUser = getCurrentUser();
      
      if (currentUser) {
        console.log("User found in localStorage, fetching addresses...");
        fetchAddresses();
      } else {
        console.log("No user found in localStorage");
        // Make sure loading is set to false for non-authenticated users
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };

    checkUserAndFetchAddresses();
  }, [fetchAddresses]);

  const value = {
    state,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    selectAddress,
    setDefaultAddress,
    getSelectedAddress
  };

  return (
    <ShippingAddressContext.Provider value={value}>
      {children}
    </ShippingAddressContext.Provider>
  );
};

// Custom hook
export const useShippingAddresses = () => {
  const context = useContext(ShippingAddressContext);
  if (context === undefined) {
    throw new Error('useShippingAddresses must be used within a ShippingAddressProvider');
  }
  return context;
};

export default { ShippingAddressProvider, useShippingAddresses };