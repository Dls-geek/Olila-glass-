import { useCallback, useEffect, useState } from 'react';
import { Shield, UserPlus, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { StaffProfile } from '../types';
import {
  Button,
  Input,
  ModuleHeader,
  SectionCard,
  Select,
  StatTile,
  darkThead,
  zebraRow,
  useToast,
} from './ui';

export function StaffPage() {
  const { user, listStaff, inviteStaff, updateStaffRole } = useApp();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listStaff();
      setStaff(rows);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onInvite = async () => {
    if (!isAdmin) {
      toast.warning('শুধু Admin স্টাফ যোগ করতে পারেন।');
      return;
    }
    setSaving(true);
    try {
      const created = await inviteStaff({ name, email, password, role });
      if (created) {
        toast.success(`${created.name} যোগ হয়েছে।`);
        setName('');
        setEmail('');
        setPassword('');
        setRole('staff');
        await refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const onRoleChange = async (id: string, next: 'admin' | 'staff') => {
    if (!isAdmin) return;
    if (id === user?.id) {
      toast.warning('নিজের রোল এখানে বদলানো যাবে না।');
      return;
    }
    const ok = await updateStaffRole(id, next);
    if (ok) {
      toast.success('রোল আপডেট হয়েছে।');
      await refresh();
    }
  };

  const adminCount = staff.filter((s) => s.role === 'admin').length;
  const staffCount = staff.filter((s) => s.role === 'staff').length;

  return (
    <div className="space-y-3">
      <ModuleHeader
        eyebrow="Settings · Team"
        title="Staff · স্টাফ"
        subtitle="দোকানের ইউজার তৈরি করুন এবং রোল সেট করুন।"
        accent="navy"
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <StatTile label="মোট ইউজার · Total" value={staff.length} tone="navy" />
        <StatTile label="Admin" value={adminCount} tone="green" />
        <StatTile label="Staff" value={staffCount} tone="blue" />
      </div>

      {isAdmin ? (
        <SectionCard title="নতুন স্টাফ · Invite" accent="green">
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
            <Input
              label="Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Karim"
            />
            <Input
              label="Email *"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@shop.com"
            />
            <Input
              label="Temporary password *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
            <Select
              label="Role *"
              value={role}
              onChange={(e) =>
                setRole(e.target.value === 'admin' ? 'admin' : 'staff')
              }
            >
              <option value="staff">Staff · কাউন্টার</option>
              <option value="admin">Admin · মালিক</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 border-t border-[#eef1f4] px-4 py-3">
            <Button onClick={() => void onInvite()} disabled={saving}>
              <UserPlus className="h-4 w-4" />
              {saving ? 'Creating…' : 'Create staff'}
            </Button>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Invite" accent="amber">
          <p className="p-4 text-[13px] text-[#6c757d]">
            স্টাফ অ্যাকাউন্ট তৈরির অনুমতি শুধু Admin-এর আছে।
          </p>
        </SectionCard>
      )}

      <SectionCard title="টিম তালিকা · Team" accent="navy">
        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-[#6c757d]">
            Loading…
          </p>
        ) : staff.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="mx-auto h-10 w-10 text-[#adb5bd]" />
            <p className="mt-3 text-sm font-semibold text-[#495057]">
              কোনো প্রোফাইল নেই।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className={darkThead}>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  {isAdmin ? <th>Action</th> : null}
                </tr>
              </thead>
              <tbody>
                {staff.map((s, idx) => (
                  <tr key={s.id} className={zebraRow(idx)}>
                    <td className="px-3 py-2.5 text-[#6c757d]">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-semibold text-[#1a365d]">
                      <span className="inline-flex items-center gap-1.5">
                        {s.role === 'admin' ? (
                          <Shield className="h-3.5 w-3.5 text-[#00a65a]" />
                        ) : null}
                        {s.name}
                        {s.id === user?.id ? (
                          <span className="rounded bg-[#eef2f7] px-1.5 py-0.5 text-[11px] font-medium text-[#495057]">
                            you
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px]">
                      {s.email || '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded border px-2 py-0.5 text-[12px] font-semibold ${
                          s.role === 'admin'
                            ? 'border-[#28a745]/40 bg-[#e8f5ec] text-[#1e7e34]'
                            : 'border-[#1a365d]/20 bg-[#eef2f7] text-[#1a365d]'
                        }`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px]">
                      {s.created_at.slice(0, 10)}
                    </td>
                    {isAdmin ? (
                      <td className="px-3 py-2.5">
                        {s.id === user?.id ? (
                          <span className="text-[12px] text-[#6c757d]">—</span>
                        ) : (
                          <Select
                            value={s.role}
                            onChange={(e) =>
                              void onRoleChange(
                                s.id,
                                e.target.value === 'admin' ? 'admin' : 'staff'
                              )
                            }
                            containerClassName="w-[120px]"
                          >
                            <option value="staff">staff</option>
                            <option value="admin">admin</option>
                          </Select>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
