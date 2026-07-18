'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  CategoryId,
  CategoryMetaMap,
  Lang,
  Profile,
  RatioMap,
  Theme,
  Transaction,
  TxType,
} from '@/utils/BoardConfig';
import {
  AVATAR_COLORS,
  CAT_ITEMS,
  CAT_NAMES,
  DEFAULT_CATEGORY_META,
  DEFAULT_MONTHLY_BASE,
  DEFAULT_PROFILE,
  DEFAULT_RATIOS,
  GROUPS,
  I18N,
  ICON_MAP,
  PALETTE,
} from '@/utils/BoardConfig';
import type { ThemeTokens } from '@/utils/boardHelpers';
import {
  fmtMoney,
  monthKey,
  themeTokens,
  todayStr,
  uid,
} from '@/utils/boardHelpers';

type BoardSession = {
  user: { email: string; id?: string };
};

type TxForm = {
  amount: string;
  note: string;
  category: CategoryId;
  date: string;
};

const GRID_ROWS: Record<CategoryId, string> = {
  needs: '1 / 3',
  savings: '1',
  wants: '2',
};

const categoryMetaKey = (email: string | undefined) => `msb_catmeta_${email}`;
const profileKey = (email: string | undefined) => `msb_profile_${email}`;
const ratioKey = (email: string | undefined) => `msb_ratios_${email}`;

