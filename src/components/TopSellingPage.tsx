import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/money';
import {
  Button,
  ModuleHeader,
  SectionCard,
  StatTile,
  darkThead,
  zebraRow,
} from './ui';

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthStartYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

export function TopSellingPage() {
  const { sales, products } = useApp();
  const [fromDate, setFromDate] = useState(monthStartYmd());
  const [toDate, setToDate] = useState(todayYmd());

  const rows = useMemo(() => {
    const map = new Map<
      string,
      {
        product_id: string;
        name: string;
        sku: string;
        qty: number;
        revenue: number;
      }
    >();

    for (const sale of sales) {
      if (fromDate && sale.date < fromDate) continue;
      if (toDate && sale.date > toDate) continue;
      for (const item of sale.items) {
        const prev = map.get(item.product_id) || {
          product_id: item.product_id,
          name: item.product_name,
          sku: '',
          qty: 0,
          revenue: 0,
        };
        prev.qty += item.quantity;
        prev.revenue += item.subtotal;
        map.set(item.product_id, prev);
      }
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    return Array.from(map.values())
      .map((r) => ({
        ...r,
        sku: productById.get(r.product_id)?.sku || r.product_id,
        group: productById.get(r.product_id)?.group || '—',
      }))
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue);
  }, [sales, products, fromDate, toDate]);

  const chartData = rows.slice(0, 10).map((r) => ({
    name: r.name.length > 18 ? `${r.name.slice(0, 16)}…` : r.name,
    qty: r.qty,
  }));

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);
  const top = rows[0];

  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Reports · Catalog movers"
        title="Top Selling · সবচেয়ে বেশি বিক্রি"
        subtitle="তারিখ রেঞ্জ অনুযায়ী SKU র‌্যাংকিং — পরিমাণ ও আয়।"
        accent="navy"
      />

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#dee2e6] bg-white px-4 py-3 shadow-sm">
        <label className="flex flex-col gap-1 text-[13px] text-[#495057]">
          <span className="font-medium">From</span>
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 rounded-md border border-[#ced4da] bg-white px-2 text-[13px]"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] text-[#495057]">
          <span className="font-medium">To</span>
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 rounded-md border border-[#ced4da] bg-white px-2 text-[13px]"
          />
        </label>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setFromDate(monthStartYmd());
            setToDate(todayYmd());
          }}
        >
          This month
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const t = todayYmd();
            setFromDate(t);
            setToDate(t);
          }}
        >
          Today
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile label="SKU sold · Unique" value={rows.length} tone="navy" />
        <StatTile label="Units · পিস" value={totalQty} tone="blue" />
        <StatTile
          label="Revenue · আয়"
          value={formatMoney(totalRev)}
          tone="green"
        />
        <StatTile
          label="Top item"
          value={top ? top.name : '—'}
          hint={top ? `${top.qty} pcs` : 'No sales in range'}
          tone="amber"
        />
      </div>

      <SectionCard title="Top 10 chart" accent="navy">
        {chartData.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Trophy className="mx-auto h-10 w-10 text-[#adb5bd]" />
            <p className="mt-3 text-sm font-semibold text-[#495057]">
              এই রেঞ্জে কোনো বিক্রয় নেই।
            </p>
          </div>
        ) : (
          <div className="h-72 w-full p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#495057' }}
                  interval={0}
                  angle={-28}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="qty" name="Units" fill="#1a365d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Ranking · তালিকা" accent="green">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#6c757d]">
            No rows for this date range.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className={darkThead}>
                  <th>#</th>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Group</th>
                  <th>Units</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.product_id} className={zebraRow(idx)}>
                    <td className="px-3 py-2.5 font-semibold text-[#495057]">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px]">{r.sku}</td>
                    <td className="px-3 py-2.5 font-medium text-[#1a365d]">
                      {r.name}
                    </td>
                    <td className="px-3 py-2.5">{r.group}</td>
                    <td className="px-3 py-2.5 font-mono font-bold">{r.qty}</td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-[#0f5132]">
                      {formatMoney(r.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
