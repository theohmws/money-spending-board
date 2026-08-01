'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { BoardSupabaseClient } from '@/hooks/useAuthSession';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useCategoryMeta } from '@/hooks/useCategoryMeta';
import { useI18n } from '@/hooks/useI18n';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useProfile } from '@/hooks/useProfile';
import { useRatios } from '@/hooks/useRatios';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import type { CategoryId } from '@/utils/BoardConfig';
import {
  CAT_ITEMS,
  CAT_NAMES,
  DEFAULT_CATEGORY_META,
  DEFAULT_MONTHLY_BASE,
  GROUPS,
  ICON_MAP,
  PALETTE,
} from '@/utils/BoardConfig';
import { fmtMoney, monthKey, previousMonthKey } from '@/utils/boardHelpers';

// Only `needs` gets an explicit placement (spanning both columns of row 1,
// full-width); savings/wants are left to grid auto-flow, which places them
// in row 2 automatically once row 1 is fully occupied. Avoids the old
// two-row-tall needs card whose content didn't fill that much height.
const GRID_COLUMN_SPAN: Partial<Record<CategoryId, string>> = {
  needs: '1 / 3',
};

export const TREND_MONTH_LIMIT_OPTIONS = [3, 6, 12, 15, 24] as const;
export type TrendMonthLimit = (typeof TREND_MONTH_LIMIT_OPTIONS)[number];

