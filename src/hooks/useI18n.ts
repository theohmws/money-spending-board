'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Lang } from '@/utils/BoardConfig';
import { I18N } from '@/utils/BoardConfig';

export const useI18n = () => {
  const [lang, setLang] = useState<Lang>('th');

  useEffect(() => {
    const savedLang = localStorage.getItem('msb_lang');
    if (savedLang === 'th' || savedLang === 'en') {
      setLang(savedLang);
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === 'th' ? 'en' : 'th';
      localStorage.setItem('msb_lang', next);
      return next;
    });
  }, []);

  return {
    lang,
    toggleLang,
    t: I18N[lang],
  };
};
