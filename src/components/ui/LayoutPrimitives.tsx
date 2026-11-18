import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Container({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide';
}) {
  const max = size === 'narrow' ? 'max-w-3xl' : size === 'wide' ? 'max-w-7xl' : 'max-w-6xl';
  return <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', max, className)}>{children}</div>;
}

export function Section({
  children,
  className,
  id,
  tone = 'page',
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: 'page' | 'surface' | 'soft';
}) {
  return (
    <section
      id={id}
      className={cn(
        'py-16 sm:py-20 lg:py-24',
        tone === 'surface' && 'border-y border-line bg-surface',
        tone === 'soft' && 'bg-surface-2/50',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'start',
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'start' | 'center';
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-ink">
          <span className="h-px w-5 bg-brand/60" aria-hidden="true" />
          {eyebrow}
        </span>
      ) : null}
      <div className={cn('flex w-full flex-col gap-6 lg:flex-row lg:items-end lg:justify-between')}>
        <div className={cn('max-w-2xl space-y-3', align === 'center' && 'mx-auto')}>
          <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
          {description ? (
            <p className="text-[15px] leading-7 text-muted">{description}</p>
          ) : null}
        </div>
        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-b border-line bg-surface-2/40', className)}>
      <Container className="py-12 sm:py-16">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-ink">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold sm:text-4xl lg:text-[2.75rem]">{title}</h1>
          {description ? (
            <p className="mt-4 text-[15px] leading-7 text-muted sm:text-base">{description}</p>
          ) : null}
          {children ? <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div> : null}
        </div>
      </Container>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} role="presentation" />;
}
