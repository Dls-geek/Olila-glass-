import { useApp } from '../context/AppContext';
import {
  Users,
  ShoppingBag,
  Truck,
  Banknote,
  AlertTriangle,
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

const currency = (n: number) => n.toLocaleString();

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

  const hourly = [
    { name: '12 PM', sales: 0 },
    { name: '2 AM', sales: 0 },
    { name: '4 AM', sales: 0 },
    { name: '6 AM', sales: 0 },
    { name: '8 AM', sales: 0 },
    { name: '10 AM', sales: 0 },
    { name: '12 AM', sales: 7000 },
    { name: '2 PM', sales: 15000 },
    { name: '4 PM', sales: 4000 },
    { name: '6 PM', sales: getDailySales() || 2000 },
    { name: '8 PM', sales: 0 },
    { name: '10 PM', sales: 0 },
  ];

  const monthly = [
    { name: '01', sales: 28000 },
    { name: '04', sales: 0 },
    { name: '07', sales: 36000 },
    { name: '10', sales: 30000 },
    { name: '13', sales: 37000 },
    { name: '16', sales: 0 },
    { name: '19', sales: 0 },
    { name: '22', sales: 0 },
    { name: '25', sales: 0 },
    { name: '28', sales: getMonthlySales() || 0 },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="small-box bg-green">
          <div className="inner">
            <h4>{products.length}</h4>
            <p>Total Product</p>
          </div>
          <Users className="icon" />
        </div>
        <div className="small-box bg-pase">
          <div className="inner">
            <h4>{sales.length}</h4>
            <p>Total Orders</p>
          </div>
          <ShoppingBag className="icon" />
        </div>
        <div className="small-box bg-bringal">
          <div className="inner">
            <h4>1</h4>
            <p>Total Supplier</p>
          </div>
          <Truck className="icon" />
        </div>
        <div className="small-box bg-darkgreen">
          <div className="inner">
            <h4>{currency(getDailySales())}</h4>
            <p>Today Sale</p>
          </div>
          <Banknote className="icon" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="as-card">
          <div className="as-card-h flex items-center justify-between">
            Hourly Report
            <input
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="h-8 rounded border border-[#ced4da] px-2 text-[13px]"
            />
          </div>
          <div className="bg-[#111] p-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourly}>
                  <CartesianGrid stroke="#333" />
                  <XAxis dataKey="name" stroke="#aaa" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#aaa" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b9dff"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="as-card">
          <div className="as-card-h flex items-center justify-between">
            Monthly Report
            <input
              type="month"
              defaultValue={new Date().toISOString().slice(0, 7)}
              className="h-8 rounded border border-[#ced4da] px-2 text-[13px]"
            />
          </div>
          <div className="bg-[#111] p-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly}>
                  <CartesianGrid stroke="#333" />
                  <XAxis dataKey="name" stroke="#aaa" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#aaa" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="#3b9dff" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="as-card">
          <div className="as-card-h">Top 10 Selling Food This Month</div>
          <div className="h-56 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts.map((p) => ({ name: p.name, sold: p.sales }))}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sold" fill="#9e9e9e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="as-card">
          <div className="as-card-h">Low Stock Alert</div>
          <div className="p-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-[13px] text-[#6c757d]">All stocks are healthy.</p>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b border-[#eef1f3] py-2 text-[13px]"
                >
                  <span>{p.name}</span>
                  <span className="text-[#fd7e14]">
                    <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                    {p.stock}
                  </span>
                </div>
              ))
            )}
            <button
              className="mt-2 text-[13px] text-[#007bff]"
              onClick={() => onNavigate('inventory')}
            >
              View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
