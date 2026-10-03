import { act, renderHook } from '@testing-library/react';

import { DEFAULT_RATIOS, I18N } from '@/utils/BoardConfig';

import { useRatios } from './useRatios';

const t = I18N.th;

const flush = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const makeClient = () => {
  const maybeSingle = jest.fn();
  const upsert = jest.fn().mockResolvedValue({ error: null });

  const client = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({ maybeSingle })),
      upsert,
    })),
  };

  return { client, maybeSingle, upsert };
};

describe('useRatios', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to DEFAULT_RATIOS', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useRatios(clientRef, 'user-1', t));

    expect(result.current.ratios).toEqual(DEFAULT_RATIOS);
  });

  it('loads the ratios column as-is when already migrated, without touching localStorage', async () => {
    const { client, maybeSingle, upsert } = makeClient();
    const saved = { needs: 40, savings: 30, wants: 30 };
    maybeSingle.mockResolvedValue({ data: { ratios: saved }, error: null });
    localStorage.setItem(
      'msb_ratios_demo@example.com',
      JSON.stringify({ needs: 10, savings: 10, wants: 80 })
    );
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useRatios(clientRef, 'user-1', t));

    await act(async () => {
      result.current.load(client as any, 'user-1', 'demo@example.com');
      await flush();
    });

    expect(result.current.ratios).toEqual(saved);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('migrates an existing localStorage value into board_settings when the column is null', async () => {
    const { client, maybeSingle, upsert } = makeClient();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const legacy = { needs: 40, savings: 30, wants: 30 };
    localStorage.setItem('msb_ratios_demo@example.com', JSON.stringify(legacy));
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useRatios(clientRef, 'user-1', t));

    await act(async () => {
      result.current.load(client as any, 'user-1', 'demo@example.com');
      await flush();
    });

    expect(result.current.ratios).toEqual(legacy);
    expect(upsert).toHaveBeenCalledWith({ user_id: 'user-1', ratios: legacy });
  });

  it('migrates to DEFAULT_RATIOS when the column is null and there is no localStorage value', async () => {
    const { client, maybeSingle, upsert } = makeClient();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useRatios(clientRef, 'user-1', t));

    await act(async () => {
      result.current.load(client as any, 'user-1', 'nobody@example.com');
      await flush();
    });

    expect(result.current.ratios).toEqual(DEFAULT_RATIOS);
    expect(upsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      ratios: DEFAULT_RATIOS,
    });
  });

  it('should populate ratioForm from current ratios when opening the modal', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useRatios(clientRef, 'user-1', t));

    act(() => {
      result.current.openRatioModal();
    });

    expect(result.current.showRatioModal).toBe(true);
    expect(result.current.ratioForm).toEqual(result.current.ratios);
  });

  it('should close the modal', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useRatios(clientRef, 'user-1', t));

    act(() => {
      result.current.openRatioModal();
      result.current.closeRatioModal();
    });

    expect(result.current.showRatioModal).toBe(false);
  });

  it('should clamp ratio changes between 0 and 100', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useRatios(clientRef, 'user-1', t));

    act(() => {
      result.current.onRatioChange('needs', 150);
    });
    expect(result.current.ratioForm.needs).toBe(100);

    act(() => {
      result.current.onRatioChange('needs', -20);
    });
    expect(result.current.ratioForm.needs).toBe(0);
  });

  it('should not save when the ratio sum is not 100', async () => {
    const { client, upsert } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useRatios(clientRef, 'user-1', t));

    act(() => {
      result.current.onRatioChange('needs', 10);
    });
    expect(result.current.ratioSum).not.toBe(100);

    await act(async () => {
      await result.current.saveRatios();
    });

    expect(result.current.ratios).toEqual(DEFAULT_RATIOS);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('should save when the ratio sum is exactly 100 and close', async () => {
    const { client, upsert } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useRatios(clientRef, 'user-1', t));

    act(() => {
      result.current.onRatioChange('needs', 60);
      result.current.onRatioChange('savings', 20);
      result.current.onRatioChange('wants', 20);
    });

    await act(async () => {
      await result.current.saveRatios();
    });

    expect(upsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      ratios: { needs: 60, savings: 20, wants: 20 },
    });
    expect(result.current.ratios).toEqual({
      needs: 60,
      savings: 20,
      wants: 20,
    });
    expect(result.current.showRatioModal).toBe(false);
  });

  it('surfaces an error and keeps the modal open with edits intact when saving fails', async () => {
    const { client, upsert } = makeClient();
    upsert.mockResolvedValue({ error: new Error('Failed to fetch') });
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useRatios(clientRef, 'user-1', t));

    act(() => {
      result.current.onRatioChange('needs', 60);
      result.current.onRatioChange('savings', 20);
      result.current.onRatioChange('wants', 20);
    });

    await act(async () => {
      await result.current.saveRatios();
    });

    expect(result.current.ratiosSaveError).toBe('Failed to fetch');
    expect(result.current.ratios).toEqual(DEFAULT_RATIOS);
    expect(result.current.ratioForm).toEqual({
      needs: 60,
      savings: 20,
      wants: 20,
    });
  });

  it('resets to DEFAULT_RATIOS on clear', async () => {
    const { client, maybeSingle } = makeClient();
    maybeSingle.mockResolvedValue({
      data: { ratios: { needs: 40, savings: 30, wants: 30 } },
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useRatios(clientRef, 'user-1', t));

    await act(async () => {
      result.current.load(client as any, 'user-1', 'demo@example.com');
      await flush();
    });
    expect(result.current.ratios).not.toEqual(DEFAULT_RATIOS);

    act(() => {
      result.current.clear();
    });

    expect(result.current.ratios).toEqual(DEFAULT_RATIOS);
    expect(result.current.ratioForm).toEqual(DEFAULT_RATIOS);
  });
});
