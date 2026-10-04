'use client';

import { useCallback, useEffect, useState } from 'react';

import type { Palette, Theme } from '@/utils/BoardConfig';
import { PALETTES } from '@/utils/BoardConfig';
import type { ThemeTokens } from '@/utils/boardHelpers';
import { themeTokens as buildThemeTokens } from '@/utils/boardHelpers';

const DEFAULT_PALETTE: Palette = 'edamame';

// Mirrors the choice onto <html> so the Tinysoy CSS variables in global.css
// (`.dark`, `[data-palette]`) take effect.
const applyToDocument = (mode: Theme, palette: Palette) => {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  if (palette === DEFAULT_PALETTE) root.removeAttribute('data-palette');
  else root.setAttribute('data-palette', palette);
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [palette, setPaletteState] = useState<Palette>(DEFAULT_PALETTE);

  useEffect(() => {
    const savedTheme = localStorage.getItem('msb_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setThemeState(savedTheme);
    }
    const savedPalette = localStorage.getItem('msb_palette');
    if (PALETTES.includes(savedPalette as Palette)) {
      setPaletteState(savedPalette as Palette);
    }
  }, []);

  useEffect(() => {
    applyToDocument(theme, palette);
  }, [theme, palette]);

  const setTheme = useCallback((mode: Theme) => {
    localStorage.setItem('msb_theme', mode);
    setThemeState(mode);
  }, []);

  const setPalette = useCallback((next: Palette) => {
    localStorage.setItem('msb_palette', next);
    setPaletteState(next);
  }, []);

  return {
    theme,
    setTheme,
    palette,
    setPalette,
    themeTokens: buildThemeTokens(theme) as ThemeTokens,
  };
};
