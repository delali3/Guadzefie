import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

// Types
export interface PaymentMethod {
  id: number;
  user_id: string;
  payment_type: string; // 'card', 'mobile_money', 'bank_transfer', etc.
  provider: string; // 'visa', 'mastercard', 'mtn', 'vodafone', etc.
  account_name: string;
  account_number: string; // last 4 digits for cards, mobile number for mobile money
  expiry_date: string | null; // Only for cards: "MM/YY"
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewPaymentMethod {
  payment_type: string;
  provider: string;
  account_name: string;
  account_number: string;
  expiry_date?: string | null;
  is_default?: boolean;
}

interface PaymentMethodState {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethodId: number | null;
  defaultPaymentMethodId: number | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// Action types
type PaymentMethodAction =
  | { type: 'SET_PAYMENT_METHODS'; payload: PaymentMethod[] }
  | { type: 'ADD_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'UPDATE_PAYMENT_METHOD'; payload: PaymentMethod }
  | { type: 'DELETE_PAYMENT_METHOD'; payload: number }
  | { type: 'SELECT_PAYMENT_METHOD'; payload: number | null }
  | { type: 'SET_DEFAULT_PAYMENT_METHOD'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean };

// Initial state
const initialState: PaymentMethodState = {
  paymentMethods: [],
  selectedPaymentMethodId: null,
  defaultPaymentMethodId: null,
  loading: false,
  error: null,
  initialized: false
};

// Reducer
const paymentMethodReducer = (
  state: PaymentMethodState,
  action: PaymentMethodAction
): PaymentMethodState => {
  switch (action.type) {
    case 'SET_PAYMENT_METHODS':
      const paymentMethods = action.payload;
      const defaultMethod = paymentMethods.find(method => method.is_default);
      
      return {
        ...state,
        paymentMethods,
        defaultPaymentMethodId: defaultMethod ? defaultMethod.id : null
      };
    
    case 'ADD_PAYMENT_METHOD':
      return {
        ...state,
        paymentMethods: [...state.paymentMethods, action.payload],
        selectedPaymentMethodId: action.payload.is_default ? action.payload.id : state.selectedPaymentMethodId,
        defaultPaymentMethodId: action.payload.is_default ? action.payload.id : state.defaultPaymentMethodId
      };
    
    case 'UPDATE_PAYMENT_METHOD': {
      const updatedMethod = action.payload;
      const updatedMethods = state.paymentMethods.map(method =>
        method.id === updatedMethod.id ? updatedMethod : method
      );
      
      return {
        ...state,
        paymentMethods: updatedMethods,
        defaultPaymentMethodId: updatedMethod.is_default ? updatedMethod.id : state.defaultPaymentMethodId
      };
    }
    
    case 'DELETE_PAYMENT_METHOD': {
      const deletedMethodId = action.payload;
      const filteredMethods = state.paymentMethods.filter(method => method.id !== deletedMethodId);
      
      let newSelectedId = state.selectedPaymentMethodId;
      if (state.selectedPaymentMethodId === deletedMethodId) {
        // If the selected method was deleted, select the default or the first available
        newSelectedId = state.defaultPaymentMethodId !== deletedMethodId 
          ? state.defaultPaymentMethodId 
          : (filteredMethods.length > 0 ? filteredMethods[0].id : null);
      }
      
      let newDefaultId = state.defaultPaymentMethodId;
      if (state.defaultPaymentMethodId === deletedMethodId) {
        // If the default method was deleted, there should be no default
        newDefaultId = null;
      }
      
      return {
        ...state,
        paymentMethods: filteredMethods,
        selectedPaymentMethodId: newSelectedId,
        defaultPaymentMethodId: newDefaultId
      };
    }
    
    case 'SELECT_PAYMENT_METHOD':
      return {
        ...state,
        selectedPaymentMethodId: action.payload
      };
    
    case 'SET_DEFAULT_PAYMENT_METHOD': {
      const defaultId = action.payload;
      const updatedMethods = state.paymentMethods.map(method => ({
        ...method,
        is_default: method.id === defaultId
      }));
      
      return {
        ...state,
        paymentMethods: updatedMethods,
        defaultPaymentMethodId: defaultId
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
interface PaymentMethodContextType {
  state: PaymentMethodState;
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (method: NewPaymentMethod) => Promise<PaymentMethod | null>;
  updatePaymentMethod: (id: number, method: Partial<NewPaymentMethod>) => Promise<PaymentMethod | null>;
  deletePaymentMethod: (id: number) => Promise<boolean>;
  selectPaymentMethod: (id: number | null) => void;
  setDefaultPaymentMethod: (id: number) => Promise<boolean>;
  getSelectedPaymentMethod: () => PaymentMethod | null;
}

const PaymentMethodContext = createContext<PaymentMethodContextType | undefined>(undefined);

// Helper function to get the current user from localStorage
const getCurrentUser = (): { id: string; email: string } | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('No user found in localStorage');
      return null;
    }
    
    const user = JSON.parse(userStr);
    if (!user || !user.id) {
      console.log('Invalid user data in localStorage');
      return null;
    }
    
    return { id: user.id, email: user.email };
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

// Provider
export const PaymentMethodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(paymentMethodReducer, initialState);
  const [fetchCount, setFetchCount] = useState(0);

  // Fetch all payment methods for the current user
  const fetchPaymentMethods = useCallback(async () => {
    // Don't try to fetch if we've already tried a few times
    if (fetchCount > 3) {
      console.log("Too many fetch attempts, stopping.");
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      return;
    }

    if (state.initialized && state.paymentMethods.length > 0) {
      return;
    }

    // If already loading, don't trigger another fetch
    if (state.loading) {
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Get the current user from localStorage
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.log('No authenticated user found in fetchPaymentMethods');
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'User not authenticated. Please sign in to view your payment methods.' 
        });
        dispatch({ type: 'SET_PAYMENT_METHODS', payload: [] });
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        return;
      }
      
      console.log('Fetching payment methods for user:', currentUser.id);

      // We have user auth, proceed to fetch payment methods 
      try {
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('is_default', { ascending: false })
          .order('updated_at', { ascending: false });
        
        if (error) {
          // Check if the error is because the table doesn't exist yet
          if (error.code === '42P01') { // PostgreSQL code for undefined_table
            console.warn('Payment methods table does not exist yet. Please run the migration script.');
            dispatch({ type: 'SET_PAYMENT_METHODS', payload: [] });
            dispatch({
              type: 'SET_ERROR',
              payload: 'Payment methods table does not exist. Please run the migration script first.'
            });
          } else {
            console.error('Error fetching payment methods:', error);
            dispatch({
              type: 'SET_ERROR',
              payload: error.message || 'Failed to fetch payment methods'
            });
          }
        } else {
          console.log(`Fetched ${data?.length || 0} payment methods successfully`);
          dispatch({ type: 'SET_PAYMENT_METHODS', payload: data || [] });
          
          // Auto-select the default payment method or the first one if available
          if (data && data.length > 0) {
            const defaultMethod = data.find(method => method.is_default);
            dispatch({ 
              type: 'SELECT_PAYMENT_METHOD', 
              payload: defaultMethod ? defaultMethod.id : data[0].id 
            });
          }
        }
      } catch (fetchError) {
        console.error('Error in fetch operation:', fetchError);
        dispatch({
          type: 'SET_ERROR',
          payload: fetchError instanceof Error ? fetchError.message : 'Failed to fetch payment methods'
        });
      }
    } catch (error) {
      console.error('Error getting user in fetchPaymentMethods:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to get current user'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      setFetchCount(prev => prev + 1);
    }
  }, [fetchCount, state.loading, state.initialized, state.paymentMethods.length]);

  // Add a new payment method
  const addPaymentMethod = useCallback(async (method: NewPaymentMethod): Promise<PaymentMethod | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Get the current user from localStorage
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.error('No user found in session');
        dispatch({
          type: 'SET_ERROR',
          payload: 'You appear to be logged out. Please sign in to add payment methods.'
        });
        return null;
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .insert([
          { 
            ...method,
            user_id: currentUser.id
          }
        ])
        .select()
        .single();
      
      if (error) {
        if (error.code === '42P01') {
          throw new Error('Payment methods table does not exist. Please run the migration script first.');
        }
        throw error;
      }
      
      if (!data) {
        throw new Error('Failed to create payment method');
      }
      
      dispatch({ type: 'ADD_PAYMENT_METHOD', payload: data });
      return data;
    } catch (error) {
      console.error('Error adding payment method:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to add payment method'
      });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Update an existing payment method
  const updatePaymentMethod = useCallback(async (id: number, methodUpdate: Partial<NewPaymentMethod>): Promise<PaymentMethod | null> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Get the current user from localStorage
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.error('No user found in session for updatePaymentMethod');
        dispatch({
          type: 'SET_ERROR',
          payload: 'You appear to be logged out. Please sign in to update payment methods.'
        });
        return null;
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .update({
          ...methodUpdate,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', currentUser.id)  // Ensure the payment method belongs to the current user
        .select()
        .single();
      
      if (error) {
        if (error.code === '42P01') {
          throw new Error('Payment methods table does not exist. Please run the migration script first.');
        }
        throw error;
      }
      
      if (!data) {
        throw new Error('Failed to update payment method');
      }
      
      dispatch({ type: 'UPDATE_PAYMENT_METHOD', payload: data });
      return data;
    } catch (error) {
      console.error('Error updating payment method:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to update payment method'
      });
      return null;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Delete a payment method
  const deletePaymentMethod = useCallback(async (id: number): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Get the current user from localStorage
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.error('No user found in session for deletePaymentMethod');
        dispatch({
          type: 'SET_ERROR',
          payload: 'You appear to be logged out. Please sign in to delete payment methods.'
        });
        return false;
      }

      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);  // Ensure the payment method belongs to the current user
      
      if (error) {
        if (error.code === '42P01') {
          throw new Error('Payment methods table does not exist. Please run the migration script first.');
        }
        throw error;
      }
      
      dispatch({ type: 'DELETE_PAYMENT_METHOD', payload: id });
      return true;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to delete payment method'
      });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Select a specific payment method
  const selectPaymentMethod = useCallback((id: number | null) => {
    dispatch({ type: 'SELECT_PAYMENT_METHOD', payload: id });
  }, []);

  // Set a payment method as default
  const setDefaultPaymentMethod = useCallback(async (id: number): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Get the current user from localStorage
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.error('No user found in session for setDefaultPaymentMethod');
        dispatch({
          type: 'SET_ERROR',
          payload: 'You appear to be logged out. Please sign in to set default payment method.'
        });
        return false;
      }

      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', currentUser.id);  // Ensure the payment method belongs to the current user
      
      if (error) {
        if (error.code === '42P01') {
          throw new Error('Payment methods table does not exist. Please run the migration script first.');
        }
        throw error;
      }
      
      dispatch({ type: 'SET_DEFAULT_PAYMENT_METHOD', payload: id });
      return true;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to set default payment method'
      });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Get the currently selected payment method
  const getSelectedPaymentMethod = useCallback((): PaymentMethod | null => {
    if (!state.selectedPaymentMethodId) return null;
    return state.paymentMethods.find(method => method.id === state.selectedPaymentMethodId) || null;
  }, [state.paymentMethods, state.selectedPaymentMethodId]);

  // Load payment methods when the context is first mounted if the user is logged in
  useEffect(() => {
    const checkUserAndFetchPaymentMethods = async () => {
      // Check if user is logged in via localStorage
      const currentUser = getCurrentUser();
      
      if (currentUser) {
        console.log("User found in localStorage, fetching payment methods...");
        fetchPaymentMethods();
      } else {
        console.log("No user found in localStorage");
        // Make sure loading is set to false for non-authenticated users
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };

    checkUserAndFetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const value = {
    state,
    fetchPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    selectPaymentMethod,
    setDefaultPaymentMethod,
    getSelectedPaymentMethod
  };

  return (
    <PaymentMethodContext.Provider value={value}>
      {children}
    </PaymentMethodContext.Provider>
  );
};

// Custom hook
export const usePaymentMethods = () => {
  const context = useContext(PaymentMethodContext);
  if (context === undefined) {
    throw new Error('usePaymentMethods must be used within a PaymentMethodProvider');
  }
  return context;
};

export default { PaymentMethodProvider, usePaymentMethods };
