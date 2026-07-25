import { act, renderHook } from '@testing-library/react';

import { useI18n } from './useI18n';

describe('useI18n', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to Thai', () => {
    const { result } = renderHook(() => useI18n());

    expect(result.current.lang).toBe('th');
    expect(result.current.t.signIn).toBe('เข้าสู่ระบบ');
  });

  it('should restore a saved language from localStorage on mount', () => {
    localStorage.setItem('msb_lang', 'en');

    const { result } = renderHook(() => useI18n());

    expect(result.current.lang).toBe('en');
    expect(result.current.t.signIn).toBe('Sign in');
  });

  it('should ignore an invalid saved language', () => {
    localStorage.setItem('msb_lang', 'fr');

    const { result } = renderHook(() => useI18n());

    expect(result.current.lang).toBe('th');
  });

  it('should toggle between th and en, persisting the result', () => {
    const { result } = renderHook(() => useI18n());

    act(() => {
      result.current.toggleLang();
    });

    expect(result.current.lang).toBe('en');
    expect(localStorage.getItem('msb_lang')).toBe('en');

    act(() => {
      result.current.toggleLang();
    });

    expect(result.current.lang).toBe('th');
    expect(localStorage.getItem('msb_lang')).toBe('th');
  });
});
