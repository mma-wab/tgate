import { BadgeCheck, CircleHelp, ShieldCheck, Users } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { ProxyRecord, ProxyStatus, TrustLevel } from '../../types/proxy';
import { statusLabel } from '../../lib/format';
import { cn } from '../../lib/cn';
import { Badge } from '../ui/Badge';

const statusTone: Record<ProxyStatus, string> = {
  online: 'border-success/25 bg-success-soft text-success',
  offline: 'border-danger/25 bg-danger-soft text-danger',
  timeout: 'border-warning/30 bg-warning-soft text-warning',
  unknown: 'border-line bg-surface-2 text-muted',
};

const dotTone: Record<ProxyStatus, string> = {
  online: 'bg-success',
  offline: 'bg-danger',
  timeout: 'bg-warning',
  unknown: 'bg-muted',
};

export function StatusBadge({
  status,
  className,
  size = 'default',
}: {
  status: ProxyStatus;
  className?: string;
  size?: 'default' | 'lg';
}) {
  const { lang } = useI18n();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium leading-none',
        statusTone[status],
        size === 'lg' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]',
        className,
      )}
    >
      <span className="relative flex size-1.5" aria-hidden="true">
        {status === 'online' ? (
          <span className={cn('absolute inline-flex size-full animate-pulse-soft rounded-full opacity-70', dotTone[status])} />
        ) : null}
        <span className={cn('relative inline-flex size-1.5 rounded-full', dotTone[status])} />
      </span>
      {statusLabel(status, lang)}
    </span>
  );
}

const trustIcon = {
  'trusted-source': BadgeCheck,
  community: Users,
  unverified: CircleHelp,
};

const trustTone = {
  'trusted-source': 'brand',
  community: 'neutral',
  unverified: 'outline',
} as const;

export function TrustBadge({ trust, className }: { trust: TrustLevel; className?: string }) {
  const { t } = useI18n();
  const Icon = trustIcon[trust];
  const labelKey =
    trust === 'trusted-source'
      ? 'proxy.trustedSource'
      : trust === 'community'
        ? 'proxy.community'
        : 'proxy.unverified';
  return (
    <Badge tone={trustTone[trust]} className={className} icon={<Icon className="size-3" aria-hidden="true" />}>
      {t(labelKey)}
    </Badge>
  );
}

export function AvailabilityVerifiedBadge({ proxy }: { proxy: ProxyRecord }) {
  const { t } = useI18n();
  if (!proxy.lastOnline) return null;
  return (
    <Badge
      tone="success"
      title={t('proxy.availabilityVerifiedHint')}
      icon={<ShieldCheck className="size-3" aria-hidden="true" />}
    >
      {t('proxy.availabilityVerified')}
    </Badge>
  );
}
