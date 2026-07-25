import { act, renderHook } from '@testing-library/react';

import { DEFAULT_CATEGORY_META } from '@/utils/BoardConfig';

import { useCategoryMeta } from './useCategoryMeta';

describe('useCategoryMeta', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to DEFAULT_CATEGORY_META', () => {
    const { result } = renderHook(() => useCategoryMeta('demo@example.com'));

    expect(result.current.categoryMeta).toEqual(DEFAULT_CATEGORY_META);
  });

  it('should load saved category meta for the given email on demand', () => {
    const saved = {
      ...DEFAULT_CATEGORY_META,
      needs: { icon: 'cart', color: '#000', dark: '#111' },
    };
    localStorage.setItem('msb_catmeta_demo@example.com', JSON.stringify(saved));
    const { result } = renderHook(() => useCategoryMeta('demo@example.com'));

    act(() => {
      result.current.load('demo@example.com');
    });

    expect(result.current.categoryMeta.needs.icon).toBe('cart');
  });

  it('should populate categoryMetaForm from current meta when opening settings', () => {
    const { result } = renderHook(() => useCategoryMeta('demo@example.com'));

    act(() => {
      result.current.openCategorySettings();
    });

    expect(result.current.showCategorySettings).toBe(true);
    expect(result.current.categoryMetaForm).toEqual(
      result.current.categoryMeta
    );
  });

  it('should update icon and palette on the form only', () => {
    const { result } = renderHook(() => useCategoryMeta('demo@example.com'));

    act(() => {
      result.current.selectCategoryIcon('needs', 'cart');
      result.current.selectCategoryPalette('wants', {
        color: '#7FB3F2',
        dark: '#1E3A5C',
      });
    });

    expect(result.current.categoryMetaForm.needs.icon).toBe('cart');
    expect(result.current.categoryMetaForm.wants.color).toBe('#7FB3F2');
    expect(result.current.categoryMeta.needs.icon).toBe(
      DEFAULT_CATEGORY_META.needs.icon
    );
  });

  it('should save the form, persist per-email, and close', () => {
    const { result } = renderHook(() => useCategoryMeta('demo@example.com'));

    act(() => {
      result.current.selectCategoryIcon('needs', 'cart');
    });
    act(() => {
      result.current.saveCategoryMeta();
    });

    expect(result.current.categoryMeta.needs.icon).toBe('cart');
    expect(result.current.showCategorySettings).toBe(false);
    expect(
      JSON.parse(localStorage.getItem('msb_catmeta_demo@example.com')!).needs
        .icon
    ).toBe('cart');
  });
});
