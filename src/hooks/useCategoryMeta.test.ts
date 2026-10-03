import { act, renderHook } from '@testing-library/react';

import { DEFAULT_CATEGORY_META, I18N } from '@/utils/BoardConfig';

import { useCategoryMeta } from './useCategoryMeta';

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

describe('useCategoryMeta', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to DEFAULT_CATEGORY_META', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useCategoryMeta(clientRef, 'user-1', t)
    );

    expect(result.current.categoryMeta).toEqual(DEFAULT_CATEGORY_META);
  });

  it('loads the category_meta column as-is when already migrated, without touching localStorage', async () => {
    const { client, maybeSingle, upsert } = makeClient();
    const saved = {
      ...DEFAULT_CATEGORY_META,
      needs: { icon: 'cart', color: '#000', dark: '#111' },
    };
    maybeSingle.mockResolvedValue({
      data: { category_meta: saved },
      error: null,
    });
    localStorage.setItem(
      'msb_catmeta_demo@example.com',
      JSON.stringify(DEFAULT_CATEGORY_META)
    );
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useCategoryMeta(clientRef, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any, 'user-1', 'demo@example.com');
      await flush();
    });

    expect(result.current.categoryMeta.needs.icon).toBe('cart');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('migrates an existing localStorage value into board_settings when the column is null', async () => {
    const { client, maybeSingle, upsert } = makeClient();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const legacy = {
      ...DEFAULT_CATEGORY_META,
      wants: { icon: 'cart', color: '#7FB3F2', dark: '#1E3A5C' },
    };
    localStorage.setItem(
      'msb_catmeta_demo@example.com',
      JSON.stringify(legacy)
    );
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useCategoryMeta(clientRef, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any, 'user-1', 'demo@example.com');
      await flush();
    });

    expect(result.current.categoryMeta).toEqual(legacy);
    expect(upsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      category_meta: legacy,
    });
  });

  it('migrates to DEFAULT_CATEGORY_META when the column is null and there is no localStorage value', async () => {
    const { client, maybeSingle, upsert } = makeClient();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useCategoryMeta(clientRef, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any, 'user-1', 'nobody@example.com');
      await flush();
    });

    expect(result.current.categoryMeta).toEqual(DEFAULT_CATEGORY_META);
    expect(upsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      category_meta: DEFAULT_CATEGORY_META,
    });
  });

  it('should populate categoryMetaForm from current meta when opening settings', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useCategoryMeta(clientRef, 'user-1', t)
    );

    act(() => {
      result.current.openCategorySettings();
    });

    expect(result.current.showCategorySettings).toBe(true);
    expect(result.current.categoryMetaForm).toEqual(
      result.current.categoryMeta
    );
  });

  it('should update icon and palette on the form only', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useCategoryMeta(clientRef, 'user-1', t)
    );

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

  it('should save the form, upsert to board_settings, and close', async () => {
    const { client, upsert } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useCategoryMeta(clientRef, 'user-1', t)
    );

    act(() => {
      result.current.selectCategoryIcon('needs', 'cart');
    });
    await act(async () => {
      await result.current.saveCategoryMeta();
    });

    const expected = {
      ...DEFAULT_CATEGORY_META,
      needs: { ...DEFAULT_CATEGORY_META.needs, icon: 'cart' },
    };
    expect(upsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      category_meta: expected,
    });
    expect(result.current.categoryMeta.needs.icon).toBe('cart');
    expect(result.current.showCategorySettings).toBe(false);
  });

  it('surfaces an error and keeps the modal open with edits intact when saving fails', async () => {
    const { client, upsert } = makeClient();
    upsert.mockResolvedValue({ error: new Error('Failed to fetch') });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useCategoryMeta(clientRef, 'user-1', t)
    );

    act(() => {
      result.current.selectCategoryIcon('needs', 'cart');
    });
    await act(async () => {
      await result.current.saveCategoryMeta();
    });

    expect(result.current.categoryMetaSaveError).toBe('Failed to fetch');
    expect(result.current.categoryMeta.needs.icon).toBe(
      DEFAULT_CATEGORY_META.needs.icon
    );
    expect(result.current.categoryMetaForm.needs.icon).toBe('cart');
  });

  it('resets to DEFAULT_CATEGORY_META on clear', async () => {
    const { client, maybeSingle } = makeClient();
    maybeSingle.mockResolvedValue({
      data: {
        category_meta: {
          ...DEFAULT_CATEGORY_META,
          needs: { icon: 'cart', color: '#000', dark: '#111' },
        },
      },
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useCategoryMeta(clientRef, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any, 'user-1', 'demo@example.com');
      await flush();
    });
    expect(result.current.categoryMeta).not.toEqual(DEFAULT_CATEGORY_META);

    act(() => {
      result.current.clear();
    });

    expect(result.current.categoryMeta).toEqual(DEFAULT_CATEGORY_META);
    expect(result.current.categoryMetaForm).toEqual(DEFAULT_CATEGORY_META);
  });
});
