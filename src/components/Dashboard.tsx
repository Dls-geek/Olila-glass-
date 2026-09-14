import { useApp } from '../context/AppContext';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  CalendarDays,
  Boxes,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, StatCard, Badge, Button } from './ui';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const currency = (n: number) => `৳${n.toLocaleString()}`;

const quickActions = [
  {
    id: 'billing',
    label: 'New Sale',
    hint: 'Open billing counter',
    icon: ShoppingCart,
  },
  {
    id: 'products',
    label: 'Products',
    hint: 'Manage your catalog',
    icon: Package,
  },
  { id: 'sales', label: 'Sales', hint: 'View history', icon: TrendingUp },
  { id: 'inventory', label: 'Inventory', hint: 'Check stock', icon: Boxes },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const {
    products,
    sales,
    getDailySales,
    getMonthlySales,
    getLowStockProducts,
    getTopProducts,
  } = useApp();
  const lowStockProducts = getLowStockProducts();
  const topProducts = getTopProducts();
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const alertCount = lowStockProducts.length + outOfStockCount;

  const chartData = [
    { name: 'Mon', sales: 1200 },
    { name: 'Tue', sales: 1800 },
    { name: 'Wed', sales: 1500 },
    { name: 'Thu', sales: 2200 },
    { name: 'Fri', sales: 2800 },
    { name: 'Sat', sales: 3200 },
    { name: 'Sun', sales: getDailySales() || 2100 },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Welcome back 👋
          </h1>
          <p className="text-sm text-slate-500">
            Here's what's happening in your store today.
          </p>
        </div>
        <Button onClick={() => onNavigate('billing')}>
          <ShoppingCart className="h-4 w-4" />
          Quick Billing
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Sales"
          value={currency(getDailySales())}
          icon={<IndianRupee className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Monthly Sales"
          value={currency(getMonthlySales())}
          icon={<CalendarDays className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Total Products"
          value={products.length}
          icon={<Boxes className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="Total Orders"
          value={sales.length}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="warning"
        />
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Weekly Sales Overview"
            subtitle="Revenue for the last 7 days"
          />
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 30px -12px rgba(15,23,42,0.18)',
                      fontSize: '13px',
                    }}
                    formatter={(value) => [currency(Number(value)), 'Sales']}
                  />
                  <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Stock alerts */}
        <Card>
          <CardHeader
            title="Stock Alerts"
            action={
              <Badge tone={alertCount > 0 ? 'danger' : 'success'}>
                {alertCount} {alertCount === 1 ? 'item' : 'items'}
              </Badge>
            }
          />
          <CardContent className="pt-1">
            {alertCount === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Package className="h-6 w-6" />
                </div>
                <p className="text-sm text-slate-500">
                  All stock levels are healthy.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 4).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-9 w-9 rounded-md object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {product.name}
                        </p>
                        <p className="text-xs text-amber-600">
                          {product.stock} left in stock
                        </p>
                      </div>
                    </div>
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  </div>
                ))}
                {outOfStockCount > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-sm font-medium text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {outOfStockCount} product(s) out of stock
                  </div>
                )}
                <button
                  onClick={() => onNavigate('inventory')}
                  className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
                >
                  View inventory
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top Selling Products" />
          <CardContent className="pt-1">
            {topProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No sales data yet.
              </p>
            ) : (
              <div className="space-y-1">
                {topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between rounded-lg px-2 py-2.5 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {product.name}
                      </span>
                    </div>
                    <Badge tone="brand">{product.sales} sold</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Quick Actions" />
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ id, label, hint, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className="group flex flex-col items-start rounded-lg border border-slate-200 p-4 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="text-xs text-slate-500">{hint}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
