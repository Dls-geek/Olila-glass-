import {
  forwardRef,
  type SelectHTMLAttributes,
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: ReactNode;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, icon, id, containerClassName, children, ...props },
    ref
  ) => {
    const selectId = id || props.name;
    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1 block text-[12px] font-medium text-[#495057]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6c757d]">
              {icon}
            </span>
          )}
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-9 w-full appearance-none rounded-[4px] border border-[#ced4da] bg-white pl-3 pr-8 text-sm text-[#212529]',
              'focus:border-[#80bdff] focus:outline-none focus:ring-2 focus:ring-[#80bdff]/40',
              icon && 'pl-9',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6c757d]" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
