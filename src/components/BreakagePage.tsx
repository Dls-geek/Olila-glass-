import { useMemo, useState } from 'react';
import { AlertTriangle, Package, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Button,
  Input,
  ModuleHeader,
  SectionCard,
  Select,
  StatTile,
  TablePager,
  darkThead,
  zebraRow,
  useToast,
} from './ui';

export function BreakagePage({ onViewStock }: { onViewStock?: () => void }) {
  const { products, inventoryLogs, adjustStock } = useApp();
  const toast = useToast();
  const [productSearch, setProductSearch] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('1');
  const [saving, setSaving] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

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

  const filteredBreaks = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return breaks;
    return breaks.filter(
      (l) =>
        l.product_name.toLowerCase().includes(q) ||
        l.date.includes(q) ||
        (l.product_id || '').toLowerCase().includes(q)
    );
  }, [breaks, listSearch]);

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

  const submit = async () => {
    if (!productId) {
      toast.warning('পণ্য সিলেক্ট করুন।');
      return;
    }
    if (!Number(qty) || Number(qty) <= 0) {
      toast.warning('সঠিক পরিমাণ দিন।');
      return;
    }
    setSaving(true);
    try {
      const ok = await adjustStock(productId, Number(qty), 'break');
      if (ok) {
        toast.success('ভাঙা/নষ্ট রেকর্ড হয়েছে।');
        setQty('1');
      } else {
        toast.error('সেভ হয়নি — স্টক চেক করুন।');
      }
    } finally {
      setSaving(false);
    }
  };

  const selectOptions = selected
    ? [selected, ...filteredProducts.filter((p) => p.id !== selected.id)]
    : filteredProducts;

  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Stock · Loss"
        title="Breakage · ভাঙা / নষ্ট"
        subtitle="চিপ/ক্র্যাক হলে এখানে রেকর্ড করুন — স্টক সাথে সাথে কমবে।"
        accent="amber"
        actions={
          <Button size="sm" variant="secondary" onClick={() => onViewStock?.()}>
            <Package className="h-3.5 w-3.5" />
            স্টক দেখুন
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatTile label="আজকের ভাঙা · Today" value={todayUnits} tone="amber" />
        <StatTile label="মোট ইউনিট · Total" value={totalUnits} tone="red" />
        <StatTile
          label="রেকর্ড · Entries"
          value={breaks.length}
          tone="navy"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SectionCard
            title="রেকর্ড করুন · Record"
            subtitle="SKU খুঁজে আইটেম বাছুন।"
            accent="red"
          >
            <div className="space-y-3 p-4">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-[#495057]">
                  পণ্য খুঁজুন
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6c757d]" />
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="SKU / নাম / গ্রুপ…"
                    className="h-9 w-full rounded-md border border-[#ced4da] bg-white pl-8 pr-2 text-sm outline-none focus:border-[#00a65a]"
                  />
                </div>
              </div>
              <Select
                label="আইটেম *"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">সিলেক্ট করুন…</option>
                {selectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.group}] {p.sku} — {p.name} · on hand {p.stock}
                  </option>
                ))}
              </Select>
              <Input
                label="ভাঙা পরিমাণ *"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
              {selected && (
                <p className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-3 py-2 text-[13px] text-[#6c757d]">
                  সেভের পর থাকবে:{' '}
                  <strong className="text-[#1a365d]">
                    {Math.max(0, selected.stock - (Number(qty) || 0))}
                  </strong>
                </p>
              )}
              <Button
                variant="danger"
                onClick={() => void submit()}
                disabled={saving}
              >
                <AlertTriangle className="h-4 w-4" />
                {saving ? 'সেভ হচ্ছে…' : 'ভাঙা সেভ করুন'}
              </Button>
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-3">
          <SectionCard
            title="ইতিহাস · Breakage history"
            subtitle="সাম্প্রতিক ভাঙা/নষ্ট রেকর্ড।"
            accent="amber"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f4] px-4 py-2.5">
              <label className="flex items-center gap-1.5 text-[13px] text-[#495057]">
                Show
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 rounded-md border border-[#ced4da] bg-white px-2 text-[13px]"
                >
                  {[10, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                entries
              </label>
              <label className="flex items-center gap-2 text-[13px] text-[#495057]">
                Search:
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6c757d]" />
                  <input
                    value={listSearch}
                    onChange={(e) => {
                      setListSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="পণ্য / তারিখ…"
                    className="h-8 w-44 rounded-md border border-[#ced4da] bg-white pl-7 pr-2 text-[13px] outline-none focus:border-[#00a65a]"
                  />
                </div>
              </label>
            </div>

            {breaks.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <AlertTriangle className="mx-auto h-9 w-9 text-[#adb5bd]" />
                <p className="mt-3 text-sm font-semibold text-[#495057]">
                  এখনও কোনো ভাঙা রেকর্ড নেই।
                </p>
              </div>
            ) : filteredBreaks.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-[#6c757d]">
                খোঁজার সাথে মিলছে না।
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-[13px]">
                    <thead>
                      <tr className={darkThead}>
                        <th>#</th>
                        <th>তারিখ</th>
                        <th>পণ্য</th>
                        <th>পরিমাণ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((log, idx) => (
                        <tr key={log.id} className={zebraRow(idx)}>
                          <td className="px-3 py-2.5 text-[#6c757d]">
                            {start + idx}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[12px]">
                            {log.date}
                          </td>
                          <td className="px-3 py-2.5">{log.product_name}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-[#dc3545]">
                            −{log.quantity}
                          </td>
                        </tr>
                      ))}
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
      </div>
    </div>
  );
}
