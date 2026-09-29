import { renderHook, waitFor } from '@testing-library/react';

import type { BoardSupabaseClient } from './useAuthSession';
import { usePublicStats } from './usePublicStats';

const refWith = (rpc: jest.Mock) => ({
  current: { rpc } as unknown as BoardSupabaseClient,
});

describe('usePublicStats', () => {
  it('returns the counts from the public_stats RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: { users: 12, transactions: 340 },
      error: null,
    });

    const { result } = renderHook(() => usePublicStats(refWith(rpc), true));

    await waitFor(() =>
      expect(result.current).toEqual({ users: 12, transactions: 340 })
    );
    expect(rpc).toHaveBeenCalledWith('public_stats');
  });

  it('does not call the RPC while disabled', () => {
    const rpc = jest.fn();

    renderHook(() => usePublicStats(refWith(rpc), false));

    expect(rpc).not.toHaveBeenCalled();
  });

  it('stays null when the RPC errors or throws', async () => {
    const failing = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'nope' } });
    const { result: a } = renderHook(() =>
      usePublicStats(refWith(failing), true)
    );
    await waitFor(() => expect(failing).toHaveBeenCalled());
    expect(a.current).toBeNull();

    const throwing = jest.fn().mockRejectedValue(new Error('offline'));
    const { result: b } = renderHook(() =>
      usePublicStats(refWith(throwing), true)
    );
    await waitFor(() => expect(throwing).toHaveBeenCalled());
    expect(b.current).toBeNull();
  });
});
