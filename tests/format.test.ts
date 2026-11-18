import { describe, expect, it } from 'vitest';
import {
  countryLabel,
  formatDate,
  formatDateTime,
  formatLatency,
  formatNumber,
  formatRelative,
  percent,
  statusLabel,
  trustLabel,
} from '../src/lib/format';

describe('format helpers', () => {
  it('never renders fabricated latency values', () => {
    expect(formatLatency(null, 'en')).toBe('n/a');
    expect(formatLatency(42, 'en')).toBe('42 ms');
    expect(formatLatency(1500, 'en')).toBe('1.5 s');
    expect(formatLatency(null, 'ar')).toBe('غير متاح');
  });

  it('handles missing and invalid timestamps explicitly', () => {
    expect(formatDateTime(null, 'en')).toBe('Not yet');
    expect(formatDateTime('nope', 'en')).toBe('Unknown');
    expect(formatDate(null, 'ar')).toBe('غير محدد');
    expect(formatRelative(null, 'en')).toBe('Not yet');
    expect(formatRelative('nope', 'en')).toBe('Unknown');
  });

  it('formats relative time in both languages', () => {
    const now = Date.parse('2026-11-17T12:00:00Z');
    expect(formatRelative('2026-11-17T11:58:00Z', 'en', now)).toMatch(/2 minutes ago/);
    expect(formatRelative('2026-11-17T12:00:00Z', 'ar', now)).toContain('الآن');
  });

  it('formats numbers and percentages without decimals where possible', () => {
    expect(formatNumber(1234, 'en')).toBe('1,234');
    expect(percent(50, 'en')).toBe('50%');
    expect(percent(null, 'en')).toBe('—');
  });

  it('localizes country, status and trust labels', () => {
    expect(countryLabel('DE', 'en')).toMatch(/Germany/i);
    expect(countryLabel(null, 'en')).toBe('');
    expect(statusLabel('timeout', 'en')).toBe('Timeout');
    expect(statusLabel('online', 'ar')).toBe('متصل');
    expect(trustLabel('unverified', 'en')).toBe('Unverified');
    expect(trustLabel('trusted-source', 'ar')).toBe('مصدر موثوق');
  });
});
