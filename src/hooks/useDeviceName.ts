'use client';

import { useCallback, useEffect, useState } from 'react';

// The name this device has in Settings → General → About → Name, entered by
// the user because a web page can't read it. Compared with the Shortcut's
// "Device Name" so slip photos are only offered on the device that took them.
// Per-browser by nature, so it lives in localStorage, not Supabase.
export const useDeviceName = () => {
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    try {
      setDeviceName(localStorage.getItem('msb_device_name') ?? '');
    } catch {
      // storage unavailable: the button simply stays hidden for device-tagged rows
    }
  }, []);

  const onDeviceNameChange = useCallback((value: string) => {
    setDeviceName(value);
    try {
      localStorage.setItem('msb_device_name', value);
    } catch {
      // ignore
    }
  }, []);

  return { deviceName, onDeviceNameChange };
};
