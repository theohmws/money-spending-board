import { act, renderHook } from '@testing-library/react';

import { DEFAULT_BADGE_COLORS, I18N } from '@/utils/BoardConfig';

import { useBoardSettings } from './useBoardSettings';

const t = I18N.th;

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

describe('useBoardSettings', () => {
  it('defaults to the built-in badge colors', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useBoardSettings(clientRef, 'user-1', t)
    );

    expect(result.current.badgeColors).toEqual(DEFAULT_BADGE_COLORS);
    expect(result.current.badgeColorsForm).toEqual(DEFAULT_BADGE_COLORS);
  });

  it('loads a saved badge_colors row for the user', async () => {
    const { client, maybeSingle } = makeClient();
    const saved = {
      needsReview: { color: '#111111', dark: '#000000' },
      source: { color: '#222222', dark: '#333333' },
    };
    maybeSingle.mockResolvedValue({
      data: { badge_colors: saved },
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useBoardSettings(clientRef, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });

    expect(result.current.badgeColors).toEqual(saved);
    expect(result.current.badgeColorsForm).toEqual(saved);
  });

  it('falls back to defaults when the user has no settings row yet', async () => {
    const { client, maybeSingle } = makeClient();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useBoardSettings(clientRef, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });

    expect(result.current.badgeColors).toEqual(DEFAULT_BADGE_COLORS);
  });

  it('updates only the form when selecting a color, not the saved value', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useBoardSettings(clientRef, 'user-1', t)
    );

    act(() => {
      result.current.selectBadgeColor('needsReview', {
        color: '#ABCDEF',
        dark: '#123456',
      });
    });

    expect(result.current.badgeColorsForm.needsReview).toEqual({
      color: '#ABCDEF',
      dark: '#123456',
    });
    expect(result.current.badgeColors).toEqual(DEFAULT_BADGE_COLORS);
  });

  it('upserts the whole badge_colors object and commits the form on save', async () => {
    const { client, upsert } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useBoardSettings(clientRef, 'user-1', t)
    );

    act(() => {
      result.current.selectBadgeColor('source', {
        color: '#ABCDEF',
        dark: '#123456',
      });
    });
    await act(async () => {
      await result.current.saveBadgeColors();
    });

    expect(upsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      badge_colors: {
        ...DEFAULT_BADGE_COLORS,
        source: { color: '#ABCDEF', dark: '#123456' },
      },
    });
    expect(result.current.badgeColors.source).toEqual({
      color: '#ABCDEF',
      dark: '#123456',
    });
  });

  it('surfaces an error when saving fails', async () => {
    const { client, upsert } = makeClient();
    upsert.mockResolvedValue({ error: new Error('Failed to fetch') });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useBoardSettings(clientRef, 'user-1', t)
    );

    await act(async () => {
      await result.current.saveBadgeColors();
    });

    expect(result.current.settingsError).toBe('Failed to fetch');
  });

  it('resets to defaults on clear', async () => {
    const { client, maybeSingle } = makeClient();
    maybeSingle.mockResolvedValue({
      data: {
        badge_colors: {
          needsReview: { color: '#111111', dark: '#000000' },
          source: { color: '#222222', dark: '#333333' },
        },
      },
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useBoardSettings(clientRef, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });
    expect(result.current.badgeColors).not.toEqual(DEFAULT_BADGE_COLORS);

    act(() => {
      result.current.clear();
    });

    expect(result.current.badgeColors).toEqual(DEFAULT_BADGE_COLORS);
    expect(result.current.badgeColorsForm).toEqual(DEFAULT_BADGE_COLORS);
  });
});
