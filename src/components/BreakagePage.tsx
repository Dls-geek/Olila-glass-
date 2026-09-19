import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Package, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Chalan, InventoryLog } from '../types';
import {
  Button,
  Input,
  ModuleHeader,
  ProductSearchBox,
  SectionCard,
  Select,
  StatTile,
  TablePager,
  darkThead,
  zebraRow,
  useToast,
} from './ui';

const COMPANY_OPTIONS = ['Supreme', 'Winner', 'Kleen'];

function shortId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

function pendingQty(log: InventoryLog) {
  return Math.max(0, log.quantity - (Number(log.replaced_qty) || 0));
}

export function BreakagePage({ onViewStock }: { onViewStock?: () => void }) {
  const {
    products,
    inventoryLogs,
    adjustStock,
    receiveBreakageReplacement,
    listChalans,
  } = useApp();
  const toast = useToast();
  const [productSearch, setProductSearch] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('1');
  const [supplier, setSupplier] = useState('');
  const [customSupplier, setCustomSupplier] = useState(false);
  const [chalanId, setChalanId] = useState('');
  const [chalans, setChalans] = useState<Chalan[]>([]);
  const [saving, setSaving] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replaced'>(
    'all'
  );
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [replaceTarget, setReplaceTarget] = useState<InventoryLog | null>(null);
  const [replaceQty, setReplaceQty] = useState('');

  useEffect(() => {
    void listChalans().then(setChalans).catch(() => setChalans([]));
  }, [listChalans]);

  const breaks = useMemo(
    () => inventoryLogs.filter((l) => l.change_type === 'break'),
    [inventoryLogs]
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const list = !q
      ? products.slice(0, 80)
      : products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.sku || '').toLowerCase().includes(q) ||
              p.group.toLowerCase().includes(q)
          )
          .slice(0, 80);
    return list;
  }, [products, productSearch]);

  const selected = products.find((p) => p.id === productId);

  const openChalansForSupplier = useMemo(() => {
    const s = supplier.trim().toLowerCase();
    if (!s) return [];
    return chalans.filter(
      (c) =>
        (c.status === 'open' || c.status === 'partial') &&
        (c.supplier || '').toLowerCase().includes(s)
    );
  }, [chalans, supplier]);

  const filteredBreaks = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    return breaks.filter((l) => {
      const statusOk =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
            ? l.return_status === 'pending'
            : l.return_status === 'replaced';
      if (!statusOk) return false;
      if (!q) return true;
      return (
        l.product_name.toLowerCase().includes(q) ||
        l.date.includes(q) ||
        (l.product_id || '').toLowerCase().includes(q) ||
        (l.supplier || '').toLowerCase().includes(q) ||
        (l.chalan_id || '').toLowerCase().includes(q)
      );
    });
  }, [breaks, listSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBreaks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBreaks.slice(start, start + pageSize);
  }, [filteredBreaks, currentPage, pageSize]);
  const start =
    filteredBreaks.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredBreaks.length);

  const today = new Date().toISOString().split('T')[0];
  const todayUnits = breaks
    .filter((b) => b.date === today)
    .reduce((s, b) => s + b.quantity, 0);
  const totalUnits = breaks.reduce((s, b) => s + b.quantity, 0);
  const pendingUnits = breaks
    .filter((b) => b.return_status === 'pending')
    .reduce((s, b) => s + pendingQty(b), 0);

  const submit = async () => {
    if (!productId) {
      toast.warning('Select a product.');
      return;
    }
    if (!Number(qty) || Number(qty) <= 0) {
      toast.warning('Enter a valid quantity.');
      return;
    }
    setSaving(true);
    try {
      const ok = await adjustStock(productId, Number(qty), 'break', {
        supplier: supplier.trim() || undefined,
        chalanId: chalanId || undefined,
      });
      if (ok) {
        setQty('1');
        setProductSearch('');
        setProductId('');
        setChalanId('');
      }
    } finally {
      setSaving(false);
    }
  };

  const submitReplace = async () => {
    if (!replaceTarget) return;
    const max = pendingQty(replaceTarget);
    const n = Math.floor(Number(replaceQty));
    if (!n || n <= 0) {
      toast.warning('Enter replacement quantity.');
      return;
    }
    if (n > max) {
      toast.warning(`Max ${max} pending.`);
      return;
    }
    setSaving(true);
    try {
      const ok = await receiveBreakageReplacement(replaceTarget.id, n);
      if (ok) {
        setReplaceTarget(null);
        setReplaceQty('');
      }
    } finally {
      setSaving(false);
    }
  };

  const selectOptions = selected
    ? [selected, ...filteredProducts.filter((p) => p.id !== selected.id)]
    : filteredProducts;

  const companySelectValue = customSupplier
    ? '__custom__'
    : COMPANY_OPTIONS.includes(supplier)
      ? supplier
      : supplier
        ? '__custom__'
        : '';

  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Stock · Loss"
        title="Breakage · ভাঙা / নষ্ট"
        accent="amber"
        actions={
          <Button size="sm" variant="info" onClick={() => onViewStock?.()}>
            <Package className="h-3.5 w-3.5" />
            Current Stock
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile label="Today" value={todayUnits} tone="amber" />
        <StatTile label="Total units" value={totalUnits} tone="red" />
        <StatTile label="Pending return" value={pendingUnits} tone="amber" />
        <StatTile label="Entries" value={breaks.length} tone="navy" />
      </div>

      <SectionCard title="Record breakage" accent="navy">
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-bold text-[#212529]">
                Product *
              </label>
              <ProductSearchBox
                products={products}
                value={productSearch}
                onChange={setProductSearch}
                onPick={(p) => {
                  setProductSearch(p.sku || p.id);
                  setProductId(p.id);
                  if (!supplier && p.group) {
                    setCustomSupplier(false);
                    setSupplier(p.group);
                  }
                }}
                placeholder="Name, SKU, group…"
                showMeta={false}
                limit={12}
              />
            </div>
            <Select
              label="Item *"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = products.find((x) => x.id === e.target.value);
                if (p && !supplier) {
                  setCustomSupplier(false);
                  setSupplier(p.group);
                }
              }}
            >
              <option value="">Select product…</option>
              {selectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.group}] {p.sku} — {p.name} · on hand {p.stock}
                </option>
              ))}
            </Select>
            <Input
              label="Quantity *"
              type="number"
              min={1}
              max={selected?.stock}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              hint={
                selected
                  ? `On hand ${selected.stock} · after save ${Math.max(0, selected.stock - (Number(qty) || 0))}`
                  : 'Cannot exceed on-hand stock.'
              }
            />
            {customSupplier ? (
              <Input
                label="Company (for return)"
                value={supplier}
                onChange={(e) => {
                  setSupplier(e.target.value);
                  setChalanId('');
                }}
                placeholder="Supplier / company name"
                hint="Company will replace with good stock later."
              />
            ) : (
              <Select
                label="Company (for return)"
                value={companySelectValue}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setCustomSupplier(true);
                    setSupplier('');
                    setChalanId('');
                  } else {
                    setSupplier(e.target.value);
                    setChalanId('');
                  }
                }}
              >
                <option value="">No company link</option>
                {COMPANY_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="__custom__">Custom…</option>
              </Select>
            )}
            {supplier ? (
              <Select
                label="Link chalan (optional)"
                value={chalanId}
                onChange={(e) => setChalanId(e.target.value)}
                containerClassName="md:col-span-2"
              >
                <option value="">None</option>
                {openChalansForSupplier.map((c) => (
                  <option key={c.id} value={c.id}>
                    {shortId(c.id)} · {c.date} · outstanding {c.remaining_units}
                  </option>
                ))}
              </Select>
            ) : null}
            {customSupplier ? (
              <button
                type="button"
                className="md:col-span-2 text-left text-[12px] font-medium text-[#1a365d] underline-offset-2 hover:underline"
                onClick={() => {
                  setCustomSupplier(false);
                  setSupplier('');
                  setChalanId('');
                }}
              >
                Back to company list
              </button>
            ) : null}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-[#eef1f4] pt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewStock?.()}
            >
              List
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void submit()}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </SectionCard>

      {replaceTarget ? (
        <SectionCard title="Receive replacement" accent="green">
          <div className="space-y-3 p-4">
            <p className="text-[13px] text-[#495057]">
              <strong className="text-[#111827]">{replaceTarget.product_name}</strong>
              {' · '}
              broken {replaceTarget.quantity}
              {' · '}
              pending {pendingQty(replaceTarget)}
              {replaceTarget.supplier
                ? ` · ${replaceTarget.supplier}`
                : ''}
            </p>
            <Input
              label="Replacement qty *"
              type="number"
              min={1}
              max={pendingQty(replaceTarget)}
              value={replaceQty}
              onChange={(e) => setReplaceQty(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setReplaceTarget(null);
                  setReplaceQty('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="success"
                disabled={saving}
                onClick={() => void submitReplace()}
              >
                {saving ? 'Saving…' : 'Save replacement'}
              </Button>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard>
        <div className="flex flex-col gap-2 border-b border-[#eef1f4] px-3 py-2 sm:flex-row sm:items-end">
          <Select
            label="Status"
            value={statusFilter}
            containerClassName="sm:w-40 sm:shrink-0"
            className="h-8 text-[13px]"
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="pending">Pending return</option>
            <option value="replaced">Replaced</option>
          </Select>
          <Select
            label="Show"
            value={String(pageSize)}
            containerClassName="sm:w-28 sm:shrink-0"
            className="h-8 text-[13px]"
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
          <Input
            label="Search"
            value={listSearch}
            onChange={(e) => {
              setListSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Name, SKU, company, date…"
            icon={<Search className="h-3.5 w-3.5" />}
            containerClassName="min-w-0 flex-1"
            className="h-8 text-[13px]"
          />
        </div>

        {breaks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <AlertTriangle className="mx-auto h-9 w-9 text-[#adb5bd]" />
            <p className="mt-3 text-sm font-semibold text-[#495057]">
              No breakage records yet.
            </p>
          </div>
        ) : filteredBreaks.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-[#6c757d]">
            No matching records.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-auto text-[14px] text-[#212529]">
                <thead>
                  <tr className={darkThead}>
                    <th className="w-10">#</th>
                    <th>Date</th>
                    <th>Name</th>
                    <th>Qty</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((log, idx) => {
                    const pending = pendingQty(log);
                    return (
                      <tr
                        key={log.id}
                        className={zebraRow(
                          idx,
                          'cursor-default transition-colors hover:!bg-[#c3e6cb]'
                        )}
                      >
                        <td className="px-3 py-2.5 text-[#495057]">
                          {start + idx}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[13px] font-bold text-[#111827]">
                          {log.date}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-[#111827]">
                          {log.product_name}
                          {log.chalan_id ? (
                            <div className="text-[11px] font-normal text-[#6c757d]">
                              Chalan {shortId(log.chalan_id)}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#dc3545]">
                          −{log.quantity}
                          {(log.replaced_qty || 0) > 0 ? (
                            <span className="ml-1 text-[11px] font-semibold text-[#15803d]">
                              (+{log.replaced_qty})
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.supplier || '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          {log.return_status === 'pending' ? (
                            <span className="rounded border border-[#fd7e14]/40 bg-[#fff7ed] px-2 py-0.5 text-[11px] font-semibold text-[#b35900]">
                              Pending {pending}
                            </span>
                          ) : log.return_status === 'replaced' ? (
                            <span className="rounded border border-[#28a745]/35 bg-[#e8f5ec] px-2 py-0.5 text-[11px] font-semibold text-[#1e7e34]">
                              Replaced
                            </span>
                          ) : (
                            <span className="text-[12px] text-[#6c757d]">—</span>
                          )}
                        </td>
                        <td className="w-0 whitespace-nowrap px-3 py-2.5">
                          {log.return_status === 'pending' && pending > 0 ? (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => {
                                setReplaceTarget(log);
                                setReplaceQty(String(pending));
                              }}
                            >
                              Receive replacement
                            </Button>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TablePager
              start={start}
              end={end}
              total={filteredBreaks.length}
              page={currentPage}
              totalPages={totalPages}
              onPage={setPage}
            />
          </>
        )}
      </SectionCard>
    </div>
  );
}
