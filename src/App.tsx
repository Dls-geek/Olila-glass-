import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './components/ui';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { BillingPage } from './components/BillingPage';
import { ProductsPage } from './components/ProductsPage';
import { InventoryPage } from './components/InventoryPage';
import { SalesPage } from './components/SalesPage';
import { cn } from './utils/cn';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
  LogOut,
  Menu,
  User,
  Wallet,
  ListOrdered,
  Boxes,
  ChefHat,
  ClipboardList,
  ShoppingBag,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'billing', label: 'POS / Billing', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Stock', icon: BarChart3 },
  { id: 'sales', label: 'Sale List', icon: Receipt },
];

const quickLinks = [
  { id: 'expense', label: 'Expense', color: 'bg-[#28a745]', icon: Wallet, page: 'dashboard' },
  { id: 'sales', label: 'Sale List', color: 'bg-[#20c997]', icon: ListOrdered, page: 'sales' },
  { id: 'stock', label: 'Stock', color: 'bg-[#ffc107] text-[#212529]', icon: Boxes, page: 'inventory' },
  { id: 'kitchen', label: 'Kitchen', color: 'bg-[#6f42c1]', icon: ChefHat, page: 'products' },
  { id: 'summary', label: "Today's Summary", color: 'bg-[#007bff]', icon: ClipboardList, page: 'dashboard' },
  { id: 'order', label: 'Order', color: 'bg-[#28a745]', icon: ShoppingBag, page: 'billing' },
];

function MainApp() {
  const { user, logout } = useApp();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <LoginPage />;
  }

  if (currentPage === 'billing') {
    return <BillingPage onBack={() => setCurrentPage('dashboard')} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'products':
        return <ProductsPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'sales':
        return <SalesPage />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#e9ecef]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[210px] flex-col border-r border-[#dee2e6] bg-white lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col items-center gap-1 border-b border-[#f1f3f5] py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#28a745] bg-white text-[11px] font-bold leading-tight text-[#1e7e34]">
            অলিলা
            <br />
            গ্লাস
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 text-[13px]">
          {navItems.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-4 py-2.5 text-left',
                  active
                    ? 'bg-[#e8f5e9] font-medium text-[#1e7e34]'
                    : 'text-[#495057] hover:bg-[#f8f9fa]'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0 text-[#6c757d]" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#dee2e6] p-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e9ecef] text-xs font-semibold text-[#495057]">
              {(user.name || 'U').charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{user.name}</p>
              <p className="truncate text-[11px] capitalize text-[#6c757d]">
                {user.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-1 py-1.5 text-[13px] text-[#dc3545] hover:underline"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 bg-white px-3 py-2 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1.5 text-[#495057] hover:bg-[#f1f3f5] lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
            <span className="hidden text-[12px] text-[#6c757d] sm:inline">
              Quick Links :
            </span>
            {quickLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setCurrentPage(link.page)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-[3px] px-2 py-1 text-[12px] font-medium text-white',
                  link.color
                )}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </button>
            ))}
            <button
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#e9ecef] text-[#495057]"
              title={user.name}
            >
              <User className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-3 sm:p-4">{renderPage()}</main>
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
