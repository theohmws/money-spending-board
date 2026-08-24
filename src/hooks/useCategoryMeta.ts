'use client';

import type { RefObject } from 'react';
import { useCallback, useState } from 'react';

import type { BoardSupabaseClient } from '@/hooks/useAuthSession';
import type {
  CategoryId,
  CategoryMetaMap,
  I18nDict,
} from '@/utils/BoardConfig';
import { DEFAULT_CATEGORY_META } from '@/utils/BoardConfig';
import { loadBoardSettingField } from '@/utils/boardHelpers';

const categoryMetaKey = (email: string | undefined) => `msb_catmeta_${email}`;

// Supabase-backed (board_settings.category_meta), migrating once from the
// legacy msb_catmeta_<email> localStorage key on first load. See design.md
// Decisions 3-4 in
// openspec/changes/2026-08-24-migrate-profile-ratios-categorymeta-to-supabase.
export const useCategoryMeta = (
  clientRef: RefObject<BoardSupabaseClient | null>,
  userId: string | undefined,
  t: I18nDict
) => {
  const [categoryMeta, setCategoryMeta] = useState<CategoryMetaMap>(
    DEFAULT_CATEGORY_META
  );
  const [categoryMetaForm, setCategoryMetaForm] = useState<CategoryMetaMap>(
    DEFAULT_CATEGORY_META
  );
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [categoryMetaSaveError, setCategoryMetaSaveError] = useState<
    string | null
  >(null);

  const load = useCallback(
    (
      client: BoardSupabaseClient,
      currentUserId: string | undefined,
      currentEmail: string | undefined
    ) => {
      if (!currentUserId) return;
      loadBoardSettingField(
        client,
        currentUserId,
        'category_meta',
        categoryMetaKey(currentEmail),
        DEFAULT_CATEGORY_META
      ).then(setCategoryMeta);
    },
    []
  );

  const clear = useCallback(() => {
    setCategoryMeta(DEFAULT_CATEGORY_META);
    setCategoryMetaForm(DEFAULT_CATEGORY_META);
  }, []);

  const openCategorySettings = useCallback(() => {
    setCategoryMetaForm(categoryMeta);
    setCategoryMetaSaveError(null);
    setShowCategorySettings(true);
  }, [categoryMeta]);
  const closeCategorySettings = useCallback(
    () => setShowCategorySettings(false),
    []
  );
  const selectCategoryIcon = useCallback(
    (categoryId: CategoryId, iconId: string) =>
      setCategoryMetaForm((prev) => ({
        ...prev,
        [categoryId]: { ...prev[categoryId], icon: iconId },
      })),
    []
  );
  const selectCategoryPalette = useCallback(
    (categoryId: CategoryId, palette: { color: string; dark: string }) =>
      setCategoryMetaForm((prev) => ({
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          color: palette.color,
          dark: palette.dark,
        },
      })),
    []
  );
  const saveCategoryMeta = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !userId) return;

    setCategoryMetaSaveError(null);
    try {
      const { error } = await client
        .from('board_settings')
        .upsert({ user_id: userId, category_meta: categoryMetaForm });
      if (error) throw error;
      setCategoryMeta(categoryMetaForm);
      setShowCategorySettings(false);
    } catch (err) {
      setCategoryMetaSaveError(
        err instanceof Error ? err.message : t.categoryMetaSaveError
      );
    }
  }, [categoryMetaForm, clientRef, t, userId]);

  return {
    categoryMeta,
    categoryMetaForm,
    showCategorySettings,
    openCategorySettings,
    closeCategorySettings,
    selectCategoryIcon,
    selectCategoryPalette,
    saveCategoryMeta,
    categoryMetaSaveError,
    load,
    clear,
  };
};
