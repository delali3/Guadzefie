// src/contexts/ShippingAddressContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

// Types
export interface ShippingAddress {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewShippingAddress {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default?: boolean;
}

interface ShippingAddressState {
  addresses: ShippingAddress[];
  selectedAddressId: number | null;
  defaultAddressId: number | null;
  loading: boolean;
  error: string | null;
  initialized: boolean; // Added to track initialization
}

// Action types
type ShippingAddressAction =
  | { type: 'SET_ADDRESSES'; payload: ShippingAddress[] }
  | { type: 'ADD_ADDRESS'; payload: ShippingAddress }
  | { type: 'UPDATE_ADDRESS'; payload: ShippingAddress }
  | { type: 'DELETE_ADDRESS'; payload: number }
  | { type: 'SELECT_ADDRESS'; payload: number | null }
  | { type: 'SET_DEFAULT_ADDRESS'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }; // New action type

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
  updateAddress: (id: number, address: Partial<NewShippingAddress>) => Promise<ShippingAddress | null>;
  deleteAddress: (id: number) => Promise<boolean>;
  selectAddress: (id: number | null) => void;
  setDefaultAddress: (id: number) => Promise<boolean>;
  getSelectedAddress: () => ShippingAddress | null;
}

const ShippingAddressContext = createContext<ShippingAddressContextType | undefined>(undefined);

// Provider
export const ShippingAddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(shippingAddressReducer, initialState);
  const [fetchCount, setFetchCount] = useState(0);

  // Fetch all shipping addresses for the current user
  const fetchAddresses = useCallback(async () => {
    // Don't try to fetch if we've already tried a few times
    if (fetchCount > 0) {
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        dispatch({ type: 'SET_ADDRESSES', payload: [] });
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        return;
      }

      // Check if the shipping_addresses table exists
      try {
        const { data, error } = await supabase
          .from('shipping_addresses')
          .select('*')
          .order('is_default', { ascending: false })
          .order('updated_at', { ascending: false });
        
        if (error) {
          // Check if the error is because the table doesn't exist yet
          if (error.code === '42P01') { // PostgreSQL code for undefined_table
            console.warn('Shipping addresses table does not exist yet. Returning empty array.');
            dispatch({ type: 'SET_ADDRESSES', payload: [] });
          } else {
            console.error('Error fetching shipping addresses:', error);
            dispatch({
              type: 'SET_ERROR',
              payload: error.message || 'Failed to fetch shipping addresses'
            });
          }
        } else {
          dispatch({ type: 'SET_ADDRESSES', payload: data || [] });
          
          // Auto-select the default address or the first one if available
          if (data && data.length > 0) {
            const defaultAddress = data.find(address => address.is_default);
            dispatch({ 
              type: 'SELECT_ADDRESS', 
              payload: defaultAddress ? defaultAddress.id : data[0].id 
            });
          }
        }
      } catch (fetchError) {
        console.error('Error in fetch operation:', fetchError);
        dispatch({
          type: 'SET_ERROR',
          payload: fetchError instanceof Error ? fetchError.message : 'Failed to fetch shipping addresses'
        });
      }
    } catch (error) {
      console.error('Error getting user:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to get current user'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      setFetchCount(prev => prev + 1);
    }
  }, [fetchCount, state.loading, state.initialized, state.addresses.length]);

  // Add a new shipping address
  const addAddress = useCallback(async (address: NewShippingAddress): Promise<ShippingAddress | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if table exists before inserting
      try {
        const { data, error } = await supabase
          .from('shipping_addresses')
          .insert([
            { 
              ...address,
              user_id: user.id
            }
          ])
          .select()
          .single();
        
        if (error) {
          if (error.code === '42P01') {
            throw new Error('Shipping addresses table does not exist');
          }
          throw error;
        }
        
        if (!data) {
          throw new Error('Failed to create shipping address');
        }
        
        dispatch({ type: 'ADD_ADDRESS', payload: data });
        return data;
      } catch (insertError) {
        console.error('Error inserting address:', insertError);
        throw insertError;
      }
    } catch (error) {
      console.error('Error adding shipping address:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to add shipping address'
      });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Update an existing shipping address
  const updateAddress = useCallback(async (id: number, addressUpdate: Partial<NewShippingAddress>): Promise<ShippingAddress | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .update({
          ...addressUpdate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.code === '42P01') {
          throw new Error('Shipping addresses table does not exist');
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
  const deleteAddress = useCallback(async (id: number): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { error } = await supabase
        .from('shipping_addresses')
        .delete()
        .eq('id', id);
      
      if (error) {
        if (error.code === '42P01') {
          throw new Error('Shipping addresses table does not exist');
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
  const selectAddress = useCallback((id: number | null) => {
    dispatch({ type: 'SELECT_ADDRESS', payload: id });
  }, []);

  // Set an address as default
  const setDefaultAddress = useCallback(async (id: number): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { error } = await supabase
        .from('shipping_addresses')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        if (error.code === '42P01') {
          throw new Error('Shipping addresses table does not exist');
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
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          fetchAddresses();
        } else {
          // Make sure loading is set to false for non-authenticated users
          dispatch({ type: 'SET_LOADING', payload: false });
          dispatch({ type: 'SET_INITIALIZED', payload: true });
        }
      } catch (error) {
        console.error("Error checking session:", error);
        // Ensure loading state is reset on error
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };

    checkUserAndFetchAddresses();

    // Listen for authentication changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((session) => {
      if (session) {
        fetchAddresses();
      } else {
        // Clear addresses if logged out
        dispatch({ type: 'SET_ADDRESSES', payload: [] });
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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