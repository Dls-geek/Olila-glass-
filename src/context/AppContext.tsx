import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Product, Sale, SaleItem, InventoryLog, CartItem, User } from '../types';

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
  completeSale: (customerName?: string, customerPhone?: string) => Sale | null;
  getCartTotal: () => number;
  getLowStockProducts: () => Product[];
  getDailySales: () => number;
  getMonthlySales: () => number;
  getTopProducts: () => { name: string; sales: number }[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Sample data
const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Glass Tumbler Set',
    category: 'Glassware',
    purchase_price: 150,
    selling_price: 299,
    stock: 45,
    low_stock_alert: 10,
    image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=200&h=200',
    sku: 'GLS-001',
    created_at: '2024-01-01',
  },
  {
    id: '2',
    name: 'Ceramic Bowl',
    category: 'Ceramic',
    purchase_price: 80,
    selling_price: 180,
    stock: 5,
    low_stock_alert: 10,
    image_url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&q=80&w=200&h=200',
    sku: 'CER-001',
    created_at: '2024-01-02',
  },
  {
    id: '3',
    name: 'Dinner Plate Set',
    category: 'Tableware',
    purchase_price: 200,
    selling_price: 450,
    stock: 25,
    low_stock_alert: 8,
    image_url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&q=80&w=200&h=200',
    sku: 'TAB-001',
    created_at: '2024-01-03',
  },
  {
    id: '4',
    name: 'Wine Glass',
    category: 'Glassware',
    purchase_price: 120,
    selling_price: 250,
    stock: 0,
    low_stock_alert: 5,
    image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=200&h=200',
    sku: 'GLS-002',
    created_at: '2024-01-04',
  },
  {
    id: '5',
    name: 'Ceramic Mug',
    category: 'Ceramic',
    purchase_price: 50,
    selling_price: 120,
    stock: 60,
    low_stock_alert: 15,
    image_url: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=200&h=200',
    sku: 'CER-002',
    created_at: '2024-01-05',
  },
  {
    id: '6',
    name: 'Cutlery Set',
    category: 'Tableware',
    purchase_price: 180,
    selling_price: 380,
    stock: 15,
    low_stock_alert: 5,
    image_url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&q=80&w=200&h=200',
    sku: 'TAB-002',
    created_at: '2024-01-06',
  },
];

const sampleSales: Sale[] = [
  {
    id: 'S1',
    date: '2024-01-15',
    total_amount: 899,
    customer_name: 'John Doe',
    customer_phone: '1234567890',
    items: [
      { product_id: '1', product_name: 'Glass Tumbler Set', quantity: 2, price: 299, subtotal: 598 },
      { product_id: '5', product_name: 'Ceramic Mug', quantity: 2, price: 120, subtotal: 240 },
    ],
  },
  {
    id: 'S2',
    date: '2024-01-14',
    total_amount: 450,
    customer_name: 'Jane Smith',
    items: [
      { product_id: '3', product_name: 'Dinner Plate Set', quantity: 1, price: 450, subtotal: 450 },
    ],
  },
];

const sampleLogs: InventoryLog[] = [
  { id: 'L1', product_id: '1', product_name: 'Glass Tumbler Set', change_type: 'add', quantity: 50, date: '2024-01-01' },
  { id: 'L2', product_id: '1', product_name: 'Glass Tumbler Set', change_type: 'sell', quantity: 2, date: '2024-01-15' },
  { id: 'L3', product_id: '3', product_name: 'Dinner Plate Set', change_type: 'add', quantity: 30, date: '2024-01-03' },
  { id: 'L4', product_id: '3', product_name: 'Dinner Plate Set', change_type: 'sell', quantity: 1, date: '2024-01-14' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    products: sampleProducts,
    sales: sampleSales,
    inventoryLogs: sampleLogs,
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    if (email && password.length >= 4) {
      const user: User = {
        id: '1',
        name: 'Shop Owner',
        email: email,
        role: 'admin',
      };
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_LOADING', payload: false });
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
      alert('Product is out of stock!');
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

  const completeSale = (customerName?: string, customerPhone?: string): Sale | null => {
    if (state.cart.length === 0) return null;

    // Check stock
    for (const item of state.cart) {
      if (item.quantity > item.product.stock) {
        alert(`Not enough stock for ${item.product.name}. Available: ${item.product.stock}`);
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

    const totalAmount = saleItems.reduce((sum, item) => sum + item.subtotal, 0);

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

  const getCartTotal = (): number => {
    return state.cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  };

  const getLowStockProducts = (): Product[] => {
    return state.products.filter(
      (p) => p.stock <= p.low_stock_alert && p.stock > 0
    );
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
