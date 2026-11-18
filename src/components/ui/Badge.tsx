import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type BadgeTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';

const tones: Record<BadgeTone, string> = {
  brand: 'bg-brand-soft text-brand-ink border-brand/15',
  success: 'bg-success-soft text-success border-success/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  neutral: 'bg-surface-2 text-muted border-line',
  outline: 'bg-transparent text-ink-soft border-line-strong',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
  icon,
  title,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
