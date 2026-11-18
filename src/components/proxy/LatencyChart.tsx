import { useI18n } from '../../i18n';
import type { CheckHistoryEntry } from '../../types/proxy';
import { formatDateTime, statusLabel } from '../../lib/format';
import { cn } from '../../lib/cn';

export function LatencyChart({
  history,
  limit = 12,
  size = 'sm',
  className,
}: {
  history: CheckHistoryEntry[];
  limit?: number;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const { t, lang } = useI18n();
  const entries = history.slice(-limit);
  const height = size === 'lg' ? 'h-28' : 'h-10';
  const gap = size === 'lg' ? 'gap-1.5' : 'gap-1';

  if (entries.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center rounded-lg border border-dashed border-line-strong/80 px-2.5',
          height,
          className,
        )}
      >
        <span className="text-[11px] text-muted">{t('proxy.noHistory')}</span>
      </div>
    );
  }

  const maxLatency = Math.max(
    1,
    ...entries
      .filter((entry) => entry.status === 'online' && entry.latencyMs !== null)
      .map((entry) => entry.latencyMs ?? 0),
  );
  const onlineCount = entries.filter((entry) => entry.status === 'online').length;

  return (
    <div
      className={cn('flex items-end', gap, height, className)}
      role="img"
      aria-label={t('proxy.historySummary', { online: onlineCount, total: entries.length })}
    >
      {entries.map((entry) => {
        const isOnline = entry.status === 'online' && entry.latencyMs !== null;
        const pct = isOnline
          ? Math.min(100, Math.max(24, (entry.latencyMs! / maxLatency) * 100))
          : entry.status === 'offline' || entry.status === 'timeout'
            ? 16
            : 10;
        const tone =
          entry.status === 'online'
            ? 'bg-brand/75 hover:bg-brand'
            : entry.status === 'offline'
              ? 'bg-danger/55'
              : entry.status === 'timeout'
                ? 'bg-warning/65'
                : 'bg-line-strong';
        return (
          <div
            key={`${entry.at}-${entry.status}`}
            title={`${formatDateTime(entry.at, lang)} · ${statusLabel(entry.status, lang)}${
              entry.latencyMs !== null ? ` · ${entry.latencyMs} ms` : ''
            }`}
            className={cn('min-h-1 flex-1 rounded-t-[3px] transition-colors', tone)}
            style={{ height: `${pct}%` }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
