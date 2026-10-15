'use client';

import { useEffect, useState } from 'react';

import { CURRENT_ICON_VERSION, useUpdateCheck } from '@/hooks/useUpdateCheck';

export const canRegisterServiceWorker = () =>
  process.env.NODE_ENV === 'production' &&
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator;

const COPY = {
  th: {
    update: 'มีเวอร์ชันใหม่ของแอป',
    reload: 'อัปเดต',
    icon: 'ไอคอนแอปมีการเปลี่ยนแปลง หากต้องการเห็นไอคอนใหม่ ให้เพิ่มแอปลงหน้าจอโฮมใหม่:',
    iconSteps: [
      'กดไอคอนแอปค้างบนหน้าจอโฮม แล้วเลือก “ลบแอป”',
      'เปิด Safari แล้วเข้าเว็บนี้อีกครั้ง',
      'กดปุ่มแชร์ แล้วเลือก “เพิ่มลงหน้าจอโฮม”',
    ],
    dismiss: 'ปิด',
  },
  en: {
    update: 'A new version of the app is available.',
    reload: 'Update',
    icon: 'The app icon has changed. To see the new one, add the app to your home screen again:',
    iconSteps: [
      'Press and hold the app icon on your home screen, then choose “Remove App”.',
      'Open Safari and visit this site again.',
      'Tap the Share button, then choose “Add to Home Screen”.',
    ],
    dismiss: 'Dismiss',
  },
};

const readLang = (): keyof typeof COPY => {
  try {
    return localStorage.getItem('msb_lang') === 'en' ? 'en' : 'th';
  } catch {
    return 'th';
  }
};

// An icon change can't be applied by an update (iOS keeps the home-screen
// copy), so remember the icon version this device last loaded. When a later
// load carries a different one, tell the user once to re-add the app — this
// works whether or not the old version was still open when the deploy landed.
const ICON_SEEN_KEY = 'msb_icon_seen';

const applyUpdate = async () => {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch {
    // reload anyway
  }
  window.location.reload();
};

export const ServiceWorkerRegistration = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [iconNoticePending, setIconNoticePending] = useState(false);
  const { outdated, iconOutdated, dismissed, dismiss } = useUpdateCheck(
    canRegisterServiceWorker()
  );

  useEffect(() => {
    try {
      const seen = localStorage.getItem(ICON_SEEN_KEY);
      // First load on this device: nothing to compare with, just record it.
      if (seen !== null && seen !== CURRENT_ICON_VERSION) {
        setIconNoticePending(true);
      }
      localStorage.setItem(ICON_SEEN_KEY, CURRENT_ICON_VERSION);
    } catch {
      // storage unavailable — the icon notice is best-effort
    }
  }, []);

  const showIcon = iconOutdated || iconNoticePending;
  const onDismiss = () => {
    setIconNoticePending(false);
    dismiss();
  };

  useEffect(() => {
    if (!canRegisterServiceWorker()) {
      return undefined;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failures (unsupported context, network error, etc.)
      // shouldn't break the app — the SW is a progressive enhancement.
    });

    // sw.js calls skipWaiting()+clients.claim() unconditionally, so a new
    // version takes over an already-open tab on its own — no "waiting"
    // worker to react to. `controllerchange` is what actually fires at that
    // moment. Its first firing just means this tab came under SW control
    // for the first time (nothing changed, nothing to reload for); only a
    // later one during the same page load is a genuine version swap.
    let isFirstControllerChange = !navigator.serviceWorker.controller;
    const onControllerChange = () => {
      if (isFirstControllerChange) {
        isFirstControllerChange = false;
        return;
      }
      setUpdateAvailable(true);
    };
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange
    );
    return () =>
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange
      );
  }, []);

  if (!updateAvailable && !dismissed && (outdated || showIcon)) {
    const copy = COPY[readLang()];
    return (
      <div
        role="status"
        className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-3 px-4 py-3 text-center text-[13.5px]"
        style={{ background: '#132119', color: '#EFFCF4' }}
      >
        <div className="flex max-w-md flex-col gap-1.5">
          {outdated && <span>{copy.update}</span>}
          {showIcon && (
            <>
              <span>{copy.icon}</span>
              <ol className="list-inside list-decimal text-left text-[12.5px] leading-relaxed">
                {copy.iconSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </div>
        {outdated && (
          <button
            type="button"
            onClick={applyUpdate}
            className="rounded-lg px-3 py-1.5 text-[12.5px] font-bold"
            style={{ background: '#EFFCF4', color: '#132119' }}
          >
            {copy.reload}
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-3 py-1.5 text-[12.5px] font-bold underline"
        >
          {copy.dismiss}
        </button>
      </div>
    );
  }

  if (!updateAvailable) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-3 px-4 py-3 text-center text-[13.5px]"
      style={{ background: '#132119', color: '#EFFCF4' }}
    >
      <span>A new version of the app is available.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg px-3 py-1.5 text-[12.5px] font-bold"
        style={{ background: '#EFFCF4', color: '#132119' }}
      >
        Reload
      </button>
    </div>
  );
};
