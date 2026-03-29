export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  low_stock_alert: number;
  image_url: string;
  sku?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  date: string;
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  items: SaleItem[];
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  product_name: string;
  change_type: 'add' | 'sell';
  quantity: number;
  date: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
