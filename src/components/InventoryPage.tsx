import { useMemo, useRef, useState } from 'react';
import { TrendingDown, TrendingUp, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Product, PurchaseSource } from '../types';
import { parseStockCsv } from '../utils/parseStockCsv';
import { Button, Card, CardHeader, Input, Modal, Select, useToast } from './ui';

const currency = (n: number) => `৳${n.toLocaleString()}`;

type Status = 'good' | 'low' | 'out';
type IntakeMode = 'bulk' | 'csv' | 'purchase' | null;

const getStockStatus = (product: Product): Status => {
  if (product.stock === 0) return 'out';
  if (product.stock <= product.low_stock_alert) return 'low';
  return 'good';
};

export function InventoryPage() {
  const { products, inventoryLogs, adjustStock, recordPurchase, uploadPurchaseReceipt } =
    useApp();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState('10');

  const [intakeMode, setIntakeMode] = useState<IntakeMode>(null);
  const [bulkScope, setBulkScope] = useState<'all' | string>('all');
  const [bulkQty, setBulkQty] = useState('10');
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState<
    { sku: string; quantity: number; product?: Product; ok: boolean }[]
  >([]);
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptName, setReceiptName] = useState('');
  const [saving, setSaving] = useState(false);
  const [purchaseLines, setPurchaseLines] = useState<
    { productId: string; qty: string }[]
  >([{ productId: '', qty: '' }]);

  const groups = useMemo(
    () => Array.from(new Set(products.map((p) => p.group).filter(Boolean))).sort(),
    [products]
  );

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

  const productBySku = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) {
      map.set(p.id, p);
      if (p.sku) map.set(p.sku, p);
    }
    return map;
  }, [products]);

  const resetIntake = () => {
    setIntakeMode(null);
    setBulkScope('all');
    setBulkQty('10');
    setCsvText('');
    setCsvPreview([]);
    setSupplier('');
    setNotes('');
    setReceiptFile(null);
    setReceiptName('');
    setPurchaseLines([{ productId: '', qty: '' }]);
    if (receiptInputRef.current) receiptInputRef.current.value = '';
  };

  const openIntake = (mode: IntakeMode) => {
    resetIntake();
    setIntakeMode(mode);
  };

  const buildCsvPreview = (text: string) => {
    setCsvText(text);
    const { rows, errors } = parseStockCsv(text);
    if (errors.length && rows.length === 0) {
      toast.warning(errors[0]);
      setCsvPreview([]);
      return;
    }
    if (errors.length) {
      toast.warning(`${errors.length} row(s) skipped. Check SKU/qty.`);
    }
    setCsvPreview(
      rows.map((r) => {
        const product = productBySku.get(r.sku);
        return {
          sku: r.sku,
          quantity: r.quantity,
          product,
          ok: Boolean(product),
        };
      })
    );
  };

  const onCsvFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    buildCsvPreview(text);
  };

  const submitIntake = async () => {
    if (!intakeMode) return;
    setSaving(true);
    try {
      let items: { product_id: string; quantity: number }[] = [];
      let source: PurchaseSource = 'purchase';

      if (intakeMode === 'bulk') {
        source = 'bulk';
        const qty = Math.floor(Number(bulkQty));
        if (qty <= 0) {
          toast.warning('Enter a quantity greater than 0.');
          return;
        }
        const list =
          bulkScope === 'all'
            ? products
            : products.filter((p) => p.group === bulkScope);
        if (list.length === 0) {
          toast.warning('No products in this scope.');
          return;
        }
        items = list.map((p) => ({ product_id: p.id, quantity: qty }));
      } else if (intakeMode === 'csv') {
        source = 'csv';
        const okRows = csvPreview.filter((r) => r.ok && r.product);
        if (okRows.length === 0) {
          toast.warning('No matching SKUs to import.');
          return;
        }
        const unknown = csvPreview.filter((r) => !r.ok).length;
        if (unknown) {
          toast.warning(`${unknown} unknown SKU(s) will be skipped.`);
        }
        items = okRows.map((r) => ({
          product_id: r.product!.id,
          quantity: r.quantity,
        }));
      } else {
        source = 'purchase';
        items = purchaseLines
          .map((l) => ({
            product_id: l.productId,
            quantity: Math.floor(Number(l.qty)),
          }))
          .filter((l) => l.product_id && l.quantity > 0);
        if (items.length === 0) {
          toast.warning('Add at least one product line.');
          return;
        }
      }

      let receiptUrl: string | undefined;
      if (receiptFile) {
        const url = await uploadPurchaseReceipt(receiptFile);
        if (!url) return;
        receiptUrl = url;
      }

      const result = await recordPurchase({
        items,
        supplier,
        notes,
        receiptUrl,
        source,
      });
      if (result) resetIntake();
    } finally {
      setSaving(false);
    }
  };

  const intakeTitle =
    intakeMode === 'bulk'
      ? 'Bulk restock'
      : intakeMode === 'csv'
        ? 'Import stock CSV'
        : intakeMode === 'purchase'
          ? 'Company purchase + receipt'
          : '';

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
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="mb-1 text-[18px] font-semibold">Stock</h1>
              <p className="text-[13px] text-[#6c757d]">
                Bulk restock, CSV import, or record a company purchase with receipt
                photo/PDF.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="success" onClick={() => openIntake('bulk')}>
                Bulk restock
              </Button>
              <Button size="sm" variant="info" onClick={() => openIntake('csv')}>
                Import CSV
              </Button>
              <Button size="sm" onClick={() => openIntake('purchase')}>
                <Upload className="h-3.5 w-3.5" />
                Purchase + receipt
              </Button>
            </div>
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
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const base = Math.max(
                  1,
                  Math.min(currentPage - 3, totalPages - 6)
                );
                return base + i;
              })
                .filter((n) => n >= 1 && n <= totalPages)
                .map((n) => (
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
                        ? log.purchase_id
                          ? `Purchase ${log.purchase_id}`
                          : 'Restock'
                        : log.change_type === 'break'
                          ? 'Breakage'
                          : 'Sale'}
                    </p>
                  </div>
                  <span
                    className={
                      log.change_type === 'add'
                        ? 'text-[#28a745]'
                        : 'text-[#dc3545]'
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

      <Modal
        open={intakeMode !== null}
        onClose={resetIntake}
        title={intakeTitle}
        size="lg"
      >
        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
          {intakeMode === 'bulk' && (
            <>
              <Select
                label="Scope"
                value={bulkScope}
                onChange={(e) => setBulkScope(e.target.value)}
              >
                <option value="all">All products ({products.length})</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    Group: {g} (
                    {products.filter((p) => p.group === g).length})
                  </option>
                ))}
              </Select>
              <Input
                label="Quantity to add to each item"
                type="number"
                min={1}
                value={bulkQty}
                onChange={(e) => setBulkQty(e.target.value)}
              />
            </>
          )}

          {intakeMode === 'csv' && (
            <>
              <p className="text-[13px] text-[#6c757d]">
                CSV columns: <code>SKU,quantity</code> (header optional). Example:{' '}
                <code>12703,24</code>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose CSV file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => void onCsvFile(e.target.files?.[0] || null)}
                />
              </div>
              <label className="block text-[13px] font-medium text-[#495057]">
                Or paste CSV
                <textarea
                  value={csvText}
                  onChange={(e) => buildCsvPreview(e.target.value)}
                  rows={5}
                  className="mt-1 w-full rounded-[4px] border border-[#ced4da] p-2 font-mono text-[12px]"
                  placeholder={'SKU,quantity\n12703,24\n12801,12'}
                />
              </label>
              {csvPreview.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-[4px] border border-[#dee2e6] text-[12px]">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#f8f9fa] text-left">
                        <th className="px-2 py-1">SKU</th>
                        <th className="px-2 py-1">Qty</th>
                        <th className="px-2 py-1">Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 50).map((r) => (
                        <tr key={`${r.sku}-${r.quantity}`} className="border-t">
                          <td className="px-2 py-1">{r.sku}</td>
                          <td className="px-2 py-1">{r.quantity}</td>
                          <td
                            className={
                              r.ok
                                ? 'px-2 py-1 text-[#28a745]'
                                : 'px-2 py-1 text-[#dc3545]'
                            }
                          >
                            {r.ok ? r.product?.name : 'Unknown SKU'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvPreview.length > 50 && (
                    <p className="border-t px-2 py-1 text-[#6c757d]">
                      Showing first 50 of {csvPreview.length} rows…
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {intakeMode === 'purchase' && (
            <>
              <p className="text-[13px] text-[#6c757d]">
                When the company gives you a receipt, upload it here and add the
                lines you received.
              </p>
              {purchaseLines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-5">
                  <div className="md:col-span-3">
                    <Select
                      label={idx === 0 ? 'Product' : undefined}
                      value={line.productId}
                      onChange={(e) => {
                        const next = [...purchaseLines];
                        next[idx] = { ...next[idx], productId: e.target.value };
                        setPurchaseLines(next);
                      }}
                    >
                      <option value="">Select product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.group}] {p.sku} — {p.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <Input
                    label={idx === 0 ? 'Qty' : undefined}
                    type="number"
                    min={1}
                    value={line.qty}
                    onChange={(e) => {
                      const next = [...purchaseLines];
                      next[idx] = { ...next[idx], qty: e.target.value };
                      setPurchaseLines(next);
                    }}
                  />
                  <div className={idx === 0 ? 'flex items-end' : ''}>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={purchaseLines.length === 1}
                      onClick={() =>
                        setPurchaseLines(purchaseLines.filter((_, i) => i !== idx))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  setPurchaseLines([...purchaseLines, { productId: '', qty: '' }])
                }
              >
                + Add line
              </Button>
            </>
          )}

          <div className="grid grid-cols-1 gap-3 border-t border-[#dee2e6] pt-3 md:grid-cols-2">
            <Input
              label="Supplier / company (optional)"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Supreme distributor"
            />
            <Input
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <p className="mb-1 text-[13px] font-medium text-[#495057]">
              Company receipt (optional) — photo or PDF
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => receiptInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload receipt
              </Button>
              <input
                ref={receiptInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setReceiptFile(f);
                  setReceiptName(f?.name || '');
                }}
              />
              <span className="text-[12px] text-[#6c757d]">
                {receiptName || 'No file selected'}
              </span>
              {receiptFile && (
                <button
                  type="button"
                  className="text-[12px] text-[#dc3545]"
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptName('');
                    if (receiptInputRef.current) receiptInputRef.current.value = '';
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={resetIntake} disabled={saving}>
              Cancel
            </Button>
            <Button variant="success" onClick={() => void submitIntake()} disabled={saving}>
              {saving ? 'Saving…' : 'Save stock intake'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
