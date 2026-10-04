import type { BoardSupabaseClient } from '@/hooks/useAuthSession';
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

// U+2212 MINUS SIGN, not a hyphen — a hyphen sits at half the cap-height and
// collides visually with the tall, already-crossed ฿ glyph right next to it
// (reads like a strikethrough). The real minus sign is wider and vertically
// centered, so it stays legible next to ฿.
const MINUS = '−';

export const fmtMoney = (amount: number) => {
  const value = Number(amount) || 0;
  const abs = Math.abs(value).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (value < 0 ? `${MINUS}฿` : '฿') + abs;
};

// For contexts that always want an explicit sign (transaction rows, daily
// net totals) rather than fmtMoney's bare "no prefix for positive" style.
export const fmtSignedMoney = (amount: number) => {
  const value = Number(amount) || 0;
  return (value >= 0 ? '+' : MINUS) + fmtMoney(Math.abs(value));
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

// Shared by useProfile/useRatios/useCategoryMeta: each of those domains
// lives in its own board_settings column, migrating once from the domain's
// legacy localStorage key the first time a user's column is still null. See
// design.md Decision 3 in
// openspec/changes/2026-08-24-migrate-profile-ratios-categorymeta-to-supabase.
export const loadBoardSettingField = async <T>(
  client: BoardSupabaseClient,
  userId: string,
  column: 'profile' | 'ratios' | 'category_meta',
  localStorageKey: string,
  defaultValue: T
): Promise<T> => {
  const { data, error } = await client
    .from('board_settings')
    .select(column)
    .maybeSingle();

  const loaded =
    !error && data ? (data as Record<string, T | null>)[column] : null;
  if (loaded != null) return loaded;

  const migrated = readJSON<T>(localStorageKey) ?? defaultValue;
  await client
    .from('board_settings')
    .upsert({ user_id: userId, [column]: migrated });
  return migrated;
};

// Tinysoy UI tokens as CSS variable references, so charts and the few
// remaining inline styles follow the active palette and light/dark mode.
export const themeTokens = (mode: Theme): ThemeTokens => ({
  mode,
  pageBg: 'var(--background)',
  cardBg: 'var(--card)',
  text: 'var(--foreground)',
  label: 'var(--muted-foreground)',
  subtext: 'var(--muted-foreground)',
  subtext2: 'var(--muted-foreground)',
  subtext3: 'var(--muted-foreground)',
  inputBg: 'var(--background)',
  inputBorder: 'var(--input)',
  divider: 'var(--border)',
  chipBg: 'var(--muted)',
  chipText: 'var(--secondary-foreground)',
  fadeToCard: 'linear-gradient(180deg, transparent, var(--card) 30%)',
});
