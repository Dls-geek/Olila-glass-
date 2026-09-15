import { useMemo } from 'react';
import {
  ClipboardList,
  FileSpreadsheet,
  Package,
  PieChart,
  Plus,
  ShoppingCart,
  Truck,
  Upload,
  UserPlus,
  Wallet,
  Warehouse,
  AlertTriangle,
  List,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/money';
import {
  HubActionCard,
  ModuleHeader,
  SectionCard,
  StatTile,
} from './ui';

type Go = (page: string) => void;

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function SalesHub({ onNavigate }: { onNavigate: Go }) {
  const { sales, getDailySales } = useApp();
  const today = todayYmd();
  const todayCount = sales.filter((s) => s.date === today).length;
  const monthCount = useMemo(() => {
    const y = new Date().getFullYear();
    const m = new Date().getMonth();
    return sales.filter((s) => {
      const d = new Date(s.date);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
  }, [sales]);

  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Sales · Module"
        title="Sales Hub · বিক্রয়"
        subtitle="POS ও সেল লিস্ট — এখান থেকে শুরু করুন।"
        accent="navy"
      />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <StatTile
          label="আজকের আয় · Today"
          value={formatMoney(getDailySales())}
          tone="green"
        />
        <StatTile label="আজকের ইনভয়েস" value={todayCount} tone="navy" />
        <StatTile label="এই মাসের ইনভয়েস" value={monthCount} tone="blue" />
      </div>
      <SectionCard title="Actions" subtitle="একটা কাজ বেছে নিন" accent="navy">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <HubActionCard
            tone="green"
            title="New Sale · POS"
            description="কাউন্টারে নতুন বিক্রয় শুরু করুন।"
            icon={<ShoppingCart className="h-5 w-5" />}
            onClick={() => onNavigate('billing')}
          />
          <HubActionCard
            tone="navy"
            title="Sale List"
            description="তারিখ রেঞ্জ দিয়ে ইনভয়েস দেখুন ও প্রিন্ট করুন।"
            icon={<List className="h-5 w-5" />}
            onClick={() => onNavigate('sales')}
          />
        </div>
      </SectionCard>
    </div>
  );
}

export function CatalogHub({ onNavigate }: { onNavigate: Go }) {
  const { products } = useApp();
  const groups = new Set(products.map((p) => p.group).filter(Boolean)).size;
  const low = products.filter(
    (p) => p.stock > 0 && p.stock <= p.low_stock_alert
  ).length;
  const out = products.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Catalog · Module"
        title="Catalog Hub · ক্যাটালগ"
        subtitle="পণ্য তালিকা ও নতুন SKU — আলাদা পেজে।"
        accent="green"
      />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile label="মোট SKU" value={products.length} tone="navy" />
        <StatTile label="Groups" value={groups} tone="blue" />
        <StatTile label="Low stock" value={low} tone="amber" />
        <StatTile label="Out of stock" value={out} tone="red" />
      </div>
      <SectionCard title="Actions" accent="green">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <HubActionCard
            tone="navy"
            title="Product List"
            description="খুঁজুন, ফিল্টার, এডিট বা ডিলিট।"
            icon={<Package className="h-5 w-5" />}
            onClick={() => onNavigate('products')}
          />
          <HubActionCard
            tone="green"
            title="Add Product"
            description="একটা করে বা CSV/Excel বাল্ক ইমপোর্ট।"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => onNavigate('addProduct')}
          />
        </div>
      </SectionCard>
    </div>
  );
}

export function InventoryHub({ onNavigate }: { onNavigate: Go }) {
  const { products, inventoryLogs } = useApp();
  const units = products.reduce((s, p) => s + p.stock, 0);
  const low = products.filter(
    (p) => p.stock > 0 && p.stock <= p.low_stock_alert
  ).length;
  const breaks = inventoryLogs.filter((l) => l.change_type === 'break').length;

  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Inventory · Module"
        title="Inventory Hub · স্টক"
        subtitle="শেল্ফ কাউন্ট ও ব্রেকেজ — সাপ্লাই Purchase হাবে।"
        accent="navy"
      />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <StatTile label="মোট পিস · On hand" value={units} tone="navy" />
        <StatTile label="Low stock SKU" value={low} tone="amber" />
        <StatTile label="Breakage logs" value={breaks} tone="red" />
      </div>
      <SectionCard title="Actions" accent="navy">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <HubActionCard
            tone="navy"
            title="Current Stock"
            description="স্টক দেখুন ও সার্চ করুন।"
            icon={<Warehouse className="h-5 w-5" />}
            onClick={() => onNavigate('inventory')}
          />
          <HubActionCard
            tone="red"
            title="Breakage"
            description="ভাঙা/ক্ষতি রেকর্ড করুন।"
            icon={<AlertTriangle className="h-5 w-5" />}
            onClick={() => onNavigate('breakage')}
          />
        </div>
      </SectionCard>
    </div>
  );
}

