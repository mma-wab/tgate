import type { ComponentType, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Button, buttonStyles } from './Button';
import { useI18n } from '../../i18n';
import { AlertIcon, InfoIcon, RefreshIcon } from './SketchIcons';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} aria-hidden="true" />;
}

export function EmptyState({
  icon: Icon = InfoIcon,
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
    <div className={cn('sketch-dashed px-6 py-10 text-center sm:px-10', className)}>
      <div className="mx-auto flex max-w-md flex-col items-center">
        <span className="mb-4 flex size-11 items-center justify-center rounded-2xl border border-line bg-surface-2 text-brand">
          <Icon className="size-5" />
        </span>
        <Title className="text-base font-bold">{title}</Title>
        <p className="mt-1.5 text-[13px] leading-6 text-muted">{description}</p>
        {actions ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">{actions}</div>
        ) : null}
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
    <div className="sketch-dashed border-danger/40 bg-danger-soft/30 px-6 py-9 text-center">
      <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertIcon className="size-5" />
      </span>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-xl text-[13px] leading-6 text-muted">{description}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {onRetry ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            iconLeft={<RefreshIcon className="size-3.5" />}
          >
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
    neutral: 'border-line-strong bg-surface-2/60 text-ink-soft',
    brand: 'border-brand/30 bg-brand-soft/70 text-brand-ink',
    warning: 'border-warning/30 bg-warning-soft/70 text-warning',
    danger: 'border-danger/30 bg-danger-soft/70 text-danger',
    success: 'border-success/30 bg-success-soft/70 text-success',
  };
  return (
    <div
      role={tone === 'danger' ? 'alert' : tone === 'warning' ? 'status' : undefined}
      className={cn('sketch-sm px-4 py-3 text-[12.5px] leading-6', tones[tone], className)}
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
