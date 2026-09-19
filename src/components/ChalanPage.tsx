import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { previewChalanBulkReceive } from '../utils/matchChalanBulkCsv';
import { Button, Input, Modal, Select, TablePager, darkThead, zebraRow, useToast } from './ui';

type ChalanMode = 'list' | 'new' | 'paona' | 'bulkRecv';

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
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkChalanId, setBulkChalanId] = useState('');
  const [bulkPreview, setBulkPreview] = useState<ReturnType<
    typeof previewChalanBulkReceive
  > | null>(null);

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
    setBulkCsvText('');
    setBulkPreview(null);
  };

  const applyBulkCsvToDetail = (text: string) => {
    if (!detail) return;
    setBulkCsvText(text);
    if (!text.trim()) {
      setBulkPreview(null);
      return;
    }
    const preview = previewChalanBulkReceive(text, detail, products);
    setBulkPreview(preview);
    setRecvQty((prev) => ({ ...prev, ...preview.recvQty }));
    if (preview.errors[0]) toast.warning(preview.errors[0]);
    else if (preview.unmatchedLines > 0)
      toast.warning(`${preview.unmatchedLines} SKU(s) not on this PO.`);
    else if (preview.cappedLines > 0)
      toast.info(`${preview.cappedLines} line(s) capped at outstanding qty.`);
    else if (Object.keys(preview.recvQty).length > 0)
      toast.success(`${Object.keys(preview.recvQty).length} line(s) filled.`);
  };

  const openChalansWithOutstanding = useMemo(
    () =>
      chalans.filter(
        (c) =>
          c.remaining_units > 0 &&
          (c.status === 'open' || c.status === 'partial')
      ),
    [chalans]
  );

  const runBulkRecvFromPage = async () => {
    if (!bulkChalanId) {
      toast.warning('Select a purchase order / chalan.');
      return;
    }
    if (!bulkPreview || Object.keys(bulkPreview.recvQty).length === 0) {
      toast.warning('Paste SKU,quantity and preview first.');
      return;
    }
    setSaving(true);
    try {
      const items = Object.entries(bulkPreview.recvQty).map(
        ([product_id, quantity]) => ({
          product_id,
          quantity: Math.floor(Number(quantity)),
        })
      );
      const ok = await receiveChalan({
        chalanId: bulkChalanId,
        items,
        notes: recvNotes,
      });
      if (ok) {
        setBulkCsvText('');
        setBulkPreview(null);
        setRecvNotes('');
        await refresh();
        await openDetail(bulkChalanId);
      }
    } finally {
      setSaving(false);
    }
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
                {
                  n: 6,
                  title: 'Bulk Receive',
                  tone: 'amber',
                  active: mode === 'bulkRecv',
                  onClick: () => onNavigate?.('chalanBulkRecv'),
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
          <div className="flex flex-col gap-2 border-b border-[#eef1f4] px-3 py-2 sm:flex-row sm:items-end">
            <Select
              label="Status"
              value={statusFilter}
              containerClassName="sm:w-44 sm:shrink-0"
              className="h-8 text-[13px]"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All status</option>
              <option value="openish">Open / partial</option>
              <option value="open">Open</option>
              <option value="partial">Partial</option>
              <option value="closed">Closed</option>
            </Select>
            <Input
              label="Search"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Chalan / supplier / SKU…"
              icon={<Search className="h-3.5 w-3.5" />}
              containerClassName="min-w-0 flex-1"
              className="h-8 text-[13px]"
            />
            <Button
              size="sm"
              className="sm:mb-0.5"
              onClick={() => onNavigate?.('chalanNew')}
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
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
                <table className="w-full min-w-[920px] table-auto text-[14px] text-[#212529]">
                  <thead>
                    <tr className={darkThead}>
                      <th className="w-10">#</th>
                      <th>Date</th>
                      <th>Chalan</th>
                      <th>Supplier</th>
                      <th>Order</th>
                      <th>Received</th>
                      <th>Outstanding</th>
                      <th>Paid</th>
                      <th className="w-0 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span>Action</span>
                          <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="h-6 rounded border-0 bg-white/95 px-1 text-[11px] font-medium text-[#212529]"
                            aria-label="Rows per page"
                          >
                            {[10, 25, 50].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </div>
                      </th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedChalans.map((c, idx) => (
                      <tr
                        key={c.id}
                        className={zebraRow(
                          idx,
                          'cursor-default transition-colors hover:!bg-[#c3e6cb]'
                        )}
                      >
                        <td className="px-3 py-2.5 text-[#495057]">
                          {listStart + idx}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[13px] font-bold text-[#111827]">
                          {c.date}
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            title={c.id}
                            className="font-bold text-[#0056b3] hover:underline"
                            onClick={() => void openDetail(c.id)}
                          >
                            {shortId(c.id)}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-[#212529]">
                          {c.supplier || '—'}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#111827]">
                          {c.ordered_units}
                          <span className="text-[#6c757d]"> · </span>
                          {formatMoney(c.ordered_amount)}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#111827]">
                          {c.received_units}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#dc3545]">
                          {c.remaining_units}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#15803d]">
                          {formatMoney(c.paid_amount)}
                        </td>
                        <td className="w-0 whitespace-nowrap px-3 py-2.5">
                          <div className="inline-flex gap-1">
                            <Button
                              size="sm"
                              variant="info"
                              onClick={() => void openDetail(c.id)}
                            >
                              View
                            </Button>
                            {c.remaining_units > 0 ? (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() =>
                                  void openDetail(c.id, { recv: true })
                                }
                              >
                                Receive
                              </Button>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusPill status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePager
                start={listStart}
                end={listEnd}
                total={filteredChalans.length}
                page={listPage}
                totalPages={listTotalPages}
                onPage={setPage}
              />
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
              <div className="flex flex-col gap-2 border-b border-[#eef1f4] px-3 py-2 sm:flex-row sm:items-end">
                <Select
                  label="Show"
                  value={String(pageSize)}
                  containerClassName="sm:w-28 sm:shrink-0"
                  className="h-8 text-[13px]"
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  {[10, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] table-auto text-[14px] text-[#212529]">
                  <thead>
                    <tr className={darkThead}>
                      <th className="w-10">#</th>
                      <th>Chalan</th>
                      <th>Supplier</th>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Outstanding</th>
                      <th>Rate</th>
                      <th>Value</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedPaona.map((r, idx) => (
                      <tr
                        key={`${r.chalan_id}-${r.product_id}`}
                        className={zebraRow(
                          idx,
                          'cursor-default transition-colors hover:!bg-[#c3e6cb]'
                        )}
                      >
                        <td className="px-3 py-2.5 text-[#495057]">
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
                        <td className="px-3 py-2.5 font-mono text-[13px] font-bold text-[#111827]">
                          {r.sku || '—'}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-[#111827]">
                          {r.product_name}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#dc3545]">
                          {r.remaining}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#111827]">
                          {formatMoney(r.unit_rate)}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#111827]">
                          {formatMoney(r.remaining * r.unit_rate)}
                        </td>
                        <td className="w-0 whitespace-nowrap px-3 py-2.5">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              void openDetail(r.chalan_id, { recv: true })
                            }
                          >
                            Receive
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePager
                start={paonaStart}
                end={paonaEnd}
                total={paonaRows.length}
                page={paonaPageSafe}
                totalPages={paonaTotalPages}
                onPage={setPaonaPage}
              />
            </>
          )}
        </div>
      )}

      {mode === 'bulkRecv' && (
        <div className="overflow-hidden rounded-xl border border-[#dee2e6] bg-white shadow-sm">
          <div className="border-b border-[#eef1f4] bg-[#f4fbf7] px-4 py-3">
            <h2 className="text-[15px] font-bold text-[#1a365d]">
              Bulk receive · বাল্ক রিসিভ
            </h2>
            <p className="text-[12px] text-[#6c757d]">
              After PO, paste the SKUs you received. Qty caps at outstanding.
            </p>
          </div>
          <div className="space-y-4 p-4">
            <Select
              label="Purchase order / chalan *"
              value={bulkChalanId}
              onChange={(e) => {
                setBulkChalanId(e.target.value);
                setBulkCsvText('');
                setBulkPreview(null);
                if (e.target.value) void openDetail(e.target.value);
              }}
            >
              <option value="">Select chalan with outstanding…</option>
              {openChalansWithOutstanding.map((c) => (
                <option key={c.id} value={c.id}>
                  {shortId(c.id)} · {c.date} · {c.supplier || '—'} · outstanding{' '}
                  {c.remaining_units}
                </option>
              ))}
            </Select>
            <div>
              <label className="mb-1 block text-[12px] font-bold text-[#212529]">
                Paste CSV (SKU,quantity)
              </label>
              <textarea
                value={bulkCsvText}
                onChange={(e) => {
                  const text = e.target.value;
                  setBulkCsvText(text);
                  if (!bulkChalanId || !text.trim()) {
                    setBulkPreview(null);
                    return;
                  }
                  const c =
                    detail?.id === bulkChalanId
                      ? detail
                      : chalans.find((x) => x.id === bulkChalanId);
                  if (!c) return;
                  // Prefer full detail with items
                  void (async () => {
                    const full =
                      detail?.id === bulkChalanId
                        ? detail
                        : await getChalan(bulkChalanId);
                    if (!full) return;
                    setDetail(full);
                    const preview = previewChalanBulkReceive(
                      text,
                      full,
                      products
                    );
                    setBulkPreview(preview);
                  })();
                }}
                rows={6}
                className="w-full rounded-[4px] border border-[#ced4da] p-2 font-mono text-[13px]"
                placeholder={'SKU,quantity\n81290,12\n851445,6'}
                disabled={!bulkChalanId}
              />
            </div>
            <Input
              label="Notes (optional)"
              value={recvNotes}
              onChange={(e) => setRecvNotes(e.target.value)}
            />
            {bulkPreview && bulkPreview.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-[#dee2e6]">
                <table className="w-full text-[14px] text-[#212529]">
                  <thead>
                    <tr className={darkThead}>
                      <th>SKU</th>
                      <th>Name</th>
                      <th>Requested</th>
                      <th>Will receive</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkPreview.rows.map((r, idx) => (
                      <tr key={`${r.sku}-${idx}`} className={zebraRow(idx)}>
                        <td className="px-3 py-2.5 font-mono font-bold">
                          {r.sku}
                        </td>
                        <td className="px-3 py-2.5">
                          {r.product_name || '—'}
                        </td>
                        <td className="px-3 py-2.5 font-mono">{r.requested}</td>
                        <td className="px-3 py-2.5 font-mono font-bold">
                          {r.applied}
                        </td>
                        <td
                          className={
                            r.status === 'ok'
                              ? 'px-3 py-2.5 text-[#28a745]'
                              : r.status === 'capped'
                                ? 'px-3 py-2.5 text-[#b35900]'
                                : 'px-3 py-2.5 text-[#dc3545]'
                          }
                        >
                          {r.status}
                          {r.note ? ` · ${r.note}` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : openChalansWithOutstanding.length === 0 ? (
              <p className="text-sm text-[#6c757d]">
                No open chalans with outstanding qty. Create a PO first.
              </p>
            ) : null}
            <div className="flex justify-end gap-2 border-t border-[#eef1f4] pt-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onNavigate?.('chalan')}
              >
                Back to list
              </Button>
              <Button
                size="sm"
                variant="success"
                disabled={
                  saving ||
                  !bulkPreview ||
                  Object.keys(bulkPreview.recvQty).length === 0
                }
                onClick={() => void runBulkRecvFromPage()}
              >
                {saving ? 'Saving…' : 'Receive matched lines'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={detail !== null}
        onClose={() => {
          setDetail(null);
          setShowPay(false);
          setShowRecv(false);
        }}
        title={detail ? `Chalan ${shortId(detail.id)}` : 'Chalan'}
        subtitle={
          detail
            ? `${detail.date} · ${detail.supplier || 'No supplier'} · Outstanding ${detail.remaining_units} pcs`
            : undefined
        }
        size="xl"
      >
        {detail && (
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-3 py-2">
                <p className="text-[11px] text-[#6c757d]">Status</p>
                <div className="mt-1">
                  <StatusPill status={detail.status} />
                </div>
              </div>
              <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-3 py-2">
                <p className="text-[11px] text-[#6c757d]">Order</p>
                <p className="mt-0.5 font-mono font-bold text-[#15803d]">
                  {formatMoney(detail.ordered_amount)}
                </p>
              </div>
              <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-3 py-2">
                <p className="text-[11px] text-[#6c757d]">Paid</p>
                <p className="mt-0.5 font-mono font-bold text-[#1b4f72]">
                  {formatMoney(detail.paid_amount)}
                </p>
              </div>
              <div className="rounded-lg border border-[#dee2e6] bg-[#f8f9fa] px-3 py-2">
                <p className="text-[11px] text-[#6c757d]">Outstanding</p>
                <p className="mt-0.5 font-mono font-bold text-[#dc3545]">
                  {detail.remaining_units} pcs
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                size="sm"
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
                Link payment
              </Button>
              {detail.remaining_units > 0 && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => {
                    setShowRecv(true);
                    setShowPay(false);
                  }}
                >
                  <Truck className="h-4 w-4" />
                  Receive goods
                </Button>
              )}
            </div>

            <div className="overflow-x-auto rounded-md border border-[#dee2e6]">
              <table className="w-full text-[14px] text-[#212529]">
                <thead>
                  <tr className={darkThead}>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Ordered</th>
                    <th>Received</th>
                    <th>Outstanding</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((i, idx) => (
                    <tr
                      key={i.id}
                      className={zebraRow(
                        idx,
                        'cursor-default transition-colors hover:!bg-[#c3e6cb]'
                      )}
                    >
                      <td className="px-3 py-2.5 font-mono text-[13px] font-bold text-[#111827]">
                        {i.sku}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-[#111827]">
                        {i.product_name}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold">
                        {i.ordered_qty}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold">
                        {i.received_qty}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#dc3545]">
                        {i.remaining_qty}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold">
                        {formatMoney(i.unit_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto rounded-md border border-[#dee2e6]">
              <table className="w-full text-[14px] text-[#212529]">
                <thead>
                  <tr className={darkThead}>
                    <th>Linked payments</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-sm text-[#6c757d]"
                      >
                        No payments linked yet. Due{' '}
                        {formatMoney(
                          Math.max(
                            0,
                            detail.ordered_amount - detail.paid_amount
                          )
                        )}
                        .
                      </td>
                    </tr>
                  ) : (
                    detail.payments.map((p, idx) => (
                      <tr key={p.id} className={zebraRow(idx)}>
                        <td className="px-3 py-2.5 font-mono text-[13px] font-bold text-[#111827]">
                          {p.paid_at}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-[#15803d]">
                          {formatMoney(p.amount)}
                        </td>
                        <td className="px-3 py-2.5">{p.method}</td>
                        <td className="px-3 py-2.5">
                          {p.receipt_url ? (
                            <a
                              href={p.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[13px] font-medium text-[#007bff] hover:underline"
                            >
                              Open
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {showPay && (
              <div className="rounded-md border border-[#dee2e6] bg-white p-4">
                <h4 className="text-[13px] font-semibold tracking-wide text-[#1a365d]">
                  Link payment
                </h4>
                <p className="mt-1 text-[12px] text-[#6c757d]">
                  Order {formatMoney(detail.ordered_amount)} · paid{' '}
                  {formatMoney(detail.paid_amount)} · due{' '}
                  {formatMoney(
                    Math.max(0, detail.ordered_amount - detail.paid_amount)
                  )}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label="Amount (৳) *"
                    type="number"
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="50000"
                  />
                  <Select
                    label="Method"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                  >
                    <option>Cash</option>
                    <option>bKash</option>
                    <option>Bank</option>
                    <option>Card</option>
                  </Select>
                  <Input
                    label="Notes"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Reference"
                    containerClassName="md:col-span-2"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => payFileRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Receipt
                  </Button>
                  <input
                    ref={payFileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setPayFile(e.target.files?.[0] || null)}
                  />
                  <span className="text-[12px] text-[#6c757d]">
                    {payFile?.name || 'Optional'}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[#eef1f4] pt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowPay(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void submitPay()}
                    disabled={saving}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}

            {showRecv && (
              <div className="rounded-md border border-[#dee2e6] bg-white p-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h4 className="text-[13px] font-semibold tracking-wide text-[#1a365d]">
                      Receive goods
                    </h4>
                    <p className="mt-1 text-[12px] text-[#6c757d]">
                      Enter qty received. Leftover stays outstanding from
                      supplier.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={fillAllRemaining}
                    >
                      Fill remaining
                    </Button>
                    <Button size="sm" variant="ghost" onClick={clearRecvQty}>
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-2 rounded-md border border-[#dee2e6] bg-[#f8fafb] p-3">
                  <p className="text-[12px] font-semibold text-[#1a365d]">
                    Bulk paste · SKU,quantity
                  </p>
                  <textarea
                    value={bulkCsvText}
                    onChange={(e) => applyBulkCsvToDetail(e.target.value)}
                    rows={3}
                    className="w-full rounded-[4px] border border-[#ced4da] p-2 font-mono text-[12px]"
                    placeholder={'SKU,quantity\n81290,12\n851445,6'}
                  />
                  {bulkPreview && bulkPreview.rows.length > 0 ? (
                    <div className="max-h-40 overflow-auto rounded border border-[#dee2e6] bg-white text-[12px]">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[#f8f9fa] text-left">
                            <th className="px-2 py-1">SKU</th>
                            <th className="px-2 py-1">Req</th>
                            <th className="px-2 py-1">Apply</th>
                            <th className="px-2 py-1">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkPreview.rows.map((r) => (
                            <tr
                              key={`${r.sku}-${r.requested}`}
                              className="border-t"
                            >
                              <td className="px-2 py-1 font-mono">{r.sku}</td>
                              <td className="px-2 py-1">{r.requested}</td>
                              <td className="px-2 py-1">{r.applied}</td>
                              <td
                                className={
                                  r.status === 'ok'
                                    ? 'px-2 py-1 text-[#28a745]'
                                    : r.status === 'capped'
                                      ? 'px-2 py-1 text-[#b35900]'
                                      : 'px-2 py-1 text-[#dc3545]'
                                }
                              >
                                {r.status}
                                {r.note ? ` · ${r.note}` : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 space-y-3">
                  {detail.items
                    .filter((i) => i.remaining_qty > 0)
                    .map((i) => (
                      <div
                        key={i.id}
                        className="grid grid-cols-1 gap-4 md:grid-cols-2"
                      >
                        <Input
                          label="Product"
                          value={`${i.sku} — ${i.product_name} (outstanding ${i.remaining_qty})`}
                          readOnly
                        />
                        <Input
                          label="Receive qty *"
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
                    label="Notes"
                    value={recvNotes}
                    onChange={(e) => setRecvNotes(e.target.value)}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => recvFileRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Delivery photo
                  </Button>
                  <input
                    ref={recvFileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setRecvFile(e.target.files?.[0] || null)}
                  />
                  <span className="text-[12px] text-[#6c757d]">
                    {recvFile?.name || 'Optional'}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[#eef1f4] pt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowRecv(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => void submitRecv()}
                    disabled={saving}
                  >
                    Save
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
