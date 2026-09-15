import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/money';
import {
  Button,
  ModuleHeader,
  SectionCard,
  StatTile,
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

export function ProfitLossPage() {
  const { sales, products, listExpenses } = useApp();
  const [fromDate, setFromDate] = useState(monthStartYmd());
  const [toDate, setToDate] = useState(todayYmd());
  const [expenseTotal, setExpenseTotal] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const rows = await listExpenses({ from: fromDate, to: toDate });
      if (alive) setExpenseTotal(rows.reduce((s, r) => s + r.amount, 0));
    })();
    return () => {
      alive = false;
    };
    // listExpenses is stable enough for this range-driven fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const costByProduct = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) m.set(p.id, p.purchase_price);
    return m;
  }, [products]);

  const summary = useMemo(() => {
    let revenue = 0;
    let cogs = 0;
    let discount = 0;
    let invoiceCount = 0;
    const byDay = new Map<string, { revenue: number; cogs: number }>();

    for (const sale of sales) {
      if (fromDate && sale.date < fromDate) continue;
      if (toDate && sale.date > toDate) continue;
      invoiceCount += 1;
      discount += sale.discount || 0;
      revenue += sale.total_amount;
      let saleCogs = 0;
      for (const item of sale.items) {
        const unitCost = costByProduct.get(item.product_id) ?? 0;
        saleCogs += unitCost * item.quantity;
      }
      cogs += saleCogs;
      const day = byDay.get(sale.date) || { revenue: 0, cogs: 0 };
      day.revenue += sale.total_amount;
      day.cogs += saleCogs;
      byDay.set(sale.date, day);
    }

    const gross = revenue - cogs;
    const net = gross - expenseTotal;
    const chart = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date: date.slice(5),
        revenue: Math.round(v.revenue),
        cogs: Math.round(v.cogs),
        profit: Math.round(v.revenue - v.cogs),
      }));

    return { revenue, cogs, gross, net, discount, invoiceCount, chart };
  }, [sales, costByProduct, fromDate, toDate, expenseTotal]);

  const margin =
    summary.revenue > 0
      ? ((summary.gross / summary.revenue) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Reports · Finance"
        title="Profit & Loss · লাভ-ক্ষতি"
        subtitle="আয় − COGS − অপারেটিং খরচ (Expense)।"
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
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Revenue · আয়"
          value={formatMoney(summary.revenue)}
          hint={`${summary.invoiceCount} invoices`}
          tone="green"
        />
        <StatTile
          label="COGS · ক্রয়মূল্য"
          value={formatMoney(summary.cogs)}
          tone="amber"
        />
        <StatTile
          label="Gross profit"
          value={formatMoney(summary.gross)}
          tone={summary.gross >= 0 ? 'navy' : 'red'}
        />
        <StatTile
          label="Expenses · খরচ"
          value={formatMoney(expenseTotal)}
          tone="red"
        />
        <StatTile
          label="Net profit"
          value={formatMoney(summary.net)}
          tone={summary.net >= 0 ? 'blue' : 'red'}
        />
        <StatTile label="Gross margin %" value={`${margin}%`} tone="blue" />
      </div>

      <SectionCard title="Daily revenue vs COGS" accent="navy">
        {summary.chart.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-[#6c757d]">
            এই রেঞ্জে কোনো বিক্রয় নেই।
          </p>
        ) : (
          <div className="h-72 w-full p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) =>
                    formatMoney(
                      typeof value === 'number' ? value : Number(value) || 0
                    )
                  }
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#28a745"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="cogs"
                  name="COGS"
                  fill="#fd7e14"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="profit"
                  name="Gross"
                  fill="#1a365d"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Notes" accent="amber">
        <ul className="space-y-1.5 px-4 py-3 text-[13px] text-[#495057]">
          <li>
            COGS = sold qty × catalog <code>purchase_price</code>.
          </li>
          <li>Expenses come from the Expense module for the same date range.</li>
          <li>Net = Gross − Expenses.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
