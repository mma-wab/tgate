import type { ComponentType, ReactNode } from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button, buttonStyles } from './Button';
import { useI18n } from '../../i18n';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} aria-hidden="true" />;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actions,
  className,
  titleAs: Title = 'h3',
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
  titleAs?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center sm:px-10',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(50%_100%_at_50%_0%,var(--brand-soft),transparent)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-lg flex-col items-center">
        <span className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-line bg-surface-2 text-brand shadow-card">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <Title className="text-lg font-semibold">{title}</Title>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        {actions ? <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">{actions}</div> : null}
      </div>
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
  children,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="rounded-3xl border border-danger/25 bg-danger-soft/40 px-6 py-12 text-center">
      <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        {onRetry ? (
          <Button variant="secondary" onClick={onRetry} iconLeft={<RefreshCw className="size-4" />}>
            {t('common.retry')}
          </Button>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function InlineNote({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: 'neutral' | 'brand' | 'warning' | 'danger' | 'success';
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: 'border-line bg-surface-2/60 text-ink-soft',
    brand: 'border-brand/20 bg-brand-soft/70 text-brand-ink',
    warning: 'border-warning/25 bg-warning-soft/70 text-warning',
    danger: 'border-danger/25 bg-danger-soft/70 text-danger',
    success: 'border-success/25 bg-success-soft/70 text-success',
  };
  return (
    <div
      role={tone === 'danger' ? 'alert' : tone === 'warning' ? 'status' : undefined}
      className={cn('rounded-2xl border px-4 py-3 text-[13px] leading-6', tones[tone], className)}
    >
      {children}
    </div>
  );
}

export function LinkButton({
  href,
  children,
  variant = 'secondary',
  size = 'md',
  className,
  external = true,
  iconLeft,
  iconRight,
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  variant?: Parameters<typeof buttonStyles>[0];
  size?: Parameters<typeof buttonStyles>[1];
  className?: string;
  external?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={buttonStyles(variant, size, className)}
    >
      {iconLeft}
      {children}
      {iconRight}
    </a>
  );
}
