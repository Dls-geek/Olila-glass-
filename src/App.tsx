import { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider, useToast } from './components/ui';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { BillingPage } from './components/BillingPage';
import { ProductsPage } from './components/ProductsPage';
import { InventoryPage } from './components/InventoryPage';
import { SalesPage } from './components/SalesPage';
import { BreakagePage } from './components/BreakagePage';
import { ChalanPage } from './components/ChalanPage';
import { StaffPage } from './components/StaffPage';
import { TopSellingPage } from './components/TopSellingPage';
import { ProfitLossPage } from './components/ProfitLossPage';
import { ExpensePage } from './components/ExpensePage';
import { CashLedgerPage } from './components/CashLedgerPage';
import {
  SalesHub,
  CatalogHub,
  InventoryHub,
  PurchaseHub,
  ReportsHub,
  ExpenseHub,
  SettingsHub,
} from './components/ModuleHubs';
import { cn } from './utils/cn';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Truck,
  PieChart,
  Wallet,
  Settings,
  ChevronRight,
  LogOut,
  Menu,
  UserCircle,
} from 'lucide-react';

type Page =
  | 'dashboard'
  | 'salesHome'
  | 'catalogHome'
  | 'inventoryHome'
  | 'purchaseHome'
  | 'reportsHome'
  | 'expenseHome'
  | 'settingsHome'
  | 'products'
  | 'addProduct'
  | 'inventory'
  | 'sales'
  | 'billing'
  | 'breakage'
  | 'chalan'
  | 'chalanNew'
  | 'chalanPaona'
  | 'stockBulk'
  | 'stockCsv'
  | 'stockPurchase'
  | 'staff'
  | 'topSelling'
  | 'profitLoss'
  | 'expenses'
  | 'cashLedger';

const HASH_PAGES: Page[] = [
  'dashboard',
  'salesHome',
  'catalogHome',
  'inventoryHome',
  'purchaseHome',
  'reportsHome',
  'expenseHome',
  'settingsHome',
  'products',
  'addProduct',
  'inventory',
  'sales',
  'billing',
  'breakage',
  'chalan',
  'chalanNew',
  'chalanPaona',
  'stockBulk',
  'stockCsv',
  'stockPurchase',
  'staff',
  'topSelling',
  'profitLoss',
  'expenses',
  'cashLedger',
];

