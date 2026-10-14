'use client';

import { useCallback, useEffect, useState } from 'react';

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

export const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '';
export const CURRENT_ICON_VERSION = process.env.NEXT_PUBLIC_ICON_VERSION ?? '';

type RemoteVersion = { version?: string; iconVersion?: string };

// Polls /version.json (written at build time by scripts/set-sw-cache-version.js)
// and compares it with the version baked into this bundle. Silent on any
// failure (offline, missing file) — the check is a progressive enhancement.
export const useUpdateCheck = (enabled: boolean) => {
  const [remote, setRemote] = useState<RemoteVersion | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const check = async () => {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' });
        if (res.ok) {
          setRemote((await res.json()) as RemoteVersion);
        }
      } catch {
        // offline or unreachable — try again next time
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };

    check();
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled]);

  const dismiss = useCallback(() => setDismissed(true), []);

  const outdated = !!remote?.version && remote.version !== CURRENT_VERSION;
  const iconOutdated =
    !!remote?.iconVersion && remote.iconVersion !== CURRENT_ICON_VERSION;

  return {
    outdated,
    iconOutdated,
    latestIconVersion: remote?.iconVersion ?? '',
    dismissed,
    dismiss,
  };
};
