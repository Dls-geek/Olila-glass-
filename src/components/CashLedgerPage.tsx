import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/money';
import type { CashDirection, CashLedgerLine } from '../types';
import {
  Button,
  ConfirmDialog,
  Input,
  ModuleHeader,
  SectionCard,
  Select,
  StatTile,
  darkThead,
  zebraRow,
  useToast,
} from './ui';

function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthStartYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

type DatePreset = 'today' | 'month' | 'all' | 'custom';

function sourceBadge(source: CashLedgerLine['source']) {
  const map: Record<CashLedgerLine['source'], string> = {
    opening: 'Opening',
    sale: 'Sale',
    expense: 'Expense',
    chalan: 'Chalan',
    manual: 'Manual',
  };
  return map[source];
}

export function CashLedgerPage() {
  const {
    getCashLedger,
    updateCashSettings,
    addCashEntry,
    deleteCashEntry,
  } = useApp();
  const toast = useToast();

  const [lines, setLines] = useState<CashLedgerLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(monthStartYmd());
  const [toDate, setToDate] = useState(todayYmd());
  const [preset, setPreset] = useState<DatePreset>('month');
  const [cashIn, setCashIn] = useState(0);
  const [cashOut, setCashOut] = useState(0);
  const [balance, setBalance] = useState(0);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [openingDate, setOpeningDate] = useState(todayYmd());
  const [savingSettings, setSavingSettings] = useState(false);

  const [date, setDate] = useState(todayYmd());
  const [direction, setDirection] = useState<CashDirection>('in');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const applyPreset = (p: DatePreset) => {
    const today = todayYmd();
    setPreset(p);
    if (p === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (p === 'month') {
      setFromDate(monthStartYmd());
      setToDate(today);
    } else if (p === 'all') {
      setFromDate('');
      setToDate('');
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await getCashLedger({
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setLines(data.lines);
      setCashIn(data.totals.cashIn);
      setCashOut(data.totals.cashOut);
      setBalance(data.totals.balance);
      setOpeningBalance(String(data.settings.opening_balance));
      setOpeningDate(data.settings.opening_date);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const onSaveSettings = async () => {
    const n = Number(openingBalance);
    if (!Number.isFinite(n) || n < 0) {
      toast.warning('Opening balance must be 0 or more.');
      return;
    }
    setSavingSettings(true);
    try {
      const ok = await updateCashSettings({
        opening_balance: n,
        opening_date: openingDate,
      });
      if (ok) {
        toast.success('Opening balance saved.');
        await refresh();
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const onAdd = async () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.warning('Amount must be greater than 0.');
      return;
    }
    setSaving(true);
    try {
      const ok = await addCashEntry({
        date,
        direction,
        amount: n,
        note: note.trim() || undefined,
      });
      if (ok) {
        toast.success(direction === 'in' ? 'Cash in recorded.' : 'Cash out recorded.');
        setAmount('');
        setNote('');
        await refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    const ok = await deleteCashEntry(deleteId);
    if (ok) {
      toast.success('Entry deleted.');
      setDeleteId(null);
      await refresh();
    }
  };

  const presetBtn = (p: DatePreset, label: string) => (
    <button
      type="button"
      onClick={() => applyPreset(p)}
      className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition ${
        preset === p
          ? 'bg-[#1a365d] text-white'
          : 'border border-[#ced4da] bg-white text-[#495057] hover:bg-[#f8f9fa]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Expense · Cash"
        title="Cash Ledger · নগদ খাতা"
        subtitle="নগদ বিক্রি, খরচ, চালান পেমেন্ট ও ম্যানুয়াল ইন/আউট — রানিং ব্যালেন্স।"
        accent="green"
      />

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-[#dee2e6] bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-[13px]">
            <span className="font-medium text-[#495057]">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPreset('custom');
              }}
              className="h-9 rounded-md border border-[#ced4da] px-2 text-[13px]"
            />
          </label>
          <label className="flex flex-col gap-1 text-[13px]">
            <span className="font-medium text-[#495057]">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPreset('custom');
              }}
              className="h-9 rounded-md border border-[#ced4da] px-2 text-[13px]"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {presetBtn('today', 'Today')}
          {presetBtn('month', 'This month')}
          {presetBtn('all', 'All time')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile label="Cash in · আসছে" value={formatMoney(cashIn)} tone="green" />
        <StatTile label="Cash out · যাচ্ছে" value={formatMoney(cashOut)} tone="amber" />
        <StatTile label="Balance · ব্যালেন্স" value={formatMoney(balance)} tone="navy" />
        <StatTile label="Lines" value={lines.length} tone="blue" />
      </div>

      <SectionCard title="শুরুর নগদ · Opening balance" accent="navy">
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
          <Input
            label="Opening date"
            type="date"
            value={openingDate}
            onChange={(e) => setOpeningDate(e.target.value)}
          />
          <Input
            label="Opening amount (৳)"
            type="number"
            min={0}
            step="0.01"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              onClick={() => void onSaveSettings()}
              disabled={savingSettings}
              className="w-full md:w-auto"
            >
              {savingSettings ? 'Saving…' : 'Save opening'}
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="ম্যানুয়াল এন্ট্রি · Add cash in / out" accent="green">
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-5">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Select
            label="Direction"
            value={direction}
            onChange={(e) => setDirection(e.target.value as CashDirection)}
          >
            <option value="in">Cash in · আসছে</option>
            <option value="out">Cash out · যাচ্ছে</option>
          </Select>
          <Input
            label="Amount (৳)"
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
          <Input
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
          />
          <div className="flex items-end">
            <Button
              onClick={() => void onAdd()}
              disabled={saving}
              className="w-full"
            >
              {direction === 'in' ? (
                <ArrowDownLeft className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
              {saving ? 'Saving…' : direction === 'in' ? 'Add cash in' : 'Add cash out'}
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Ledger · খাতা" accent="navy">
        {loading ? (
          <p className="px-4 py-8 text-center text-[13px] text-[#6c757d]">
            Loading…
          </p>
        ) : lines.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[#6c757d]">
            No cash movements in this range.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className={darkThead}>
                <tr>
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Source</th>
                  <th className="px-3 py-2 font-semibold">Detail</th>
                  <th className="px-3 py-2 text-right font-semibold">In</th>
                  <th className="px-3 py-2 text-right font-semibold">Out</th>
                  <th className="px-3 py-2 text-right font-semibold">Balance</th>
                  <th className="px-3 py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {lines.map((r, i) => (
                  <tr key={r.id} className={zebraRow(i)}>
                    <td className="px-3 py-2 whitespace-nowrap text-[#495057]">
                      {r.date}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded border border-[#dee2e6] bg-[#f8f9fa] px-1.5 py-0.5 text-[11px] font-semibold text-[#1a365d]">
                        {sourceBadge(r.source)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-[#212529]">{r.label}</div>
                      {r.note ? (
                        <div className="text-[12px] text-[#6c757d]">{r.note}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-[#00a65a]">
                      {r.direction === 'in' && r.source !== 'opening'
                        ? formatMoney(r.amount)
                        : r.source === 'opening'
                          ? formatMoney(r.amount)
                          : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-[#c0392b]">
                      {r.direction === 'out' ? formatMoney(r.amount) : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-[#1a365d]">
                      {formatMoney(r.balance)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.source === 'manual' ? (
                        <button
                          type="button"
                          title="Delete"
                          className="rounded p-1 text-[#adb5bd] hover:bg-[#fdecee] hover:text-[#dc3545]"
                          onClick={() => setDeleteId(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void onDelete()}
        title="Delete cash entry?"
        description="Only manual ledger entries can be deleted. Sales, expenses, and chalan payments stay in their own modules."
        confirmLabel="Delete"
      />
    </div>
  );
}