function pageFromHash(): Page {
  const raw = window.location.hash.replace(/^#\/?/, '') as Page;
  return HASH_PAGES.includes(raw) ? raw : 'dashboard';
}

type NavChild = { label: string; page: Page | null };
type NavItem = {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  page?: Page;
  children?: NavChild[];
};

const parents: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  {
    id: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    page: 'salesHome',
    children: [
      { label: 'Overview', page: 'salesHome' },
      { label: 'New Sale (POS)', page: 'billing' },
      { label: 'Sale List', page: 'sales' },
    ],
  },
  {
    id: 'catalog',
    label: 'Products',
    icon: Package,
    page: 'catalogHome',
    children: [
      { label: 'Overview', page: 'catalogHome' },
      { label: 'Product List', page: 'products' },
      { label: 'Add Product', page: 'addProduct' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Warehouse,
    page: 'inventoryHome',
    children: [
      { label: 'Overview', page: 'inventoryHome' },
      { label: 'Current Stock', page: 'inventory' },
      { label: 'Breakage', page: 'breakage' },
    ],
  },
  {
    id: 'purchase',
    label: 'Purchase',
    icon: Truck,
    page: 'purchaseHome',
    children: [
      { label: 'Overview', page: 'purchaseHome' },
      { label: 'Purchase Status', page: 'chalan' },
      { label: 'Purchase Order', page: 'chalanNew' },
      { label: 'Pending', page: 'chalanPaona' },
      { label: 'Bulk Restock', page: 'stockBulk' },
      { label: 'Import CSV', page: 'stockCsv' },
      { label: 'Purchase + Receipt', page: 'stockPurchase' },
    ],
  },
  {
    id: 'report',
    label: 'Reports',
    icon: PieChart,
    page: 'reportsHome',
    children: [
      { label: 'Overview', page: 'reportsHome' },
      { label: 'Sales Overview', page: 'dashboard' },
      { label: 'Sale Report', page: 'sales' },
      { label: 'Top Selling', page: 'topSelling' },
      { label: 'Profit & Loss', page: 'profitLoss' },
    ],
  },
  {
    id: 'expense',
    label: 'Expense',
    icon: Wallet,
    page: 'expenseHome',
    children: [
      { label: 'Overview', page: 'expenseHome' },
      { label: 'Expense List', page: 'expenses' },
      { label: 'Cash Ledger', page: 'cashLedger' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    page: 'settingsHome',
    children: [
      { label: 'Overview', page: 'settingsHome' },
      { label: 'Staff', page: 'staff' },
    ],
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#00a65a] bg-white text-center text-[8px] font-bold leading-[1.05] text-[#008d4c]">
        অলিলা
        <br />
        গ্লাস
      </div>
      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-[13px] font-bold leading-tight text-[#008d4c]">
          Olila Glass
        </p>
        <p className="truncate text-[10px] text-[#98a6ad]">Tableware shop</p>
      </div>
    </div>
  );
}

function parentIdForPage(page: Page): string | null {
  for (const item of parents) {
    if (item.page === page) return item.id;
    if (item.children?.some((c) => c.page === page)) return item.id;
  }
  return null;
}

function MainApp() {
  const { user, logout, isLoading } = useApp();
  const toast = useToast();
  const [page, setPage] = useState<Page>(() =>
    typeof window === 'undefined' ? 'dashboard' : pageFromHash()
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(() =>
    parentIdForPage(
      typeof window === 'undefined' ? 'dashboard' : pageFromHash()
    )
  );
  const [mobileNav, setMobileNav] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [posReturn, setPosReturn] = useState<Page>('dashboard');
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onHash = () => {
      const next = pageFromHash();
      setPage(next);
      const parent = parentIdForPage(next);
      if (parent) setOpenMenuId(parent);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!userMenu) return;
    const onDoc = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenu(false);
        setMobileNav(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenu]);

  const go = (next: Page | null) => {
    if (!next) {
      toast.info('Coming soon.');
      return;
    }
    if (next === 'billing' && page !== 'billing') {
      setPosReturn(page);
    }
    setPage(next);
    window.location.hash = '/' + next;
    setMobileNav(false);
    setUserMenu(false);
    const parent = parentIdForPage(next);
    if (parent) setOpenMenuId(parent);
    else setOpenMenuId(null);
  };

  const openParentOnly = (id: string) => {
    setOpenMenuId(id);
  };

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ebeff2] text-[#435966]">
        Loading shop…
      </div>
    );
  }

  if (!user) return <LoginPage />;

  if (page === 'billing') {
    return (
      <BillingPage
        onBack={() => go(posReturn === 'billing' ? 'dashboard' : posReturn)}
        onViewSales={() => go('sales')}
      />
    );
  }

  const handleLogout = async () => {
    setUserMenu(false);
    await logout();
    toast.success('Signed out.');
  };

  const chalanMode =
    page === 'chalanNew' ? 'new' : page === 'chalanPaona' ? 'paona' : 'list';
  const showChalan =
    page === 'chalan' || page === 'chalanNew' || page === 'chalanPaona';

  const inventoryIntake =
    page === 'stockBulk'
      ? 'bulk'
      : page === 'stockCsv'
        ? 'csv'
        : page === 'stockPurchase'
          ? 'purchase'
          : null;
  const showInventory =
    page === 'inventory' ||
    page === 'stockBulk' ||
    page === 'stockCsv' ||
    page === 'stockPurchase';

  return (
    <div className="min-h-screen bg-[#ebeff2]">
      {mobileNav && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}

      <header className="as-topbar">
        <div className="as-topbar-left !justify-start gap-2 px-3">
          <button
            className="p-2 lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Logo />
        </div>
        <div className="as-topbar-right overflow-x-auto">
          <span className="hidden shrink-0 text-[12px] font-medium text-[#435966] md:inline">
            Links:
          </span>
          <button className="as-quick bg-[#00a65a]" onClick={() => go('dashboard')}>
            Dashboard
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
            Products
          </button>
          <button className="as-quick bg-[#17a2b8]" onClick={() => go('chalan')}>
            Chalan
          </button>
          <button className="as-quick bg-[#00a65a]" onClick={() => go('billing')}>
            POS
          </button>
        </div>
        <div className="as-user relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenu((open) => !open)}
            className="flex items-center gap-2"
            aria-expanded={userMenu}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            <UserCircle className="h-8 w-8 shrink-0 text-[#98a6ad]" />
            <span className="as-user-lines">
              <strong>{user.name}</strong>
              <span>{user.role === 'admin' ? 'Admin' : 'Staff'}</span>
              <span>Olila Glass</span>
            </span>
          </button>
          {userMenu && (
            <div
              role="menu"
              className="absolute right-2 top-full z-50 min-w-[150px] border border-[#eee] bg-white py-1 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#435966] hover:bg-[#e9f7f0]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
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
          <nav className="pb-8" id="sidebar-menu" aria-label="Main">
            {parents.map((item) => {
              const Icon = item.icon;
              const opened = openMenuId === item.id;
              const isLeaf = Boolean(item.page) && !item.children;
              const activeParent =
                item.page === page ||
                Boolean(item.children?.some((c) => c.page === page));
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={item.children ? opened : undefined}
                    className={cn(
                      'as-nav',
                      activeParent && 'active',
                      opened && !isLeaf && 'subdrop'
                    )}
                    onClick={() => {
                      if (item.children?.length) {
                        openParentOnly(item.id);
                        if (item.page) go(item.page);
                      } else if (item.page) {
                        go(item.page);
                      }
                    }}
                  >
                    <Icon className="mr-[15px] ml-[3px] h-4 w-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.children && (
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
                          type="button"
                          className={cn(child.page === page && 'active')}
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
          {page === 'salesHome' && (
            <SalesHub onNavigate={(p) => go(p as Page)} />
          )}
          {page === 'catalogHome' && (
            <CatalogHub onNavigate={(p) => go(p as Page)} />
          )}
          {page === 'inventoryHome' && (
            <InventoryHub onNavigate={(p) => go(p as Page)} />
          )}
          {page === 'purchaseHome' && (
            <PurchaseHub onNavigate={(p) => go(p as Page)} />
          )}
          {page === 'reportsHome' && (
            <ReportsHub onNavigate={(p) => go(p as Page)} />
          )}
          {page === 'expenseHome' && (
            <ExpenseHub onNavigate={(p) => go(p as Page)} />
          )}
          {page === 'settingsHome' && (
            <SettingsHub onNavigate={(p) => go(p as Page)} />
          )}
          {page === 'products' && (
            <ProductsPage mode="list" onAdd={() => go('addProduct')} />
          )}
          {page === 'addProduct' && (
            <ProductsPage mode="form" onList={() => go('products')} />
          )}
          {showInventory && (
            <InventoryPage
              intake={inventoryIntake}
              onNavigate={(p) => go(p as Page)}
            />
          )}
          {showChalan && (
            <ChalanPage
              mode={chalanMode}
              onNavigate={(p) => go(p as Page)}
            />
          )}
          {page === 'breakage' && (
            <BreakagePage onViewStock={() => go('inventory')} />
          )}
          {page === 'sales' && (
            <SalesPage onNewSale={() => go('billing')} />
          )}
          {page === 'topSelling' && <TopSellingPage />}
          {page === 'profitLoss' && <ProfitLossPage />}
          {page === 'expenses' && <ExpensePage />}
          {page === 'cashLedger' && <CashLedgerPage />}
          {page === 'staff' && <StaffPage />}
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
