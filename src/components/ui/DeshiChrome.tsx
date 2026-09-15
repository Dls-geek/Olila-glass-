import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import type { Product } from '../../types';
import { Button } from './Button';
import { ProductSearchBox } from './ProductSearchBox';
import { cn } from '../../utils/cn';

export function StatTile({
  label,
  value,
  hint,
  tone = 'navy',
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'navy' | 'green' | 'amber' | 'red' | 'blue';
}) {
  const tones = {
    navy: 'from-[#1b4f72] to-[#163a54]',
    green: 'from-[#00a65a] to-[#008d4c]',
    amber: 'from-[#d97706] to-[#b45309]',
    red: 'from-[#dc3545] to-[#c82333]',
    blue: 'from-[#007bff] to-[#0056b3]',
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

export function ModuleHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  accent = 'green',
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  accent?: 'green' | 'navy' | 'amber';
}) {
  const accents = {
    green: 'from-[#f4fbf7] to-white',
    navy: 'from-[#f0f7fb] to-white',
    amber: 'from-[#fff7ed] to-white',
  };
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-[#dee2e6] bg-white shadow-sm'
      )}
    >
      <div
        className={cn(
          'border-b border-[#eef1f4] bg-gradient-to-r px-4 py-3',
          accents[accent]
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#00a65a]">
              {eyebrow}
            </p>
            <h1 className="mt-0.5 text-[20px] font-bold text-[#1a365d]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 max-w-2xl text-[13px] text-[#6c757d]">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  accent = 'navy',
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: 'navy' | 'green' | 'amber' | 'red';
  actions?: ReactNode;
  children: ReactNode;
}) {
  const bar = {
    navy: 'bg-[#1b4f72]',
    green: 'bg-[#00a65a]',
    amber: 'bg-[#d97706]',
    red: 'bg-[#dc3545]',
  };
  return (
    <div className="overflow-hidden rounded-xl border border-[#dee2e6] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef1f4] bg-[#f8fafb] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={cn('h-8 w-1 rounded-full', bar[accent])} />
          <div>
            <h2 className="text-[15px] font-bold text-[#1a365d]">{title}</h2>
            {subtitle ? (
              <p className="text-[12px] text-[#6c757d]">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function TableToolbar({
  pageSize,
  onPageSize,
  pageSizeOptions = [10, 25, 50],
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  filters,
  suggestProducts,
}: {
  pageSize: number;
  onPageSize: (n: number) => void;
  pageSizeOptions?: number[];
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  /** When set, search shows SKU/name suggestions from the catalog. */
  suggestProducts?: Product[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f4] px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-[13px] text-[#495057]">
          Show
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-8 rounded-md border border-[#ced4da] bg-white px-2 text-[13px]"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          entries
        </label>
        {filters}
      </div>
      <label className="flex items-center gap-2 text-[13px] text-[#495057]">
        Search:
        {suggestProducts ? (
          <ProductSearchBox
            products={suggestProducts}
            value={search}
            onChange={onSearch}
            placeholder={searchPlaceholder}
            className="w-56 sm:w-72"
            inputClassName="h-8 pl-8 text-[13px]"
            showMeta={false}
            limit={10}
            aria-label="Search name or SKU"
          />
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6c757d]" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 w-48 rounded-md border border-[#ced4da] bg-white pl-7 pr-2 text-[13px] outline-none focus:border-[#00a65a] sm:w-60"
            />
          </div>
        )}
      </label>
    </div>
  );
}

export function TablePager({
  start,
  end,
  total,
  page,
  totalPages,
  onPage,
}: {
  start: number;
  end: number;
  total: number;
  page: number;
  totalPages: number;
  onPage: (n: number) => void;
}) {
  const nums: number[] = [];
  const maxShow = Math.min(totalPages, 5);
  let from = Math.max(1, page - 2);
  const to = Math.min(totalPages, from + maxShow - 1);
  from = Math.max(1, to - maxShow + 1);
  for (let i = from; i <= to; i++) nums.push(i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f4] px-4 py-3 text-[13px] text-[#495057]">
      <p>
        Showing {start} to {end} of {total} entries
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        {nums.map((n) => (
          <Button
            key={n}
            size="sm"
            variant={n === page ? 'primary' : 'secondary'}
            onClick={() => onPage(n)}
          >
            {n}
          </Button>
        ))}
        <Button
          size="sm"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export const darkThead =
  'bg-[#343a40] text-left text-white [&>th]:px-3 [&>th]:py-2.5 [&>th]:font-medium';

export function zebraRow(idx: number, extra = '') {
  return cn(
    'border-b border-[#eef1f4] hover:bg-[#f0f7fb]',
    idx % 2 ? 'bg-[#f8f9fa]' : 'bg-white',
    extra
  );
}
