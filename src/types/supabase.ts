// File: src/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number
          created_at: string
          updated_at: string
          name: string
          description: string
          price: number
          image_url: string
          category_id: number
          inventory_count: number
          featured: boolean
          farmer_id: string | null
          vendor_id: string | null
          owner_id: string | null
          rating: number | null
          discount_percentage: number | null
          sales_count: number
          sku: string | null
          weight: number | null
          dimensions: string | null
          tags: string[] | null
          brand: string | null
          is_organic: boolean | null
          harvest_date: string | null
          expiry_date: string | null
          shelf_life: number | null
          nutritional_info: Json | null
          certifications: string[] | null
          region_of_origin: string | null
          storage_instructions: string | null
          shipping_weight: number | null
          shipping_dimensions: string | null
          cost_price: number | null
          profit_margin: number | null
          min_order_quantity: number | null
          max_order_quantity: number | null
          units_sold: number | null
          views_count: number | null
          related_products: number[] | null
          is_featured_in_homepage: boolean | null
          is_available: boolean | null
          is_deleted: boolean | null
          seo_title: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          custom_fields: Json | null
          farming_method: string | null
          soil_type: string | null
          water_source: string | null
          growing_conditions: string | null
          pesticide_free: boolean | null
          non_gmo: boolean | null
          planting_date: string | null
          availability_schedule: Json | null
          farm_location: Json | null
          handling_instructions: string | null
          seasonal: boolean | null
          current_season: string | null
          production_capacity: number | null
          farm_distance: number | null
          freshness_guarantee: string | null
          cultivation_practices: string | null
          supply_consistency: string | null
          marketplace_status: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          updated_at?: string
          name: string
          description: string
          price: number
          image_url: string
          category_id: number
          inventory_count: number
          featured?: boolean
          farmer_id?: string | null
          vendor_id?: string | null
          owner_id?: string | null
          rating?: number | null
          discount_percentage?: number | null
          sales_count?: number
          sku?: string | null
          weight?: number | null
          dimensions?: string | null
          tags?: string[] | null
          brand?: string | null
          is_organic?: boolean | null
          harvest_date?: string | null
          expiry_date?: string | null
          shelf_life?: number | null
          nutritional_info?: Json | null
          certifications?: string[] | null
          region_of_origin?: string | null
          storage_instructions?: string | null
          shipping_weight?: number | null
          shipping_dimensions?: string | null
          cost_price?: number | null
          profit_margin?: number | null
          min_order_quantity?: number | null
          max_order_quantity?: number | null
          units_sold?: number | null
          views_count?: number | null
          related_products?: number[] | null
          is_featured_in_homepage?: boolean | null
          is_available?: boolean | null
          is_deleted?: boolean | null
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          custom_fields?: Json | null
          farming_method?: string | null
          soil_type?: string | null
          water_source?: string | null
          growing_conditions?: string | null
          pesticide_free?: boolean | null
          non_gmo?: boolean | null
          planting_date?: string | null
          availability_schedule?: Json | null
          farm_location?: Json | null
          handling_instructions?: string | null
          seasonal?: boolean | null
          current_season?: string | null
          production_capacity?: number | null
          farm_distance?: number | null
          freshness_guarantee?: string | null
          cultivation_practices?: string | null
          supply_consistency?: string | null
          marketplace_status?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          updated_at?: string
          name?: string
          description?: string
          price?: number
          image_url?: string
          category_id?: number
          inventory_count?: number
          featured?: boolean
          farmer_id?: string | null
          vendor_id?: string | null
          owner_id?: string | null
          rating?: number | null
          discount_percentage?: number | null
          sales_count?: number
          sku?: string | null
          weight?: number | null
          dimensions?: string | null
          tags?: string[] | null
          brand?: string | null
          is_organic?: boolean | null
          harvest_date?: string | null
          expiry_date?: string | null
          shelf_life?: number | null
          nutritional_info?: Json | null
          certifications?: string[] | null
          region_of_origin?: string | null
          storage_instructions?: string | null
          shipping_weight?: number | null
          shipping_dimensions?: string | null
          cost_price?: number | null
          profit_margin?: number | null
          min_order_quantity?: number | null
          max_order_quantity?: number | null
          units_sold?: number | null
          views_count?: number | null
          related_products?: number[] | null
          is_featured_in_homepage?: boolean | null
          is_available?: boolean | null
          is_deleted?: boolean | null
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          custom_fields?: Json | null
          farming_method?: string | null
          soil_type?: string | null
          water_source?: string | null
          growing_conditions?: string | null
          pesticide_free?: boolean | null
          non_gmo?: boolean | null
          planting_date?: string | null
          availability_schedule?: Json | null
          farm_location?: Json | null
          handling_instructions?: string | null
          seasonal?: boolean | null
          current_season?: string | null
          production_capacity?: number | null
          farm_distance?: number | null
          freshness_guarantee?: string | null
          cultivation_practices?: string | null
          supply_consistency?: string | null
          marketplace_status?: string | null
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          description: string | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
        }
      }
      orders: {
        Row: {
          id: number
          created_at: string
          user_id: string
          status: string
          total: number
          shipping_address: Json
          billing_address: Json | null
          payment_intent_id: string | null
          estimated_delivery: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          user_id: string
          status: string
          total: number
          shipping_address: Json
          billing_address?: Json | null
          payment_intent_id?: string | null
          estimated_delivery?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          user_id?: string
          status?: string
          total?: number
          shipping_address?: Json
          billing_address?: Json | null
          payment_intent_id?: string | null
          estimated_delivery?: string | null
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          product_id: number
          quantity: number
          price_at_purchase: number
        }
        Insert: {
          id?: number
          order_id: number
          product_id: number
          quantity: number
          price_at_purchase: number
        }
        Update: {
          id?: number
          order_id?: number
          product_id?: number
          quantity?: number
          price_at_purchase?: number
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
