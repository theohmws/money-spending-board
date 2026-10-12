import { act, renderHook, waitFor } from '@testing-library/react';

import { useUpdateCheck } from './useUpdateCheck';

const mockFetch = (body: unknown, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({ ok, json: async () => body });
};

describe('useUpdateCheck', () => {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '';
  const iconVersion = process.env.NEXT_PUBLIC_ICON_VERSION ?? '';

  it('does nothing when disabled', () => {
    mockFetch({ version: 'x' });
    renderHook(() => useUpdateCheck(false));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('is up to date when versions match', async () => {
    mockFetch({ version, iconVersion });
    const { result } = renderHook(() => useUpdateCheck(true));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(result.current.outdated).toBe(false);
    expect(result.current.iconOutdated).toBe(false);
  });

  it('flags a newer app version', async () => {
    mockFetch({ version: `${version}-new`, iconVersion });
    const { result } = renderHook(() => useUpdateCheck(true));

    await waitFor(() => expect(result.current.outdated).toBe(true));
    expect(result.current.iconOutdated).toBe(false);
  });

  it('flags a newer icon version', async () => {
    mockFetch({ version, iconVersion: `${iconVersion}9` });
    const { result } = renderHook(() => useUpdateCheck(true));

    await waitFor(() => expect(result.current.iconOutdated).toBe(true));
  });

  it('can be dismissed', async () => {
    mockFetch({ version: `${version}-new` });
    const { result } = renderHook(() => useUpdateCheck(true));
    await waitFor(() => expect(result.current.outdated).toBe(true));

    act(() => result.current.dismiss());

    expect(result.current.dismissed).toBe(true);
  });

  it('ignores fetch failures', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useUpdateCheck(true));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(result.current.outdated).toBe(false);
  });
});
