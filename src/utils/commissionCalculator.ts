// src/utils/commissionCalculator.ts
import { supabase } from '../lib/supabase';
import { Commission } from '../types/vendor';

export interface CommissionTier {
  minSales: number;
  maxSales: number;
  rate: number;
  name: string;
}

export interface CommissionSettings {
  defaultRate: number;
  tiers: CommissionTier[];
  categoryRates: Record<string, number>;
  performanceBonus: {
    enabled: boolean;
    thresholds: Array<{
      performanceScore: number;
      bonusRate: number;
    }>;
  };
}

export class CommissionCalculator {
  private settings: CommissionSettings;

  constructor(settings?: CommissionSettings) {
    this.settings = settings || this.getDefaultSettings();
  }

  private getDefaultSettings(): CommissionSettings {
    return {
      defaultRate: 0.15, // 15%
      tiers: [
        { minSales: 0, maxSales: 100000, rate: 0.15, name: 'Bronze' },
        { minSales: 100001, maxSales: 500000, rate: 0.18, name: 'Silver' },
        { minSales: 500001, maxSales: 1000000, rate: 0.20, name: 'Gold' },
        { minSales: 1000001, maxSales: Infinity, rate: 0.25, name: 'Platinum' }
      ],
      categoryRates: {
        'Fruits & Vegetables': 0.12,
        'Grains & Cereals': 0.15,
        'Dairy Products': 0.18,
        'Meat & Poultry': 0.20,
        'Organic Products': 0.22,
        'Processed Foods': 0.16
      },
      performanceBonus: {
        enabled: true,
        thresholds: [
          { performanceScore: 90, bonusRate: 0.05 }, // 5% bonus
          { performanceScore: 95, bonusRate: 0.10 }  // 10% bonus
        ]
      }
    };
  }

  async calculateCommissionRate(
    vendorId: string,
    productId: number,
    saleAmount: number
  ): Promise<number> {
    try {
      // Get vendor's total sales for tier calculation
      const { data: totalSalesData } = await supabase
        .from('commissions')
        .select('sale_amount')
        .eq('vendor_id', vendorId)
        .eq('status', 'paid');

      const totalSales = totalSalesData?.reduce((sum, c) => sum + c.sale_amount, 0) || 0;

      // Get base rate from tier
      let baseRate = this.getTierRate(totalSales);

      // Get product category for category-specific rate
      const { data: product } = await supabase
        .from('products')
        .select('categories(name)')
        .eq('id', productId)
        .single();

      if (product?.categories?.name && this.settings.categoryRates[product.categories.name]) {
        baseRate = Math.max(baseRate, this.settings.categoryRates[product.categories.name]);
      }

      // Apply performance bonus if enabled
      if (this.settings.performanceBonus.enabled) {
        const performanceBonus = await this.getPerformanceBonus(vendorId);
        baseRate += performanceBonus;
      }

      return Math.min(baseRate, 0.30); // Cap at 30%
    } catch (error) {
      console.error('Error calculating commission rate:', error);
      return this.settings.defaultRate;
    }
  }

  private getTierRate(totalSales: number): number {
    const tier = this.settings.tiers.find(
      t => totalSales >= t.minSales && totalSales <= t.maxSales
    );
    return tier?.rate || this.settings.defaultRate;
  }

  private async getPerformanceBonus(vendorId: string): Promise<number> {
    try {
      const { data: metrics } = await supabase
        .from('vendor_performance_metrics')
        .select('overall_score')
        .eq('vendor_id', vendorId)
        .single();

      if (!metrics) return 0;

      const applicableBonus = this.settings.performanceBonus.thresholds
        .filter(t => metrics.overall_score >= t.performanceScore)
        .sort((a, b) => b.bonusRate - a.bonusRate)[0]; // Get highest applicable bonus

      return applicableBonus?.bonusRate || 0;
    } catch (error) {
      console.error('Error getting performance bonus:', error);
      return 0;
    }
  }

  async calculateCommission(
    vendorId: string,
    orderId: number,
    productId: number,
    saleAmount: number
  ): Promise<Omit<Commission, 'id' | 'created_at'>> {
    const commissionRate = await this.calculateCommissionRate(vendorId, productId, saleAmount);
    const commissionAmount = saleAmount * commissionRate;

    return {
      vendor_id: vendorId,
      order_id: orderId,
      product_id: productId,
      sale_amount: saleAmount,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      status: 'calculated'
    };
  }

