'use client';

import { useEffect, useState } from 'react';

export const canRegisterServiceWorker = () =>
  process.env.NODE_ENV === 'production' &&
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator;

export const ServiceWorkerRegistration = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

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
