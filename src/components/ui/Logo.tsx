import { cn } from '../../lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('size-9', className)}
      role="img"
      aria-label="T-Gate"
    >
      <defs>
        <linearGradient id="tgate-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#229fd8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#tgate-logo-grad)" />
      {/* Gate Portal Arch */}
      <path
        d="M 13.5 29 L 13.5 20.5 C 13.5 16.9 16.4 14 20 14 C 23.6 14 26.5 16.9 26.5 20.5 L 26.5 29"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Top Bar of T */}
      <rect x="8.5" y="9.5" width="23" height="3.8" rx="1.9" fill="#ffffff" />
      {/* Central T Transmission Stem */}
      <line x1="20" y1="13.3" x2="20" y2="23" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
      {/* Core Connection Node */}
      <circle cx="20" cy="24" r="2.2" fill="#ffffff" />
      {/* Base Ground Nodes */}
      <circle cx="13.5" cy="29" r="1.3" fill="#ffffff" opacity="0.9" />
      <circle cx="26.5" cy="29" r="1.3" fill="#ffffff" opacity="0.9" />
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
        className="text-[18px] font-bold tracking-tight text-ink"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        T-<span className="text-brand">Gate</span>
      </span>
    </a>
  );
}
