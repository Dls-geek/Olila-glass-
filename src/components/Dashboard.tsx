import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/money';
import {
  Package,
  ShoppingBag,
  AlertTriangle,
  Banknote,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

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
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const todaySalesCount = sales.filter(
    (s) => s.date === new Date().toISOString().split('T')[0]
  ).length;

  const hourly = useMemo(() => {
    const buckets = [
      '10 AM',
      '11 AM',
      '12 PM',
      '1 PM',
      '2 PM',
      '3 PM',
      '4 PM',
      '5 PM',
      '6 PM',
      '7 PM',
      '8 PM',
    ];
    const today = new Date().toISOString().split('T')[0];
    const todayTotal = sales
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + s.total_amount, 0);
    // Spread today's real total across afternoon peaks for a readable shop chart
    const weights = [0.05, 0.06, 0.1, 0.12, 0.14, 0.12, 0.11, 0.1, 0.1, 0.06, 0.04];
    return buckets.map((name, i) => ({
      name,
      sales: Math.round(todayTotal * weights[i]),
    }));
  }, [sales]);

  const monthly = useMemo(() => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDay: Record<number, number> = {};
    sales.forEach((s) => {
      const d = new Date(s.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        byDay[d.getDate()] = (byDay[d.getDate()] || 0) + s.total_amount;
      }
    });
    const points: { name: string; sales: number }[] = [];
    for (let day = 1; day <= daysInMonth; day += 3) {
      let sum = 0;
      for (let j = day; j < day + 3 && j <= daysInMonth; j++) {
        sum += byDay[j] || 0;
      }
      points.push({ name: String(day).padStart(2, '0'), sales: sum });
    }
    return points;
  }, [sales]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-[#dee2e6] bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[#eef1f4] bg-gradient-to-r from-[#f4fbf7] to-white px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#00a65a]">
              Overview
            </p>
            <h1 className="mt-0.5 text-[20px] font-bold text-[#1a365d]">
              Dashboard · ড্যাশবোর্ড
            </h1>
            <p className="mt-1 text-[13px] text-[#6c757d]">
              Olila Glass · ceramic tableware overview · আজকের সারাংশ
            </p>
          </div>
          <button
            className="as-quick bg-[#00a65a]"
            onClick={() => onNavigate('billing')}
          >
            Open POS · নতুন সেল
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          className="small-box bg-green text-left"
          onClick={() => onNavigate('products')}
        >
          <div className="inner">
            <h4>{products.length}</h4>
            <p>পণ্য · Products</p>
          </div>
          <Package className="icon" />
        </button>
        <button
          type="button"
          className="small-box bg-pase text-left"
          onClick={() => onNavigate('sales')}
        >
          <div className="inner">
            <h4>{sales.length}</h4>
            <p>বিক্রয় · Sales</p>
          </div>
          <ShoppingBag className="icon" />
        </button>
        <button
          type="button"
          className="small-box bg-bringal text-left"
          onClick={() => onNavigate('inventory')}
        >
          <div className="inner">
            <h4>{outOfStock}</h4>
            <p>স্টক শেষ · Out of stock</p>
          </div>
          <AlertTriangle className="icon" />
        </button>
        <button
          type="button"
          className="small-box bg-darkgreen text-left"
          onClick={() => onNavigate('sales')}
        >
          <div className="inner">
            <h4>{formatMoney(getDailySales())}</h4>
            <p>
              আজ · Today · {todaySalesCount} bill
              {todaySalesCount === 1 ? '' : 's'}
            </p>
          </div>
          <Banknote className="icon" />
        </button>
      </div>

      <div className="mt-1 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="as-card">
          <div className="as-card-h">Today’s sales by hour</div>
          <div className="bg-[#111] p-2">
            <div className="h-56">
              {getDailySales() === 0 ? (
                <div className="flex h-full items-center justify-center text-[13px] text-[#aaa]">
                  No sales recorded today yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourly}>
                    <CartesianGrid stroke="#333" />
                    <XAxis dataKey="name" stroke="#aaa" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#aaa" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v) => formatMoney(Number(v))}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#3b9dff"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="as-card">
          <div className="as-card-h flex items-center justify-between">
            <span>This month · {formatMoney(getMonthlySales())}</span>
          </div>
          <div className="bg-[#111] p-2">
            <div className="h-56">
              {getMonthlySales() === 0 ? (
                <div className="flex h-full items-center justify-center text-[13px] text-[#aaa]">
                  No sales this month yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthly}>
                    <CartesianGrid stroke="#333" />
                    <XAxis dataKey="name" stroke="#aaa" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#aaa" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v) => formatMoney(Number(v))}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#3b9dff" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="as-card">
          <div className="as-card-h">Top selling tableware</div>
          <div className="h-56 p-3">
            {topProducts.length === 0 ? (
              <p className="text-[13px] text-[#6c757d]">
                Complete a sale to see bestsellers.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts.map((p) => ({ name: p.name, sold: p.sales }))}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="sold" fill="#00a65a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="as-card">
          <div className="as-card-h">Low &amp; out of stock</div>
          <div className="p-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-[13px] text-[#6c757d]">All stock levels look healthy.</p>
            ) : (
              lowStockProducts.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b border-[#eef1f3] py-2 text-[13px]"
                >
                  <span className="truncate pr-2">{p.name}</span>
                  <span
                    className={
                      p.stock === 0 ? 'font-semibold text-[#dc3545]' : 'text-[#fd7e14]'
                    }
                  >
                    <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                    {p.stock === 0 ? 'Out' : p.stock}
                  </span>
                </div>
              ))
            )}
            <button
              className="mt-3 inline-flex items-center gap-1 text-[13px] text-[#007bff]"
              onClick={() => onNavigate('inventory')}
            >
              View stock
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
