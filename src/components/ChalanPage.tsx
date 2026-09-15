import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardList,
  PackageCheck,
  Plus,
  RefreshCw,
  Truck,
  Upload,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Chalan, Product } from '../types';
import { formatMoney } from '../utils/money';
import { Button, Input, Modal, Select } from './ui';

type Tab = 'list' | 'new' | 'paona';

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
  steps: { n: number; title: string; done?: boolean; active?: boolean }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((s) => (
        <div
          key={s.n}
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] ${
            s.done
              ? 'border-[#28a745]/30 bg-[#28a745]/10 text-[#1e7e34]'
              : s.active
                ? 'border-[#00a65a]/40 bg-[#00a65a]/10 text-[#008d4c]'
                : 'border-[#dee2e6] bg-[#f8f9fa] text-[#6c757d]'
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-[11px] font-bold">
            {s.n}
          </span>
          {s.title}
        </div>
      ))}
    </div>
  );
}

export function ChalanPage() {
  const {
    products,
    listChalans,
    getChalan,
    createChalan,
    addChalanPayment,
    receiveChalan,
    uploadPurchaseReceipt,
  } = useApp();
  const payFileRef = useRef<HTMLInputElement>(null);
  const recvFileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('list');
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
  const [listSearch, setListSearch] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listChalans();
    setChalans(list);
    setLoading(false);
  }, [listChalans]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openDetail = async (id: string) => {
    const c = await getChalan(id);
    setDetail(c);
    setShowPay(false);
    setShowRecv(false);
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
    if (!q) return products.slice(0, 80);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          p.group.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      )
      .slice(0, 80);
  }, [products, productSearch]);

  const filteredChalans = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return chalans;
    return chalans.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        (c.supplier || '').toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        c.items.some(
          (i) =>
            i.product_name.toLowerCase().includes(q) ||
            (i.sku || '').toLowerCase().includes(q)
        )
    );
  }, [chalans, listSearch]);

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

  const kpi = useMemo(() => {
    const open = chalans.filter((c) => c.status === 'open' || c.status === 'partial');
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
        setLines([{ productId: '', qty: '', rate: '' }]);
        setSupplier('');
        setNotes('');
        setTab('list');
        await refresh();
        await openDetail(res.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const submitPay = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      let receiptUrl: string | undefined;
      if (payFile) {
        const url = await uploadPurchaseReceipt(payFile);
        if (!url) return;
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
        setShowPay(false);
        setPayAmount('');
        setPayNotes('');
        setPayFile(null);
        await refresh();
        await openDetail(detail.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const submitRecv = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const items = detail.items
        .map((i) => ({
          product_id: i.product_id,
          quantity: Math.floor(Number(recvQty[i.product_id] || 0)),
        }))
        .filter((i) => i.quantity > 0);
      let deliveryPhotoUrl: string | undefined;
      if (recvFile) {
        const url = await uploadPurchaseReceipt(recvFile);
        if (!url) return;
        deliveryPhotoUrl = url;
      }
      const ok = await receiveChalan({
        chalanId: detail.id,
        items,
        notes: recvNotes,
        deliveryPhotoUrl,
      });
      if (ok) {
        setShowRecv(false);
        setRecvNotes('');
        setRecvFile(null);
        await refresh();
        await openDetail(detail.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; hint: string }[] = [
    { id: 'list', label: 'চালান তালিকা', hint: 'All orders' },
    { id: 'new', label: 'নতুন চালান', hint: 'Create order' },
    {
      id: 'paona',
      label: `পাওনা (${paonaRows.length})`,
      hint: 'Not received yet',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Header — DeshiVoj-style bilingual */}
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
              <p className="mt-1 max-w-2xl text-[13px] text-[#6c757d]">
                আগে চালান বানান → পরে কোম্পানিকে টাকা দিন (লিংকড পেমেন্ট) → মাল
                এলে আংশিক/পূর্ণ রিসিভ → বাকিটা পাওনায় থাকবে।
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void refresh()}
                disabled={loading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setTab('new')}>
                <Plus className="h-3.5 w-3.5" />
                নতুন চালান
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <StepHint
              steps={[
                { n: 1, title: 'চালান তৈরি', active: tab === 'new' },
                { n: 2, title: 'পেমেন্ট লিংক', done: kpi.paid > 0 },
                { n: 3, title: 'মাল রিসিভ', done: chalans.some((c) => c.received_units > 0) },
                { n: 4, title: 'পাওনা দেখুন', active: tab === 'paona' },
              ]}
            />
          </div>
        </div>

        {/* KPI strip */}
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

        {/* Segmented tabs */}
        <div className="mx-3 mb-3 flex gap-1 rounded-xl border border-[#dee2e6] bg-[#eef1f4] p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-lg px-3 py-2 text-center transition-colors ${
                tab === t.id
                  ? 'bg-white text-[#1a365d] shadow-sm ring-1 ring-[#dee2e6]'
                  : 'text-[#6c757d] hover:bg-white/60 hover:text-[#343a40]'
              }`}
            >
              <span className="text-sm font-semibold tracking-tight">{t.label}</span>
              <span className="mt-0.5 text-[11px] font-normal text-[#6c757d]">
                {t.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* NEW CHALAN */}
      {tab === 'new' && (
        <div className="overflow-hidden rounded-xl border border-[#dee2e6] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#eef1f4] bg-[#f8fafb] px-4 py-3">
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

          <div className="space-y-3 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
            </div>

            <div className="overflow-hidden rounded-xl border border-[#dee2e6]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-[#f8f9fa] px-3 py-2">
                <p className="text-[13px] font-semibold text-[#1a365d]">
                  লাইন আইটেম · Lines
                </p>
                <p className="text-[12px] text-[#6c757d]">
                  {filledLines.length} ভরা · {draftUnits} পিস
                </p>
              </div>
              <div className="space-y-2 p-3">
                <Input
                  label="পণ্য খুঁজুন (SKU / নাম / গ্রুপ)"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="যেমন: 12703 বা plate বা Supreme"
                />
                <p className="text-[11px] text-[#6c757d]">
                  {productSearch.trim()
                    ? `খুঁজে পাওয়া ${filteredProducts.length}টা (সর্বোচ্চ ৮০)`
                    : 'সার্চ ছাড়া প্রথম ৮০টা দেখাচ্ছে — SKU লিখে খুঁজুন'}
                </p>
                {lines.map((line, idx) => {
                  const filled = Boolean(line.productId && Number(line.qty) > 0);
                  const selected = line.productId
                    ? productById.get(line.productId)
                    : undefined;
                  const options = selected
                    ? [
                        selected,
                        ...filteredProducts.filter((p) => p.id !== selected.id),
                      ]
                    : filteredProducts;
                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-1 items-end gap-2 rounded-lg border p-2 md:grid-cols-12 ${
                        filled
                          ? 'border-l-4 border-l-[#00a65a] border-[#dee2e6] bg-[#f4fbf7]'
                          : 'border-[#e9ecef] bg-white'
                      }`}
                    >
                      <div className="md:col-span-6">
                        <Select
                          label={idx === 0 ? 'পণ্য (SKU / নাম)' : undefined}
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
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          label={idx === 0 ? 'পরিমাণ' : undefined}
                          type="number"
                          min={1}
                          value={line.qty}
                          onChange={(e) => {
                            const next = [...lines];
                            next[idx] = { ...next[idx], qty: e.target.value };
                            setLines(next);
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          label={idx === 0 ? 'রেট (DP)' : undefined}
                          type="number"
                          min={0}
                          value={line.rate}
                          onChange={(e) => {
                            const next = [...lines];
                            next[idx] = { ...next[idx], rate: e.target.value };
                            setLines(next);
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          disabled={lines.length === 1}
                          onClick={() =>
                            setLines(lines.filter((_, i) => i !== idx))
                          }
                        >
                          বাদ
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setLines([...lines, { productId: '', qty: '', rate: '' }])
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  আরও লাইন
                </Button>
              </div>
            </div>
          </div>

          {/* Sticky-ish footer CTA */}
          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-[#dee2e6] bg-white/95 px-4 py-3 backdrop-blur">
            <div>
              <p className="text-[11px] text-[#6c757d]">মোট অর্ডার মূল্য</p>
              <p className="font-mono text-lg font-bold text-[#1a365d]">
                {formatMoney(draftTotal)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setTab('list')}>
                বাতিল
              </Button>
              <Button
                onClick={() => void submitNew()}
                disabled={saving || filledLines.length === 0}
              >
                {saving ? 'সেভ হচ্ছে…' : 'চালান তৈরি করুন'}
              </Button>
            </div>
          </div>
          <p className="border-t border-[#eef1f4] bg-[#fffbeb] px-4 py-2 text-[12px] text-[#92400e]">
            💡 টাকা আলাদা: চালান তৈরির পর ওপেন করে{' '}
            <strong>পেমেন্ট লিংক</strong> যোগ করুন। মাল এলে{' '}
            <strong>রিসিভ</strong> করুন — বাকিটা পাওনায় থাকবে।
          </p>
        </div>
      )}

      {/* LIST */}
      {tab === 'list' && (
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
            <Input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="চালান / কোম্পানি / SKU খুঁজুন…"
              className="max-w-xs"
            />
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
              <Button className="mt-4" onClick={() => setTab('new')}>
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
                onClick={() => setListSearch('')}
              >
                সার্চ মুছুন
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-[13px]">
                <thead>
                  <tr className="sticky top-0 bg-[#1b4f72] text-left text-white">
                    <th className="px-3 py-2.5 font-medium">চালান</th>
                    <th className="px-3 py-2.5 font-medium">তারিখ</th>
                    <th className="px-3 py-2.5 font-medium">কোম্পানি</th>
                    <th className="px-3 py-2.5 font-medium">স্ট্যাটাস</th>
                    <th className="px-3 py-2.5 font-medium">অর্ডার</th>
                    <th className="px-3 py-2.5 font-medium">রিসিভ</th>
                    <th className="px-3 py-2.5 font-medium">পাওনা</th>
                    <th className="px-3 py-2.5 font-medium">পরিশোধ</th>
                    <th className="px-3 py-2.5 font-medium">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChalans.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-b border-[#eef1f4] hover:bg-[#f8fafb] ${
                        c.remaining_units > 0 ? 'border-l-4 border-l-[#fd7e14]' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 font-semibold text-[#1a365d]">
                        {c.id}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex rounded-md border border-[#dee2e6] bg-[#f8f9fa] px-2 py-0.5 font-mono text-[12px]">
                          {c.date}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">{c.supplier || '—'}</td>
                      <td className="px-3 py-2.5">
                        <StatusPill status={c.status} />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-mono tabular-nums">
                          {c.ordered_units}
                        </span>
                        <span className="text-[#6c757d]"> · </span>
                        <span className="font-mono tabular-nums text-[#15803d]">
                          {formatMoney(c.ordered_amount)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">
                        {c.received_units}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold tabular-nums text-[#dc3545]">
                        {c.remaining_units}
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums text-[#15803d]">
                        {formatMoney(c.paid_amount)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void openDetail(c.id)}
                        >
                          খুলুন
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PAONA */}
      {tab === 'paona' && (
        <div className="overflow-hidden rounded-xl border border-[#dee2e6] bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#eef1f4] bg-[#fff7ed] px-4 py-3">
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

          {paonaRows.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <PackageCheck className="mx-auto h-10 w-10 text-[#28a745]" />
              <p className="mt-3 text-sm font-semibold text-[#495057]">
                কোনো পাওনা নেই — সব মাল রিসিভ হয়েছে।
              </p>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => setTab('list')}
              >
                চালান তালিকায় যান
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[13px]">
                <thead>
                  <tr className="bg-[#d97706] text-left text-white">
                    <th className="px-3 py-2.5">চালান</th>
                    <th className="px-3 py-2.5">কোম্পানি</th>
                    <th className="px-3 py-2.5">SKU</th>
                    <th className="px-3 py-2.5">পণ্য</th>
                    <th className="px-3 py-2.5">বাকি পিস</th>
                    <th className="px-3 py-2.5">রেট</th>
                    <th className="px-3 py-2.5">মূল্য</th>
                  </tr>
                </thead>
                <tbody>
                  {paonaRows.map((r) => (
                    <tr
                      key={`${r.chalan_id}-${r.sku}`}
                      className="border-b border-[#eef1f4] hover:bg-[#fffbeb]"
                    >
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          className="font-semibold text-[#007bff]"
                          onClick={() => {
                            setTab('list');
                            void openDetail(r.chalan_id);
                          }}
                        >
                          {r.chalan_id}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      <Modal
        open={detail !== null}
        onClose={() => {
          setDetail(null);
          setShowPay(false);
          setShowRecv(false);
        }}
        title={detail ? `চালান ${detail.id}` : 'চালান'}
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

            <StepHint
              steps={[
                { n: 1, title: 'চালান', done: true },
                {
                  n: 2,
                  title: 'পেমেন্ট',
                  done: detail.paid_amount > 0,
                  active: showPay,
                },
                {
                  n: 3,
                  title: 'রিসিভ',
                  done: detail.received_units > 0 && detail.remaining_units === 0,
                  active: showRecv,
                },
              ]}
            />

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
                  {detail.items.map((i) => (
                    <tr
                      key={i.id}
                      className={`border-t border-[#eef1f4] ${
                        i.remaining_qty > 0 ? 'bg-[#fffbeb]' : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-mono text-[12px]">{i.sku}</td>
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

            {/* Actions */}
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
                ২) পেমেন্ট লিংক করুন
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
                  ৩) মাল রিসিভ করুন
                </Button>
              )}
            </div>

            {/* Payments list */}
            <div className="rounded-xl border border-[#dee2e6] p-3">
              <h3 className="mb-2 text-[14px] font-bold text-[#1a365d]">
                লিংকড পেমেন্ট · Linked payments
              </h3>
              {detail.payments.length === 0 ? (
                <p className="rounded-lg bg-[#f8f9fa] px-3 py-3 text-[13px] text-[#6c757d]">
                  এখনও কোনো পেমেন্ট লিংক নেই। কোম্পানিকে টাকা দিলে উপরের বাটন
                  দিয়ে এখানে রেকর্ড করুন।
                </p>
              ) : (
                <ul className="space-y-1.5 text-[13px]">
                  {detail.payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-[#eef1f4] bg-[#f8fafb] px-3 py-2"
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
                      {p.receipt_url && (
                        <a
                          href={p.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#007bff]"
                        >
                          রসিদ দেখুন
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
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
                    label="পরিমাণ (৳)"
                    type="number"
                    min={1}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="যেমন 50000"
                    hint={`বাকি লিংক: ${formatMoney(Math.max(0, detail.ordered_amount - detail.paid_amount))} (চাইলে আলাদা পরিমাণও দিতে পারেন)`}
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
                    পেমেন্ট সেভ
                  </Button>
                </div>
              </div>
            )}

            {showRecv && (
              <div className="space-y-3 rounded-xl border border-[#00a65a]/30 bg-[#f4fbf7] p-4">
                <div className="flex items-start gap-2">
                  <Truck className="mt-0.5 h-5 w-5 text-[#00a65a]" />
                  <div>
                    <h4 className="font-bold text-[#1a365d]">
                      মাল রিসিভ · Receive goods
                    </h4>
                    <p className="text-[12px] text-[#6c757d]">
                      শুধু যেটা এসেছে সেই পরিমাণ দিন। স্টক এখনই বাড়বে; বাকি পাওনায়
                      থাকবে।
                    </p>
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
