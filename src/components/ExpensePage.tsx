import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/money';
import type { Expense, ExpenseType } from '../types';
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

const TYPE_OPTIONS: ExpenseType[] = [
  'Rent',
  'Salary',
  'Transport',
  'Utilities',
  'Packaging',
  'Misc',
];

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

export function ExpensePage() {
  const { listExpenses, addExpense, deleteExpense } = useApp();
  const toast = useToast();
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(monthStartYmd());
  const [toDate, setToDate] = useState(todayYmd());
  const [date, setDate] = useState(todayYmd());
  const [type, setType] = useState<ExpenseType>('Misc');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listExpenses({ from: fromDate, to: toDate });
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const total = useMemo(
    () => rows.reduce((s, r) => s + r.amount, 0),
    [rows]
  );

  const onAdd = async () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.warning('Amount must be greater than 0.');
      return;
    }
    setSaving(true);
    try {
      const ok = await addExpense({
        date,
        type,
        amount: n,
        notes: notes.trim() || undefined,
      });
      if (ok) {
        toast.success('Expense saved.');
        setAmount('');
        setNotes('');
        await refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Expense · Shop costs"
        title="Expense List · খরচ"
        subtitle="ভাড়া, বেতন, ট্রান্সপোর্ট — তারিখ রেঞ্জে দেখুন।"
        accent="amber"
      />

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#dee2e6] bg-white px-4 py-3 shadow-sm">
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-medium text-[#495057]">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 rounded-md border border-[#ced4da] px-2 text-[13px]"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px]">
          <span className="font-medium text-[#495057]">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 rounded-md border border-[#ced4da] px-2 text-[13px]"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Entries" value={rows.length} tone="navy" />
        <StatTile label="Total · মোট" value={formatMoney(total)} tone="amber" />
      </div>

      <SectionCard title="নতুন খরচ · Add" accent="amber">
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as ExpenseType)}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input
            label="Amount (৳)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="flex justify-end border-t border-[#eef1f4] px-4 py-3">
          <Button onClick={() => void onAdd()} disabled={saving}>
            <Plus className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save expense'}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="খরচ তালিকা" accent="navy">
        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-[#6c757d]">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Wallet className="mx-auto h-10 w-10 text-[#adb5bd]" />
            <p className="mt-3 text-sm font-semibold text-[#495057]">
              এই রেঞ্জে কোনো খরচ নেই।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className={darkThead}>
                  <th>#</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} className={zebraRow(idx)}>
                    <td className="px-3 py-2.5 text-[#6c757d]">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-[12px]">{r.date}</td>
                    <td className="px-3 py-2.5 font-semibold">{r.type}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-[#b45309]">
                      {formatMoney(r.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-[#6c757d]">{r.notes || '—'}</td>
                    <td className="px-3 py-2.5">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteId(r.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete expense?"
        description="This entry will be removed permanently."
        confirmLabel="Delete"
        onCancel={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          const ok = await deleteExpense(deleteId);
          setDeleteId(null);
          if (ok) {
            toast.success('Deleted.');
            await refresh();
          }
        }}
      />
    </div>
  );
}
