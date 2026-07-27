'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { BoardSupabaseClient } from '@/hooks/useAuthSession';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useCategoryMeta } from '@/hooks/useCategoryMeta';
import { useI18n } from '@/hooks/useI18n';
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
import { fmtMoney } from '@/utils/boardHelpers';

const GRID_ROWS: Record<CategoryId, string> = {
  needs: '1 / 3',
  savings: '1',
  wants: '2',
};

export const useSpendingBoard = () => {
  const { lang, toggleLang, t } = useI18n();
  const { theme, setTheme, themeTokens } = useTheme();
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
    deleteTx,
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
          gridRow: GRID_ROWS[group.id],
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
    selectedMonth,
    monthOptions,
    onMonthChange,
    userEmail: session?.user.email ?? '',
    balanceLabel: fmtMoney(balance),
    incomeLabel: fmtMoney(income),
    expenseLabel: fmtMoney(expense),
    categoryCards,
    transactionRows,

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
