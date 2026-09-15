import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from 'react';
import { Product, Sale, SaleItem, InventoryLog, CartItem, User, StaffProfile, Expense, ExpenseType, PurchaseItemInput, PurchaseResult, PurchaseSource, Chalan, ChalanItem, ChalanPayment, ChalanStatus } from '../types';
import { useToast } from '../components/ui';
import { supabase } from '../lib/supabase';

interface AppState {
  user: User | null;
  products: Product[];
  sales: Sale[];
  inventoryLogs: InventoryLog[];
  cart: CartItem[];
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_SALES'; payload: Sale[] }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'SET_LOGS'; payload: InventoryLog[] }
  | { type: 'ADD_LOG'; payload: InventoryLog }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  user: null,
  products: [],
  sales: [],
  inventoryLogs: [],
  cart: [],
  isLoading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'ADD_SALE':
      return { ...state, sales: [action.payload, ...state.sales] };
    case 'SET_LOGS':
      return { ...state, inventoryLogs: action.payload };
    case 'ADD_LOG':
      return { ...state, inventoryLogs: [action.payload, ...state.inventoryLogs] };
    case 'ADD_TO_CART': {
      const existing = state.cart.find(
        (item) => item.product.id === action.payload.product.id
      );
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.product.id === action.payload.product.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return { ...state, cart: [...state.cart, action.payload] };
    }
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter((item) => item.product.id !== action.payload),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AppContextType extends AppState {
  dispatch: React.Dispatch<AppAction>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  completeSale: (
    customerName?: string,
    customerPhone?: string,
    options?: {
      discount?: number;
      paymentMethod?: string;
      paidAmount?: number;
    }
  ) => Promise<Sale | null>;
  adjustStock: (
    productId: string,
    quantity: number,
    change_type: 'add' | 'break'
  ) => Promise<boolean>;
  uploadPurchaseReceipt: (file: File) => Promise<string | null>;
  recordPurchase: (input: {
    items: PurchaseItemInput[];
    supplier?: string;
    notes?: string;
    receiptUrl?: string;
    source?: PurchaseSource;
    date?: string;
  }) => Promise<PurchaseResult | null>;
  listChalans: () => Promise<Chalan[]>;
  getChalan: (id: string) => Promise<Chalan | null>;
  createChalan: (input: {
    items: { product_id: string; quantity: number; unit_rate?: number }[];
    supplier?: string;
    notes?: string;
    date?: string;
  }) => Promise<{ id: string } | null>;
  addChalanPayment: (input: {
    chalanId: string;
    amount: number;
    method?: string;
    receiptUrl?: string;
    notes?: string;
    paidAt?: string;
  }) => Promise<boolean>;
  receiveChalan: (input: {
    chalanId: string;
    items: { product_id: string; quantity: number }[];
    notes?: string;
    deliveryPhotoUrl?: string;
    date?: string;
  }) => Promise<boolean>;
  listStaff: () => Promise<StaffProfile[]>;
  inviteStaff: (input: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'staff';
  }) => Promise<StaffProfile | null>;
  updateStaffRole: (id: string, role: 'admin' | 'staff') => Promise<boolean>;
  listExpenses: (range?: { from?: string; to?: string }) => Promise<Expense[]>;
  addExpense: (input: {
    date: string;
    type: ExpenseType;
    amount: number;
    notes?: string;
  }) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  getCartTotal: () => number;
  getLowStockProducts: () => Product[];
  getDailySales: () => number;
  getMonthlySales: () => number;
  getTopProducts: () => { name: string; sales: number }[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

type ProductRow = {
  id: string;
  name: string;
  category: string;
  group: string;
  purchase_price: number | string;
  selling_price: number | string;
  stock: number;
  low_stock_alert: number;
  image_url: string;
  sku: string | null;
  created_at: string;
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    group: row.group,
    purchase_price: Number(row.purchase_price),
    selling_price: Number(row.selling_price),
    stock: Number(row.stock),
    low_stock_alert: Number(row.low_stock_alert),
    image_url: row.image_url || '',
    sku: row.sku ?? undefined,
    created_at: String(row.created_at).slice(0, 10),
  };
}

function mapSale(
  row: {
    id: string;
    date: string;
    total_amount: number | string;
    discount?: number | string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    payment_method?: string | null;
    paid_amount?: number | string | null;
  },
  items: SaleItem[]
): Sale {
  return {
    id: row.id,
    date: String(row.date).slice(0, 10),
    total_amount: Number(row.total_amount),
    discount: row.discount != null ? Number(row.discount) : undefined,
    customer_name: row.customer_name ?? undefined,
    customer_phone: row.customer_phone ?? undefined,
    payment_method: row.payment_method ?? undefined,
    paid_amount:
      row.paid_amount != null ? Number(row.paid_amount) : undefined,
    items,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadShopData = async () => {
    const [productsRes, salesRes, itemsRes, logsRes] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('sale_items').select('*'),
      supabase
        .from('inventory_logs')
        .select('*')
        .order('date', { ascending: false })
        .limit(500),
    ]);

    if (productsRes.error) throw productsRes.error;
    if (salesRes.error) throw salesRes.error;
    if (itemsRes.error) throw itemsRes.error;
    if (logsRes.error) throw logsRes.error;

    const itemsBySale = new Map<string, SaleItem[]>();
    for (const row of itemsRes.data || []) {
      const list = itemsBySale.get(row.sale_id) || [];
      list.push({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: Number(row.quantity),
        price: Number(row.price),
        subtotal: Number(row.subtotal),
      });
      itemsBySale.set(row.sale_id, list);
    }

    dispatch({
      type: 'SET_PRODUCTS',
      payload: (productsRes.data || []).map((r) => mapProduct(r as ProductRow)),
    });
    dispatch({
      type: 'SET_SALES',
      payload: (salesRes.data || []).map((s) =>
        mapSale(s, itemsBySale.get(s.id) || [])
      ),
    });
    dispatch({
      type: 'SET_LOGS',
      payload: (logsRes.data || []).map((l) => ({
        id: l.id,
        product_id: l.product_id,
        product_name: l.product_name,
        change_type: l.change_type as InventoryLog['change_type'],
        quantity: Number(l.quantity),
        date: String(l.date).slice(0, 10),
        purchase_id: l.purchase_id ?? undefined,
      })),
    });
  };

