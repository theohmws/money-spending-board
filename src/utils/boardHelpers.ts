import type { Theme } from '@/utils/BoardConfig';

export type ThemeTokens = {
  mode: Theme;
  pageBg: string;
  cardBg: string;
  text: string;
  label: string;
  subtext: string;
  subtext2: string;
  subtext3: string;
  inputBg: string;
  inputBorder: string;
  divider: string;
  chipBg: string;
  chipText: string;
  fadeToCard: string;
};

export const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const fmtMoney = (amount: number) => {
  const value = Number(amount) || 0;
  const abs = Math.abs(value).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (value < 0 ? '-฿' : '฿') + abs;
};

export const monthKey = (date: string) => date.slice(0, 7);

export const previousMonthKey = (month: string) => {
  const [yearPart, monthPart] = month.split('-');
  const year = Number(yearPart);
  const mon = Number(monthPart);
  const d = new Date(year, mon - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const readJSON = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const themeTokens = (mode: Theme): ThemeTokens => {
  const isDark = mode === 'dark';
  return {
    mode,
    pageBg: isDark ? '#0B100D' : '#EEF1F0',
    cardBg: isDark ? '#161D17' : '#FFFFFF',
    text: isDark ? '#EAF3ED' : '#132119',
    label: isDark ? '#93A599' : '#7A857D',
    subtext: isDark ? '#8FA598' : '#8A948C',
    subtext2: isDark ? '#71857A' : '#9AA39C',
    subtext3: isDark ? '#4E5F55' : '#B7BFB6',
    inputBg: isDark ? '#20281F' : '#FAFBF9',
    inputBorder: isDark ? '#2C362B' : '#E3E7E3',
    divider: isDark ? '#232B21' : '#F1F3F1',
    chipBg: isDark ? '#242D24' : '#F2F4F2',
    chipText: isDark ? '#C9D6CC' : '#4A554D',
    fadeToCard: isDark
      ? 'linear-gradient(180deg, rgba(22,29,23,0), #161D17 30%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0), #FFFFFF 30%)',
  };
};
