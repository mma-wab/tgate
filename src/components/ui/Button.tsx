import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'soft' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-white shadow-[0_4px_14px_rgba(34,159,216,0.35)] hover:bg-brand-strong hover:shadow-[0_6px_20px_rgba(34,159,216,0.45)]',
  secondary:
    'border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2 shadow-sm',
  ghost: 'text-ink-soft hover:bg-surface-2 hover:text-ink',
  outline: 'border border-line-strong text-ink hover:border-brand hover:bg-brand-soft/40',
  soft: 'bg-brand-soft text-brand-ink hover:bg-brand/15',
  danger: 'bg-danger-soft text-danger hover:bg-danger/20',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px] rounded-xl',
  md: 'h-11 px-5 text-sm rounded-2xl',
  lg: 'h-12 px-6 text-[15px] rounded-2xl',
  icon: 'size-10 rounded-xl',
};

export function buttonStyles(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
}