  async processOrderCommissions(orderId: number): Promise<Commission[]> {
    try {
      // Get order items with product and vendor information
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            id,
            farmer_id,
            vendor_id,
            owner_id,
            categories (name)
          )
        `)
        .eq('order_id', orderId);

      if (error) throw error;

      const commissions: Commission[] = [];

      for (const item of orderItems || []) {
        const product = item.products;
        if (!product) continue;

        const vendorId = product.farmer_id || product.vendor_id || product.owner_id;
        if (!vendorId) continue;

        const saleAmount = item.price_at_purchase * item.quantity;

        const commissionData = await this.calculateCommission(
          vendorId,
          orderId,
          product.id,
          saleAmount
        );

        // Save commission to database
        const { data: savedCommission, error: commissionError } = await supabase
          .from('commissions')
          .insert(commissionData)
          .select()
          .single();

        if (commissionError) {
          console.error('Error saving commission:', commissionError);
          continue;
        }

        commissions.push(savedCommission);
      }

      return commissions;
    } catch (error) {
      console.error('Error processing order commissions:', error);
      throw error;
    }
  }

  getTierInfo(totalSales: number): CommissionTier | null {
    return this.settings.tiers.find(
      t => totalSales >= t.minSales && totalSales <= t.maxSales
    ) || null;
  }

  getNextTier(totalSales: number): { tier: CommissionTier; salesNeeded: number } | null {
    const currentTier = this.getTierInfo(totalSales);
    if (!currentTier) return null;

    const nextTier = this.settings.tiers.find(t => t.minSales > totalSales);
    if (!nextTier) return null;

    return {
      tier: nextTier,
      salesNeeded: nextTier.minSales - totalSales
    };
  }

  // Calculate projected commission for a vendor
  async getProjectedCommission(
    vendorId: string,
    projectedSales: number
  ): Promise<{
    currentRate: number;
    projectedRate: number;
    projectedCommission: number;
    potentialUpgrade: boolean;
    nextTierBonus?: number;
  }> {
    try {
      // Get current total sales
      const { data: currentCommissions } = await supabase
        .from('commissions')
        .select('sale_amount')
        .eq('vendor_id', vendorId)
        .eq('status', 'paid');

      const currentTotalSales = currentCommissions?.reduce((sum, c) => sum + c.sale_amount, 0) || 0;
      const newTotalSales = currentTotalSales + projectedSales;

      const currentRate = this.getTierRate(currentTotalSales);
      const projectedRate = this.getTierRate(newTotalSales);

      const projectedCommission = projectedSales * projectedRate;
      const potentialUpgrade = projectedRate > currentRate;

      let nextTierBonus = 0;
      if (potentialUpgrade) {
        const currentTierCommission = projectedSales * currentRate;
        nextTierBonus = projectedCommission - currentTierCommission;
      }

      return {
        currentRate,
        projectedRate,
        projectedCommission,
        potentialUpgrade,
        nextTierBonus: potentialUpgrade ? nextTierBonus : undefined
      };
    } catch (error) {
      console.error('Error calculating projected commission:', error);
      throw error;
    }
  }

  // Bulk recalculate commissions for a vendor (useful for rate changes)
  async recalculateVendorCommissions(
    vendorId: string,
    fromDate?: string
  ): Promise<{ updated: number; totalAdjustment: number }> {
    try {
      let query = supabase
        .from('commissions')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('status', 'calculated');

      if (fromDate) {
        query = query.gte('created_at', fromDate);
      }

      const { data: commissions, error } = await query;

      if (error) throw error;

      let updated = 0;
      let totalAdjustment = 0;

      for (const commission of commissions || []) {
        const newRate = await this.calculateCommissionRate(
          vendorId,
          commission.product_id,
          commission.sale_amount
        );

        const newAmount = commission.sale_amount * newRate;
        const adjustment = newAmount - commission.commission_amount;

        if (Math.abs(adjustment) > 0.01) { // Only update if difference is significant
          await supabase
            .from('commissions')
            .update({
              commission_rate: newRate,
              commission_amount: newAmount
            })
            .eq('id', commission.id);

          updated++;
          totalAdjustment += adjustment;
        }
      }

      return { updated, totalAdjustment };
    } catch (error) {
      console.error('Error recalculating vendor commissions:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const commissionCalculator = new CommissionCalculator();