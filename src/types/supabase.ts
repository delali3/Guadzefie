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
          name: string
          description: string
          price: number
          image_url: string
          category_id: number
          inventory_count: number
          featured: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          description: string
          price: number
          image_url: string
          category_id: number
          inventory_count: number
          featured?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          description?: string
          price?: number
          image_url?: string
          category_id?: number
          inventory_count?: number
          featured?: boolean
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
