import { act, renderHook } from '@testing-library/react';

import { useOnlineStatus } from './useOnlineStatus';

const setNavigatorOnLine = (value: boolean) => {
  Object.defineProperty(navigator, 'onLine', {
    value,
    configurable: true,
  });
};

describe('useOnlineStatus', () => {
  afterEach(() => {
    setNavigatorOnLine(true);
  });

  it('defaults to navigator.onLine on mount', () => {
    setNavigatorOnLine(false);

    const { result } = renderHook(() => useOnlineStatus());

    expect(result.current).toBe(false);
  });

  it('flips to false on a window offline event', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);
  });

  it('flips back to true on a window online event', () => {
    setNavigatorOnLine(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current).toBe(true);
  });

  it('removes its event listeners on unmount', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useOnlineStatus());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
