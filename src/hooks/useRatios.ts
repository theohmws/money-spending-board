'use client';

import { useCallback, useState } from 'react';

import type { CategoryId, RatioMap } from '@/utils/BoardConfig';
import { DEFAULT_RATIOS } from '@/utils/BoardConfig';
import { readJSON } from '@/utils/boardHelpers';

const ratioKey = (email: string | undefined) => `msb_ratios_${email}`;

export const useRatios = (email: string | undefined) => {
  const [ratios, setRatios] = useState<RatioMap>(DEFAULT_RATIOS);
  const [showRatioModal, setShowRatioModal] = useState(false);
  const [ratioForm, setRatioForm] = useState<RatioMap>(DEFAULT_RATIOS);

  const load = useCallback((currentEmail: string | undefined) => {
    setRatios(readJSON<RatioMap>(ratioKey(currentEmail)) ?? DEFAULT_RATIOS);
  }, []);

  const openRatioModal = useCallback(() => {
    setRatioForm(ratios);
    setShowRatioModal(true);
  }, [ratios]);
  const closeRatioModal = useCallback(() => setShowRatioModal(false), []);
  const onRatioChange = useCallback((key: CategoryId, value: number) => {
    const clamped = Math.max(0, Math.min(100, Number(value) || 0));
    setRatioForm((prev) => ({ ...prev, [key]: clamped }));
  }, []);
  const ratioSum = Object.values(ratioForm).reduce((a, v) => a + Number(v), 0);
  const saveRatios = useCallback(() => {
    if (ratioSum !== 100) return;
    localStorage.setItem(ratioKey(email), JSON.stringify(ratioForm));
    setRatios(ratioForm);
    setShowRatioModal(false);
  }, [email, ratioForm, ratioSum]);

  return {
    ratios,
    showRatioModal,
    ratioForm,
    openRatioModal,
    closeRatioModal,
    onRatioChange,
    ratioSum,
    saveRatios,
    load,
  };
};
