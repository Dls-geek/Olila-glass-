import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider, useToast } from './components/ui';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { BillingPage } from './components/BillingPage';
import { ProductsPage } from './components/ProductsPage';
import { InventoryPage } from './components/InventoryPage';
import { SalesPage } from './components/SalesPage';
import { cn } from './utils/cn';
import {
  LayoutDashboard,
  Utensils,
  Trash2,
  Truck,
  Users,
  ShoppingCart,
  Archive,
  Package,
  ShoppingBag,
  BarChart3,
  PieChart,
  Wallet,
  Landmark,
  UserCircle,
  User,
  Store,
  MessageSquare,
  Settings,
  ChevronRight,
  LogOut,
  Bell,
  Menu,
} from 'lucide-react';

type Page =
  | 'dashboard'
  | 'products'
  | 'addProduct'
  | 'inventory'
  | 'sales'
  | 'billing';

const parents = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' as Page },
  {
    id: 'food',
    label: 'Food Manage',
    icon: Utensils,
    children: [
      { label: 'Add Food', page: 'addProduct' as Page },
      { label: 'Food List', page: 'products' as Page },
      { label: 'Food Category', page: 'products' as Page },
      { label: 'Table', page: null },
      { label: 'Waiter', page: null },
    ],
  },
  {
    id: 'waste',
    label: 'Food Waste',
    icon: Trash2,
    children: [
      { label: 'Add Waste Food', page: null },
      { label: 'Waste Food List', page: null },
    ],
  },
  {
    id: 'supplier',
    label: 'Supplier',
    icon: Truck,
    children: [
      { label: 'Supplier List', page: null },
      { label: 'Due Received List', page: null },
      { label: 'Due Payment List', page: null },
    ],
  },
  {
    id: 'customer',
    label: 'Customer',
    icon: Users,
    children: [
      { label: 'Customer List', page: null },
      { label: 'Due Received List', page: null },
      { label: 'Customer Group', page: null },
      { label: 'Branches List', page: null },
    ],
  },
  {
    id: 'order',
    label: 'Order',
    icon: ShoppingCart,
    children: [
      { label: 'New Order', page: 'billing' as Page },
      { label: 'Token List', page: null },
      { label: 'Sale List', page: 'sales' as Page },
    ],
  },
  {
    id: 'trash',
    label: 'Trash Box',
    icon: Archive,
    children: [
      { label: 'Item Void List', page: null },
      { label: 'Token Trash List', page: null },
      { label: 'Sale Trash List', page: null },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    children: [
      { label: 'Product List', page: 'products' as Page },
      { label: 'Add Product', page: 'addProduct' as Page },
      { label: 'Unit', page: null },
      { label: 'Categories', page: null },
    ],
  },
  {
    id: 'purchase',
    label: 'Purchase',
    icon: ShoppingBag,
    children: [
      { label: 'Add Purchase', page: null },
      { label: 'Manage Purchase', page: null },
    ],
  },
  {
    id: 'stock',
    label: 'Stock',
    icon: BarChart3,
    children: [
      { label: 'Current Stock', page: 'inventory' as Page },
      { label: 'Stock Out', page: null },
      { label: 'Stock Out List', page: null },
      { label: 'Adjustment', page: null },
    ],
  },
  {
    id: 'report',
    label: 'Report',
    icon: PieChart,
    children: [
      { label: 'Profit / Loss Report', page: 'dashboard' as Page },
      { label: 'Master Sales Report', page: 'sales' as Page },
    ],
  },
  {
    id: 'expense',
    label: 'Expense',
    icon: Wallet,
    children: [
      { label: 'Expense List', page: null },
      { label: 'Expense Type', page: null },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: Landmark,
    children: [
      { label: 'Account List', page: null },
      { label: 'Balance Transfer', page: null },
    ],
  },
  {
    id: 'employee',
    label: 'Employee',
    icon: UserCircle,
    children: [{ label: 'Employee List', page: null }],
  },
  {
    id: 'user',
    label: 'User',
    icon: User,
    children: [
      { label: 'All User', page: null },
      { label: 'Create User', page: null },
    ],
  },
  {
    id: 'ecom',
    label: 'E-commerce',
    icon: Store,
    children: [{ label: 'E-commerce settings', page: null }],
  },
  {
    id: 'message',
    label: 'Message',
    icon: MessageSquare,
    children: [{ label: 'Send SMS', page: null }],
  },
  {
    id: 'setting',
    label: 'Setting',
    icon: Settings,
    children: [
      { label: 'Business Settings', page: null },
      { label: 'Print Settings', page: null },
    ],
  },
];

function Logo() {
  return (
    <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full border-[3px] border-[#00a65a] bg-white text-center text-[10px] font-bold leading-[1.1] text-[#008d4c]">
      অলিলা
      <br />
      গ্লাস
    </div>
  );
}

function MainApp() {
  const { user, logout } = useApp();
  const toast = useToast();
  const [page, setPage] = useState<Page>('dashboard');
  const [openMenus, setOpenMenus] = useState<string[]>(['food']);
  const [mobileNav, setMobileNav] = useState(false);

  if (!user) return <LoginPage />;

  if (page === 'billing') {
    return <BillingPage onBack={() => setPage('dashboard')} />;
  }

  const go = (next: Page | null) => {
    if (!next) {
      toast.info('This menu matches the original layout (coming soon).');
      return;
    }
    setPage(next);
    setMobileNav(false);
  };

  const toggle = (id: string) => {
    setOpenMenus((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#ebeff2]">
      {mobileNav && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}

      <header className="as-topbar">
        <div className="as-topbar-left">
          <button
            className="p-2 lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Logo />
        </div>
        <div className="as-topbar-right overflow-x-auto">
          <span className="hidden text-[13px] text-black sm:inline">
            Quick Links :
          </span>
          <button className="as-quick bg-[#00a65a]" onClick={() => go('dashboard')}>
            Expense
          </button>
          <button className="as-quick bg-[#20c997]" onClick={() => go('sales')}>
            Sale List
          </button>
          <button
            className="as-quick bg-[#f0ad4e] !text-[#212529]"
            onClick={() => go('inventory')}
          >
            Stock
          </button>
          <button className="as-quick bg-[#6f42c1]" onClick={() => go('products')}>
            Kitchen
          </button>
          <button className="as-quick bg-[#007bff]" onClick={() => go('dashboard')}>
            Today's Summary
          </button>
          <button className="as-quick bg-[#00a65a]" onClick={() => go('billing')}>
            Order
          </button>
          <div className="ml-2 flex items-center gap-2 border-l border-[#eee] pl-3">
            <Bell className="h-5 w-5 text-[#435966]" />
            <button
              onClick={logout}
              className="flex items-center gap-1 text-[13px] text-[#435966]"
            >
              <LogOut className="h-4 w-4" />
              {user.name}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            'as-side z-40 lg:block',
            mobileNav ? 'fixed bottom-0 left-0 top-[77px] block' : 'hidden lg:block'
          )}
          style={{ minHeight: 'calc(100vh - 77px)' }}
        >
          <nav className="pb-8" id="sidebar-menu">
            {parents.map((item) => {
              const Icon = item.icon;
              const opened = openMenus.includes(item.id);
              const isDash = item.id === 'dashboard';
              const activeParent =
                isDash && page === 'dashboard'
                  ? true
                  : item.children?.some((c) => c.page === page);
              return (
                <div key={item.id}>
                  <button
                    className={cn(
                      'as-nav',
                      isDash && page === 'dashboard' && 'active',
                      opened && !isDash && 'subdrop'
                    )}
                    onClick={() => {
                      if (isDash) go('dashboard');
                      else toggle(item.id);
                    }}
                  >
                    <Icon className="mr-[15px] ml-[3px] h-4 w-5" />
                    <span className="flex-1">{item.label}</span>
                    {!isDash && (
                      <ChevronRight
                        className={cn(
                          'h-4 w-4 text-[#98a6ad] transition-transform',
                          opened && 'rotate-90'
                        )}
                      />
                    )}
                  </button>
                  {item.children && (
                    <div className={cn('as-sub', opened && 'open')}>
                      {item.children.map((child) => (
                        <button
                          key={`${item.id}-${child.label}`}
                          className={cn(
                            child.page === page && activeParent && 'active'
                          )}
                          onClick={() => go(child.page)}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="as-content">
          {page === 'dashboard' && (
            <Dashboard onNavigate={(p) => go(p as Page)} />
          )}
          {page === 'products' && (
            <ProductsPage mode="list" onAdd={() => go('addProduct')} />
          )}
          {page === 'addProduct' && (
            <ProductsPage mode="form" onList={() => go('products')} />
          )}
          {page === 'inventory' && <InventoryPage />}
          {page === 'sales' && <SalesPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ToastProvider>
  );
}