export function PurchaseHub({ onNavigate }: { onNavigate: Go }) {
  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Purchase · Module"
        title="Purchase Hub · ক্রয়"
        subtitle="চালান / PO, পাওনা, এবং দ্রুত স্টক ইনটেক।"
        accent="amber"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatTile
          label="Primary flow"
          value="Chalan / PO"
          hint="Company order"
          tone="navy"
        />
        <StatTile label="Outstanding" value="পাওনা" hint="Open receive" tone="amber" />
        <StatTile label="Quick intake" value="Bulk / CSV" hint="Restock" tone="green" />
      </div>
      <SectionCard title="Chalan & পাওনা" accent="navy">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <HubActionCard
            tone="green"
            title="Chalan List"
            description="সব অর্ডার ও স্ট্যাটাস।"
            icon={<ClipboardList className="h-5 w-5" />}
            onClick={() => onNavigate('chalan')}
          />
          <HubActionCard
            tone="navy"
            title="Purchase Order"
            description="নতুন কোম্পানি অর্ডার তৈরি।"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => onNavigate('chalanNew')}
          />
          <HubActionCard
            tone="amber"
            title="পাওনা"
            description="বাকি মাল রিসিভ করুন।"
            icon={<Truck className="h-5 w-5" />}
            onClick={() => onNavigate('chalanPaona')}
          />
        </div>
      </SectionCard>
      <SectionCard title="Quick stock intake" accent="green">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <HubActionCard
            tone="green"
            title="Bulk Restock"
            description="গ্রুপ/সব SKU একসাথে।"
            icon={<Package className="h-5 w-5" />}
            onClick={() => onNavigate('stockBulk')}
          />
          <HubActionCard
            tone="blue"
            title="Import CSV"
            description="SKU + quantity ফাইল।"
            icon={<Upload className="h-5 w-5" />}
            onClick={() => onNavigate('stockCsv')}
          />
          <HubActionCard
            tone="navy"
            title="Purchase + Receipt"
            description="কোম্পানি বিল + রসিদ আপলোড।"
            icon={<FileSpreadsheet className="h-5 w-5" />}
            onClick={() => onNavigate('stockPurchase')}
          />
        </div>
      </SectionCard>
    </div>
  );
}

export function ReportsHub({ onNavigate }: { onNavigate: Go }) {
  const { getDailySales, getMonthlySales } = useApp();
  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Reports · Module"
        title="Reports Hub · রিপোর্ট"
        subtitle="ওভারভিউ, সেল, টপ সেলিং, লাভ-ক্ষতি।"
        accent="navy"
      />
      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label="আজ · Today"
          value={formatMoney(getDailySales())}
          tone="green"
        />
        <StatTile
          label="এই মাস · Month"
          value={formatMoney(getMonthlySales())}
          tone="navy"
        />
      </div>
      <SectionCard title="Reports" accent="navy">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <HubActionCard
            tone="green"
            title="Sales Overview"
            description="ড্যাশবোর্ড চার্ট ও সারাংশ।"
            icon={<PieChart className="h-5 w-5" />}
            onClick={() => onNavigate('dashboard')}
          />
          <HubActionCard
            tone="navy"
            title="Sale Report"
            description="ইনভয়েস তালিকা ও তারিখ ফিল্টার।"
            icon={<List className="h-5 w-5" />}
            onClick={() => onNavigate('sales')}
          />
          <HubActionCard
            tone="amber"
            title="Top Selling"
            description="রেঞ্জ অনুযায়ী সবচেয়ে বেশি বিক্রি।"
            icon={<Package className="h-5 w-5" />}
            onClick={() => onNavigate('topSelling')}
          />
          <HubActionCard
            tone="blue"
            title="Profit & Loss"
            description="আয় − COGS (ক্রয়মূল্য)।"
            icon={<Wallet className="h-5 w-5" />}
            onClick={() => onNavigate('profitLoss')}
          />
        </div>
      </SectionCard>
    </div>
  );
}

export function ExpenseHub({ onNavigate }: { onNavigate: Go }) {
  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Expense · Module"
        title="Expense Hub · খরচ"
        subtitle="দোকানের অপারেটিং খরচ ট্র্যাক করুন।"
        accent="amber"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <StatTile label="This month" value={formatMoney(0)} hint="After first entry" tone="amber" />
        <StatTile label="Entries" value={0} tone="navy" />
      </div>
      <SectionCard title="Actions" accent="amber">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <HubActionCard
            tone="amber"
            title="Expense List"
            description="খরচ যোগ/দেখুন (types + amounts)।"
            icon={<Wallet className="h-5 w-5" />}
            onClick={() => onNavigate('expenses')}
          />
        </div>
      </SectionCard>
    </div>
  );
}

export function SettingsHub({ onNavigate }: { onNavigate: Go }) {
  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Settings · Module"
        title="Settings Hub · সেটিংস"
        subtitle="টিম ও দোকান কনফিগ।"
        accent="navy"
      />
      <SectionCard title="Team" accent="navy">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <HubActionCard
            tone="green"
            title="Staff"
            description="স্টাফ ইউজার তৈরি ও রোল ম্যানেজ।"
            icon={<UserPlus className="h-5 w-5" />}
            onClick={() => onNavigate('staff')}
          />
        </div>
      </SectionCard>
    </div>
  );
}
