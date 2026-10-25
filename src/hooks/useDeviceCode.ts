'use client';

import { useCallback, useEffect, useState } from 'react';

// The code the user's Shortcut keeps in a file on this device, pasted in by
// the user because a web page can't read it. Compared with the `device` value
// the Shortcut sends so slip photos are only offered on the device that took
// them. Per-browser by nature, so it lives in localStorage, not Supabase.
export const useDeviceCode = () => {
  const [deviceCode, setDeviceCode] = useState('');

  useEffect(() => {
    try {
      setDeviceCode(localStorage.getItem('msb_device_code') ?? '');
    } catch {
      // storage unavailable: the button simply stays hidden for device-tagged rows
    }
  }, []);

  const onDeviceCodeChange = useCallback((value: string) => {
    setDeviceCode(value);
    try {
      localStorage.setItem('msb_device_code', value);
    } catch {
      // ignore
    }
  }, []);

  return { deviceCode, onDeviceCodeChange };
};
