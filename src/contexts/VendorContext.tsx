// src/contexts/VendorContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { VendorProfile, Commission, Payout, VendorAnalytics, VendorApplication } from '../types/vendor';

interface VendorState {
  vendorProfile: VendorProfile | null;
  commissions: Commission[];
  payouts: Payout[];
  analytics: VendorAnalytics | null;
  applications: VendorApplication[];
  isLoading: boolean;
  error: string | null;
}

type VendorAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_VENDOR_PROFILE'; payload: VendorProfile | null }
  | { type: 'SET_COMMISSIONS'; payload: Commission[] }
  | { type: 'SET_PAYOUTS'; payload: Payout[] }
  | { type: 'SET_ANALYTICS'; payload: VendorAnalytics | null }
  | { type: 'SET_APPLICATIONS'; payload: VendorApplication[] }
  | { type: 'ADD_COMMISSION'; payload: Commission }
  | { type: 'UPDATE_COMMISSION'; payload: { id: string; updates: Partial<Commission> } }
  | { type: 'ADD_PAYOUT'; payload: Payout }
  | { type: 'UPDATE_PAYOUT'; payload: { id: string; updates: Partial<Payout> } };

interface VendorContextType extends VendorState {
  // Commission Management
  calculateCommissions: (orderId: number) => Promise<void>;
  getVendorCommissions: (vendorId: string, filters?: CommissionFilters) => Promise<Commission[]>;
  updateCommissionStatus: (commissionId: string, status: Commission['status']) => Promise<void>;

  // Payout Management
  createPayout: (vendorId: string, commissionIds: string[]) => Promise<string>;
  processPayouts: (payoutIds: string[]) => Promise<void>;
  getVendorPayouts: (vendorId: string) => Promise<Payout[]>;

  // Analytics
  getVendorAnalytics: (vendorId: string, period: string) => Promise<VendorAnalytics>;
  updateAnalytics: (vendorId: string) => Promise<void>;

  // Application Management
  submitApplication: (applicationData: Partial<VendorApplication>) => Promise<string>;
  updateApplicationStatus: (applicationId: string, status: VendorApplication['status'], notes?: string) => Promise<void>;
  getApplications: (filters?: ApplicationFilters) => Promise<VendorApplication[]>;
}

interface CommissionFilters {
  status?: Commission['status'];
  dateFrom?: string;
  dateTo?: string;
  productId?: number;
}

interface ApplicationFilters {
  status?: VendorApplication['status'];
  businessType?: string;
  dateFrom?: string;
  dateTo?: string;
}

const initialState: VendorState = {
  vendorProfile: null,
  commissions: [],
  payouts: [],
  analytics: null,
  applications: [],
  isLoading: false,
  error: null
};

const vendorReducer = (state: VendorState, action: VendorAction): VendorState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_VENDOR_PROFILE':
      return { ...state, vendorProfile: action.payload };
    case 'SET_COMMISSIONS':
      return { ...state, commissions: action.payload };
    case 'SET_PAYOUTS':
      return { ...state, payouts: action.payload };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    case 'SET_APPLICATIONS':
      return { ...state, applications: action.payload };
    case 'ADD_COMMISSION':
      return { ...state, commissions: [...state.commissions, action.payload] };
    case 'UPDATE_COMMISSION':
      return {
        ...state,
        commissions: state.commissions.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        )
      };
    case 'ADD_PAYOUT':
      return { ...state, payouts: [...state.payouts, action.payload] };
    case 'UPDATE_PAYOUT':
      return {
        ...state,
        payouts: state.payouts.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        )
      };
    default:
      return state;
  }
};

const VendorContext = createContext<VendorContextType | null>(null);

