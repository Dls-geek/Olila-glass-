import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Receipt,
  Search,
  Calendar,
  User,
  Phone,
  Eye,
  TrendingUp,
  Filter,
} from 'lucide-react';
import type { Sale } from '../types';
import { Badge, Button, Card, Input, Modal, StatCard } from './ui';

const currency = (n: number) => `৳${n.toLocaleString()}`;

export function SalesPage() {
  const { sales } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [dateFilter, setDateFilter] = useState('');

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || sale.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const todaySales = sales
    .filter((s) => s.date === new Date().toISOString().split('T')[0])
    .reduce((sum, s) => sum + s.total_amount, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Sales History</h1>
        <p className="text-sm text-slate-500">
          Review all transactions and invoices
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Revenue"
          value={currency(totalSales)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="Today's Sales"
          value={currency(todaySales)}
          icon={<Receipt className="h-5 w-5" />}
          tone="brand"
        />
        <StatCard
          label="Total Orders"
          value={sales.length}
          icon={<Receipt className="h-5 w-5" />}
          tone="info"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            containerClassName="flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer or invoice number…"
            icon={<Search className="h-5 w-5" />}
          />
          <Input
            containerClassName="sm:w-52"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            icon={<Filter className="h-4 w-4" />}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Invoice</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Items</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
                <th className="px-5 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <span className="font-mono font-semibold text-brand-600">
                      {sale.id}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {sale.date}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 font-medium text-slate-800">
                      <User className="h-4 w-4 text-slate-400" />
                      {sale.customer_name || 'Walk-in Customer'}
                    </div>
                    {sale.customer_phone && (
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        <Phone className="h-3 w-3" />
                        {sale.customer_phone}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone="neutral">{sale.items.length} items</Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900">
                    {currency(sale.total_amount)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedSale(sale)}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSales.length === 0 && (
          <div className="py-16 text-center">
            <Receipt className="mx-auto mb-4 h-16 w-16 text-slate-300" />
            <p className="text-slate-500">No sales found</p>
            <p className="text-sm text-slate-400">
              Start making sales to see them here.
            </p>
          </div>
        )}
      </Card>

      {/* Detail modal */}
      <Modal
        open={selectedSale !== null}
        onClose={() => setSelectedSale(null)}
        title="Invoice Details"
        subtitle={selectedSale?.id}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setSelectedSale(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedSale && (
          <div className="p-6">
            <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div>
                <p className="text-xs text-slate-400">Customer</p>
                <p className="font-medium text-slate-800">
                  {selectedSale.customer_name || 'Walk-in Customer'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="font-medium text-slate-800">
                  {selectedSale.customer_phone || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Date</p>
                <p className="font-medium text-slate-800">{selectedSale.date}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Items</p>
                <p className="font-medium text-slate-800">
                  {selectedSale.items.length} items
                </p>
              </div>
            </div>

            <p className="mb-3 text-sm font-semibold text-slate-700">
              Items purchased
            </p>
            <div className="space-y-2">
              {selectedSale.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {currency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {currency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-lg bg-brand-50 p-4">
              <span className="font-semibold text-slate-700">Total Amount</span>
              <span className="text-2xl font-bold text-brand-700">
                {currency(selectedSale.total_amount)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