  const resolveUser = async (authUser: {
    id: string;
    email?: string | null;
  }): Promise<User> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', authUser.id)
      .maybeSingle();

    return {
      id: authUser.id,
      email: authUser.email || '',
      name: profile?.name || 'Shop Owner',
      role: (profile?.role as User['role']) || 'admin',
    };
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session?.user) {
        try {
          const user = await resolveUser(data.session.user);
          if (!mounted) return;
          dispatch({ type: 'SET_USER', payload: user });
          await loadShopData();
        } catch (err) {
          console.error(err);
          toast.error('Could not load shop data from Supabase.');
        }
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
      if (mounted) dispatch({ type: 'SET_LOADING', payload: false });
    };

    void boot();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      if (!session?.user) {
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_PRODUCTS', payload: [] });
        dispatch({ type: 'SET_SALES', payload: [] });
        dispatch({ type: 'SET_LOGS', payload: [] });
        dispatch({ type: 'CLEAR_CART' });
        return;
      }
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const user = await resolveUser(session.user);
        dispatch({ type: 'SET_USER', payload: user });
        await loadShopData();
      } catch (err) {
        console.error(err);
        toast.error('Could not load shop data from Supabase.');
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.error(error.message || 'Login failed.');
      return false;
    }
    toast.success('Welcome to Olila Glass.');
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'CLEAR_CART' });
  };

  const addProduct = async (product: Omit<Product, 'id' | 'created_at'>) => {
    const id = product.sku?.trim() || String(Date.now());
    const created_at = new Date().toISOString().slice(0, 10);
    const row = {
      id,
      name: product.name,
      category: product.category,
      group: product.group,
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      stock: product.stock,
      low_stock_alert: product.low_stock_alert,
      image_url: product.image_url,
      sku: product.sku || null,
      created_at,
    };
    const { data, error } = await supabase
      .from('products')
      .insert(row)
      .select('*')
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    const newProduct = mapProduct(data as ProductRow);
    dispatch({ type: 'ADD_PRODUCT', payload: newProduct });

    if (newProduct.stock > 0) {
      const log: InventoryLog = {
        id: 'L' + Date.now(),
        product_id: newProduct.id,
        product_name: newProduct.name,
        change_type: 'add',
        quantity: newProduct.stock,
        date: created_at,
      };
      const { error: logError } = await supabase.from('inventory_logs').insert(log);
      if (!logError) dispatch({ type: 'ADD_LOG', payload: log });
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    const existing = state.products.find((p) => p.id === id);
    if (!existing) return;
    const next = { ...existing, ...product };
    const { data, error } = await supabase
      .from('products')
      .update({
        name: next.name,
        category: next.category,
        group: next.group,
        purchase_price: next.purchase_price,
        selling_price: next.selling_price,
        stock: next.stock,
        low_stock_alert: next.low_stock_alert,
        image_url: next.image_url,
        sku: next.sku || null,
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    dispatch({ type: 'UPDATE_PRODUCT', payload: mapProduct(data as ProductRow) });
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stock <= 0) {
      toast.warning(`${product.name} is out of stock.`);
      return;
    }
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, quantity } });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const completeSale = async (
    customerName?: string,
    customerPhone?: string,
    options?: {
      discount?: number;
      paymentMethod?: string;
      paidAmount?: number;
    }
  ): Promise<Sale | null> => {
    if (state.cart.length === 0) return null;

    for (const item of state.cart) {
      if (item.quantity > item.product.stock) {
        toast.error(
          `Not enough stock for ${item.product.name}. Available: ${item.product.stock}.`
        );
        return null;
      }
    }

    const items = state.cart.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    }));

    const { data, error } = await supabase.rpc('complete_sale', {
      p_customer_name: customerName ?? null,
      p_customer_phone: customerPhone ?? null,
      p_discount: options?.discount ?? 0,
      p_items: items,
      p_payment_method: options?.paymentMethod ?? 'Cash',
      p_paid_amount:
        options?.paidAmount != null && Number.isFinite(options.paidAmount)
          ? options.paidAmount
          : null,
    });

    if (error) {
      toast.error(error.message);
      return null;
    }

    const payload = data as {
      id: string;
      date: string;
      total_amount: number;
      discount?: number;
      customer_name?: string | null;
      customer_phone?: string | null;
      payment_method?: string | null;
      paid_amount?: number | null;
      items: SaleItem[];
    };

    const sale = mapSale(payload, payload.items || []);
    dispatch({ type: 'ADD_SALE', payload: sale });

    for (const item of state.cart) {
      const product = state.products.find((p) => p.id === item.product.id);
      if (product) {
        dispatch({
          type: 'UPDATE_PRODUCT',
          payload: { ...product, stock: product.stock - item.quantity },
        });
      }
      dispatch({
        type: 'ADD_LOG',
        payload: {
          id: 'L' + Date.now() + item.product.id,
          product_id: item.product.id,
          product_name: item.product.name,
          change_type: 'sell',
          quantity: item.quantity,
          date: sale.date,
        },
      });
    }

    clearCart();
    return sale;
  };

  const adjustStock = async (
    productId: string,
    quantity: number,
    change_type: 'add' | 'break'
  ): Promise<boolean> => {
    const product = state.products.find((p) => p.id === productId);
    const qty = Math.floor(Number(quantity));
    if (!product || qty <= 0) {
      toast.warning('Enter a valid quantity.');
      return false;
    }
    if (change_type === 'break' && qty > product.stock) {
      toast.error(`Only ${product.stock} of ${product.name} on hand.`);
      return false;
    }
    const next =
      change_type === 'add' ? product.stock + qty : product.stock - qty;

    const { data, error } = await supabase
      .from('products')
      .update({ stock: next })
      .eq('id', productId)
      .select('*')
      .single();
    if (error) {
      toast.error(error.message);
      return false;
    }

    const log: InventoryLog = {
      id: 'L' + Date.now() + productId,
      product_id: product.id,
      product_name: product.name,
      change_type,
      quantity: qty,
      date: new Date().toISOString().slice(0, 10),
    };
    const { error: logError } = await supabase.from('inventory_logs').insert(log);
    if (logError) {
      toast.error(logError.message);
      return false;
    }

    dispatch({ type: 'UPDATE_PRODUCT', payload: mapProduct(data as ProductRow) });
    dispatch({ type: 'ADD_LOG', payload: log });
    toast.success(
      change_type === 'add'
        ? `Restocked ${qty} × ${product.name}.`
        : `Recorded ${qty} broken ${product.name}.`
    );
    return true;
  };

  const uploadPurchaseReceipt = async (file: File): Promise<string | null> => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];
    if (!allowed.includes(file.type)) {
      toast.warning('Upload a JPG, PNG, WebP, GIF, or PDF receipt.');
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.warning('Receipt must be under 10 MB.');
      return null;
    }
    const ext =
      file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ||
      'bin';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from('purchase-receipts')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from('purchase-receipts').getPublicUrl(path);
    return data.publicUrl;
  };

  const recordPurchase = async (input: {
    items: PurchaseItemInput[];
    supplier?: string;
    notes?: string;
    receiptUrl?: string;
    source?: PurchaseSource;
    date?: string;
  }): Promise<PurchaseResult | null> => {
    const items = input.items
      .map((i) => ({
        product_id: String(i.product_id).trim(),
        quantity: Math.floor(Number(i.quantity)),
      }))
      .filter((i) => i.product_id && i.quantity > 0);

    if (items.length === 0) {
      toast.warning('Add at least one product with quantity.');
      return null;
    }

    const { data, error } = await supabase.rpc('record_purchase', {
      p_items: items,
      p_supplier: input.supplier?.trim() || null,
      p_notes: input.notes?.trim() || null,
      p_receipt_url: input.receiptUrl?.trim() || null,
      p_source: input.source || 'purchase',
      p_date: input.date || new Date().toISOString().slice(0, 10),
    });

    if (error) {
      toast.error(error.message);
      return null;
    }

    try {
      await loadShopData();
    } catch (err) {
      console.error(err);
      toast.warning('Stock saved, but refresh the page to reload lists.');
    }

    const result = data as PurchaseResult;
    toast.success(
      `Stock intake ${result.id}: +${result.unit_count} units across ${result.line_count} items.`
    );
    return result;
  };

  const mapChalanBundle = (
    row: {
      id: string;
      date: string;
      supplier?: string | null;
      status: string;
      notes?: string | null;
    },
    items: {
      id: number;
      chalan_id: string;
      product_id: string;
      product_name: string;
      sku?: string | null;
      ordered_qty: number;
      unit_rate: number | string;
      received_qty: number;
    }[],
    payments: {
      id: string;
      chalan_id: string;
      amount: number | string;
      paid_at: string;
      method?: string | null;
      receipt_url?: string | null;
      notes?: string | null;
    }[]
  ): Chalan => {
    const mappedItems: ChalanItem[] = items.map((i) => {
      const ordered = Number(i.ordered_qty);
      const received = Number(i.received_qty);
      return {
        id: Number(i.id),
        chalan_id: i.chalan_id,
        product_id: i.product_id,
        product_name: i.product_name,
        sku: i.sku ?? undefined,
        ordered_qty: ordered,
        unit_rate: Number(i.unit_rate),
        received_qty: received,
        remaining_qty: Math.max(0, ordered - received),
      };
    });
    const mappedPayments: ChalanPayment[] = payments.map((p) => ({
      id: p.id,
      chalan_id: p.chalan_id,
      amount: Number(p.amount),
      paid_at: String(p.paid_at).slice(0, 10),
      method: p.method ?? undefined,
      receipt_url: p.receipt_url ?? undefined,
      notes: p.notes ?? undefined,
    }));
    return {
      id: row.id,
      date: String(row.date).slice(0, 10),
      supplier: row.supplier ?? undefined,
      status: row.status as ChalanStatus,
      notes: row.notes ?? undefined,
      items: mappedItems,
      payments: mappedPayments,
      ordered_amount: mappedItems.reduce(
        (s, i) => s + i.ordered_qty * i.unit_rate,
        0
      ),
      paid_amount: mappedPayments.reduce((s, p) => s + p.amount, 0),
      ordered_units: mappedItems.reduce((s, i) => s + i.ordered_qty, 0),
      received_units: mappedItems.reduce((s, i) => s + i.received_qty, 0),
      remaining_units: mappedItems.reduce((s, i) => s + i.remaining_qty, 0),
    };
  };

  const listChalans = async (): Promise<Chalan[]> => {
    const { data: chalans, error } = await supabase
      .from('chalans')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(error.message);
      return [];
    }
    const ids = (chalans || []).map((c) => c.id);
    if (ids.length === 0) return [];

    const [itemsRes, payRes] = await Promise.all([
      supabase.from('chalan_items').select('*').in('chalan_id', ids),
      supabase.from('chalan_payments').select('*').in('chalan_id', ids),
    ]);
    if (itemsRes.error) toast.error(itemsRes.error.message);
    if (payRes.error) toast.error(payRes.error.message);

    const itemsBy = new Map<string, typeof itemsRes.data>();
    for (const row of itemsRes.data || []) {
      const list = itemsBy.get(row.chalan_id) || [];
      list.push(row);
      itemsBy.set(row.chalan_id, list);
    }
    const payBy = new Map<string, typeof payRes.data>();
    for (const row of payRes.data || []) {
      const list = payBy.get(row.chalan_id) || [];
      list.push(row);
      payBy.set(row.chalan_id, list);
    }

    return (chalans || []).map((c) =>
      mapChalanBundle(c, itemsBy.get(c.id) || [], payBy.get(c.id) || [])
    );
  };

  const getChalan = async (id: string): Promise<Chalan | null> => {
    const { data, error } = await supabase
      .from('chalans')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      toast.error(error.message);
      return null;
    }
    if (!data) return null;
    const [itemsRes, payRes] = await Promise.all([
      supabase.from('chalan_items').select('*').eq('chalan_id', id),
      supabase
        .from('chalan_payments')
        .select('*')
        .eq('chalan_id', id)
        .order('paid_at', { ascending: false }),
    ]);
    if (itemsRes.error || payRes.error) {
      toast.error(itemsRes.error?.message || payRes.error?.message || 'Load failed');
      return null;
    }
    return mapChalanBundle(data, itemsRes.data || [], payRes.data || []);
  };

  const createChalan = async (input: {
    items: { product_id: string; quantity: number; unit_rate?: number }[];
    supplier?: string;
    notes?: string;
    date?: string;
  }): Promise<{ id: string } | null> => {
    const items = input.items
      .map((i) => ({
        product_id: String(i.product_id).trim(),
        quantity: Math.floor(Number(i.quantity)),
        unit_rate:
          i.unit_rate === undefined ? undefined : Number(i.unit_rate),
      }))
      .filter((i) => i.product_id && i.quantity > 0);
    if (items.length === 0) {
      toast.warning('Add at least one chalan line.');
      return null;
    }
    const { data, error } = await supabase.rpc('create_chalan', {
      p_items: items,
      p_supplier: input.supplier?.trim() || null,
      p_notes: input.notes?.trim() || null,
      p_date: input.date || new Date().toISOString().slice(0, 10),
    });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const id = (data as { id: string }).id;
    toast.success(`Chalan ${id} created. Add payment when you pay the company.`);
    return { id };
  };

  const addChalanPayment = async (input: {
    chalanId: string;
    amount: number;
    method?: string;
    receiptUrl?: string;
    notes?: string;
    paidAt?: string;
  }): Promise<boolean> => {
    const amount = Number(input.amount);
    if (!(amount > 0)) {
      toast.warning('Enter a payment amount.');
      return false;
    }
    const { error } = await supabase.rpc('add_chalan_payment', {
      p_chalan_id: input.chalanId,
      p_amount: amount,
      p_method: input.method || 'Cash',
      p_receipt_url: input.receiptUrl || null,
      p_notes: input.notes || null,
      p_paid_at: input.paidAt || new Date().toISOString().slice(0, 10),
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success(`Payment ৳${amount.toLocaleString()} linked to ${input.chalanId}.`);
    return true;
  };

  const receiveChalan = async (input: {
    chalanId: string;
    items: { product_id: string; quantity: number }[];
    notes?: string;
    deliveryPhotoUrl?: string;
    date?: string;
  }): Promise<boolean> => {
    const items = input.items
      .map((i) => ({
        product_id: String(i.product_id).trim(),
        quantity: Math.floor(Number(i.quantity)),
      }))
      .filter((i) => i.product_id && i.quantity > 0);
    if (items.length === 0) {
      toast.warning('Enter receive quantities.');
      return false;
    }
    const { data, error } = await supabase.rpc('receive_chalan', {
      p_chalan_id: input.chalanId,
      p_items: items,
      p_notes: input.notes || null,
      p_delivery_photo_url: input.deliveryPhotoUrl || null,
      p_date: input.date || new Date().toISOString().slice(0, 10),
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    try {
      await loadShopData();
    } catch (err) {
      console.error(err);
    }
    const unitCount = (data as { unit_count?: number })?.unit_count ?? 0;
    toast.success(`Received +${unitCount} units against ${input.chalanId}.`);
    return true;
  };

  const getCartTotal = (): number => {
    return state.cart.reduce(
      (sum, item) => sum + item.product.selling_price * item.quantity,
      0
    );
  };

  const getLowStockProducts = (): Product[] => {
    return state.products
      .filter((p) => p.stock <= p.low_stock_alert)
      .sort((a, b) => a.stock - b.stock);
  };

  const getDailySales = (): number => {
    const today = new Date().toISOString().split('T')[0];
    return state.sales
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.total_amount, 0);
  };

  const getMonthlySales = (): number => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return state.sales
      .filter((s) => {
        const saleDate = new Date(s.date);
        return (
          saleDate.getMonth() === currentMonth &&
          saleDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, s) => sum + s.total_amount, 0);
  };

  const getTopProducts = (): { name: string; sales: number }[] => {
    const productSales: Record<string, number> = {};
    state.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        productSales[item.product_name] =
          (productSales[item.product_name] || 0) + item.quantity;
      });
    });
    return Object.entries(productSales)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  };

  const listStaff = async (): Promise<StaffProfile[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: true });
    if (error) {
      toast.error(error.message);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id as string,
      name: (row.name as string) || 'Staff',
      email: (row.email as string) || '',
      role: (row.role as StaffProfile['role']) || 'staff',
      created_at: String(row.created_at),
    }));
  };

  const inviteStaff = async (input: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'staff';
  }): Promise<StaffProfile | null> => {
    const { data, error } = await supabase.functions.invoke('invite-staff', {
      body: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        role: input.role,
      },
    });
    if (error) {
      toast.error(error.message || 'Invite failed.');
      return null;
    }
    const payload = data as {
      error?: string;
      user?: { id: string; email: string; name: string; role: string };
    };
    if (payload?.error) {
      toast.error(payload.error);
      return null;
    }
    if (!payload?.user) {
      toast.error('Invite failed.');
      return null;
    }
    return {
      id: payload.user.id,
      name: payload.user.name,
      email: payload.user.email,
      role: payload.user.role === 'admin' ? 'admin' : 'staff',
      created_at: new Date().toISOString(),
    };
  };

  const updateStaffRole = async (
    id: string,
    role: 'admin' | 'staff'
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  };

  const listExpenses = async (range?: {
    from?: string;
    to?: string;
  }): Promise<Expense[]> => {
    let q = supabase
      .from('expenses')
      .select('id, date, type, amount, notes, created_at')
      .order('date', { ascending: false });
    if (range?.from) q = q.gte('date', range.from);
    if (range?.to) q = q.lte('date', range.to);
    const { data, error } = await q;
    if (error) {
      toast.error(error.message);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id as string,
      date: String(row.date).slice(0, 10),
      type: row.type as ExpenseType,
      amount: Number(row.amount),
      notes: (row.notes as string | null) || undefined,
      created_at: String(row.created_at),
    }));
  };

  const addExpense = async (input: {
    date: string;
    type: ExpenseType;
    amount: number;
    notes?: string;
  }): Promise<boolean> => {
    const id = `E${Date.now()}`;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from('expenses').insert({
      id,
      date: input.date,
      type: input.type,
      amount: input.amount,
      notes: input.notes || null,
      created_by: user?.id ?? null,
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        dispatch,
        login,
        logout,
        addProduct,
        updateProduct,
        deleteProduct,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        completeSale,
        adjustStock,
        uploadPurchaseReceipt,
        recordPurchase,
        listChalans,
        getChalan,
        createChalan,
        addChalanPayment,
        receiveChalan,
        listStaff,
        inviteStaff,
        updateStaffRole,
        listExpenses,
        addExpense,
        deleteExpense,
        getCartTotal,
        getLowStockProducts,
        getDailySales,
        getMonthlySales,
        getTopProducts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
