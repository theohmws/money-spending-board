'use client';

import type { RefObject } from 'react';
import { useCallback, useState } from 'react';

import type { BoardSupabaseClient } from '@/hooks/useAuthSession';
import type { CategoryId, I18nDict, RatioMap } from '@/utils/BoardConfig';
import { DEFAULT_RATIOS } from '@/utils/BoardConfig';
import { loadBoardSettingField } from '@/utils/boardHelpers';

const ratioKey = (email: string | undefined) => `msb_ratios_${email}`;

// Supabase-backed (board_settings.ratios), migrating once from the legacy
// msb_ratios_<email> localStorage key on first load. See design.md
// Decisions 3-4 in
// openspec/changes/2026-08-24-migrate-profile-ratios-categorymeta-to-supabase.
export const useRatios = (
  clientRef: RefObject<BoardSupabaseClient | null>,
  userId: string | undefined,
  t: I18nDict
) => {
  const [ratios, setRatios] = useState<RatioMap>(DEFAULT_RATIOS);
  const [showRatioModal, setShowRatioModal] = useState(false);
  const [ratioForm, setRatioForm] = useState<RatioMap>(DEFAULT_RATIOS);
  const [ratiosSaveError, setRatiosSaveError] = useState<string | null>(null);

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
        'ratios',
        ratioKey(currentEmail),
        DEFAULT_RATIOS
      ).then(setRatios);
    },
    []
  );

  const clear = useCallback(() => {
    setRatios(DEFAULT_RATIOS);
    setRatioForm(DEFAULT_RATIOS);
  }, []);

  const openRatioModal = useCallback(() => {
    setRatioForm(ratios);
    setRatiosSaveError(null);
    setShowRatioModal(true);
  }, [ratios]);
  const closeRatioModal = useCallback(() => setShowRatioModal(false), []);
  const onRatioChange = useCallback((key: CategoryId, value: number) => {
    const clamped = Math.max(0, Math.min(100, Number(value) || 0));
    setRatioForm((prev) => ({ ...prev, [key]: clamped }));
  }, []);
  const ratioSum = Object.values(ratioForm).reduce((a, v) => a + Number(v), 0);
  const saveRatios = useCallback(async () => {
    if (ratioSum !== 100) return;
    const client = clientRef.current;
    if (!client || !userId) return;

    setRatiosSaveError(null);
    try {
      const { error } = await client
        .from('board_settings')
        .upsert({ user_id: userId, ratios: ratioForm });
      if (error) throw error;
      setRatios(ratioForm);
      setShowRatioModal(false);
    } catch (err) {
      setRatiosSaveError(
        err instanceof Error ? err.message : t.ratiosSaveError
      );
    }
  }, [clientRef, ratioForm, ratioSum, t, userId]);

  return {
    ratios,
    showRatioModal,
    ratioForm,
    openRatioModal,
    closeRatioModal,
    onRatioChange,
    ratioSum,
    saveRatios,
    ratiosSaveError,
    load,
    clear,
  };
};
