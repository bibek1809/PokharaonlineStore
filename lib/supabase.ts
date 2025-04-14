import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Customer = {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  instagram_handle?: string
  tiktok_handle?: string
  notes?: string
  created_at: string
}

export type Product = {
  id: string
  name: string
  description?: string
  price: number
  cost_price: number
  quantity: number
  image_url?: string
  category?: string
  created_at: string
}

export type Sale = {
  id: string
  customer_id?: string
  customer?: Customer
  total_amount: number
  discount: number
  payment_method?: string
  sale_date: string
  nepali_month?: string
  nepali_year?: string
  notes?: string
  created_at: string
  items?: SaleItem[]
}

export type SaleItem = {
  id: string
  sale_id: string
  product_id: string
  product?: Product
  quantity: number
  price: number
  total: number
}

export type Expense = {
  id: string
  description: string
  amount: number
  expense_date: string
  nepali_month?: string
  nepali_year?: string
  category?: string
  created_at: string
}

export type StoreSettings = {
  id: string
  store_name: string
  store_address?: string
  store_phone?: string
  store_email?: string
  logo_url?: string
}
