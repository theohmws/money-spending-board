'use client';

import { useCallback, useState } from 'react';

import type { CategoryId, CategoryMetaMap } from '@/utils/BoardConfig';
import { DEFAULT_CATEGORY_META } from '@/utils/BoardConfig';
import { readJSON } from '@/utils/boardHelpers';

const categoryMetaKey = (email: string | undefined) => `msb_catmeta_${email}`;

export const useCategoryMeta = (email: string | undefined) => {
  const [categoryMeta, setCategoryMeta] = useState<CategoryMetaMap>(
    DEFAULT_CATEGORY_META
  );
  const [categoryMetaForm, setCategoryMetaForm] = useState<CategoryMetaMap>(
    DEFAULT_CATEGORY_META
  );
  const [showCategorySettings, setShowCategorySettings] = useState(false);

  const load = useCallback((currentEmail: string | undefined) => {
    setCategoryMeta(
      readJSON<CategoryMetaMap>(categoryMetaKey(currentEmail)) ??
        DEFAULT_CATEGORY_META
    );
  }, []);

  const openCategorySettings = useCallback(() => {
    setCategoryMetaForm(categoryMeta);
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
  const saveCategoryMeta = useCallback(() => {
    localStorage.setItem(
      categoryMetaKey(email),
      JSON.stringify(categoryMetaForm)
    );
    setCategoryMeta(categoryMetaForm);
    setShowCategorySettings(false);
  }, [categoryMetaForm, email]);

  return {
    categoryMeta,
    categoryMetaForm,
    showCategorySettings,
    openCategorySettings,
    closeCategorySettings,
    selectCategoryIcon,
    selectCategoryPalette,
    saveCategoryMeta,
    load,
  };
};
