import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'soft' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const base =
  'inline-flex select-none items-center justify-center gap-2 font-semibold transition-all duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45';

const variants: Record<ButtonVariant, string> = {
  primary:
    'sketch-pill border-brand-strong bg-brand text-white hover:bg-brand-strong hover:border-brand-strong',
  secondary:
    'sketch-pill border-line-strong bg-surface text-ink hover:border-brand/60 hover:bg-brand-soft/50',
  ghost: 'rounded-2xl text-ink-soft hover:bg-surface-2 hover:text-ink',
  outline:
    'sketch-pill border-line-strong bg-transparent text-ink hover:border-brand/60 hover:bg-brand-soft/40',
  soft: 'sketch-pill border-transparent bg-brand-soft text-brand-ink hover:border-brand/30',
  danger: 'sketch-pill border-danger/30 bg-danger-soft text-danger hover:border-danger/50',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-6 text-[15px]',
  icon: 'size-11 rounded-2xl',
};

export function buttonStyles(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(base, variants[variant], sizes[size], className);
}

function SketchSpinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-4 animate-spin', className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3.4a8.6 8.6 0 1 0 8.5 9.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
    </svg>
  );
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
      {loading ? <SketchSpinner /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
}
