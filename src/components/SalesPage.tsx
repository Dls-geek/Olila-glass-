import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus } from 'lucide-react';
import type { Sale } from '../types';
import { Button, Modal } from './ui';

const currency = (n: number) => n.toLocaleString();

export function SalesPage() {
  const { sales } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || sale.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage, pageSize]);

  const start = filteredSales.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredSales.length);

  const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const todaySales = sales
    .filter((s) => s.date === new Date().toISOString().split('T')[0])
    .reduce((sum, s) => sum + s.total_amount, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['Total Revenue', `৳${currency(totalSales)}`],
          ["Today's Sales", `৳${currency(todaySales)}`],
          ['Total Orders', String(sales.length)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[4px] border border-[#dee2e6] bg-white p-3"
          >
            <p className="text-[12px] text-[#6c757d]">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[4px] border border-[#dee2e6] bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-[18px] font-semibold">Sale List</h1>
          <Button variant="info" size="sm">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[13px]">
            Show
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-[4px] border border-[#ced4da] px-2"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            entries
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 rounded-[4px] border border-[#ced4da] px-2"
            />
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            Search:
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-8 w-44 rounded-[4px] border border-[#ced4da] px-2"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-[13px]">
            <thead>
              <tr className="bg-[#9e9e9e] text-left text-white">
                <th className="px-3 py-2 font-medium">SL</th>
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Items</th>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((sale, idx) => (
                <tr key={sale.id} className="border-b border-[#dee2e6]">
                  <td className="px-3 py-2">{start + idx}</td>
                  <td className="px-3 py-2">{sale.id}</td>
                  <td className="px-3 py-2">{sale.date}</td>
                  <td className="px-3 py-2">
                    {sale.customer_name || 'Walk-in Customer'}
                    {sale.customer_phone ? (
                      <div className="text-[11px] text-[#6c757d]">
                        {sale.customer_phone}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{sale.items.length}</td>
                  <td className="px-3 py-2">{currency(sale.total_amount)}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setSelectedSale(sale)}
                      className="mr-1 rounded-[3px] bg-[#007bff] px-2 py-0.5 text-[12px] text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setSelectedSale(sale)}
                      className="rounded-[3px] bg-[#dc3545] px-2 py-0.5 text-[12px] text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <p>
            Showing {start} to {end} of {filteredSales.length} entries
          </p>
          <div className="flex overflow-hidden rounded-[4px] border border-[#dee2e6]">
            <button
              className="px-3 py-1.5 disabled:text-[#adb5bd]"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={
                  n === currentPage
                    ? 'bg-[#007bff] px-3 py-1.5 text-white'
                    : 'border-l border-[#dee2e6] px-3 py-1.5'
                }
              >
                {n}
              </button>
            ))}
            <button
              className="border-l border-[#dee2e6] px-3 py-1.5 disabled:text-[#adb5bd]"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={selectedSale !== null}
        onClose={() => setSelectedSale(null)}
        size="sm"
      >
        {selectedSale && (
          <div className="p-6 font-mono text-[13px] leading-5">
            <div className="text-center">
              <p className="text-base font-bold">Olila Glass</p>
              <p>Address: Circular Road, Firoza Merchant Plaza</p>
              <p>Mobile: 01783867744</p>
              <p>--------------------------------------------</p>
              <p className="text-left">Invoice No: {selectedSale.id}</p>
              <p className="text-left">Date: {selectedSale.date}</p>
              <p className="text-left">
                Customer Name: {selectedSale.customer_name || 'Guest'}
              </p>
              <p className="font-bold">INVOICE</p>
            </div>
            <table className="mt-2 w-full">
              <thead>
                <tr>
                  <th className="text-left">Name</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items.map((item) => (
                  <tr key={`${selectedSale.id}-${item.product_id}`}>
                    <td>{item.product_name}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{item.price}</td>
                    <td className="text-right">{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>--------------------------------------------</p>
            <p className="text-right">
              Subtotal: {selectedSale.total_amount.toFixed(2)}
            </p>
            <p className="text-right">Discount: 0.00</p>
            <p className="text-right font-bold">
              Total Amount: {selectedSale.total_amount.toFixed(2)}
            </p>
            <p className="text-right">
              Paid: {selectedSale.total_amount.toFixed(2)}
            </p>
            <p className="mt-4 text-center">
              congratulations!! you have saved 0.00 taka
            </p>
            <div className="mt-4 flex justify-center">
              <Button
                variant="success"
                onClick={() => {
                  window.print();
                }}
              >
                Print Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
