import { act, renderHook } from '@testing-library/react';

import { useTheme } from './useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to light theme', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
    expect(result.current.themeTokens.mode).toBe('light');
  });

  it('should restore a saved theme from localStorage on mount', () => {
    localStorage.setItem('msb_theme', 'dark');

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
  });

  it('should ignore an invalid saved theme', () => {
    localStorage.setItem('msb_theme', 'blue');

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
  });

  it('should persist and apply a new theme', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.themeTokens.mode).toBe('dark');
    expect(localStorage.getItem('msb_theme')).toBe('dark');
  });
});