export const useSpendingBoard = () => {
  const { lang, toggleLang, t } = useI18n();
  const { theme, setTheme, themeTokens } = useTheme();
  const isOnline = useOnlineStatus();
  const locale = lang === 'en' ? 'en-US' : 'th-TH';

  // Mirrors the auth session's email/client specifically for the hooks
  // below — set synchronously inside handleSessionResolved, since
  // useAuthSession's own session/client aren't reachable until after it's
  // called, and it needs handleSessionResolved (built from these hooks'
  // `load`) as an argument.
  const [resolvedEmail, setResolvedEmail] = useState<string | undefined>(
    undefined
  );
  const [resolvedUserId, setResolvedUserId] = useState<string | undefined>(
    undefined
  );
  const clientRefLocal = useRef<BoardSupabaseClient | null>(null);

  const ratiosSlice = useRatios(resolvedEmail);
  const profileSlice = useProfile(resolvedEmail);
  const categoryMetaSlice = useCategoryMeta(resolvedEmail);
  const txSlice = useTransactions(clientRefLocal, resolvedUserId, t, locale);

  const [showRuleInfo, setShowRuleInfo] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'graph'>('overview');
  const [activeGraphTab, setActiveGraphTab] = useState<'trend' | 'compare'>(
    'trend'
  );
  const [trendMonthLimit, setTrendMonthLimit] = useState<TrendMonthLimit>(6);
  const [trendSeries, setTrendSeries] = useState<'income' | 'expense'>(
    'expense'
  );

  const [viewportWidth, setViewportWidth] = useState(430);

  const handleSessionResolved = useCallback(
    (
      client: BoardSupabaseClient,
      currentEmail: string | undefined,
      currentUserId: string | undefined
    ) => {
      setResolvedEmail(currentEmail);
      setResolvedUserId(currentUserId);
      clientRefLocal.current = client;
      txSlice.load(client);
      ratiosSlice.load(currentEmail);
      profileSlice.load(currentEmail);
      categoryMetaSlice.load(currentEmail);
    },
    [txSlice.load, ratiosSlice.load, profileSlice.load, categoryMetaSlice.load]
  );

  const {
    booting,
    session,
    configMissing,
    oauthProviders,
    authMode,
    authForm,
    authError,
    authLoading,
    onAuthEmailChange,
    onAuthPasswordChange,
    toggleAuthMode,
    submitAuth,
    signInWithOAuth,
    signOut: authSignOut,
  } = useAuthSession(t, handleSessionResolved);

  const signOut = useCallback(async () => {
    await authSignOut();
    txSlice.clear();
  }, [authSignOut, txSlice.clear]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    setViewportWidth(window.innerWidth);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleRuleInfo = useCallback(
    () => setShowRuleInfo((prev) => !prev),
    []
  );

  const {
    ratios,
    showRatioModal,
    ratioForm,
    openRatioModal,
    closeRatioModal,
    onRatioChange,
    ratioSum,
    saveRatios,
  } = ratiosSlice;

  const {
    profile,
    profileForm,
    showProfile,
    openProfile,
    closeProfile,
    onProfileNameChange,
    onProfileIncomeChange,
    avatarSwatches,
    saveProfile,
  } = profileSlice;

  const {
    categoryMeta,
    categoryMetaForm,
    showCategorySettings,
    openCategorySettings: openCategorySettingsSlice,
    closeCategorySettings,
    selectCategoryIcon,
    selectCategoryPalette,
    saveCategoryMeta,
  } = categoryMetaSlice;

  const {
    transactions,
    selectedMonth,
    onMonthChange,
    monthOptions,
    monthTx,
    income,
    expense,
    balance,
    showAddModal,
    openAddModal,
    editingTxId,
    openEditModal,
    closeAddModal,
    txType,
    setTxType,
    txForm,
    onTxAmountChange,
    onTxNoteChange,
    onTxDateChange,
    onTxCategoryChange,
    saveTransaction,
    saveError,
    deleteTx,
    deleteError,
  } = txSlice;

  // Cross-domain actions: each touches two hooks (profile + ratios, or
  // category-meta + profile), so they're composed here rather than in
  // either slice.
  const editSplitFromProfile = useCallback(() => {
    closeProfile();
    openRatioModal();
  }, [closeProfile, openRatioModal]);

  const openCategorySettings = useCallback(() => {
    openCategorySettingsSlice();
    closeProfile();
  }, [openCategorySettingsSlice, closeProfile]);

  const groupsLocalized = useMemo(
    () =>
      GROUPS.map((group) => ({
        ...group,
        name: CAT_NAMES[group.id][lang],
        items: CAT_ITEMS[group.id][lang],
      })),
    [lang]
  );

  const catById = useMemo(
    () => Object.fromEntries(groupsLocalized.map((c) => [c.id, c])),
    [groupsLocalized]
  );

  const budgetBase = useMemo(() => {
    const incomeSetting = Number(profile.monthlyIncome) || 0;
    if (incomeSetting > 0) return incomeSetting;
    if (income > 0) return income;
    return DEFAULT_MONTHLY_BASE;
  }, [profile.monthlyIncome, income]);

  const categoryCards = useMemo(
    () =>
      groupsLocalized.map((group) => {
        const meta = categoryMeta[group.id] ?? DEFAULT_CATEGORY_META[group.id];
        const ratioPct = ratios[group.id];
        const budget = budgetBase * (ratioPct / 100);
        const spent = monthTx
          .filter((tx) => tx.type === 'expense' && tx.category === group.id)
          .reduce((a, tx) => a + Number(tx.amount), 0);
        const pct = budget
          ? Math.min(100, Math.round((spent / budget) * 100))
          : 0;

        return {
          id: group.id,
          name: group.name,
          color: meta.color,
          dark: meta.dark,
          iconPath: ICON_MAP[meta.icon] ?? ICON_MAP.home,
          pctLabel: ratioPct,
          gridColumn: GRID_COLUMN_SPAN[group.id],
          items: group.items.join(' · '),
          spentLabel: fmtMoney(spent),
          budgetLabel: fmtMoney(budget),
          pct,
        };
      }),
    [groupsLocalized, categoryMeta, ratios, budgetBase, monthTx]
  );

  const transactionRows = useMemo(
    () =>
      [...monthTx]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((tx) => {
          const category = tx.category ? catById[tx.category] : null;
          const meta = tx.category
            ? categoryMeta[tx.category] ?? DEFAULT_CATEGORY_META[tx.category]
            : null;
          return {
            id: tx.id,
            initial: tx.type === 'income' ? '+' : category?.name[0] ?? 'O',
            color: tx.type === 'income' ? '#0E8F5F' : meta?.color ?? '#64748B',
            title: tx.note || category?.name || 'Other',
            dateLabel: new Date(`${tx.date}T00:00:00`).toLocaleDateString(
              locale,
              { month: 'short', day: 'numeric' }
            ),
            amountLabel:
              (tx.type === 'income' ? '+' : '-') +
              fmtMoney(tx.amount).replace('-', ''),
            amountColor: tx.type === 'income' ? '#0E8F5F' : themeTokens.text,
            onDelete: () => deleteTx(tx.id),
            onEdit: () => openEditModal(tx),
          };
        }),
    [monthTx, catById, categoryMeta, locale, theme, deleteTx, openEditModal]
  );

  const monthlyTotals = useMemo(() => {
    const emptyCategorySpend = (): Record<CategoryId, number> => ({
      needs: 0,
      savings: 0,
      wants: 0,
    });
    const totalsByMonth = new Map<
      string,
      {
        income: number;
        expense: number;
        categorySpend: Record<CategoryId, number>;
      }
    >();
    transactions.forEach((tx) => {
      const key = monthKey(tx.date);
      const entry = totalsByMonth.get(key) ?? {
        income: 0,
        expense: 0,
        categorySpend: emptyCategorySpend(),
      };
      if (tx.type === 'income') {
        entry.income += Number(tx.amount);
      } else {
        entry.expense += Number(tx.amount);
        if (tx.category) entry.categorySpend[tx.category] += Number(tx.amount);
      }
      totalsByMonth.set(key, entry);
    });

    if (!totalsByMonth.has(selectedMonth)) {
      totalsByMonth.set(selectedMonth, {
        income: 0,
        expense: 0,
        categorySpend: emptyCategorySpend(),
      });
    }

    const sorted = Array.from(totalsByMonth.entries()).sort(([a], [b]) =>
      a < b ? -1 : 1
    );
    const recent = sorted.slice(-trendMonthLimit);
    const hasSelected = recent.some(([month]) => month === selectedMonth);
    const withSelected = hasSelected
      ? recent
      : [...recent, ...sorted.filter(([month]) => month === selectedMonth)];

    return withSelected
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, totals]) => ({
        month,
        label: new Date(`${month}-02T00:00:00`).toLocaleDateString(locale, {
          month: 'short',
          year: 'numeric',
        }),
        income: totals.income,
        expense: totals.expense,
        isSelected: month === selectedMonth,
        categoryBreakdown: groupsLocalized.map((group) => ({
          id: group.id,
          name: group.name,
          color: group.color,
          amount: totals.categorySpend[group.id],
        })),
      }));
  }, [transactions, selectedMonth, locale, trendMonthLimit, groupsLocalized]);

  const compareRows = useMemo(() => {
    const prevMonth = previousMonthKey(selectedMonth);
    const prevMonthTx = transactions.filter(
      (tx) => monthKey(tx.date) === prevMonth
    );

    return groupsLocalized.map((group) => {
      const selectedSpend = monthTx
        .filter((tx) => tx.type === 'expense' && tx.category === group.id)
        .reduce((a, tx) => a + Number(tx.amount), 0);
      const previousSpend = prevMonthTx
        .filter((tx) => tx.type === 'expense' && tx.category === group.id)
        .reduce((a, tx) => a + Number(tx.amount), 0);

      return {
        id: group.id,
        name: group.name,
        color: group.color,
        selectedSpend,
        previousSpend,
      };
    });
  }, [groupsLocalized, monthTx, transactions, selectedMonth]);

  const categoryOptions = useMemo(
    () =>
      groupsLocalized.map((group) => {
        const selected = txForm.category === group.id;
        const meta = categoryMeta[group.id] ?? DEFAULT_CATEGORY_META[group.id];
        return {
          id: group.id,
          name: `${group.name} ${ratios[group.id]}%`,
          selected,
          color: meta.color,
          dark: meta.dark,
          onSelect: () => onTxCategoryChange(group.id),
        };
      }),
    [groupsLocalized, txForm.category, categoryMeta, ratios, onTxCategoryChange]
  );

  const categorySettingsRows = useMemo(
    () =>
      groupsLocalized.map((group) => {
        const meta =
          categoryMetaForm[group.id] ?? DEFAULT_CATEGORY_META[group.id];
        return {
          id: group.id,
          name: group.name,
          iconPath: ICON_MAP[meta.icon] ?? ICON_MAP.home,
          color: meta.color,
          dark: meta.dark,
          iconOptions: Object.entries(ICON_MAP).map(([iconId, d]) => ({
            id: iconId,
            d,
            selected: meta.icon === iconId,
            onSelect: () => selectCategoryIcon(group.id, iconId),
          })),
          paletteOptions: PALETTE.map((palette) => ({
            color: palette.color,
            selected: meta.color === palette.color,
            onSelect: () => selectCategoryPalette(group.id, palette),
          })),
        };
      }),
    [
      groupsLocalized,
      categoryMetaForm,
      selectCategoryIcon,
      selectCategoryPalette,
    ]
  );

  const ratioRows = useMemo(
    () =>
      groupsLocalized.map((group) => ({
        id: group.id,
        name: group.name,
        color: group.color,
        value: ratioForm[group.id],
        onChange: (value: number) => onRatioChange(group.id, value),
      })),
    [groupsLocalized, ratioForm, onRatioChange]
  );

  const profileInitial = (profile.name ||
    session?.user.email ||
    '?')[0]?.toUpperCase();

  const isDesktop = viewportWidth >= 900;

  return {
    t,
    lang,
    toggleLang,
    theme,
    setTheme,
    themeTokens,
    isDesktop,
    isOnline,

    booting,
    showConfigError: !booting && configMissing,
    showLogin: !booting && !configMissing && !session,
    showApp: !booting && !configMissing && !!session,

    oauthProviders,
    authMode,
    authForm,
    authError,
    authLoading,
    onAuthEmailChange,
    onAuthPasswordChange,
    toggleAuthMode,
    submitAuth,
    signInWithOAuth,
    signOut,

    showRuleInfo,
    toggleRuleInfo,
    activeTab,
    setActiveTab,
    activeGraphTab,
    setActiveGraphTab,
    trendMonthLimit,
    setTrendMonthLimit,
    trendSeries,
    setTrendSeries,
    selectedMonth,
    monthOptions,
    onMonthChange,
    userEmail: session?.user.email ?? '',
    balanceLabel: fmtMoney(balance),
    incomeLabel: fmtMoney(income),
    expenseLabel: fmtMoney(expense),
    categoryCards,
    transactionRows,
    deleteError,
    monthlyTotals,
    compareRows,

    showAddModal,
    openAddModal,
    editingTxId,
    closeAddModal,
    txType,
    setTxType,
    txForm,
    onTxAmountChange,
    onTxNoteChange,
    onTxDateChange,
    categoryOptions,
    saveTransaction,
    saveError,

    showRatioModal,
    openRatioModal,
    closeRatioModal,
    ratioRows,
    ratioSum,
    saveRatios,

    headerAvatarBg: profile.avatarColor || '#0E8F5F',
    headerAvatarInitial: profileInitial,
    showProfile,
    openProfile,
    closeProfile,
    profileForm,
    onProfileNameChange,
    onProfileIncomeChange,
    avatarSwatches,
    saveProfile,
    editSplitFromProfile,
    profileRatioLabel: `${ratios.needs}/${ratios.wants}/${ratios.savings}`,

    openCategorySettings,
    closeCategorySettings,
    showCategorySettings,
    categorySettingsRows,
    saveCategoryMeta,
  };
};
