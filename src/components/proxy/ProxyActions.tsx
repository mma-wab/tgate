import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Link2, Send, Server, ArrowUpRight } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useCopy } from '../../hooks/useCopy';
import {
  buildTelegramProxyLink,
  formatHostPort,
  type ProxyEndpoint,
} from '../../lib/validation';
import { buttonStyles } from '../ui/Button';
import { cn } from '../../lib/cn';

export function CopyIconButton({
  text,
  label,
  copiedMessage,
  className,
  variant = 'icon',
}: {
  text: string;
  label: string;
  copiedMessage?: string;
  className?: string;
  variant?: 'icon' | 'label';
}) {
  const { t } = useI18n();
  const copy = useCopy();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const onClick = async () => {
    const ok = await copy(text, copiedMessage);
    if (!ok) return;
    setCopied(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface text-muted transition hover:border-brand/35 hover:bg-brand-soft/60 hover:text-brand-ink',
        variant === 'icon' ? 'size-11' : 'h-11 px-3.5 text-[13px] font-medium',
        className,
      )}
    >
      {copied ? (
        <Check className="size-4 text-success" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
      {variant === 'label' ? (
        <span>{copied ? t('common.copied') : label}</span>
      ) : (
        <span className="sr-only" aria-live="polite">
          {copied ? t('common.copied') : ''}
        </span>
      )}
    </button>
  );
}

export function ConnectButton({
  proxy,
  size = 'sm',
  className,
  compact = false,
}: {
  proxy: ProxyEndpoint;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const link = buildTelegramProxyLink(proxy);

  if (!link) {
    return (
      <span
        className={buttonStyles('secondary', size, cn('cursor-not-allowed opacity-50', className))}
        title={t('proxy.connectDisabled')}
      >
        <Send className="size-4" aria-hidden="true" />
        {t('proxy.connectDisabled')}
      </span>
    );
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonStyles('primary', size, className)}
      aria-label={t('common.connect')}
      title={t('details.connectHint')}
    >
      <Send className="size-4" aria-hidden="true" />
      {compact ? t('common.connectShort') : t('common.connect')}
      <span className="sr-only"> ({t('common.newTab')})</span>
    </a>
  );
}

export function ProxyCardActions({
  proxy,
  name,
}: {
  proxy: ProxyEndpoint & { id: string };
  name: string;
}) {
  const { t } = useI18n();
  const link = buildTelegramProxyLink(proxy);
  const address = formatHostPort(proxy);

  return (
    <div className="flex items-center gap-2">
      <ConnectButton proxy={proxy} size="sm" compact className="flex-1" />
      <CopyIconButton
        text={address}
        label={`${t('common.copyAddress')} — ${name}`}
        copiedMessage={t('proxy.addressCopied')}
      />
      {link ? (
        <CopyIconButton
          text={link}
          label={`${t('common.copyLink')} — ${name}`}
          copiedMessage={t('proxy.linkCopied')}
        />
      ) : null}
      <Link
        to={`/proxies/${proxy.id}`}
        title={t('proxy.viewDetails', { name })}
        aria-label={t('proxy.viewDetails', { name })}
        className="inline-flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-muted transition hover:border-brand/35 hover:bg-brand-soft/60 hover:text-brand-ink"
      >
        <ArrowUpRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function IconMeta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
      <span className="text-muted/80" aria-hidden="true">
        {icon}
      </span>
      {children}
    </span>
  );
}

export const MetaIcons = { Server, Link2 };
