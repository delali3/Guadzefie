// src/types/vendor.ts
export interface VendorApplication {
  id: string;
  user_id: string;
  business_name: string;
  business_type: 'farm' | 'manufacturer' | 'distributor' | 'retailer';
  business_registration_number?: string;
  tax_id?: string;
  business_email: string;
  business_phone: string;
  business_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  business_description: string;
  years_in_business: number;
  website_url?: string;
  social_media_links?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  product_categories: string[];
  estimated_monthly_sales: number;
  bank_account_info: {
    bank_name: string;
    account_number: string;
    routing_number: string;
    account_holder_name: string;
  };
  documents: {
    business_license?: string;
    tax_certificate?: string;
    insurance_certificate?: string;
    product_certifications?: string[];
  };
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  commission_rate?: number;
  approval_notes?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorProfile {
  id: string;
  user_id: string;
  application_id: string;
  business_name: string;
  business_type: string;
  status: 'active' | 'inactive' | 'suspended';
  commission_rate: number;
  total_sales: number;
  total_commission: number;
  total_products: number;
  rating: number;
  performance_score: number;
  joining_date: string;
  last_active: string;
  settings: {
    auto_approve_products: boolean;
    notification_preferences: {
      new_orders: boolean;
      low_stock: boolean;
      commission_updates: boolean;
      performance_reports: boolean;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  vendor_id: string;
  order_id: number;
  product_id: number;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'calculated' | 'paid' | 'disputed';
  calculated_at?: string;
  paid_at?: string;
  payout_id?: string;
  created_at: string;
}

export interface Payout {
  id: string;
  vendor_id: string;
  total_commission: number;
  commission_count: number;
  period_start: string;
  period_end: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method: 'bank_transfer' | 'paypal' | 'stripe' | 'check';
  payment_reference?: string;
  payment_fee: number;
  net_amount: number;
  processed_by?: string;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorAnalytics {
  vendor_id: string;
  period: string;
  total_sales: number;
  total_orders: number;
  total_commission: number;
  average_order_value: number;
  conversion_rate: number;
  return_rate: number;
  customer_satisfaction: number;
  top_selling_products: Array<{
    product_id: number;
    product_name: string;
    sales: number;
    revenue: number;
  }>;
  sales_by_category: Array<{
    category: string;
    sales: number;
    revenue: number;
  }>;
  monthly_performance: Array<{
    month: string;
    sales: number;
    orders: number;
    commission: number;
  }>;
}

export interface VendorPerformanceMetrics {
  vendor_id: string;
  overall_score: number;
  sales_performance: number;
  customer_satisfaction: number;
  product_quality: number;
  shipping_performance: number;
  communication_score: number;
  compliance_score: number;
  last_updated: string;
}