export const VendorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(vendorReducer, initialState);
  const { user } = useAuth();

  // Calculate commissions for an order
  const calculateCommissions = async (orderId: number): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Get order items with product and vendor information
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            id,
            farmer_id,
            vendor_id,
            owner_id,
            price
          )
        `)
        .eq('order_id', orderId);

      if (orderError) throw orderError;

      // Calculate commission for each item
      for (const item of orderItems || []) {
        const product = item.products;
        if (!product) continue;

        const vendorId = product.farmer_id || product.vendor_id || product.owner_id;
        if (!vendorId) continue;

        // Get vendor's commission rate
        const { data: vendorProfile } = await supabase
          .from('vendor_profiles')
          .select('commission_rate')
          .eq('user_id', vendorId)
          .single();

        const commissionRate = vendorProfile?.commission_rate || 0.15; // Default 15%
        const saleAmount = item.price_at_purchase * item.quantity;
        const commissionAmount = saleAmount * commissionRate;

        // Create commission record
        const commission: Omit<Commission, 'id' | 'created_at'> = {
          vendor_id: vendorId,
          order_id: orderId,
          product_id: product.id,
          sale_amount: saleAmount,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          status: 'calculated'
        };

        const { data: newCommission, error: commissionError } = await supabase
          .from('commissions')
          .insert(commission)
          .select()
          .single();

        if (commissionError) {
          console.error('Error creating commission:', commissionError);
          continue;
        }

        dispatch({ type: 'ADD_COMMISSION', payload: newCommission });
      }
    } catch (error) {
      console.error('Error calculating commissions:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to calculate commissions' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Get vendor commissions with filters
  const getVendorCommissions = async (vendorId: string, filters?: CommissionFilters): Promise<Commission[]> => {
    try {
      let query = supabase
        .from('commissions')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }

      const { data, error } = await query;

      if (error) throw error;

      dispatch({ type: 'SET_COMMISSIONS', payload: data || [] });
      return data || [];
    } catch (error) {
      console.error('Error fetching commissions:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch commissions' });
      return [];
    }
  };

  // Update commission status
  const updateCommissionStatus = async (commissionId: string, status: Commission['status']): Promise<void> => {
    try {
      const updates: Partial<Commission> = { status };

      if (status === 'paid') {
        updates.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('commissions')
        .update(updates)
        .eq('id', commissionId);

      if (error) throw error;

      dispatch({ type: 'UPDATE_COMMISSION', payload: { id: commissionId, updates } });
    } catch (error) {
      console.error('Error updating commission status:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update commission status' });
    }
  };

  // Create payout for vendor
  const createPayout = async (vendorId: string, commissionIds: string[]): Promise<string> => {
    try {
      // Get commissions to calculate total
      const { data: commissions, error: commissionsError } = await supabase
        .from('commissions')
        .select('*')
        .in('id', commissionIds)
        .eq('status', 'calculated');

      if (commissionsError) throw commissionsError;

      const totalCommission = commissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;
      const paymentFee = totalCommission * 0.025; // 2.5% payment processing fee
      const netAmount = totalCommission - paymentFee;

      // Create payout record
      const payout: Omit<Payout, 'id' | 'created_at' | 'updated_at'> = {
        vendor_id: vendorId,
        total_commission: totalCommission,
        commission_count: commissions?.length || 0,
        period_start: commissions?.[0]?.created_at || new Date().toISOString(),
        period_end: new Date().toISOString(),
        status: 'pending',
        payment_method: 'bank_transfer',
        payment_fee: paymentFee,
        net_amount: netAmount
      };

      const { data: newPayout, error: payoutError } = await supabase
        .from('payouts')
        .insert(payout)
        .select()
        .single();

      if (payoutError) throw payoutError;

      // Update commission statuses to pending
      await Promise.all(
        commissionIds.map(id => updateCommissionStatus(id, 'pending'))
      );

      // Update commissions with payout_id
      await supabase
        .from('commissions')
        .update({ payout_id: newPayout.id })
        .in('id', commissionIds);

      dispatch({ type: 'ADD_PAYOUT', payload: newPayout });
      return newPayout.id;
    } catch (error) {
      console.error('Error creating payout:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create payout' });
      throw error;
    }
  };

  // Process payouts (admin function)
  const processPayouts = async (payoutIds: string[]): Promise<void> => {
    try {
      for (const payoutId of payoutIds) {
        // In a real application, this would integrate with payment processor
        const paymentReference = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const updates: Partial<Payout> = {
          status: 'completed',
          payment_reference: paymentReference,
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        };

        const { error } = await supabase
          .from('payouts')
          .update(updates)
          .eq('id', payoutId);

        if (error) throw error;

        // Update related commissions to paid status
        const { data: payout } = await supabase
          .from('payouts')
          .select('*')
          .eq('id', payoutId)
          .single();

        if (payout) {
          await supabase
            .from('commissions')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('payout_id', payoutId);
        }

        dispatch({ type: 'UPDATE_PAYOUT', payload: { id: payoutId, updates } });
      }
    } catch (error) {
      console.error('Error processing payouts:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to process payouts' });
    }
  };

  // Get vendor payouts
  const getVendorPayouts = async (vendorId: string): Promise<Payout[]> => {
    try {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      dispatch({ type: 'SET_PAYOUTS', payload: data || [] });
      return data || [];
    } catch (error) {
      console.error('Error fetching payouts:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch payouts' });
      return [];
    }
  };

  // Get vendor analytics
  const getVendorAnalytics = async (vendorId: string, period: string): Promise<VendorAnalytics> => {
    try {
      // This would typically be a complex query or stored procedure
      // For now, we'll create a basic implementation

      const endDate = new Date();
      let startDate = new Date();

      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Get vendor's orders in the period
      const { data: orders, error: ordersError } = await supabase
        .from('order_items')
        .select(`
          *,
          orders (created_at, status),
          products (farmer_id, vendor_id, owner_id, name, category_id)
        `)
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString());

      if (ordersError) throw ordersError;

      // Filter orders for this vendor
      const vendorOrders = orders?.filter(item => {
        const product = item.products;
        return product && (
          product.farmer_id === vendorId ||
          product.vendor_id === vendorId ||
          product.owner_id === vendorId
        );
      }) || [];

      // Calculate analytics
      const totalSales = vendorOrders.reduce((sum, item) => sum + (item.price_at_purchase * item.quantity), 0);
      const totalOrders = new Set(vendorOrders.map(item => item.order_id)).size;

      // Get commissions for this period
      const { data: commissions } = await supabase
        .from('commissions')
        .select('*')
        .eq('vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const totalCommission = commissions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;

      const analytics: VendorAnalytics = {
        vendor_id: vendorId,
        period,
        total_sales: totalSales,
        total_orders: totalOrders,
        total_commission: totalCommission,
        average_order_value: totalOrders > 0 ? totalSales / totalOrders : 0,
        conversion_rate: 0, // Would need traffic data
        return_rate: 0, // Would need return data
        customer_satisfaction: 0, // Would need review data
        top_selling_products: [],
        sales_by_category: [],
        monthly_performance: []
      };

      dispatch({ type: 'SET_ANALYTICS', payload: analytics });
      return analytics;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch analytics' });
      throw error;
    }
  };

  // Update analytics
  const updateAnalytics = async (vendorId: string): Promise<void> => {
    try {
      await getVendorAnalytics(vendorId, 'month');
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  };

  // Submit vendor application
  const submitApplication = async (applicationData: Partial<VendorApplication>): Promise<string> => {
    try {
      if (!user) throw new Error('User not authenticated');

      const application: Omit<VendorApplication, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        status: 'pending',
        ...applicationData as Omit<VendorApplication, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>
      };

      const { data, error } = await supabase
        .from('vendor_applications')
        .insert(application)
        .select()
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error submitting application:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to submit application' });
      throw error;
    }
  };

  // Update application status
  const updateApplicationStatus = async (
    applicationId: string,
    status: VendorApplication['status'],
    notes?: string
  ): Promise<void> => {
    try {
      const updates: Partial<VendorApplication> = {
        status,
        approval_notes: notes
      };

      if (status === 'approved') {
        updates.approved_by = user?.id;
        updates.approved_at = new Date().toISOString();
        updates.commission_rate = 0.15; // Default commission rate
      } else if (status === 'rejected') {
        updates.rejection_reason = notes;
      }

      const { error } = await supabase
        .from('vendor_applications')
        .update(updates)
        .eq('id', applicationId);

      if (error) throw error;

      // If approved, create vendor profile
      if (status === 'approved') {
        const { data: application } = await supabase
          .from('vendor_applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        if (application) {
          const vendorProfile: Omit<VendorProfile, 'id' | 'created_at' | 'updated_at'> = {
            user_id: application.user_id,
            application_id: applicationId,
            business_name: application.business_name,
            business_type: application.business_type,
            status: 'active',
            commission_rate: 0.15,
            total_sales: 0,
            total_commission: 0,
            total_products: 0,
            rating: 0,
            performance_score: 0,
            joining_date: new Date().toISOString(),
            last_active: new Date().toISOString(),
            settings: {
              auto_approve_products: false,
              notification_preferences: {
                new_orders: true,
                low_stock: true,
                commission_updates: true,
                performance_reports: true
              }
            }
          };

          await supabase
            .from('vendor_profiles')
            .insert(vendorProfile);
        }
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update application status' });
    }
  };

  // Get applications with filters
  const getApplications = async (filters?: ApplicationFilters): Promise<VendorApplication[]> => {
    try {
      let query = supabase
        .from('vendor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.businessType) {
        query = query.eq('business_type', filters.businessType);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      dispatch({ type: 'SET_APPLICATIONS', payload: data || [] });
      return data || [];
    } catch (error) {
      console.error('Error fetching applications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch applications' });
      return [];
    }
  };

  // Load vendor profile on mount
  useEffect(() => {
    if (user) {
      const loadVendorProfile = async () => {
        try {
          const { data } = await supabase
            .from('vendor_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (data) {
            dispatch({ type: 'SET_VENDOR_PROFILE', payload: data });
          }
        } catch (error) {
          // User might not be a vendor yet
        }
      };

      loadVendorProfile();
    }
  }, [user]);

  const value: VendorContextType = {
    ...state,
    calculateCommissions,
    getVendorCommissions,
    updateCommissionStatus,
    createPayout,
    processPayouts,
    getVendorPayouts,
    getVendorAnalytics,
    updateAnalytics,
    submitApplication,
    updateApplicationStatus,
    getApplications
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  );
};

export const useVendor = (): VendorContextType => {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};