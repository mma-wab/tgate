import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { cn } from '../../lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('size-9', className)}
      role="img"
      aria-label="Telegram Proxy Hub"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#35b6ee" />
          <stop offset="100%" stopColor="#1479ad" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#logo-gradient)" />
      <g fill="none" stroke="white" strokeLinecap="round" strokeWidth="2.1" opacity="0.95">
        <path d="M15.2 19.4a6.8 6.8 0 0 1 9.6 0" />
        <path d="M11.6 15.2a12 12 0 0 1 16.8 0" opacity="0.7" />
      </g>
      <circle cx="20" cy="25.4" r="2.3" fill="white" />
      <circle cx="28.3" cy="12.4" r="1.35" fill="white" opacity="0.85" />
      <circle cx="11.7" cy="12.4" r="1.35" fill="white" opacity="0.55" />
    </svg>
  );
}

export function Logo({ onClick, className }: { onClick?: () => void; className?: string }) {
  const { t } = useI18n();
  return (
    <Link
      to="/"
      onClick={onClick}
      className={cn('group flex items-center gap-2.5 rounded-xl', className)}
      aria-label={t('app.name')}
    >
      <LogoMark className="size-9 transition-transform duration-300 group-hover:-rotate-3" />
      <span className="flex flex-col leading-none">
        <span
          dir="ltr"
          className="text-[15px] font-semibold tracking-tight text-ink"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Telegram <span className="text-brand">Proxy Hub</span>
        </span>
        <span className="mt-1 text-[10px] font-medium tracking-wide text-muted">
          {t('app.shortName')} · MTProto
        </span>
      </span>
    </Link>
  );
}
