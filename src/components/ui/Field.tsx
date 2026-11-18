import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertCircle, Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

const controlBase =
  'w-full rounded-xl border bg-surface text-sm text-ink shadow-[0_1px_2px_rgba(23,43,77,0.03)] transition-colors placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:opacity-60';

const errorRing = 'border-danger/60 focus:border-danger focus:ring-danger/10';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optionalLabel?: string;
  children: ReactNode;
  className?: string;
  hintId: string;
  errorId: string;
}

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  optionalLabel,
  children,
  className,
  hintId,
  errorId,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        ) : optionalLabel ? (
          <span className="text-[11px] font-normal text-muted">({optionalLabel})</span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-xs leading-5 text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-xs leading-5 text-danger" role="alert">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  optionalLabel?: string;
  containerClassName?: string;
}

export function Input({
  label,
  hint,
  error,
  optionalLabel,
  id,
  className,
  containerClassName,
  required,
  ...props
}: InputProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optionalLabel={optionalLabel}
      className={containerClassName}
      hintId={`${fieldId}-hint`}
      errorId={`${fieldId}-error`}
    >
      <input
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(controlBase, 'h-11 px-3.5', error && errorRing, className)}
        {...props}
      />
    </FieldShell>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  optionalLabel?: string;
  containerClassName?: string;
}

export function Textarea({
  label,
  hint,
  error,
  optionalLabel,
  id,
  className,
  containerClassName,
  required,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optionalLabel={optionalLabel}
      className={containerClassName}
      hintId={`${fieldId}-hint`}
      errorId={`${fieldId}-error`}
    >
      <textarea
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(controlBase, 'min-h-28 resize-y px-3.5 py-2.5 leading-6', error && errorRing, className)}
        {...props}
      />
    </FieldShell>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  optionalLabel?: string;
  containerClassName?: string;
}

export function Select({
  label,
  hint,
  error,
  optionalLabel,
  id,
  className,
  containerClassName,
  required,
  children,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optionalLabel={optionalLabel}
      className={containerClassName}
      hintId={`${fieldId}-hint`}
      errorId={`${fieldId}-error`}
    >
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(
            controlBase,
            'h-11 cursor-pointer appearance-none ps-3.5 pe-10',
            error && errorRing,
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
  id,
  error,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  id?: string;
  error?: string;
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div>
      <label
        htmlFor={fieldId}
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-xl border bg-surface p-3.5 text-[13px] leading-6 text-ink-soft transition hover:border-line-strong',
          error ? 'border-danger/60' : 'border-line',
        )}
      >
        <input
          id={fieldId}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
        />
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition',
            checked
              ? 'border-brand bg-brand text-white dark:text-[#04121d]'
              : 'border-line-strong bg-surface text-transparent',
          )}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </span>
        <span className="min-w-0 flex-1">{children}</span>
      </label>
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-danger">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