const readJSON = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const useSpendingBoard = () => {
  const clientRef = useRef<SupabaseClient | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const configMissing = !supabaseUrl || !supabasePublishableKey;

  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<BoardSession | null>(null);

  const [lang, setLang] = useState<Lang>('th');
  const [theme, setThemeState] = useState<Theme>('light');

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(todayStr().slice(0, 7));

  const [ratios, setRatios] = useState<RatioMap>(DEFAULT_RATIOS);
  const [showRatioModal, setShowRatioModal] = useState(false);
  const [ratioForm, setRatioForm] = useState<RatioMap>(DEFAULT_RATIOS);

  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [profileForm, setProfileForm] = useState<Profile>(DEFAULT_PROFILE);
  const [showProfile, setShowProfile] = useState(false);

  const [categoryMeta, setCategoryMeta] = useState<CategoryMetaMap>(
    DEFAULT_CATEGORY_META
  );
  const [categoryMetaForm, setCategoryMetaForm] = useState<CategoryMetaMap>(
    DEFAULT_CATEGORY_META
  );
  const [showCategorySettings, setShowCategorySettings] = useState(false);

  const [showRuleInfo, setShowRuleInfo] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [txType, setTxType] = useState<TxType>('expense');
  const [txForm, setTxForm] = useState<TxForm>({
    amount: '',
    note: '',
    category: 'needs',
    date: todayStr(),
  });

  const [viewportWidth, setViewportWidth] = useState(430);

  const email = session?.user.email;

  const loadTransactions = useCallback((client: SupabaseClient) => {
    client
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setTransactions(data as Transaction[]);
      });
  }, []);

  const loadRatios = useCallback((currentEmail: string | undefined) => {
    setRatios(readJSON<RatioMap>(ratioKey(currentEmail)) ?? DEFAULT_RATIOS);
  }, []);

  const loadProfile = useCallback((currentEmail: string | undefined) => {
    setProfile(readJSON<Profile>(profileKey(currentEmail)) ?? DEFAULT_PROFILE);
  }, []);

  const loadCategoryMeta = useCallback((currentEmail: string | undefined) => {
    setCategoryMeta(
      readJSON<CategoryMetaMap>(categoryMetaKey(currentEmail)) ??
        DEFAULT_CATEGORY_META
    );
  }, []);

  const loadUserData = useCallback(
    (client: SupabaseClient, currentEmail: string | undefined) => {
      loadTransactions(client);
      loadRatios(currentEmail);
      loadProfile(currentEmail);
      loadCategoryMeta(currentEmail);
    },
    [loadTransactions, loadRatios, loadProfile, loadCategoryMeta]
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    setViewportWidth(window.innerWidth);

    const savedTheme = localStorage.getItem('msb_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setThemeState(savedTheme);
    }

    const savedLang = localStorage.getItem('msb_lang');
    if (savedLang === 'th' || savedLang === 'en') {
      setLang(savedLang);
    }

    if (!supabaseUrl || !supabasePublishableKey) {
      setBooting(false);
      return () => window.removeEventListener('resize', onResize);
    }

    const client = createClient(supabaseUrl, supabasePublishableKey);
    clientRef.current = client;

    client.auth.getSession().then(({ data }) => {
      const nextSession = data.session
        ? {
            user: {
              email: data.session.user.email ?? '',
              id: data.session.user.id,
            },
          }
        : null;
      setSession(nextSession);
      setBooting(false);
      if (nextSession) loadUserData(client, nextSession.user.email);
    });

    client.auth.onAuthStateChange((_event, nextAuthSession) => {
      const nextSession = nextAuthSession
        ? {
            user: {
              email: nextAuthSession.user.email ?? '',
              id: nextAuthSession.user.id,
            },
          }
        : null;
      setSession(nextSession);
      if (nextSession) loadUserData(client, nextSession.user.email);
    });

    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = I18N[lang];

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === 'th' ? 'en' : 'th';
      localStorage.setItem('msb_lang', next);
      return next;
    });
  }, []);

  const setTheme = useCallback((mode: Theme) => {
    localStorage.setItem('msb_theme', mode);
    setThemeState(mode);
  }, []);

  const toggleRuleInfo = useCallback(
    () => setShowRuleInfo((prev) => !prev),
    []
  );

  const onAuthEmailChange = useCallback(
    (value: string) => setAuthForm((prev) => ({ ...prev, email: value })),
    []
  );
  const onAuthPasswordChange = useCallback(
    (value: string) => setAuthForm((prev) => ({ ...prev, password: value })),
    []
  );
  const toggleAuthMode = useCallback(() => {
    setAuthMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setAuthError('');
  }, []);

  const submitAuth = useCallback(async () => {
    const { email: formEmail, password } = authForm;
    if (!formEmail || !password) {
      setAuthError(t.enterEmailPassword);
      return;
    }
    const client = clientRef.current;
    if (!client) return;

    setAuthLoading(true);
    setAuthError('');
    try {
      const { data, error } =
        authMode === 'signin'
          ? await client.auth.signInWithPassword({
              email: formEmail,
              password,
            })
          : await client.auth.signUp({ email: formEmail, password });
      if (error) throw error;
      const nextSession = data.session
        ? {
            user: {
              email: data.session.user.email ?? '',
              id: data.session.user.id,
            },
          }
        : null;
      setSession(nextSession);
      setAuthLoading(false);
      if (nextSession) loadUserData(client, nextSession.user.email);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : t.authFailed);
      setAuthLoading(false);
    }
  }, [authForm, authMode, loadUserData, t]);

  const signOut = useCallback(async () => {
    await clientRef.current?.auth.signOut();
    setSession(null);
    setTransactions([]);
  }, []);

  const onMonthChange = useCallback(
    (value: string) => setSelectedMonth(value),
    []
  );

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

  const openProfile = useCallback(() => {
    setProfileForm(profile);
    setShowProfile(true);
  }, [profile]);
  const closeProfile = useCallback(() => setShowProfile(false), []);
  const onProfileNameChange = useCallback(
    (value: string) => setProfileForm((prev) => ({ ...prev, name: value })),
    []
  );
  const onProfileIncomeChange = useCallback(
    (value: string) =>
      setProfileForm((prev) => ({ ...prev, monthlyIncome: value })),
    []
  );
  const selectAvatarColor = useCallback(
    (color: string) =>
      setProfileForm((prev) => ({ ...prev, avatarColor: color })),
    []
  );
  const saveProfile = useCallback(() => {
    localStorage.setItem(profileKey(email), JSON.stringify(profileForm));
    setProfile(profileForm);
    setShowProfile(false);
  }, [email, profileForm]);
  const editSplitFromProfile = useCallback(() => {
    setShowProfile(false);
    setRatioForm(ratios);
    setShowRatioModal(true);
  }, [ratios]);

  const openCategorySettings = useCallback(() => {
    setCategoryMetaForm(categoryMeta);
    setShowCategorySettings(true);
    setShowProfile(false);
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

  const openAddModal = useCallback(() => {
    setTxType('expense');
    setTxForm({ amount: '', note: '', category: 'needs', date: todayStr() });
    setShowAddModal(true);
  }, []);
  const closeAddModal = useCallback(() => setShowAddModal(false), []);
  const onTxAmountChange = useCallback(
    (value: string) => setTxForm((prev) => ({ ...prev, amount: value })),
    []
  );
  const onTxNoteChange = useCallback(
    (value: string) => setTxForm((prev) => ({ ...prev, note: value })),
    []
  );
  const onTxDateChange = useCallback(
    (value: string) => setTxForm((prev) => ({ ...prev, date: value })),
    []
  );
  const onTxCategoryChange = useCallback(
    (category: CategoryId) => setTxForm((prev) => ({ ...prev, category })),
    []
  );

  const deleteTx = useCallback(async (id: string) => {
    await clientRef.current?.from('transactions').delete().eq('id', id);
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }, []);

  const saveTransaction = useCallback(async () => {
    const amount = parseFloat(txForm.amount);
    if (!amount || amount <= 0) return;

    const tx: Transaction = {
      id: uid(),
      type: txType,
      category: txType === 'expense' ? txForm.category : null,
      note: txForm.note || (txType === 'income' ? t.income : t.expense),
      amount,
      date: txForm.date || todayStr(),
    };

    const client = clientRef.current;
    if (!client || !session?.user.id) return;

    const { data, error } = await client
      .from('transactions')
      .insert({ ...tx, user_id: session.user.id })
      .select();
    if (!error) {
      setTransactions((prev) => [
        (data?.[0] as Transaction | undefined) ?? tx,
        ...prev,
      ]);
    }
    setShowAddModal(false);
  }, [session, t, txForm, txType]);

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

  const monthTx = useMemo(
    () => transactions.filter((tx) => monthKey(tx.date) === selectedMonth),
    [transactions, selectedMonth]
  );

  const locale = lang === 'en' ? 'en-US' : 'th-TH';

  const monthOptions = useMemo(() => {
    const monthSet = new Set([todayStr().slice(0, 7), selectedMonth]);
    const now = new Date();
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(now);
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      monthSet.add(d.toISOString().slice(0, 7));
    }
    transactions.forEach((tx) => monthSet.add(monthKey(tx.date)));

    return Array.from(monthSet)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((month) => ({
        value: month,
        label: new Date(`${month}-02T00:00:00`).toLocaleDateString(locale, {
          month: 'long',
          year: 'numeric',
        }),
      }));
  }, [transactions, selectedMonth, locale]);

  const income = monthTx
    .filter((tx) => tx.type === 'income')
    .reduce((a, tx) => a + Number(tx.amount), 0);
  const expense = monthTx
    .filter((tx) => tx.type === 'expense')
    .reduce((a, tx) => a + Number(tx.amount), 0);
  const balance = income - expense;

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
            amountColor:
              tx.type === 'income' ? '#0E8F5F' : themeTokens(theme).text,
            onDelete: () => deleteTx(tx.id),
          };
        }),
    [monthTx, catById, categoryMeta, locale, theme, deleteTx]
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

  const avatarSwatches = useMemo(
    () =>
      AVATAR_COLORS.map((color) => ({
        color,
        selected: profileForm.avatarColor === color,
        onSelect: () => selectAvatarColor(color),
      })),
    [profileForm.avatarColor, selectAvatarColor]
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
    themeTokens: themeTokens(theme) as ThemeTokens,
    isDesktop,

    booting,
    showConfigError: !booting && configMissing,
    showLogin: !booting && !configMissing && !session,
    showApp: !booting && !configMissing && !!session,

    authMode,
    authForm,
    authError,
    authLoading,
    onAuthEmailChange,
    onAuthPasswordChange,
    toggleAuthMode,
    submitAuth,
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
