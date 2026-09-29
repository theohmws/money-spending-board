'use client';

import type { RefObject } from 'react';
import { useCallback, useState } from 'react';

import type { BoardSupabaseClient } from '@/hooks/useAuthSession';
import type {
  BadgeColorPair,
  BadgeColors,
  I18nDict,
} from '@/utils/BoardConfig';
import { DEFAULT_BADGE_COLORS } from '@/utils/BoardConfig';

// The two credit-card-import badge colors, user-configurable and persisted
// as a single JSON blob on Supabase — the DB-backed equivalent of how
// categoryMeta already persists a whole object at once, just to
// localStorage. See design.md Decision 5c in
// openspec/changes/2026-08-23-import-ktc-credit-card-statement.
export const useBoardSettings = (
  clientRef: RefObject<BoardSupabaseClient | null>,
  userId: string | undefined,
  t: I18nDict
) => {
  const [badgeColors, setBadgeColors] =
    useState<BadgeColors>(DEFAULT_BADGE_COLORS);
  const [badgeColorsForm, setBadgeColorsForm] =
    useState<BadgeColors>(DEFAULT_BADGE_COLORS);
  const [ownNames, setOwnNames] = useState<string[]>([]);
  const [ownNamesForm, setOwnNamesForm] = useState('');
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const load = useCallback((client: BoardSupabaseClient) => {
    client
      .from('board_settings')
      .select('badge_colors, own_names')
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.badge_colors) {
          const loaded = data.badge_colors as BadgeColors;
          setBadgeColors(loaded);
          setBadgeColorsForm(loaded);
        } else {
          setBadgeColors(DEFAULT_BADGE_COLORS);
          setBadgeColorsForm(DEFAULT_BADGE_COLORS);
        }
        const names = (!error && (data?.own_names as string[] | null)) || [];
        setOwnNames(names);
        setOwnNamesForm(names.join(', '));
      });
  }, []);

  const clear = useCallback(() => {
    setBadgeColors(DEFAULT_BADGE_COLORS);
    setBadgeColorsForm(DEFAULT_BADGE_COLORS);
    setOwnNames([]);
    setOwnNamesForm('');
  }, []);

  const selectBadgeColor = useCallback(
    (key: keyof BadgeColors, pair: BadgeColorPair) =>
      setBadgeColorsForm((prev) => ({ ...prev, [key]: pair })),
    []
  );

  const saveBadgeColors = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !userId) return;

    const names = ownNamesForm
      .split(/[,\n]/)
      .map((name) => name.trim())
      .filter(Boolean);

    setSettingsError(null);
    try {
      const { error } = await client.from('board_settings').upsert({
        user_id: userId,
        badge_colors: badgeColorsForm,
        own_names: names,
      });
      if (error) throw error;
      setBadgeColors(badgeColorsForm);
      setOwnNames(names);
    } catch (err) {
      setSettingsError(
        err instanceof Error ? err.message : t.boardSettingsSaveError
      );
    }
  }, [badgeColorsForm, clientRef, ownNamesForm, t, userId]);

  return {
    badgeColors,
    badgeColorsForm,
    ownNames,
    ownNamesForm,
    onOwnNamesFormChange: setOwnNamesForm,
    settingsError,
    selectBadgeColor,
    saveBadgeColors,
    load,
    clear,
  };
};
