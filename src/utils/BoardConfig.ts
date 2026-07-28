export type Lang = 'th' | 'en';
export type Theme = 'light' | 'dark';
export type TxType = 'expense' | 'income';
export type CategoryId = 'needs' | 'savings' | 'wants';

export type Group = {
  id: CategoryId;
  color: string;
  dark: string;
};

export type CategoryMeta = {
  icon: string;
  color: string;
  dark: string;
};

export type CategoryMetaMap = Record<CategoryId, CategoryMeta>;
export type RatioMap = Record<CategoryId, number>;

export type Profile = {
  name: string;
  avatarColor: string;
  monthlyIncome: string;
};

export type Transaction = {
  id: string;
  type: TxType;
  category: CategoryId | null;
  note: string;
  amount: number;
  date: string;
};

export const GROUPS: Group[] = [
  { id: 'needs', color: '#F2AFC2', dark: '#7A2E42' },
  { id: 'savings', color: '#8DC152', dark: '#28421A' },
  { id: 'wants', color: '#F2B052', dark: '#5C3B0E' },
];

export const DEFAULT_MONTHLY_BASE = 2000;

export const DEFAULT_RATIOS: RatioMap = { needs: 50, savings: 20, wants: 30 };

export const DEFAULT_PROFILE: Profile = {
  name: '',
  avatarColor: '#0E8F5F',
  monthlyIncome: '',
};

export const AVATAR_COLORS = [
  '#0E8F5F',
  '#3B82F6',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
];

export const ICON_DEFS = [
  {
    id: 'home',
    d: 'M3 9l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 21V12h6v9',
  },
  {
    id: 'cart',
    d: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0',
  },
  {
    id: 'heart',
    d: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z',
  },
  { id: 'film', d: 'M2 3h20v14H2z M8 21h8 M12 17v4' },
  { id: 'zap', d: 'M13 2 3 14h7l-1 8 11-14h-7l1-8z' },
  {
    id: 'gift',
    d: 'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7c-2 0-4-1.5-4-3.5A2.5 2.5 0 0 1 12.5 1c.5 1-.5 6-.5 6z M12 7c2 0 4-1.5 4-3.5A2.5 2.5 0 0 0 11.5 1c-.5 1 .5 6 .5 6z',
  },
  { id: 'trending-up', d: 'M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6' },
] as const;

export const ICON_MAP: Record<string, string> = Object.fromEntries(
  ICON_DEFS.map((icon) => [icon.id, icon.d])
);

export const PALETTE = [
  { color: '#F2AFC2', dark: '#7A2E42' },
  { color: '#8DC152', dark: '#28421A' },
  { color: '#F2B052', dark: '#5C3B0E' },
  { color: '#7FB3F2', dark: '#1E3A5C' },
  { color: '#C9A6F2', dark: '#4B2A6B' },
];

export const DEFAULT_CATEGORY_META: CategoryMetaMap = {
  needs: { icon: 'home', color: '#F2AFC2', dark: '#7A2E42' },
  savings: { icon: 'trending-up', color: '#8DC152', dark: '#28421A' },
  wants: { icon: 'gift', color: '#F2B052', dark: '#5C3B0E' },
};

export const CAT_NAMES: Record<CategoryId, Record<Lang, string>> = {
  needs: { th: 'จำเป็น', en: 'Needs' },
  savings: { th: 'เงินออม', en: 'Savings' },
  wants: { th: 'ต้องการ', en: 'Wants' },
};

export const CAT_ITEMS: Record<CategoryId, Record<Lang, string[]>> = {
  needs: {
    th: ['ที่อยู่อาศัย', 'ค่าน้ำค่าไฟ', 'ของใช้ในบ้าน', 'การเดินทาง'],
    en: ['Housing', 'Utilities', 'Groceries', 'Transport'],
  },
  savings: {
    th: ['ออมอัตโนมัติ', 'ลงทุน', 'ชำระหนี้'],
    en: ['Auto-save', 'Invest', 'Pay off debt'],
  },
  wants: {
    th: ['ท่องเที่ยว', 'ช้อปปิ้ง', 'บันเทิง'],
    en: ['Travel', 'Shopping', 'Entertainment'],
  },
};

