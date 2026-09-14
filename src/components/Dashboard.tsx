import { useApp } from '../context/AppContext';
import {
  ShoppingCart,
  Package,
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  CalendarDays,
  Boxes,
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
import { Button, Card, CardContent, CardHeader, StatCard } from './ui';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const currency = (n: number) => `৳${n.toLocaleString()}`;

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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[18px] font-semibold text-[#212529]">Dashboard</h1>
        <Button variant="success" onClick={() => onNavigate('billing')}>
          <ShoppingCart className="h-4 w-4" />
          New Order
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Weekly Sales Overview" />
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#dee2e6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => [currency(Number(value)), 'Sales']}
                  />
                  <Bar dataKey="sales" fill="#28a745" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Stock Alerts" />
          <CardContent>
            {lowStockProducts.length === 0 && outOfStockCount === 0 ? (
              <p className="py-6 text-center text-sm text-[#6c757d]">
                All stocks are healthy.
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between border-b border-[#f1f3f5] py-2 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-8 w-8 rounded object-cover"
                      />
                      <div>
                        <p className="text-[13px] font-medium">{product.name}</p>
                        <p className="text-[12px] text-[#fd7e14]">
                          Low Stock: {product.stock}
                        </p>
                      </div>
                    </div>
                    <AlertTriangle className="h-4 w-4 text-[#fd7e14]" />
                  </div>
                ))}
                {outOfStockCount > 0 && (
                  <p className="text-[13px] text-[#dc3545]">
                    {outOfStockCount} product(s) out of stock
                  </p>
                )}
                <button
                  onClick={() => onNavigate('inventory')}
                  className="text-[13px] text-[#007bff] hover:underline"
                >
                  View All
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Top Selling Products" />
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#9e9e9e] text-left text-white">
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Sold</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-[#6c757d]">
                    No sales data yet
                  </td>
                </tr>
              ) : (
                topProducts.map((product, index) => (
                  <tr key={product.name} className="border-b border-[#dee2e6]">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{product.name}</td>
                    <td className="px-3 py-2">{product.sales}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onNavigate('billing')}>
          <ShoppingCart className="h-4 w-4" />
          New Sale
        </Button>
        <Button variant="info" onClick={() => onNavigate('products')}>
          <Package className="h-4 w-4" />
          Products
        </Button>
        <Button variant="success" onClick={() => onNavigate('sales')}>
          Sale List
        </Button>
        <Button variant="warning" onClick={() => onNavigate('inventory')}>
          Stock
        </Button>
      </div>
    </div>
  );
}
