import { useMemo, useState } from 'react';
import { Plus, Printer, Receipt } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/money';
import { printReceipt } from '../utils/printReceipt';
import type { Sale } from '../types';
import { ReceiptSlip } from './ReceiptSlip';
import {
  Button,
  Modal,
  ModuleHeader,
  SectionCard,
  StatTile,
  TablePager,
  TableToolbar,
  darkThead,
  zebraRow,
} from './ui';

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
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      sale.customer_name?.toLowerCase().includes(q) ||
      sale.id.toLowerCase().includes(q) ||
      (sale.customer_phone || '').includes(q);
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
      <ModuleHeader
        eyebrow="Sales · History"
        title="Sale List · বিক্রয় তালিকা"
        subtitle="ইনভয়েস দেখুন, প্রিন্ট করুন, অথবা নতুন সেল শুরু করুন।"
        accent="navy"
        actions={
          <Button size="sm" variant="info" onClick={() => onNewSale?.()}>
            <Plus className="h-3.5 w-3.5" />
            নতুন বিক্রয় · POS
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatTile
          label="মোট আয় · Revenue"
          value={formatMoney(totalSales)}
          tone="green"
        />
        <StatTile
          label="আজকের বিক্রয় · Today"
          value={formatMoney(todaySales)}
          tone="navy"
        />
        <StatTile
          label="ইনভয়েস · Invoices"
          value={sales.length}
          tone="blue"
        />
      </div>

      <SectionCard
        title="বিক্রয় তালিকা · All sales"
        subtitle="তারিখ ও কাস্টমার দিয়ে খুঁজুন।"
        accent="navy"
      >
        <TableToolbar
          pageSize={pageSize}
          onPageSize={(n) => {
            setPageSize(n);
            setPage(1);
          }}
          pageSizeOptions={[10, 25]}
          search={searchTerm}
          onSearch={(v) => {
            setSearchTerm(v);
            setPage(1);
          }}
          searchPlaceholder="Invoice / কাস্টমার…"
          filters={
            <>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-[#ced4da] bg-white px-2 text-[13px]"
                aria-label="Filter by date"
              />
              {dateFilter ? (
                <button
                  type="button"
                  className="text-[13px] text-[#007bff]"
                  onClick={() => setDateFilter('')}
                >
                  Clear date
                </button>
              ) : null}
            </>
          }
        />

        {sales.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Receipt className="mx-auto h-10 w-10 text-[#adb5bd]" />
            <p className="mt-3 text-sm font-semibold text-[#495057]">
              এখনও কোনো বিক্রয় নেই।
            </p>
            <p className="mt-1 text-[13px] text-[#6c757d]">
              POS খুলে প্রথম সেল করুন।
            </p>
            <Button className="mt-4" onClick={() => onNewSale?.()}>
              <Plus className="h-4 w-4" />
              Open POS
            </Button>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-[#495057]">
              খোঁজার সাথে মিলছে না।
            </p>
            <Button
              className="mt-3"
              size="sm"
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
              }}
            >
              ফিল্টার মুছুন
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-[13px]">
                <thead>
                  <tr className={darkThead}>
                    <th>#</th>
                    <th>Invoice</th>
                    <th>তারিখ</th>
                    <th>কাস্টমার</th>
                    <th>Items</th>
                    <th>পেমেন্ট</th>
                    <th>মোট</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((sale, idx) => (
                    <tr key={sale.id} className={zebraRow(idx)}>
                      <td className="px-3 py-2.5 text-[#6c757d]">
                        {start + idx}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px] font-semibold text-[#1a365d]">
                        {sale.id}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex rounded border border-[#dee2e6] bg-white px-2 py-0.5 font-mono text-[12px]">
                          {sale.date}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {sale.customer_name || 'Walk-in · ওয়াক-ইন'}
                        {sale.customer_phone ? (
                          <div className="text-[11px] text-[#6c757d]">
                            {sale.customer_phone}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 font-mono">
                        {sale.items.length}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded border border-[#dee2e6] bg-[#f8f9fa] px-1.5 py-0.5 text-[11px] font-medium">
                          {sale.payment_method || 'Cash'}
                        </span>
                        {sale.paid_amount != null &&
                        sale.paid_amount !== sale.total_amount ? (
                          <div className="mt-0.5 font-mono text-[11px] text-[#6c757d]">
                            recv {formatMoney(sale.paid_amount)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-semibold text-[#15803d]">
                        {formatMoney(sale.total_amount)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Button
                          size="sm"
                          variant="info"
                          onClick={() => setSelectedSale(sale)}
                        >
                          দেখুন
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePager
              start={start}
              end={end}
              total={filteredSales.length}
              page={currentPage}
              totalPages={totalPages}
              onPage={setPage}
            />
          </>
        )}
      </SectionCard>

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
              <ReceiptSlip sale={selectedSale} printedAt={selectedSale.date} />
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
