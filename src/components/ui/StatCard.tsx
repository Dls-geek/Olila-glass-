import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: Tone;
  hint?: ReactNode;
  className?: string;
}

const iconTones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-sky-50 text-sky-600',
  neutral: 'bg-slate-100 text-slate-600',
};

export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  hint,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-[4px] border border-[#dee2e6] bg-white p-4',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
            iconTones[tone]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
