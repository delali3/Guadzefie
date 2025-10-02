// src/hooks/useVendorPerformance.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { VendorPerformanceMetrics } from '../types/vendor';

interface PerformanceCalculation {
  vendorId: string;
  salesPerformance: number;
  customerSatisfaction: number;
  productQuality: number;
  shippingPerformance: number;
  communicationScore: number;
  complianceScore: number;
  overallScore: number;
}

export const useVendorPerformance = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateSalesPerformance = async (vendorId: string, period: string = 'month'): Promise<number> => {
    try {
      // Get vendor's sales for the period
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

      // Get vendor's products
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .or(`farmer_id.eq.${vendorId},vendor_id.eq.${vendorId},owner_id.eq.${vendorId}`);

      if (!products || products.length === 0) return 0;

      const productIds = products.map(p => p.id);

      // Get orders for vendor's products in the period
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('quantity, price_at_purchase, orders!inner(created_at)')
        .in('product_id', productIds)
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString());

      const totalSales = orderItems?.reduce((sum, item) => sum + (item.quantity * item.price_at_purchase), 0) || 0;

      // Calculate performance based on sales volume and growth
      // This is a simplified calculation - in reality, you'd compare against targets, industry averages, etc.
      const performanceScore = Math.min(100, (totalSales / 100000) * 20); // 100k = 20 points, cap at 100

      return performanceScore;
    } catch (error) {
      console.error('Error calculating sales performance:', error);
      return 0;
    }
  };

  const calculateCustomerSatisfaction = async (vendorId: string): Promise<number> => {
    try {
      // Get vendor's products
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .or(`farmer_id.eq.${vendorId},vendor_id.eq.${vendorId},owner_id.eq.${vendorId}`);

      if (!products || products.length === 0) return 0;

      const productIds = products.map(p => p.id);

      // Get reviews for vendor's products
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .in('product_id', productIds);

      if (!reviews || reviews.length === 0) return 75; // Default score for no reviews

      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

      // Convert 5-star rating to 100-point scale
      return (averageRating / 5) * 100;
    } catch (error) {
      console.error('Error calculating customer satisfaction:', error);
      return 75;
    }
  };

  const calculateProductQuality = async (vendorId: string): Promise<number> => {
    try {
      // Get vendor's products with ratings
      const { data: products } = await supabase
        .from('products')
        .select('rating, return_rate')
        .or(`farmer_id.eq.${vendorId},vendor_id.eq.${vendorId},owner_id.eq.${vendorId}`);

      if (!products || products.length === 0) return 0;

      // Calculate average product rating
      const validRatings = products.filter(p => p.rating !== null).map(p => p.rating);
      const averageRating = validRatings.length > 0
        ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
        : 4; // Default rating

      // Factor in return rates (lower is better)
      const averageReturnRate = products.reduce((sum, p) => sum + (p.return_rate || 0), 0) / products.length;
      const returnPenalty = averageReturnRate * 20; // Each 1% return rate reduces score by 20

      const qualityScore = ((averageRating / 5) * 100) - returnPenalty;

      return Math.max(0, Math.min(100, qualityScore));
    } catch (error) {
      console.error('Error calculating product quality:', error);
      return 80;
    }
  };

  const calculateShippingPerformance = async (vendorId: string): Promise<number> => {
    try {
      // Get vendor's orders and their shipping performance
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .or(`farmer_id.eq.${vendorId},vendor_id.eq.${vendorId},owner_id.eq.${vendorId}`);

      if (!products || products.length === 0) return 0;

      const productIds = products.map(p => p.id);

      // Get recent orders (last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: orders } = await supabase
        .from('order_items')
        .select('orders!inner(created_at, status, estimated_delivery)')
        .in('product_id', productIds)
        .gte('orders.created_at', threeMonthsAgo.toISOString());

      if (!orders || orders.length === 0) return 85; // Default score

      // Calculate on-time delivery rate
      const deliveredOrders = orders.filter((order: any) => order.orders.status === 'delivered');
      const onTimeDeliveries = deliveredOrders.filter((order: any) => {
        if (!order.orders.estimated_delivery) return true; // Assume on time if no estimate
        const estimatedDate = new Date(order.orders.estimated_delivery);
        const currentDate = new Date();
        return currentDate <= estimatedDate;
      });

      const onTimeRate = deliveredOrders.length > 0 ? onTimeDeliveries.length / deliveredOrders.length : 0.85;

      return onTimeRate * 100;
    } catch (error) {
      console.error('Error calculating shipping performance:', error);
      return 85;
    }
  };

  const calculateCommunicationScore = async (vendorId: string): Promise<number> => {
    try {
      // In a real implementation, this would track:
      // - Response time to customer inquiries
      // - Proactive communication about order status
      // - Quality of product descriptions
      // - Responsiveness to admin requests

      // For now, return a baseline score based on account activity
      const { data: profile } = await supabase
        .from('vendor_profiles')
        .select('last_active, created_at')
        .eq('user_id', vendorId)
        .single();

      if (!profile) return 70;

      const lastActive = new Date(profile.last_active);
      const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

      // Reduce score based on inactivity
      let score = 90;
      if (daysSinceActive > 30) score -= 20;
      else if (daysSinceActive > 14) score -= 10;
      else if (daysSinceActive > 7) score -= 5;

      return Math.max(50, score);
    } catch (error) {
      console.error('Error calculating communication score:', error);
      return 80;
    }
  };

  const calculateComplianceScore = async (vendorId: string): Promise<number> => {
    try {
      // Check compliance factors:
      // - Complete profile information
      // - Up-to-date documentation
      // - Policy adherence
      // - Tax compliance

      const { data: application } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('user_id', vendorId)
        .single();

      if (!application) return 0;

      let score = 100;
      const requiredFields = [
        'business_name',
        'business_email',
        'business_phone',
        'business_description',
        'bank_account_info'
      ];

      // Check required fields
      for (const field of requiredFields) {
        if (!application[field] || (typeof application[field] === 'object' && Object.keys(application[field]).length === 0)) {
          score -= 15;
        }
      }

      // Check documents
      const documents = application.documents || {};
      if (!documents.business_license) score -= 20;
      if (!documents.tax_certificate) score -= 10;

      // Check if information is recent (within last year)
      const lastUpdated = new Date(application.updated_at);
      const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 365) score -= 15;

      return Math.max(0, score);
    } catch (error) {
      console.error('Error calculating compliance score:', error);
      return 85;
    }
  };

  const calculateOverallPerformance = async (vendorId: string, period: string = 'month'): Promise<PerformanceCalculation> => {
    setIsCalculating(true);
    setError(null);

    try {
      const [
        salesPerformance,
        customerSatisfaction,
        productQuality,
        shippingPerformance,
        communicationScore,
        complianceScore
      ] = await Promise.all([
        calculateSalesPerformance(vendorId, period),
        calculateCustomerSatisfaction(vendorId),
        calculateProductQuality(vendorId),
        calculateShippingPerformance(vendorId),
        calculateCommunicationScore(vendorId),
        calculateComplianceScore(vendorId)
      ]);

      // Weighted average for overall score
      const weights = {
        sales: 0.25,
        satisfaction: 0.20,
        quality: 0.20,
        shipping: 0.15,
        communication: 0.10,
        compliance: 0.10
      };

      const overallScore =
        salesPerformance * weights.sales +
        customerSatisfaction * weights.satisfaction +
        productQuality * weights.quality +
        shippingPerformance * weights.shipping +
        communicationScore * weights.communication +
        complianceScore * weights.compliance;

      return {
        vendorId,
        salesPerformance,
        customerSatisfaction,
        productQuality,
        shippingPerformance,
        communicationScore,
        complianceScore,
        overallScore: Math.round(overallScore)
      };
    } catch (error) {
      console.error('Error calculating overall performance:', error);
      setError('Failed to calculate performance metrics');
      throw error;
    } finally {
      setIsCalculating(false);
    }
  };

  const savePerformanceMetrics = async (performance: PerformanceCalculation): Promise<void> => {
    try {
      const metrics: Omit<VendorPerformanceMetrics, 'last_updated'> = {
        vendor_id: performance.vendorId,
        overall_score: performance.overallScore,
        sales_performance: performance.salesPerformance,
        customer_satisfaction: performance.customerSatisfaction,
        product_quality: performance.productQuality,
        shipping_performance: performance.shippingPerformance,
        communication_score: performance.communicationScore,
        compliance_score: performance.complianceScore
      };

      const { error } = await supabase
        .from('vendor_performance_metrics')
        .upsert({
          ...metrics,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'vendor_id'
        });

      if (error) throw error;

      // Also update the vendor profile with the new performance score
      await supabase
        .from('vendor_profiles')
        .update({
          performance_score: performance.overallScore,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', performance.vendorId);

    } catch (error) {
      console.error('Error saving performance metrics:', error);
      throw error;
    }
  };

  const updateAllVendorPerformance = async (): Promise<void> => {
    try {
      setIsCalculating(true);

      // Get all active vendors
      const { data: vendors } = await supabase
        .from('vendor_profiles')
        .select('user_id')
        .eq('status', 'active');

      if (!vendors) return;

      // Calculate performance for each vendor
      for (const vendor of vendors) {
        try {
          const performance = await calculateOverallPerformance(vendor.user_id);
          await savePerformanceMetrics(performance);
        } catch (error) {
          console.error(`Error updating performance for vendor ${vendor.user_id}:`, error);
          // Continue with other vendors
        }
      }
    } catch (error) {
      console.error('Error updating all vendor performance:', error);
      setError('Failed to update vendor performance metrics');
    } finally {
      setIsCalculating(false);
    }
  };

  return {
    calculateOverallPerformance,
    savePerformanceMetrics,
    updateAllVendorPerformance,
    isCalculating,
    error
  };
};