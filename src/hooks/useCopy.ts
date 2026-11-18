import { useCallback } from 'react';
import { useI18n } from '../i18n';
import { useToast } from '../contexts/ToastContext';

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export function useCopy() {
  const { t } = useI18n();
  const { push } = useToast();

  return useCallback(
    async (text: string, successMessage?: string) => {
      const ok = await writeClipboard(text);
      if (ok) {
        push(successMessage ?? t('common.copied'), 'success');
      } else {
        push(t('common.copyFailed'), 'error');
      }
      return ok;
    },
    [push, t],
  );
}
