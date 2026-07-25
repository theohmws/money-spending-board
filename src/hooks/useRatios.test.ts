import { act, renderHook } from '@testing-library/react';

import { DEFAULT_RATIOS } from '@/utils/BoardConfig';

import { useRatios } from './useRatios';

describe('useRatios', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to DEFAULT_RATIOS', () => {
    const { result } = renderHook(() => useRatios('demo@example.com'));

    expect(result.current.ratios).toEqual(DEFAULT_RATIOS);
  });

  it('should load saved ratios for the given email on demand', () => {
    localStorage.setItem(
      'msb_ratios_demo@example.com',
      JSON.stringify({ needs: 40, savings: 30, wants: 30 })
    );
    const { result } = renderHook(() => useRatios('demo@example.com'));

    act(() => {
      result.current.load('demo@example.com');
    });

    expect(result.current.ratios).toEqual({
      needs: 40,
      savings: 30,
      wants: 30,
    });
  });

  it('should fall back to defaults when nothing is stored for that email', () => {
    const { result } = renderHook(() => useRatios('nobody@example.com'));

    act(() => {
      result.current.load('nobody@example.com');
    });

    expect(result.current.ratios).toEqual(DEFAULT_RATIOS);
  });

  it('should populate ratioForm from current ratios when opening the modal', () => {
    const { result } = renderHook(() => useRatios('demo@example.com'));

    act(() => {
      result.current.openRatioModal();
    });

    expect(result.current.showRatioModal).toBe(true);
    expect(result.current.ratioForm).toEqual(result.current.ratios);
  });

  it('should close the modal', () => {
    const { result } = renderHook(() => useRatios('demo@example.com'));

    act(() => {
      result.current.openRatioModal();
      result.current.closeRatioModal();
    });

    expect(result.current.showRatioModal).toBe(false);
  });

  it('should clamp ratio changes between 0 and 100', () => {
    const { result } = renderHook(() => useRatios('demo@example.com'));

    act(() => {
      result.current.onRatioChange('needs', 150);
    });
    expect(result.current.ratioForm.needs).toBe(100);

    act(() => {
      result.current.onRatioChange('needs', -20);
    });
    expect(result.current.ratioForm.needs).toBe(0);
  });

  it('should not save when the ratio sum is not 100', () => {
    const { result } = renderHook(() => useRatios('demo@example.com'));

    act(() => {
      result.current.onRatioChange('needs', 10);
    });
    expect(result.current.ratioSum).not.toBe(100);

    act(() => {
      result.current.saveRatios();
    });

    expect(result.current.ratios).toEqual(DEFAULT_RATIOS);
    expect(localStorage.getItem('msb_ratios_demo@example.com')).toBeNull();
  });

  it('should save when the ratio sum is exactly 100 and persist per-email', () => {
    const { result } = renderHook(() => useRatios('demo@example.com'));

    act(() => {
      result.current.onRatioChange('needs', 60);
      result.current.onRatioChange('savings', 20);
      result.current.onRatioChange('wants', 20);
    });

    act(() => {
      result.current.saveRatios();
    });

    expect(result.current.ratios).toEqual({
      needs: 60,
      savings: 20,
      wants: 20,
    });
    expect(result.current.showRatioModal).toBe(false);
    expect(
      JSON.parse(localStorage.getItem('msb_ratios_demo@example.com')!)
    ).toEqual({ needs: 60, savings: 20, wants: 20 });
  });
});
