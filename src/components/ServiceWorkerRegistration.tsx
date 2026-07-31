'use client';

import { useEffect } from 'react';

export const canRegisterServiceWorker = () =>
  process.env.NODE_ENV === 'production' &&
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator;

export const ServiceWorkerRegistration = () => {
  useEffect(() => {
    if (!canRegisterServiceWorker()) {
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration failures (unsupported context, network error, etc.)
      // shouldn't break the app — the SW is a progressive enhancement.
    });
  }, []);

  return null;
};
