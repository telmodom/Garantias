export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  image_url: string;
  store_name?: string;
  purchase_date?: string; // ISO 8601 YYYY-MM-DD
  qrcode_hash?: string;
  created_at: string;
}

export interface Product {
  id: string;
  invoice_id: string;
  name: string;
  warranty_months: number;
  warranty_end_date: string; // ISO 8601 YYYY-MM-DD
  is_active: boolean;
  created_at: string;

  // Joined fields (optional)
  invoice?: Invoice;
}
