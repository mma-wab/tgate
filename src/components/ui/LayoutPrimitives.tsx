import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { SketchRuleDashed } from './Doodles';

export function Container({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide';
}) {
  const max = size === 'narrow' ? 'max-w-3xl' : size === 'wide' ? 'max-w-7xl' : 'max-w-5xl';
  return <div className={cn('mx-auto w-full px-5 sm:px-6 lg:px-8', max, className)}>{children}</div>;
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
        'py-9 sm:py-12',
        tone === 'surface' && 'bg-surface',
        tone === 'soft' && 'bg-surface-2/40',
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
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-ink">
          <svg
            viewBox="0 0 24 6"
            className="h-1.5 w-6 text-brand/70"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 3.6c4-1.4 8 1.2 12-.2 4-1.4 8 1 10 .1"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          {eyebrow}
        </span>
      ) : null}
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className={cn('max-w-xl space-y-2.5', align === 'center' && 'mx-auto')}>
          <h2 className="text-[1.55rem] leading-tight sm:text-[1.9rem]">{title}</h2>
          {description ? (
            <p className="text-[13.5px] leading-6 text-muted sm:text-sm">{description}</p>
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
    <div className={cn('bg-surface-2/40', className)}>
      <Container className="py-8 sm:py-10">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-ink">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-[2.6rem]">{title}</h1>
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
  return (
    <div className={cn('py-1', className)} role="presentation">
      <SketchRuleDashed />
    </div>
  );
}
