'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Theme } from '@/utils/BoardConfig';
import type { ThemeTokens } from '@/utils/boardHelpers';
import { themeTokens as buildThemeTokens } from '@/utils/boardHelpers';

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('msb_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setThemeState(savedTheme);
    }
  }, []);

  const setTheme = useCallback((mode: Theme) => {
    localStorage.setItem('msb_theme', mode);
    setThemeState(mode);
  }, []);

  return {
    theme,
    setTheme,
    themeTokens: buildThemeTokens(theme) as ThemeTokens,
  };
};
