import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/money';
import { printReceipt } from '../utils/printReceipt';
import { ReceiptSlip } from './ReceiptSlip';
import { Plus, Printer } from 'lucide-react';
import type { Sale } from '../types';
import { Button, Modal } from './ui';

interface SalesPageProps {
  onNewSale?: () => void;
}

export function SalesPage({ onNewSale }: SalesPageProps) {
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

  const start =
    filteredSales.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredSales.length);

  const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const todaySales = sales
    .filter((s) => s.date === new Date().toISOString().split('T')[0])
    .reduce((sum, s) => sum + s.total_amount, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ['Total revenue', formatMoney(totalSales)],
          ["Today's sales", formatMoney(todaySales)],
          ['Invoices', String(sales.length)],
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
          <Button variant="info" size="sm" onClick={() => onNewSale?.()}>
            <Plus className="h-3.5 w-3.5" />
            New sale
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
              aria-label="Filter by date"
            />
            {dateFilter && (
              <button
                type="button"
                className="text-[#007bff]"
                onClick={() => setDateFilter('')}
              >
                Clear date
              </button>
            )}
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
              placeholder="Invoice or customer"
              aria-label="Search sales"
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
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-10 text-center text-[#6c757d]"
                  >
                    No sales found.{' '}
                    <button
                      type="button"
                      className="text-[#007bff] underline"
                      onClick={() => onNewSale?.()}
                    >
                      Open POS
                    </button>
                  </td>
                </tr>
              ) : (
                paged.map((sale, idx) => (
                  <tr key={sale.id} className="border-b border-[#dee2e6]">
                    <td className="px-3 py-2">{start + idx}</td>
                    <td className="px-3 py-2">{sale.id}</td>
                    <td className="px-3 py-2">{sale.date}</td>
                    <td className="px-3 py-2">
                      {sale.customer_name || 'Walk-in'}
                      {sale.customer_phone ? (
                        <div className="text-[11px] text-[#6c757d]">
                          {sale.customer_phone}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{sale.items.length}</td>
                    <td className="px-3 py-2">
                      {formatMoney(sale.total_amount)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="rounded-[3px] bg-[#007bff] px-2 py-0.5 text-[12px] text-white"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
        title="Invoice slip"
        subtitle="Olila Glass · ceramic tableware"
      >
        {selectedSale && (
          <>
            <div className="og-slip-canvas">
              <ReceiptSlip
                sale={selectedSale}
                printedAt={selectedSale.date}
              />
            </div>
            <div className="flex justify-center gap-2 border-t border-[#dee2e6] bg-white p-3">
              <Button
                variant="success"
                onClick={() =>
                  printReceipt('invoice-print', `Invoice ${selectedSale.id}`)
                }
              >
                <Printer className="h-4 w-4" />
                Print slip
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedSale(null)}
              >
                Close
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
