import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { Product } from '../types';
import { Button, Card, CardHeader, Input, Modal } from './ui';

const currency = (n: number) => `৳${n.toLocaleString()}`;

type Status = 'good' | 'low' | 'out';

const getStockStatus = (product: Product): Status => {
  if (product.stock === 0) return 'out';
  if (product.stock <= product.low_stock_alert) return 'low';
  return 'good';
};

export function InventoryPage() {
  const { products, inventoryLogs, adjustStock } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState('10');

  const filteredProducts = products.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.group.toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q);
    const matchesStatus =
      filterStatus === 'all' || getStockStatus(p) === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const start = filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredProducts.length);

  const lowStock = products.filter(
    (p) => p.stock <= p.low_stock_alert && p.stock > 0
  ).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;
  const inStock = products.filter((p) => p.stock > 0).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Total Products', products.length, '#007bff'],
          ['In Stock', inStock, '#28a745'],
          ['Low Stock', lowStock, '#fd7e14'],
          ['Out of Stock', outOfStock, '#dc3545'],
        ].map(([label, value, color]) => (
          <div
            key={String(label)}
            className="rounded-[4px] border border-[#dee2e6] bg-white p-3"
          >
            <p className="text-[12px] text-[#6c757d]">{label}</p>
            <p className="text-2xl font-semibold" style={{ color: String(color) }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-[4px] border border-[#dee2e6] bg-white p-4 lg:col-span-2">
          <h1 className="mb-1 text-[18px] font-semibold">Stock</h1>
          <p className="mb-3 text-[13px] text-[#6c757d]">
            Track plates, cups, and bowls. Use Restock to add qty, or Breakage for chips.
          </p>
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
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-[4px] border border-[#ced4da] px-2"
              >
                <option value="all">All</option>
                <option value="good">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-[13px]">
              Search:
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Name, SKU, group…"
                className="h-8 w-52 rounded-[4px] border border-[#ced4da] px-2"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-[13px]">
              <thead>
                <tr className="bg-[#9e9e9e] text-left text-white">
                  <th className="px-3 py-2 font-medium">SL</th>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Group</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Stock</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-10 text-center text-[#6c757d]"
                    >
                      No stock rows match this filter.
                    </td>
                  </tr>
                ) : null}
                {paged.map((product, idx) => {
                  const status = getStockStatus(product);
                  return (
                    <tr key={product.id} className="border-b border-[#dee2e6]">
                      <td className="px-3 py-2">{start + idx}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={product.image_url}
                            alt=""
                            className="h-9 w-9 rounded object-cover"
                          />
                          <div>
                            <p>{product.name}</p>
                            <p className="text-[11px] text-[#6c757d]">
                              SKU: {product.sku || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">{product.group}</td>
                      <td className="px-3 py-2">{product.category}</td>
                      <td className="px-3 py-2">{product.stock}</td>
                      <td className="px-3 py-2">
                        {status === 'good' && (
                          <span className="rounded-[3px] bg-[#28a745] px-2 py-0.5 text-[12px] text-white">
                            In Stock
                          </span>
                        )}
                        {status === 'low' && (
                          <span className="rounded-[3px] bg-[#fd7e14] px-2 py-0.5 text-[12px] text-white">
                            Low Stock
                          </span>
                        )}
                        {status === 'out' && (
                          <span className="rounded-[3px] bg-[#dc3545] px-2 py-0.5 text-[12px] text-white">
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">{currency(product.selling_price)}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="text-[12px] text-[#007bff]"
                          onClick={() => {
                            setRestockTarget(product);
                            setRestockQty(
                              String(Math.max(product.low_stock_alert, 5))
                            );
                          }}
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <p>
              Showing {start} to {end} of {filteredProducts.length} entries
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

        <Card>
          <CardHeader title="Inventory Logs" />
          <div className="max-h-[28rem] space-y-1 overflow-y-auto p-3">
            {inventoryLogs.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-[#6c757d]">
                No inventory activity yet.
              </p>
            ) : (
              inventoryLogs.slice(0, 15).map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-2 border-b border-[#f1f3f5] py-2 text-[13px]"
              >
                {log.change_type === 'add' ? (
                  <TrendingUp className="h-4 w-4 text-[#28a745]" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-[#dc3545]" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate">{log.product_name}</p>
                  <p className="text-[11px] text-[#6c757d]">
                    {log.date} ·{' '}
                    {log.change_type === 'add'
                      ? 'Restock'
                      : log.change_type === 'break'
                        ? 'Breakage'
                        : 'Sale'}
                  </p>
                </div>
                <span
                  className={
                    log.change_type === 'add' ? 'text-[#28a745]' : 'text-[#dc3545]'
                  }
                >
                  {log.change_type === 'add' ? '+' : '-'}
                  {log.quantity}
                </span>
              </div>
            ))
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={restockTarget !== null}
        onClose={() => setRestockTarget(null)}
        title={restockTarget ? `Restock ${restockTarget.name}` : 'Restock'}
        size="sm"
      >
        <div className="space-y-3 p-4">
          <p className="text-[13px] text-[#6c757d]">
            On hand now: {restockTarget?.stock ?? 0}
          </p>
          <Input
            label="Quantity to add"
            type="number"
            min={1}
            value={restockQty}
            onChange={(e) => setRestockQty(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRestockTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={async () => {
                if (!restockTarget) return;
                const ok = await adjustStock(
                  restockTarget.id,
                  Number(restockQty),
                  'add'
                );
                if (ok) setRestockTarget(null);
              }}
            >
              Add to stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
