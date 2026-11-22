/**
 * Hands a `tg://` proxy link straight to the operating system.
 *
 * The navigation happens inside the click gesture and replaces the current
 * page, so every platform (iOS, Android, Windows, macOS, Linux) passes the
 * scheme directly to the Telegram app: no intermediate web page and no second
 * tab. Browsers may still show their own one-time "open this app?" prompt — that
 * dialog belongs to the OS and no website can skip it.
 *
 * Resolves with `false` when nothing took over the link, so the caller can offer
 * a manual fallback instead of opening one automatically.
 */
const HANDOFF_TIMEOUT_MS = 1500;

export function openTelegramLink(tgLink: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    let timer = 0;

    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener('blur', onHandOff);
      window.removeEventListener('pagehide', onHandOff);
      document.removeEventListener('visibilitychange', onVisibility);
    }

    function settle(handedOff: boolean) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(handedOff);
    }

    function onHandOff() {
      settle(true);
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') settle(true);
    }

    window.addEventListener('blur', onHandOff, { once: true });
    window.addEventListener('pagehide', onHandOff, { once: true });
    document.addEventListener('visibilitychange', onVisibility);
    timer = window.setTimeout(() => settle(false), HANDOFF_TIMEOUT_MS);

    try {
      // Same-tab navigation: the browser hands the scheme to the OS immediately.
      window.location.assign(tgLink);
    } catch {
      settle(false);
    }
  });
}
