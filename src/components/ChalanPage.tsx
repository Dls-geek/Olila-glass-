import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardList,
  List,
  PackageCheck,
  Plus,
  RefreshCw,
  Save,
  Search,
  Truck,
  Upload,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Chalan, Product } from '../types';
import { formatMoney } from '../utils/money';
import { cn } from '../utils/cn';
import { Button, Input, Modal, Select, useToast } from './ui';

type ChalanMode = 'list' | 'new' | 'paona';

type DraftLine = {
  productId: string;
  qty: string;
  rate: string;
};

const STATUS_BN: Record<string, string> = {
  open: 'খোলা · Open',
  partial: 'আংশিক · Partial',
  closed: 'শেষ · Closed',
  cancelled: 'বাতিল · Cancelled',
};

const statusClass: Record<string, string> = {
  open: 'border-[#17a2b8]/40 bg-[#17a2b8]/10 text-[#0e6675]',
  partial: 'border-[#fd7e14]/40 bg-[#fd7e14]/10 text-[#b35900]',
  closed: 'border-[#28a745]/35 bg-[#28a745]/10 text-[#1e7e34]',
  cancelled: 'border-[#6c757d]/35 bg-[#6c757d]/10 text-[#495057]',
};

function StatTile({
  label,
  value,
  hint,
  tone = 'navy',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'navy' | 'green' | 'amber' | 'red';
}) {
  const tones = {
    navy: 'from-[#1b4f72] to-[#163a54]',
    green: 'from-[#00a65a] to-[#008d4c]',
    amber: 'from-[#d97706] to-[#b45309]',
    red: 'from-[#dc3545] to-[#c82333]',
  };
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${tones[tone]} px-3 py-3 text-white shadow-sm`}
    >
      <p className="text-[11px] font-medium text-white/80">{label}</p>
      <p className="mt-0.5 font-mono text-xl font-bold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-white/70">{hint}</p> : null}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusClass[status] || statusClass.cancelled}`}
    >
      {STATUS_BN[status] || status}
    </span>
  );
}

function StepHint({
  steps,
}: {
  steps: {
    n: number;
    title: string;
    done?: boolean;
    active?: boolean;
    tone?: 'green' | 'navy' | 'amber' | 'red' | 'slate';
    onClick?: () => void;
  }[];
}) {
  const tones = {
    green: {
      base: 'border-[#28a745] bg-[#28a745] text-white',
      muted: 'border-[#a8d5b5] bg-[#e8f5ec] text-[#1e7e34]',
      hover: 'hover:brightness-95',
    },
    navy: {
      base: 'border-[#1a365d] bg-[#1a365d] text-white',
      muted: 'border-[#b8c5d6] bg-[#eef2f7] text-[#1a365d]',
      hover: 'hover:brightness-95',
    },
    amber: {
      base: 'border-[#fd7e14] bg-[#fd7e14] text-white',
      muted: 'border-[#f5c89a] bg-[#fff4e8] text-[#b35900]',
      hover: 'hover:brightness-95',
    },
    red: {
      base: 'border-[#dc3545] bg-[#dc3545] text-white',
      muted: 'border-[#f0b8bd] bg-[#fdecee] text-[#b02a37]',
      hover: 'hover:brightness-95',
    },
    slate: {
      base: 'border-[#6c757d] bg-[#6c757d] text-white',
      muted: 'border-[#dee2e6] bg-[#f8f9fa] text-[#6c757d]',
      hover: 'hover:brightness-95',
    },
  } as const;

  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((s) => {
        const tone = tones[s.tone ?? 'slate'];
        const className = cn(
          'rounded-lg border px-3.5 py-2 text-[13px] font-semibold tracking-wide text-white transition-colors',
          '[font-family:"Segoe_UI",Roboto,system-ui,sans-serif]',
          tone.base,
          s.active || s.done ? 'ring-2 ring-offset-1 ring-black/15' : 'opacity-90',
          s.onClick ? `cursor-pointer ${tone.hover}` : ''
        );
        if (s.onClick) {
          return (
            <button
              key={s.n}
              type="button"
              onClick={s.onClick}
              className={className}
            >
              {s.title}
            </button>
          );
        }
        return (
          <div key={s.n} className={className}>
            {s.title}
          </div>
        );
      })}
    </div>
  );
}

function shortId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

