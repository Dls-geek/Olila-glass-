import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[4px] border border-[#dee2e6] bg-white',
        interactive && 'hover:shadow-card',
        className
      )}
      {...props}
    />
  );
}

interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({
  className,
  title,
  subtitle,
  action,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b border-[#dee2e6] px-4 py-3',
        className
      )}
      {...props}
    >
      {children ?? (
        <div className="min-w-0">
          {title && (
            <h3 className="text-[16px] font-semibold text-[#212529]">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-[#6c757d]">{subtitle}</p>
          )}
        </div>
      )}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...props} />;
}