export type I18nDict = {
  loadingLabel: string;
  configMissing: string;
  welcomeBack: string;
  createBoard: string;
  signInSubtitle: string;
  signUpSubtitle: string;
  email: string;
  password: string;
  signIn: string;
  signUp: string;
  pleaseWait: string;
  toggleToSignUp: string;
  toggleToSignIn: string;
  footerAuth: string;
  signOut: string;
  available: string;
  income: string;
  spent: string;
  editRatio: string;
  ruleTitle: string;
  ruleBody: string;
  gotIt: string;
  recentActivity: string;
  noTransactionsYet: string;
  addTransaction: string;
  editTransaction: string;
  expense: string;
  amount: string;
  category: string;
  note: string;
  date: string;
  saveTransactionBtn: string;
  updateTransactionBtn: string;
  adjustSplit: string;
  splitDesc: string;
  total: string;
  saveSplit: string;
  categoryIconsColors: string;
  categoryIconsDesc: string;
  saveCategories: string;
  profileTitle: string;
  name: string;
  monthlyIncome: string;
  monthlyIncomeHint: string;
  splitRatio: string;
  needsWantsSavings: string;
  edit: string;
  categories: string;
  iconColorPerCategory: string;
  currency: string;
  thaiBaht: string;
  appearance: string;
  light: string;
  dark: string;
  saveProfileBtn: string;
  enterEmailPassword: string;
  authFailed: string;
  continueWithProvider: string;
  authDividerOr: string;
  overviewTab: string;
  graphTab: string;
  trendTab: string;
  compareTab: string;
  chartThisMonth: string;
  chartPreviousMonth: string;
  monthsUnit: string;
};

