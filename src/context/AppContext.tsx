import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Product, Sale, SaleItem, InventoryLog, CartItem, User } from '../types';
import { masterProducts } from '../data/masterProducts';
import { useToast } from '../components/ui';

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
  isLoading: false,
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
    case 'ADD_TO_CART':
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
  logout: () => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  completeSale: (
    customerName?: string,
    customerPhone?: string,
    options?: { discount?: number }
  ) => Sale | null;
  adjustStock: (
    productId: string,
    quantity: number,
    change_type: 'add' | 'break'
  ) => boolean;
  getCartTotal: () => number;
  getLowStockProducts: () => Product[];
  getDailySales: () => number;
  getMonthlySales: () => number;
  getTopProducts: () => { name: string; sales: number }[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    products: masterProducts,
    sales: [],
    inventoryLogs: [],
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (email.trim() && password.length >= 4) {
      const user: User = {
        id: '1',
        name: 'Shop Owner',
        email: email.trim(),
        role: 'admin',
      };
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_LOADING', payload: false });
      toast.success('Welcome to Olila Glass.');
      return true;
    }
    dispatch({ type: 'SET_LOADING', payload: false });
    return false;
  };

  const logout = () => {
    dispatch({ type: 'SET_USER', payload: null });
  };

  const addProduct = (product: Omit<Product, 'id' | 'created_at'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      created_at: new Date().toISOString().split('T')[0],
    };
    dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
    
    const log: InventoryLog = {
      id: Date.now().toString(),
      product_id: newProduct.id,
      product_name: newProduct.name,
      change_type: 'add',
      quantity: newProduct.stock,
      date: new Date().toISOString().split('T')[0],
    };
    dispatch({ type: 'ADD_LOG', payload: log });
  };

  const updateProduct = (id: string, product: Partial<Product>) => {
    const existingProduct = state.products.find((p) => p.id === id);
    if (existingProduct) {
      dispatch({
        type: 'UPDATE_PRODUCT',
        payload: { ...existingProduct, ...product },
      });
    }
  };

  const deleteProduct = (id: string) => {
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

  const completeSale = (
    customerName?: string,
    customerPhone?: string,
    options?: { discount?: number }
  ): Sale | null => {
    if (state.cart.length === 0) return null;

    for (const item of state.cart) {
      if (item.quantity > item.product.stock) {
        toast.error(
          `Not enough stock for ${item.product.name}. Available: ${item.product.stock}.`
        );
        return null;
      }
    }

    const saleItems: SaleItem[] = state.cart.map((item) => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      price: item.product.selling_price,
      subtotal: item.product.selling_price * item.quantity,
    }));

    const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = Math.max(0, Math.min(options?.discount ?? 0, subtotal));
    const totalAmount = Math.max(0, subtotal - discount);

    const sale: Sale = {
      id: 'S' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      total_amount: totalAmount,
      customer_name: customerName,
      customer_phone: customerPhone,
      items: saleItems,
    };

    dispatch({ type: 'ADD_SALE', payload: sale });

    // Update stock and create logs
    state.cart.forEach((item) => {
      const newStock = item.product.stock - item.quantity;
      updateProduct(item.product.id, { stock: newStock });

      const log: InventoryLog = {
        id: 'L' + Date.now() + item.product.id,
        product_id: item.product.id,
        product_name: item.product.name,
        change_type: 'sell',
        quantity: item.quantity,
        date: new Date().toISOString().split('T')[0],
      };
      dispatch({ type: 'ADD_LOG', payload: log });
    });

    clearCart();
    return sale;
  };

  const adjustStock = (
    productId: string,
    quantity: number,
    change_type: 'add' | 'break'
  ): boolean => {
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
    dispatch({
      type: 'UPDATE_PRODUCT',
      payload: { ...product, stock: next },
    });
    dispatch({
      type: 'ADD_LOG',
      payload: {
        id: 'L' + Date.now() + productId,
        product_id: product.id,
        product_name: product.name,
        change_type,
        quantity: qty,
        date: new Date().toISOString().split('T')[0],
      },
    });
    toast.success(
      change_type === 'add'
        ? `Restocked ${qty} × ${product.name}.`
        : `Recorded ${qty} broken ${product.name}.`
    );
    return true;
  };

  const getCartTotal = (): number => {
    return state.cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
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
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      })
      .reduce((sum, s) => sum + s.total_amount, 0);
  };

  const getTopProducts = (): { name: string; sales: number }[] => {
    const productSales: Record<string, number> = {};
    state.sales.forEach((sale) => {
      sale.items.forEach((item) => {
        productSales[item.product_name] = (productSales[item.product_name] || 0) + item.quantity;
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
