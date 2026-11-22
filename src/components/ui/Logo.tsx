import { cn } from '../../lib/cn';

/**
 * Hand-drawn gate mark: a wobbly rounded tile with a pencil "T" that doubles as
 * a gateway arch. No gradients, no drop shadows.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('size-9', className)}
      role="img"
      aria-label="T-Gate"
      fill="none"
    >
      <path
        d="M8.6 4.9c7.4-1 15.9-.9 23.2-.1 1.3.1 2.2 1.1 2.3 2.4.4 8.9.3 19.8-.1 27.9-.1 1.4-1.1 2.3-2.5 2.4-7.6.4-15.6.4-23.1 0-1.4-.1-2.3-1.1-2.4-2.4-.4-8.2-.4-19.1 0-27.8.1-1.3 1-2.3 2.6-2.4Z"
        fill="var(--brand-soft)"
        stroke="var(--brand)"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M10.9 11.4c6.2-.5 12.3-.4 18.4.1"
        stroke="var(--brand)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M20 11.7v8.4"
        stroke="var(--brand)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M13.4 30.1v-9c0-3.7 2.9-6.6 6.6-6.6s6.5 2.9 6.5 6.6v9"
        stroke="var(--brand)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="23.4" r="2" fill="var(--brand)" />
      <circle cx="13.4" cy="30.2" r="1.2" fill="var(--brand)" fillOpacity="0.75" />
      <circle cx="26.5" cy="30.2" r="1.2" fill="var(--brand)" fillOpacity="0.75" />
    </svg>
  );
}

export function Logo({ onClick, className }: { onClick?: () => void; className?: string }) {
  return (
    <a
      href="#top"
      onClick={onClick}
      className={cn('group flex items-center gap-2.5 rounded-xl', className)}
      aria-label="T-Gate"
    >
      <LogoMark className="size-9 shrink-0 transition-transform duration-300 group-hover:-rotate-3" />
      <span
        dir="ltr"
        className="text-[18px] font-extrabold tracking-tight text-ink"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        T-<span className="text-brand">Gate</span>
      </span>
    </a>
  );
}
