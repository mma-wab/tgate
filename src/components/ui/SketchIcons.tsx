import { cn } from '../../lib/cn';

/**
 * One hand-drawn icon family for the whole interface.
 *
 * Every glyph uses the same 24-unit grid, 1.7 stroke, round caps and slightly
 * off-axis coordinates so the set reads as pencil sketches instead of a mix of
 * stock icon styles. Colour always comes from `currentColor`.
 */
interface SketchIconProps {
  className?: string;
}

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function Icon({ className = 'size-5', children }: SketchIconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('shrink-0', className)} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

export function TelegramPlaneIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path
        d="M21.1 3.7 3.1 10.5c-.6.22-.55 1.05.06 1.2l4.3.98.86 4.62c.12.66.96.82 1.31.24l2.16-3.36 3.98 2.94c.56.4 1.32.06 1.42-.62l1.92-11.5c.1-.62-.5-1.1-1.02-.84Z"
        {...strokeProps}
      />
      <path d="M7.5 12.6 20.1 4.5" {...strokeProps} />
      <path d="M8.45 12.62 9.9 16.9" {...strokeProps} />
    </Icon>
  );
}

export function CopyIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path
        d="M9.4 8.4h8.2c1.2 0 2.1.95 2.1 2.1v8.1c0 1.2-.92 2.1-2.1 2.1H9.4c-1.15 0-2.1-.92-2.1-2.1v-8.1c0-1.18.95-2.1 2.1-2.1Z"
        {...strokeProps}
      />
      <path d="M15.6 5.4H6.8c-1.2 0-2.2 1-2.2 2.2v8.6" {...strokeProps} />
    </Icon>
  );
}

export function CheckIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path d="M4.8 12.4 9.3 16.9 19.4 6.4" {...strokeProps} />
    </Icon>
  );
}

export function RefreshIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path d="M19.7 9.1A8 8 0 0 0 5.2 7.4" {...strokeProps} />
      <path d="M20 4.3v5h-5" {...strokeProps} />
      <path d="M4.3 14.9a8 8 0 0 0 14.5 1.7" {...strokeProps} />
      <path d="M4 19.7v-5h5" {...strokeProps} />
    </Icon>
  );
}

export function SearchIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path
        d="M10.7 4.4a6.25 6.25 0 1 1-.1 12.5 6.25 6.25 0 0 1 .1-12.5Z"
        {...strokeProps}
      />
      <path d="M15.35 15.4 19.9 20" {...strokeProps} />
    </Icon>
  );
}

export function CloseIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path d="M6.1 6.2 17.9 17.8" {...strokeProps} />
      <path d="M17.9 6.2 6.2 18" {...strokeProps} />
    </Icon>
  );
}

export function MenuIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path d="M4 7.2c4.6-.5 11.5-.4 16 .1" {...strokeProps} />
      <path d="M4 12.1c4.5-.4 11.4-.3 16 .2" {...strokeProps} />
      <path d="M4 17c4.4-.4 11.5-.3 16 .1" {...strokeProps} />
    </Icon>
  );
}

export function SunIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path d="M12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Z" {...strokeProps} />
      <path d="M12 2.6v2.2M12 19.2v2.2M2.8 12h2.2M19 12h2.2" {...strokeProps} />
      <path d="M5.5 5.6 7 7.1M17 17l1.5 1.5M18.5 5.6 17 7.1M7 17l-1.5 1.5" {...strokeProps} />
    </Icon>
  );
}

export function MoonIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path
        d="M20.2 14.6A8.2 8.2 0 0 1 9.1 3.8a8.4 8.4 0 1 0 11.1 10.8Z"
        {...strokeProps}
      />
    </Icon>
  );
}

export function GlobeIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path d="M12 3.4a8.6 8.6 0 1 1-.2 17.2A8.6 8.6 0 0 1 12 3.4Z" {...strokeProps} />
      <path d="M3.7 12.1c5.4.6 11.1.6 16.5 0" {...strokeProps} />
      <path d="M12 3.5c-2.8 3.1-4.2 6-4.2 8.6 0 2.7 1.4 5.6 4.2 8.5 2.7-2.9 4.1-5.8 4.1-8.5 0-2.6-1.4-5.5-4.1-8.6Z" {...strokeProps} />
    </Icon>
  );
}

export function PinIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path
        d="M12 3.6c3.4 0 6.1 2.7 6.1 6 0 4.3-6.1 10.7-6.1 10.7S5.9 13.9 5.9 9.6c0-3.3 2.7-6 6.1-6Z"
        {...strokeProps}
      />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" {...strokeProps} />
    </Icon>
  );
}

export function BoltIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path d="M13.4 2.9 5.6 13.4h5.3l-1.2 7.7 8-10.7h-5.4l1.1-7.5Z" {...strokeProps} />
    </Icon>
  );
}

export function ShieldIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path
        d="M12 3.2c2.4 1.3 4.8 2 7.2 2.1v6c0 4-3 7.4-7.2 9.5-4.2-2.1-7.2-5.5-7.2-9.5v-6c2.4-.1 4.8-.8 7.2-2.1Z"
        {...strokeProps}
      />
      <path d="M8.9 11.9 11.4 14.4 15.6 9.7" {...strokeProps} />
    </Icon>
  );
}

export function ChevronDownIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path d="M6 9.2c2.1 2.3 4.1 4.4 6 6.4" {...strokeProps} />
      <path d="M18 9.2c-2 2.3-4 4.4-6 6.4" {...strokeProps} />
    </Icon>
  );
}

export function ArrowUpRightIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path d="M6.4 17.7 17.4 6.5" {...strokeProps} />
      <path d="M9.1 6.2h8.5v8.4" {...strokeProps} />
    </Icon>
  );
}

export function ClockIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path d="M12 3.5a8.5 8.5 0 1 1-.2 17 8.5 8.5 0 0 1 .2-17Z" {...strokeProps} />
      <path d="M12 7.4v5l3.2 2.1" {...strokeProps} />
    </Icon>
  );
}

export function InfoIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path d="M12 3.5a8.5 8.5 0 1 1-.2 17 8.5 8.5 0 0 1 .2-17Z" {...strokeProps} />
      <path d="M12 11v5.1" {...strokeProps} />
      <path d="M12 7.7v.1" {...strokeProps} strokeWidth={2.1} />
    </Icon>
  );
}

export function AlertIcon({ className }: SketchIconProps) {
  return (
    <Icon className={className}>
      <path d="M12 4.4c.4 0 .8.2 1 .6l7.3 12.6c.4.7-.1 1.5-.9 1.5H4.6c-.8 0-1.3-.8-.9-1.5L11 5c.2-.4.6-.6 1-.6Z" {...strokeProps} />
      <path d="M12 9.6v4.2" {...strokeProps} />
      <path d="M12 16.6v.1" {...strokeProps} strokeWidth={2.1} />
    </Icon>
  );
}
