import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  icon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, icon, id, containerClassName, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-[13px] font-medium text-[#495057]"
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
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-9 w-full rounded-[4px] border border-[#ced4da] bg-white px-3 text-sm text-[#212529]',
              'placeholder:text-[#adb5bd]',
              'focus:border-[#80bdff] focus:outline-none focus:ring-2 focus:ring-[#80bdff]/40',
              icon && 'pl-9',
              className
            )}
            {...props}
          />
        </div>
        {hint && <p className="mt-1 text-xs text-[#6c757d]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
