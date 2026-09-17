import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Search } from 'lucide-react';
import type { Product } from '../../types';
import { formatMoney } from '../../utils/money';
import { suggestProducts } from '../../utils/productSearch';
import { cn } from '../../utils/cn';

type ProductSearchBoxProps = {
  products: Product[];
  value: string;
  onChange: (value: string) => void;
  /** Called when user picks a row (click / Enter). */
  onPick?: (product: Product) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  limit?: number;
  /** Show price + stock in the list (POS). */
  showMeta?: boolean;
  autoFocus?: boolean;
  'aria-label'?: string;
};

export function ProductSearchBox({
  products,
  value,
  onChange,
  onPick,
  placeholder = 'Search name, SKU, group…',
  className,
  inputClassName,
  limit = 12,
  showMeta = true,
  autoFocus,
  'aria-label': ariaLabel = 'Search products',
}: ProductSearchBoxProps) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const hits = suggestProducts(products, value, limit);
  const showList = open && value.trim().length > 0 && hits.length > 0;

  useEffect(() => {
    setActive(0);
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (product: Product) => {
    onChange(product.sku || product.id);
    setOpen(false);
    onPick?.(product);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showList) {
      if (e.key === 'Escape') setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = hits[active] || hits[0];
      if (hit) pick(hit.product);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#6c757d]" />
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          showList ? `${listId}-opt-${active}` : undefined
        }
        aria-label={ariaLabel}
        className={cn(
          'h-9 w-full rounded-[4px] border border-[#ced4da] bg-white pl-8 pr-2 text-[13px] outline-none focus:border-[#00a65a] focus:ring-2 focus:ring-[#00a65a]/20',
          inputClassName
        )}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-1 max-h-72 overflow-auto rounded-md border border-[#dee2e6] bg-white py-1 shadow-lg"
        >
          {hits.map((hit, idx) => {
            const p = hit.product;
            const activeRow = idx === active;
            return (
              <li key={p.id} role="presentation">
                <button
                  type="button"
                  id={`${listId}-opt-${idx}`}
                  role="option"
                  aria-selected={activeRow}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left',
                    activeRow ? 'bg-[#e8f5ee]' : 'hover:bg-[#f8f9fa]'
                  )}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => pick(p)}
                >
                  <span className="min-w-0 flex-1 truncate text-[14px] font-bold leading-snug text-[#111827]">
                    {p.name}
                    <span className="text-[#111827]">
                      {' '}
                      Code: {p.sku || p.id}
                    </span>
                    {showMeta ? (
                      <span className="ml-2 font-bold text-[#15803d]">
                        {formatMoney(p.selling_price)}
                        <span
                          className={
                            p.stock === 0
                              ? ' ml-2 text-[#dc3545]'
                              : ' ml-2 text-[#343a40]'
                          }
                        >
                          Qty {p.stock}
                        </span>
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
