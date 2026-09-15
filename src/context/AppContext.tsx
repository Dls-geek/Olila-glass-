import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from 'react';
import { Product, Sale, SaleItem, InventoryLog, CartItem, User } from '../types';
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
    options?: { discount?: number }
  ) => Promise<Sale | null>;
  adjustStock: (
    productId: string,
    quantity: number,
    change_type: 'add' | 'break'
  ) => Promise<boolean>;
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
    options?: { discount?: number }
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
