export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  created_at: string;
}

export interface ExpenseTypeRow {
  id: string;
  name: string;
  created_at: string;
}

export interface Expense {
  id: string;
  date: string;
  type: string;
  amount: number;
  notes?: string;
  created_at: string;
}

export type CashDirection = 'in' | 'out';

export type CashLedgerSource =
  | 'opening'
  | 'sale'
  | 'expense'
  | 'chalan'
  | 'manual';

export interface CashSettings {
  opening_balance: number;
  opening_date: string;
}

export interface CashLedgerEntry {
  id: string;
  date: string;
  direction: CashDirection;
  amount: number;
  note?: string;
  created_at: string;
}

export interface CashLedgerLine {
  id: string;
  date: string;
  direction: CashDirection;
  amount: number;
  source: CashLedgerSource;
  label: string;
  note?: string;
  balance: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  group: string;
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
  discount?: number;
  customer_name?: string;
  customer_phone?: string;
  payment_method?: string;
  paid_amount?: number;
  items: SaleItem[];
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export type BreakageReturnStatus = 'pending' | 'replaced';

export interface InventoryLog {
  id: string;
  product_id: string;
  product_name: string;
  change_type: 'add' | 'sell' | 'break';
  quantity: number;
  date: string;
  purchase_id?: string;
  /** Company receiving broken goods for replacement (break rows). */
  supplier?: string;
  /** Optional open chalan linked to this breakage return. */
  chalan_id?: string;
  /** pending = awaiting replacement; replaced = fully replaced; omitted = no company link. */
  return_status?: BreakageReturnStatus;
  /** Units already replaced by company (partial allowed). */
  replaced_qty?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

/** Company stock intake (bulk / CSV / purchase with optional receipt). */
export type PurchaseSource = 'manual' | 'bulk' | 'csv' | 'purchase';

export interface PurchaseItemInput {
  product_id: string;
  quantity: number;
}

export interface PurchaseResult {
  id: string;
  date: string;
  supplier?: string | null;
  notes?: string | null;
  receipt_url?: string | null;
  source: PurchaseSource;
  line_count: number;
  unit_count: number;
}

/** Company chalan (order) — pay separately (linked), receive partially, track paona. */
export type ChalanStatus = 'open' | 'partial' | 'closed' | 'cancelled';

export interface ChalanItem {
  id: number;
  chalan_id: string;
  product_id: string;
  product_name: string;
  sku?: string;
  ordered_qty: number;
  unit_rate: number;
  received_qty: number;
  remaining_qty: number;
}

export interface ChalanPayment {
  id: string;
  chalan_id: string;
  amount: number;
  paid_at: string;
  method?: string;
  receipt_url?: string;
  notes?: string;
}

export interface Chalan {
  id: string;
  date: string;
  supplier?: string;
  status: ChalanStatus;
  notes?: string;
  items: ChalanItem[];
  payments: ChalanPayment[];
  ordered_amount: number;
  paid_amount: number;
  ordered_units: number;
  received_units: number;
  remaining_units: number;
}
