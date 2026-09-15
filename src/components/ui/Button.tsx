import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

type Variant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'info'
  | 'warning';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[#007bff] text-white hover:bg-[#0069d9] border border-[#007bff]',
  secondary:
    'bg-white text-[#212529] border border-[#ced4da] hover:bg-[#f8f9fa]',
  ghost: 'bg-transparent text-[#495057] hover:bg-[#f1f3f5]',
  danger: 'bg-[#dc3545] text-white hover:bg-[#c82333] border border-[#dc3545]',
  success: 'bg-[#28a745] text-white hover:bg-[#218838] border border-[#28a745]',
  info: 'bg-[#17a2b8] text-white hover:bg-[#138496] border border-[#17a2b8]',
  warning: 'bg-[#fd7e14] text-white hover:bg-[#e36b05] border border-[#fd7e14]',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-[13px] gap-1',
  md: 'h-9 px-3.5 text-sm gap-1.5',
  lg: 'h-10 px-5 text-[15px] gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-[4px] font-medium transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-60',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