export function ChalanPage({
  mode = 'list',
  onNavigate,
}: {
  mode?: ChalanMode;
  onNavigate?: (page: string) => void;
}) {
  const {
    products,
    listChalans,
    getChalan,
    createChalan,
    addChalanPayment,
    receiveChalan,
    uploadPurchaseReceipt,
  } = useApp();
  const toast = useToast();
  const payFileRef = useRef<HTMLInputElement>(null);
  const recvFileRef = useRef<HTMLInputElement>(null);

  const [chalans, setChalans] = useState<Chalan[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Chalan | null>(null);

  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([
    { productId: '', qty: '', rate: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNotes, setPayNotes] = useState('');
  const [payFile, setPayFile] = useState<File | null>(null);
  const [showPay, setShowPay] = useState(false);

  const [recvQty, setRecvQty] = useState<Record<string, string>>({});
  const [recvNotes, setRecvNotes] = useState('');
  const [recvFile, setRecvFile] = useState<File | null>(null);
  const [showRecv, setShowRecv] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [listSearch, setListSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [paonaPage, setPaonaPage] = useState(1);

  const groups = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.group).filter(Boolean))).sort(),
    [products]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listChalans();
    setChalans(list);
    setLoading(false);
  }, [listChalans]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [listSearch, statusFilter, pageSize]);

  useEffect(() => {
    setPaonaPage(1);
  }, [chalans]);

  const openDetail = async (id: string, opts?: { recv?: boolean }) => {
    const c = await getChalan(id);
    setDetail(c);
    setShowPay(false);
    setShowRecv(Boolean(opts?.recv));
    if (c) {
      const init: Record<string, string> = {};
      for (const item of c.items) {
        init[item.product_id] =
          item.remaining_qty > 0 ? String(item.remaining_qty) : '';
      }
      setRecvQty(init);
    }
  };

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products
      .filter((p) => (groupFilter === 'all' ? true : p.group === groupFilter))
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          p.group.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      })
      .slice(0, 100);
  }, [products, productSearch, groupFilter]);

  const filteredChalans = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    return chalans.filter((c) => {
      const statusOk =
        statusFilter === 'all'
          ? true
          : statusFilter === 'openish'
            ? c.status === 'open' || c.status === 'partial'
            : c.status === statusFilter;
      if (!statusOk) return false;
      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        (c.supplier || '').toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        c.items.some(
          (i) =>
            i.product_name.toLowerCase().includes(q) ||
            (i.sku || '').toLowerCase().includes(q)
        )
      );
    });
  }, [chalans, listSearch, statusFilter]);

  const listTotalPages = Math.max(1, Math.ceil(filteredChalans.length / pageSize));
  const listPage = Math.min(page, listTotalPages);
  const pagedChalans = useMemo(() => {
    const start = (listPage - 1) * pageSize;
    return filteredChalans.slice(start, start + pageSize);
  }, [filteredChalans, listPage, pageSize]);
  const listStart =
    filteredChalans.length === 0 ? 0 : (listPage - 1) * pageSize + 1;
  const listEnd = Math.min(listPage * pageSize, filteredChalans.length);

  const filledLines = lines.filter(
    (l) => l.productId && Math.floor(Number(l.qty)) > 0
  );
  const draftUnits = filledLines.reduce(
    (s, l) => s + (Math.floor(Number(l.qty)) || 0),
    0
  );
  const draftTotal = filledLines.reduce((s, l) => {
    const q = Math.floor(Number(l.qty)) || 0;
    const r = Number(l.rate) || 0;
    return s + q * r;
  }, 0);

  const paonaRows = useMemo(() => {
    const rows: {
      chalan_id: string;
      supplier?: string;
      product_id: string;
      product_name: string;
      sku?: string;
      remaining: number;
      unit_rate: number;
    }[] = [];
    for (const c of chalans) {
      for (const i of c.items) {
        if (i.remaining_qty > 0) {
          rows.push({
            chalan_id: c.id,
            supplier: c.supplier,
            product_id: i.product_id,
            product_name: i.product_name,
            sku: i.sku,
            remaining: i.remaining_qty,
            unit_rate: i.unit_rate,
          });
        }
      }
    }
    return rows;
  }, [chalans]);

  const paonaTotalPages = Math.max(1, Math.ceil(paonaRows.length / pageSize));
  const paonaPageSafe = Math.min(paonaPage, paonaTotalPages);
  const pagedPaona = useMemo(() => {
    const start = (paonaPageSafe - 1) * pageSize;
    return paonaRows.slice(start, start + pageSize);
  }, [paonaRows, paonaPageSafe, pageSize]);
  const paonaStart =
    paonaRows.length === 0 ? 0 : (paonaPageSafe - 1) * pageSize + 1;
  const paonaEnd = Math.min(paonaPageSafe * pageSize, paonaRows.length);
  const paonaValue = paonaRows.reduce(
    (s, r) => s + r.remaining * r.unit_rate,
    0
  );

  const kpi = useMemo(() => {
    const open = chalans.filter(
      (c) => c.status === 'open' || c.status === 'partial'
    );
    const paonaUnits = chalans.reduce((s, c) => s + c.remaining_units, 0);
    const paid = chalans.reduce((s, c) => s + c.paid_amount, 0);
    const ordered = chalans.reduce((s, c) => s + c.ordered_amount, 0);
    return {
      total: chalans.length,
      open: open.length,
      paonaUnits,
      paid,
      ordered,
    };
  }, [chalans]);

  const submitNew = async () => {
    if (filledLines.length === 0) {
      toast.warning('কমপক্ষে একটি পণ্য লাইন যোগ করুন।');
      return;
    }
    setSaving(true);
    try {
      const items = lines
        .map((l) => ({
          product_id: l.productId,
          quantity: Math.floor(Number(l.qty)),
          ...(l.rate !== '' && Number.isFinite(Number(l.rate))
            ? { unit_rate: Number(l.rate) }
            : {}),
        }))
        .filter((l) => l.product_id && l.quantity > 0);
      const res = await createChalan({ items, supplier, notes });
      if (res) {
        toast.success('চালান তৈরি হয়েছে। এখন পেমেন্ট লিংক করুন।');
        setLines([{ productId: '', qty: '', rate: '' }]);
        setSupplier('');
        setNotes('');
        setProductSearch('');
        setGroupFilter('all');
        onNavigate?.('chalan');
        await refresh();
        await openDetail(res.id);
      } else {
        toast.error('চালান তৈরি হয়নি। আবার চেষ্টা করুন।');
      }
    } finally {
      setSaving(false);
    }
  };

  const submitPay = async () => {
    if (!detail) return;
    if (!Number(payAmount) || Number(payAmount) <= 0) {
      toast.warning('সঠিক পেমেন্ট পরিমাণ দিন।');
      return;
    }
    setSaving(true);
    try {
      let receiptUrl: string | undefined;
      if (payFile) {
        const url = await uploadPurchaseReceipt(payFile);
        if (!url) {
          toast.error('রসিদ আপলোড হয়নি।');
          return;
        }
        receiptUrl = url;
      }
      const ok = await addChalanPayment({
        chalanId: detail.id,
        amount: Number(payAmount),
        method: payMethod,
        notes: payNotes,
        receiptUrl,
      });
      if (ok) {
        toast.success('পেমেন্ট লিংক হয়েছে।');
        setShowPay(false);
        setPayAmount('');
        setPayNotes('');
        setPayFile(null);
        await refresh();
        await openDetail(detail.id);
      } else {
        toast.error('পেমেন্ট সেভ হয়নি।');
      }
    } finally {
      setSaving(false);
    }
  };

  const submitRecv = async () => {
    if (!detail) return;
    const items = detail.items
      .map((i) => ({
        product_id: i.product_id,
        quantity: Math.floor(Number(recvQty[i.product_id] || 0)),
      }))
      .filter((i) => i.quantity > 0);
    if (items.length === 0) {
      toast.warning('কমপক্ষে একটি আইটেমের রিসিভ পরিমাণ দিন।');
      return;
    }
    setSaving(true);
    try {
      let deliveryPhotoUrl: string | undefined;
      if (recvFile) {
        const url = await uploadPurchaseReceipt(recvFile);
        if (!url) {
          toast.error('ডেলিভারি ছবি আপলোড হয়নি।');
          return;
        }
        deliveryPhotoUrl = url;
      }
      const ok = await receiveChalan({
        chalanId: detail.id,
        items,
        notes: recvNotes,
        deliveryPhotoUrl,
      });
      if (ok) {
        toast.success('মাল রিসিভ হয়েছে — স্টক আপডেট।');
        setShowRecv(false);
        setRecvNotes('');
        setRecvFile(null);
        await refresh();
        await openDetail(detail.id);
      } else {
        toast.error('রিসিভ হয়নি।');
      }
    } finally {
      setSaving(false);
    }
  };

  const fillAllRemaining = () => {
    if (!detail) return;
    const next: Record<string, string> = {};
    for (const i of detail.items) {
      next[i.product_id] =
        i.remaining_qty > 0 ? String(i.remaining_qty) : '';
    }
    setRecvQty(next);
  };

  const clearRecvQty = () => {
    if (!detail) return;
    const next: Record<string, string> = {};
    for (const i of detail.items) next[i.product_id] = '';
    setRecvQty(next);
  };

  const pageButtons = (current: number, total: number, set: (n: number) => void) => {
    const nums: number[] = [];
    const maxShow = Math.min(total, 5);
    let start = Math.max(1, current - 2);
    const end = Math.min(total, start + maxShow - 1);
    start = Math.max(1, end - maxShow + 1);
    for (let i = start; i <= end; i++) nums.push(i);
    return (
      <div className="flex flex-wrap items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          disabled={current <= 1}
          onClick={() => set(current - 1)}
        >
          Previous
        </Button>
        {nums.map((n) => (
          <Button
            key={n}
            size="sm"
            variant={n === current ? 'primary' : 'secondary'}
            onClick={() => set(n)}
          >
            {n}
          </Button>
        ))}
        <Button
          size="sm"
          variant="secondary"
          disabled={current >= total}
          onClick={() => set(current + 1)}
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-[#dee2e6] bg-white shadow-sm">
        <div className="border-b border-[#eef1f4] bg-gradient-to-r from-[#f4fbf7] to-white px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#00a65a]">
                Stock · Company order
              </p>
              <h1 className="mt-0.5 flex items-center gap-2 text-[20px] font-bold text-[#1a365d]">
                <ClipboardList className="h-5 w-5 text-[#00a65a]" />
                Chalan · চালান ও পাওনা
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void refresh()}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <Button size="sm" onClick={() => onNavigate?.('chalanNew')}>
                <Plus className="h-3.5 w-3.5" />
                নতুন চালান
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <StepHint
              steps={[
                {
                  n: 1,
                  title: 'Overview',
                  tone: 'slate',
                  onClick: () => onNavigate?.('purchaseHome'),
                },
                {
                  n: 2,
                  title: 'Purchase Order',
                  tone: 'green',
                  active: mode === 'new',
                  onClick: () => onNavigate?.('chalanNew'),
                },
                {
                  n: 3,
                  title: 'পেমেন্ট লিংক',
                  tone: 'navy',
                  done: kpi.paid > 0,
                  active: mode === 'list',
                  onClick: () => {
                    onNavigate?.('chalan');
                    toast.info('একটা চালান খুলে পেমেন্ট লিংক করুন।');
                  },
                },
                {
                  n: 4,
                  title: 'মাল রিসিভ',
                  tone: 'amber',
                  done: chalans.some((c) => c.received_units > 0),
                  onClick: () => {
                    onNavigate?.('chalan');
                    toast.info('একটা চালান খুলে মাল রিসিভ করুন।');
                  },
                },
                {
                  n: 5,
                  title: 'পাওনা দেখুন',
                  tone: 'red',
                  active: mode === 'paona',
                  onClick: () => onNavigate?.('chalanPaona'),
                },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 lg:grid-cols-4">
          <StatTile label="মোট চালান · Total" value={kpi.total} tone="navy" />
          <StatTile
            label="খোলা / আংশিক · Open"
            value={kpi.open}
            hint="কাজ চলছে"
            tone="amber"
          />
          <StatTile
            label="পাওনা পিস · Due qty"
            value={kpi.paonaUnits}
            hint="কোম্পানির কাছে বাকি"
            tone="red"
          />
          <StatTile
            label="পরিশোধ · Paid"
            value={formatMoney(kpi.paid)}
            hint={`অর্ডার ${formatMoney(kpi.ordered)}`}
            tone="green"
          />
        </div>
      </div>

      {mode === 'new' && (
        <div className="overflow-hidden rounded-xl border border-[#dee2e6] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef1f4] bg-[#f8fafb] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 rounded-full bg-[#00a65a]" />
              <div>
                <h2 className="text-[15px] font-bold text-[#1a365d]">
                  নতুন চালান · Create order
                </h2>
                <p className="text-[12px] text-[#6c757d]">
                  ক্যাটালগ থেকে আইটেম বাছুন। রেট ডিফল্ট DP — প্রয়োজনে বদলান। এখন
                  স্টক বাড়বে না।
                </p>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onNavigate?.('chalan')}>
              <List className="h-3.5 w-3.5" />
              তালিকা
            </Button>
          </div>

          <div className="space-y-4 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input
                label="কোম্পানি / সাপ্লায়ার"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="যেমন: Supreme ডিস্ট্রিবিউটর"
              />
              <Input
                label="নোট (ঐচ্ছিক)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="অর্ডার সম্পর্কে মন্তব্য"
              />
              <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-3 py-2">
                <p className="text-[11px] text-[#6c757d]">খসড়া মোট</p>
                <p className="font-mono text-lg font-bold text-[#1a365d]">
                  {formatMoney(draftTotal)}
                </p>
                <p className="text-[11px] text-[#6c757d]">
                  {filledLines.length} লাইন · {draftUnits} পিস
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#dee2e6]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-[#f8f9fa] px-3 py-2">
                <p className="text-[13px] font-semibold text-[#1a365d]">
                  লাইন আইটেম · Order lines
                </p>
                <div className="relative min-w-[200px] flex-1 max-w-sm">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6c757d]" />
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="SKU / নাম খুঁজুন…"
                    className="h-8 w-full rounded-md border border-[#ced4da] bg-white pl-8 pr-2 text-[13px] outline-none focus:border-[#00a65a]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 border-b border-[#eef1f4] px-3 py-2">
                <button
                  type="button"
                  onClick={() => setGroupFilter('all')}
                  className={`rounded-md border px-2.5 py-1 text-[12px] font-medium ${
                    groupFilter === 'all'
                      ? 'border-[#00a65a] bg-[#00a65a] text-white'
                      : 'border-[#dee2e6] bg-white text-[#495057]'
                  }`}
                >
                  সব গ্রুপ
                </button>
                {groups.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGroupFilter(g)}
                    className={`rounded-md border px-2.5 py-1 text-[12px] font-medium ${
                      groupFilter === g
                        ? 'border-[#00a65a] bg-[#00a65a] text-white'
                        : 'border-[#dee2e6] bg-white text-[#495057]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-[13px]">
                  <thead>
                    <tr className="bg-[#f1f5f9] text-left text-[#1a365d]">
                      <th className="px-3 py-2 font-semibold">পণ্য *</th>
                      <th className="w-28 px-3 py-2 font-semibold">পরিমাণ *</th>
                      <th className="w-32 px-3 py-2 font-semibold">রেট (DP)</th>
                      <th className="w-32 px-3 py-2 font-semibold">লাইন মোট</th>
                      <th className="w-24 px-3 py-2 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, idx) => {
                      const selected = line.productId
                        ? productById.get(line.productId)
                        : undefined;
                      const options = selected
                        ? [
                            selected,
                            ...filteredProducts.filter(
                              (p) => p.id !== selected.id
                            ),
                          ]
                        : filteredProducts;
                      const qty = Math.floor(Number(line.qty)) || 0;
                      const rate = Number(line.rate) || 0;
                      const lineTotal = qty * rate;
                      return (
                        <tr
                          key={idx}
                          className={`border-t border-[#eef1f4] ${
                            line.productId && qty > 0
                              ? 'bg-[#f4fbf7]'
                              : idx % 2
                                ? 'bg-[#fafbfc]'
                                : 'bg-white'
                          }`}
                        >
                          <td className="px-3 py-2">
                            <Select
                              value={line.productId}
                              onChange={(e) => {
                                const id = e.target.value;
                                const p = productById.get(id);
                                const next = [...lines];
                                next[idx] = {
                                  productId: id,
                                  qty: next[idx].qty,
                                  rate: p ? String(p.purchase_price) : '',
                                };
                                setLines(next);
                              }}
                            >
                              <option value="">সিলেক্ট করুন…</option>
                              {options.map((p) => (
                                <option key={p.id} value={p.id}>
                                  [{p.group}] {p.sku} — {p.name}
                                </option>
                              ))}
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={1}
                              value={line.qty}
                              onChange={(e) => {
                                const next = [...lines];
                                next[idx] = {
                                  ...next[idx],
                                  qty: e.target.value,
                                };
                                setLines(next);
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min={0}
                              value={line.rate}
                              onChange={(e) => {
                                const next = [...lines];
                                next[idx] = {
                                  ...next[idx],
                                  rate: e.target.value,
                                };
                                setLines(next);
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 font-mono tabular-nums">
                            {lineTotal > 0 ? formatMoney(lineTotal) : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={lines.length === 1}
                              onClick={() =>
                                setLines(lines.filter((_, i) => i !== idx))
                              }
                            >
                              বাদ
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#dee2e6] bg-[#f8f9fa] px-3 py-2.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setLines([...lines, { productId: '', qty: '', rate: '' }])
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  আরও লাইন যোগ করুন
                </Button>
                <div className="text-right">
                  <p className="text-[11px] text-[#6c757d]">মোট অর্ডার মূল্য</p>
                  <p className="font-mono text-base font-bold text-[#1a365d]">
                    {formatMoney(draftTotal)}
                  </p>
                </div>
              </div>
            </div>

            <p className="rounded-lg border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[12px] text-[#92400e]">
              টাকা আলাদা: চালান তৈরির পর ওপেন করে <strong>পেমেন্ট লিংক</strong>{' '}
              যোগ করুন। মাল এলে <strong>রিসিভ</strong> — বাকিটা পাওনায় থাকবে।
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-[#eef1f4] pt-4">
              <Button
                onClick={() => void submitNew()}
                disabled={saving || filledLines.length === 0}
              >
                <Save className="h-4 w-4" />
                {saving ? 'সেভ হচ্ছে…' : 'সেভ · চালান তৈরি'}
              </Button>
              <Button variant="success" onClick={() => onNavigate?.('chalan')}>
                <List className="h-4 w-4" />
                তালিকা
              </Button>
            </div>
          </div>
        </div>
      )}

      {mode === 'list' && (
        <div className="overflow-hidden rounded-xl border border-[#dee2e6] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef1f4] bg-[#f8fafb] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 rounded-full bg-[#1b4f72]" />
              <div>
                <h2 className="text-[15px] font-bold text-[#1a365d]">
                  চালান তালিকা · All chalans
                </h2>
                <p className="text-[12px] text-[#6c757d]">
                  খুলে পেমেন্ট যোগ করুন বা মাল রিসিভ করুন।
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => onNavigate?.('chalanNew')}>
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f4] px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-[13px] text-[#495057]">
                Show
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
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
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                containerClassName="w-[160px]"
              >
                <option value="all">সব স্ট্যাটাস</option>
                <option value="openish">খোলা / আংশিক</option>
                <option value="open">খোলা</option>
                <option value="partial">আংশিক</option>
                <option value="closed">শেষ</option>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-[13px] text-[#495057]">
              Search:
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6c757d]" />
                <input
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="চালান / কোম্পানি / SKU…"
                  className="h-8 w-52 rounded-md border border-[#ced4da] bg-white pl-7 pr-2 text-[13px] outline-none focus:border-[#00a65a] sm:w-64"
                />
              </div>
            </label>
          </div>

          {loading ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 px-6 py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-[#00a65a]" />
              <p className="text-sm text-[#6c757d]">চালান লোড হচ্ছে…</p>
            </div>
          ) : chalans.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-[#adb5bd]" />
              <p className="mt-3 text-sm font-semibold text-[#495057]">
                এখনও কোনো চালান নেই।
              </p>
              <p className="mt-1 text-[13px] text-[#6c757d]">
                কোম্পানি থেকে অর্ডার করলে প্রথমে এখানে চালান বানান।
              </p>
              <Button className="mt-4" onClick={() => onNavigate?.('chalanNew')}>
                <Plus className="h-4 w-4" />
                প্রথম চালান তৈরি করুন
              </Button>
            </div>
          ) : filteredChalans.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-semibold text-[#495057]">
                খোঁজার সাথে মিলছে না।
              </p>
              <Button
                className="mt-3"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setListSearch('');
                  setStatusFilter('all');
                }}
              >
                ফিল্টার মুছুন
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-[13px] text-[#212529]">
                  <thead>
                    <tr className="bg-[#1a365d] text-left text-white">
                      <th className="px-3 py-2.5 font-semibold">#</th>
                      <th className="px-3 py-2.5 font-semibold">তারিখ</th>
                      <th className="px-3 py-2.5 font-semibold">চালান</th>
                      <th className="px-3 py-2.5 font-semibold">কোম্পানি</th>
                      <th className="px-3 py-2.5 font-semibold">স্ট্যাটাস</th>
                      <th className="px-3 py-2.5 font-semibold">অর্ডার</th>
                      <th className="px-3 py-2.5 font-semibold">রিসিভ</th>
                      <th className="px-3 py-2.5 font-semibold">পাওনা</th>
                      <th className="px-3 py-2.5 font-semibold">পরিশোধ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedChalans.map((c, idx) => {
                      const rowBg = idx % 2 ? 'bg-[#e9eef3]' : 'bg-white';
                      const accent =
                        c.remaining_units > 0
                          ? 'border-l-4 border-l-[#fd7e14]'
                          : 'border-l-4 border-l-transparent';
                      return (
                        <Fragment key={c.id}>
                          <tr
                            className={`hover:bg-[#dceaf5] ${rowBg} ${accent}`}
                          >
                            <td className="px-3 pt-2.5 pb-1 font-semibold text-[#495057]">
                              {listStart + idx}
                            </td>
                            <td className="px-3 pt-2.5 pb-1">
                              <span className="inline-flex rounded border border-[#1a365d]/25 bg-[#1a365d] px-2 py-0.5 font-mono text-[12px] font-semibold text-white">
                                {c.date}
                              </span>
                            </td>
                            <td className="px-3 pt-2.5 pb-1">
                              <button
                                type="button"
                                title={c.id}
                                className="font-bold text-[#0056b3] hover:underline"
                                onClick={() => void openDetail(c.id)}
                              >
                                {shortId(c.id)}
                              </button>
                            </td>
                            <td className="px-3 pt-2.5 pb-1 font-medium text-[#212529]">
                              {c.supplier || '—'}
                            </td>
                            <td className="px-3 pt-2.5 pb-1">
                              <StatusPill status={c.status} />
                            </td>
                            <td className="px-3 pt-2.5 pb-1">
                              <span className="font-mono font-semibold tabular-nums">
                                {c.ordered_units}
                              </span>
                              <span className="text-[#6c757d]"> · </span>
                              <span className="font-mono font-semibold tabular-nums text-[#0f5132]">
                                {formatMoney(c.ordered_amount)}
                              </span>
                            </td>
                            <td className="px-3 pt-2.5 pb-1 font-mono font-semibold tabular-nums text-[#212529]">
                              {c.received_units}
                            </td>
                            <td className="px-3 pt-2.5 pb-1 font-mono font-bold tabular-nums text-[#b02a37]">
                              {c.remaining_units}
                            </td>
                            <td className="px-3 pt-2.5 pb-1 font-mono font-semibold tabular-nums text-[#0f5132]">
                              {formatMoney(c.paid_amount)}
                            </td>
                          </tr>
                          <tr
                            className={`border-b-2 border-[#ced4da] ${rowBg} ${accent}`}
                          >
                            <td
                              colSpan={9}
                              className="border-t border-[#ced4da]/70 px-3 pb-2.5 pt-1.5"
                            >
                              <div className="flex w-full gap-2">
                                <Button
                                  size="sm"
                                  variant="info"
                                  fullWidth
                                  onClick={() => void openDetail(c.id)}
                                >
                                  খুলুন
                                </Button>
                                {c.remaining_units > 0 ? (
                                  <Button
                                    size="sm"
                                    variant="success"
                                    fullWidth
                                    onClick={() =>
                                      void openDetail(c.id, { recv: true })
                                    }
                                  >
                                    রিসিভ
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    fullWidth
                                    disabled
                                  >
                                    রিসিভ হয়েছে
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f4] px-4 py-3 text-[13px] text-[#495057]">
                <p>
                  Showing {listStart} to {listEnd} of {filteredChalans.length}{' '}
                  entries
                </p>
                {pageButtons(listPage, listTotalPages, setPage)}
              </div>
            </>
          )}
        </div>
      )}

      {mode === 'paona' && (
        <div className="overflow-hidden rounded-xl border border-[#dee2e6] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef1f4] bg-[#fff7ed] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 rounded-full bg-[#d97706]" />
              <div>
                <h2 className="text-[15px] font-bold text-[#1a365d]">
                  কোম্পানির পাওনা · Not yet received
                </h2>
                <p className="text-[12px] text-[#6c757d]">
                  টাকা দিয়েছেন, কিন্তু মাল এখনও আসেনি — সেই বাকি পিসগুলো এখানে।
                </p>
              </div>
            </div>
            {paonaRows.length > 0 && (
              <div className="rounded-lg border border-[#fd7e14]/30 bg-white px-3 py-1.5 text-right">
                <p className="text-[11px] text-[#b35900]">পাওনা মূল্য (আনুমানিক)</p>
                <p className="font-mono font-bold text-[#dc3545]">
                  {formatMoney(paonaValue)}
                </p>
              </div>
            )}
          </div>

          {paonaRows.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <PackageCheck className="mx-auto h-10 w-10 text-[#28a745]" />
              <p className="mt-3 text-sm font-semibold text-[#495057]">
                কোনো পাওনা নেই — সব মাল রিসিভ হয়েছে।
              </p>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => onNavigate?.('chalan')}
              >
                চালান তালিকায় যান
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f4] px-4 py-2.5">
                <label className="flex items-center gap-1.5 text-[13px] text-[#495057]">
                  Show
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
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
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-[13px]">
                  <thead>
                    <tr className="bg-[#d97706] text-left text-white">
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">চালান</th>
                      <th className="px-3 py-2.5">কোম্পানি</th>
                      <th className="px-3 py-2.5">SKU</th>
                      <th className="px-3 py-2.5">পণ্য</th>
                      <th className="px-3 py-2.5">বাকি পিস</th>
                      <th className="px-3 py-2.5">রেট</th>
                      <th className="px-3 py-2.5">মূল্য</th>
                      <th className="px-3 py-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedPaona.map((r, idx) => (
                      <tr
                        key={`${r.chalan_id}-${r.product_id}`}
                        className={`border-b border-[#eef1f4] hover:bg-[#fffbeb] ${
                          idx % 2 ? 'bg-[#fffaf3]' : 'bg-white'
                        }`}
                      >
                        <td className="px-3 py-2.5 text-[#6c757d]">
                          {paonaStart + idx}
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            className="font-semibold text-[#007bff] hover:underline"
                            onClick={() => void openDetail(r.chalan_id)}
                          >
                            {shortId(r.chalan_id)}
                          </button>
                        </td>
                        <td className="px-3 py-2.5">{r.supplier || '—'}</td>
                        <td className="px-3 py-2.5 font-mono text-[12px]">
                          {r.sku || '—'}
                        </td>
                        <td className="px-3 py-2.5">{r.product_name}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#dc3545]">
                          {r.remaining}
                        </td>
                        <td className="px-3 py-2.5 font-mono">
                          {formatMoney(r.unit_rate)}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-semibold">
                          {formatMoney(r.remaining * r.unit_rate)}
                        </td>
                        <td className="px-3 py-2.5">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              void openDetail(r.chalan_id, { recv: true })
                            }
                          >
                            <Truck className="h-3.5 w-3.5" />
                            রিসিভ
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f4] px-4 py-3 text-[13px] text-[#495057]">
                <p>
                  Showing {paonaStart} to {paonaEnd} of {paonaRows.length}{' '}
                  entries
                </p>
                {pageButtons(paonaPageSafe, paonaTotalPages, setPaonaPage)}
              </div>
            </>
          )}
        </div>
      )}

      <Modal
        open={detail !== null}
        onClose={() => {
          setDetail(null);
          setShowPay(false);
          setShowRecv(false);
        }}
        title={detail ? `চালান ${shortId(detail.id)}` : 'চালান'}
        subtitle={
          detail
            ? `${detail.date} · ${detail.supplier || 'কোম্পানি নেই'} · পাওনা ${detail.remaining_units} পিস`
            : undefined
        }
        size="xl"
      >
        {detail && (
          <div className="max-h-[75vh] space-y-4 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-3 py-2">
                <p className="text-[11px] text-[#6c757d]">স্ট্যাটাস</p>
                <div className="mt-1">
                  <StatusPill status={detail.status} />
                </div>
              </div>
              <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-3 py-2">
                <p className="text-[11px] text-[#6c757d]">অর্ডার মূল্য</p>
                <p className="mt-0.5 font-mono font-bold text-[#15803d]">
                  {formatMoney(detail.ordered_amount)}
                </p>
              </div>
              <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-3 py-2">
                <p className="text-[11px] text-[#6c757d]">পরিশোধ</p>
                <p className="mt-0.5 font-mono font-bold text-[#1b4f72]">
                  {formatMoney(detail.paid_amount)}
                </p>
              </div>
              <div className="rounded-lg border border-[#fd7e14]/30 bg-[#fff7ed] px-3 py-2">
                <p className="text-[11px] text-[#b35900]">পাওনা পিস</p>
                <p className="mt-0.5 font-mono text-lg font-bold text-[#dc3545]">
                  {detail.remaining_units}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  const due = Math.max(
                    0,
                    detail.ordered_amount - detail.paid_amount
                  );
                  setPayAmount(due > 0 ? String(Math.round(due)) : '');
                  setShowPay(true);
                  setShowRecv(false);
                }}
              >
                <Wallet className="h-4 w-4" />
                পেমেন্ট লিংক করুন
              </Button>
              {detail.remaining_units > 0 && (
                <Button
                  variant="success"
                  onClick={() => {
                    setShowRecv(true);
                    setShowPay(false);
                  }}
                >
                  <Truck className="h-4 w-4" />
                  মাল রিসিভ করুন
                </Button>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#dee2e6]">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-[#f1f5f9] text-left text-[#1a365d]">
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">নাম</th>
                    <th className="px-3 py-2">অর্ডার</th>
                    <th className="px-3 py-2">রিসিভ</th>
                    <th className="px-3 py-2">পাওনা</th>
                    <th className="px-3 py-2">রেট</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((i, idx) => (
                    <tr
                      key={i.id}
                      className={`border-t border-[#eef1f4] ${
                        i.remaining_qty > 0
                          ? 'bg-[#fffbeb]'
                          : idx % 2
                            ? 'bg-[#fafbfc]'
                            : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-[12px]">
                        {i.sku}
                      </td>
                      <td className="px-3 py-2">{i.product_name}</td>
                      <td className="px-3 py-2 font-mono">{i.ordered_qty}</td>
                      <td className="px-3 py-2 font-mono">{i.received_qty}</td>
                      <td className="px-3 py-2 font-mono font-bold text-[#dc3545]">
                        {i.remaining_qty}
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {formatMoney(i.unit_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[#dee2e6] bg-[#f8fafb] px-3 py-1.5 text-[13px]">
              <span className="shrink-0 font-semibold text-[#1a365d]">
                লিংকড পেমেন্ট · Linked payments
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[11px] text-[#6c757d]">Due</span>
                <strong className="font-mono text-[#b45309]">
                  {formatMoney(
                    Math.max(0, detail.ordered_amount - detail.paid_amount)
                  )}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[11px] text-[#6c757d]">Pending</span>
                <strong className="font-mono text-[#dc3545]">
                  {formatMoney(
                    detail.items.reduce(
                      (sum, i) => sum + i.remaining_qty * i.unit_rate,
                      0
                    )
                  )}
                </strong>
                <span className="text-[11px] text-[#6c757d]">
                  ({detail.remaining_units} pcs)
                </span>
              </span>
              {detail.payments.length === 0 ? (
                <span className="text-[#6c757d]">এখনও কোনো পেমেন্ট নেই</span>
              ) : (
                detail.payments.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex flex-wrap items-center gap-2"
                  >
                    <span className="font-mono text-[12px] text-[#6c757d]">
                      {p.paid_at}
                    </span>
                    <strong className="font-mono text-[#15803d]">
                      {formatMoney(p.amount)}
                    </strong>
                    <span className="rounded border border-[#dee2e6] bg-white px-1.5 py-0.5 text-[11px]">
                      {p.method}
                    </span>
                    {p.receipt_url ? (
                      <a
                        href={p.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] text-[#007bff]"
                      >
                        রসিদ
                      </a>
                    ) : null}
                  </span>
                ))
              )}
            </div>

            {showPay && (
              <div className="space-y-3 rounded-xl border border-[#1b4f72]/25 bg-[#f0f7fb] p-4">
                <div className="flex items-start gap-2">
                  <Wallet className="mt-0.5 h-5 w-5 text-[#1b4f72]" />
                  <div>
                    <h4 className="font-bold text-[#1a365d]">
                      পেমেন্ট যোগ · Link payment
                    </h4>
                    <p className="text-[12px] text-[#6c757d]">
                      এই চালানের সাথে টাকা লিংক হবে (আলাদা এন্ট্রি)। অর্ডার মূল্য{' '}
                      <strong className="text-[#d97706]">
                        {formatMoney(detail.ordered_amount)}
                      </strong>
                      , ইতিমধ্যে পরিশোধ{' '}
                      <strong>{formatMoney(detail.paid_amount)}</strong>।
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Input
                    label="পরিমাণ (৳) *"
                    type="number"
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="যেমন 50000"
                    hint={`বাকি লিংক: ${formatMoney(Math.max(0, detail.ordered_amount - detail.paid_amount))}`}
                  />
                  <Select
                    label="মাধ্যম"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                  >
                    <option>Cash</option>
                    <option>bKash</option>
                    <option>Bank</option>
                    <option>Card</option>
                  </Select>
                </div>
                <Input
                  label="নোট"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="কে টাকা নিলেন / রেফারেন্স"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => payFileRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    পেমেন্ট রসিদ
                  </Button>
                  <input
                    ref={payFileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setPayFile(e.target.files?.[0] || null)}
                  />
                  <span className="text-[12px] text-[#6c757d]">
                    {payFile?.name || 'ঐচ্ছিক'}
                  </span>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowPay(false)}>
                    বাতিল
                  </Button>
                  <Button onClick={() => void submitPay()} disabled={saving}>
                    <Save className="h-4 w-4" />
                    পেমেন্ট সেভ
                  </Button>
                </div>
              </div>
            )}

            {showRecv && (
              <div className="space-y-3 rounded-xl border border-[#00a65a]/30 bg-[#f4fbf7] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Truck className="mt-0.5 h-5 w-5 text-[#00a65a]" />
                    <div>
                      <h4 className="font-bold text-[#1a365d]">
                        মাল রিসিভ · Receive goods
                      </h4>
                      <p className="text-[12px] text-[#6c757d]">
                        শুধু যেটা এসেছে সেই পরিমাণ দিন। স্টক এখনই বাড়বে; বাকি
                        পাওনায় থাকবে।
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={fillAllRemaining}>
                      সব পাওনা ভরুন
                    </Button>
                    <Button size="sm" variant="ghost" onClick={clearRecvQty}>
                      খালি
                    </Button>
                  </div>
                </div>
                {detail.items
                  .filter((i) => i.remaining_qty > 0)
                  .map((i) => (
                    <div
                      key={i.id}
                      className="grid grid-cols-1 items-end gap-2 rounded-lg border border-[#dee2e6] bg-white p-2 md:grid-cols-3"
                    >
                      <p className="text-[13px] md:col-span-2">
                        <span className="font-mono text-[12px] text-[#6c757d]">
                          {i.sku}
                        </span>{' '}
                        — {i.product_name}
                        <span className="ml-1 rounded bg-[#fff7ed] px-1.5 py-0.5 text-[11px] font-semibold text-[#b35900]">
                          পাওনা {i.remaining_qty}
                        </span>
                      </p>
                      <Input
                        label="রিসিভ পরিমাণ"
                        type="number"
                        min={0}
                        max={i.remaining_qty}
                        value={recvQty[i.product_id] || ''}
                        onChange={(e) =>
                          setRecvQty((prev) => ({
                            ...prev,
                            [i.product_id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                <Input
                  label="নোট"
                  value={recvNotes}
                  onChange={(e) => setRecvNotes(e.target.value)}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => recvFileRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    ডেলিভারি ছবি
                  </Button>
                  <input
                    ref={recvFileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setRecvFile(e.target.files?.[0] || null)}
                  />
                  <span className="text-[12px] text-[#6c757d]">
                    {recvFile?.name || 'ঐচ্ছিক'}
                  </span>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowRecv(false)}>
                    বাতিল
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => void submitRecv()}
                    disabled={saving}
                  >
                    রিসিভ নিশ্চিত করুন
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