export const I18N: Record<Lang, I18nDict> = {
  th: {
    loadingLabel: 'กำลังโหลด…',
    configMissing:
      'ยังไม่ได้ตั้งค่าโปรเจกต์ Supabase — กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY แล้วสร้างแอปใหม่',
    welcomeBack: 'ยินดีต้อนรับกลับ',
    createBoard: 'สร้างบอร์ดของคุณ',
    signInSubtitle: 'เข้าสู่ระบบเพื่อดูรายรับรายจ่ายของคุณ',
    signUpSubtitle: 'สมัครสมาชิกเพื่อเริ่มติดตามรายจ่าย',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    signIn: 'เข้าสู่ระบบ',
    signUp: 'สมัครสมาชิก',
    pleaseWait: 'กรุณารอสักครู่…',
    toggleToSignUp: 'ยังไม่มีบัญชี? สมัครสมาชิก',
    toggleToSignIn: 'มีบัญชีแล้ว? เข้าสู่ระบบ',
    footerAuth: 'บอร์ดการเงินส่วนตัว · ปลอดภัยด้วย Supabase Auth',
    signOut: 'ออกจากระบบ',
    available: 'คงเหลือ',
    income: 'รายรับ',
    spent: 'ใช้ไปแล้ว',
    editRatio: 'แก้ไขสัดส่วน',
    ruleTitle: '50/30/20 Rule',
    ruleBody:
      'แนวทางการจัดงบประมาณอย่างง่าย: 50% ของรายรับสำหรับสิ่งจำเป็น (ที่อยู่อาศัย ค่าน้ำค่าไฟ ของใช้ในบ้าน) 30% สำหรับสิ่งที่ต้องการ (ความบันเทิง ท่องเที่ยว ช้อปปิ้ง) และ 20% สำหรับเงินออม (ชำระหนี้ ลงทุน เงินสำรองฉุกเฉิน) ปรับสัดส่วนของคุณเองได้ตลอดผ่าน "แก้ไขสัดส่วน"',
    gotIt: 'เข้าใจแล้ว',
    recentActivity: 'กิจกรรมล่าสุด',
    noTransactionsYet: 'ยังไม่มีรายการ',
    addTransaction: 'เพิ่มรายการ',
    editTransaction: 'แก้ไขรายการ',
    expense: 'รายจ่าย',
    amount: 'จำนวนเงิน',
    category: 'หมวดหมู่',
    note: 'บันทึกช่วยจำ',
    date: 'วันที่',
    saveTransactionBtn: 'บันทึกรายการ',
    updateTransactionBtn: 'บันทึกการแก้ไข',
    adjustSplit: 'ปรับสัดส่วนของคุณ',
    splitDesc:
      'กำหนดสัดส่วนรายเดือนของคุณเองแทนค่าเริ่มต้น 50/30/20 — ต้องรวมกันได้ 100%',
    total: 'รวม',
    saveSplit: 'บันทึกสัดส่วน',
    categoryIconsColors: 'ไอคอนและสีของหมวดหมู่',
    categoryIconsDesc: 'เลือกไอคอนและสีให้แต่ละหมวดหมู่งบประมาณของคุณ',
    saveCategories: 'บันทึกหมวดหมู่',
    profileTitle: 'โปรไฟล์',
    name: 'ชื่อ',
    monthlyIncome: 'รายรับต่อเดือน',
    monthlyIncomeHint:
      'ใช้คำนวณงบประมาณ 50/30/20 ของคุณ เว้นว่างไว้เพื่อใช้รายรับจริงที่บันทึกไว้เดือนนี้',
    splitRatio: 'สัดส่วนการแบ่ง',
    needsWantsSavings: 'จำเป็น/ต้องการ/เงินออม',
    edit: 'แก้ไข',
    categories: 'หมวดหมู่',
    iconColorPerCategory: 'ไอคอนและสีของแต่ละหมวดหมู่',
    currency: 'สกุลเงิน',
    thaiBaht: 'บาทไทย (฿)',
    appearance: 'ธีม',
    light: 'สว่าง',
    dark: 'มืด',
    saveProfileBtn: 'บันทึกโปรไฟล์',
    enterEmailPassword: 'กรุณากรอกอีเมลและรหัสผ่าน',
    continueWithProvider: 'ดำเนินการต่อด้วย {provider}',
    authDividerOr: 'หรือ',
    authFailed: 'การเข้าสู่ระบบล้มเหลว',
    overviewTab: 'ภาพรวม',
    graphTab: 'กราฟ',
    trendTab: 'แนวโน้ม',
    compareTab: 'เปรียบเทียบ',
    chartThisMonth: 'เดือนนี้',
    chartPreviousMonth: 'เดือนที่แล้ว',
    monthsUnit: 'เดือน',
  },
  en: {
    loadingLabel: 'Loading…',
    configMissing:
      'No Supabase project configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and rebuild the app.',
    welcomeBack: 'Welcome back',
    createBoard: 'Create your board',
    signInSubtitle: 'Sign in to see your spending.',
    signUpSubtitle: 'Sign up to start tracking your spending.',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signUp: 'Sign up',
    pleaseWait: 'Please wait…',
    toggleToSignUp: "Don't have an account? Sign up",
    toggleToSignIn: 'Have an account? Sign in',
    footerAuth: 'Personal spending board · secured by Supabase Auth',
    signOut: 'Sign out',
    available: 'Available',
    income: 'Income',
    spent: 'Spent',
    editRatio: 'Edit ratio',
    ruleTitle: '50/30/20 Rule',
    ruleBody:
      'A simple budgeting guideline: 50% of income to Needs (housing, bills, groceries), 30% to Wants (fun, travel, shopping), and 20% to Savings (debt payoff, investing, emergency fund). Adjust your own split anytime with "Edit ratio".',
    gotIt: 'Got it',
    recentActivity: 'Recent activity',
    noTransactionsYet: 'No transactions yet',
    addTransaction: 'Add transaction',
    editTransaction: 'Edit transaction',
    expense: 'Expense',
    amount: 'Amount',
    category: 'Category',
    note: 'Note',
    date: 'Date',
    saveTransactionBtn: 'Save transaction',
    updateTransactionBtn: 'Save changes',
    adjustSplit: 'Adjust your split',
    splitDesc:
      'Set your own monthly split instead of the default 50/30/20 — must add up to 100%.',
    total: 'Total',
    saveSplit: 'Save split',
    categoryIconsColors: 'Category icons & colors',
    categoryIconsDesc:
      'Pick an icon and color for each of your budget categories.',
    saveCategories: 'Save categories',
    profileTitle: 'Profile',
    name: 'Name',
    monthlyIncome: 'Monthly income',
    monthlyIncomeHint:
      'Used to calculate your 50/30/20 budgets. Leave blank to use actual income logged this month.',
    splitRatio: 'Split ratio',
    needsWantsSavings: 'Needs/Wants/Savings',
    edit: 'Edit',
    categories: 'Categories',
    iconColorPerCategory: 'Icon & color per category',
    currency: 'Currency',
    thaiBaht: 'Thai Baht (฿)',
    appearance: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    saveProfileBtn: 'Save profile',
    enterEmailPassword: 'Enter email and password.',
    authFailed: 'Authentication failed.',
    continueWithProvider: 'Continue with {provider}',
    authDividerOr: 'or',
    overviewTab: 'Overview',
    graphTab: 'Graph',
    trendTab: 'Trend',
    compareTab: 'Compare',
    chartThisMonth: 'This month',
    chartPreviousMonth: 'Last month',
    monthsUnit: 'months',
  },
};
