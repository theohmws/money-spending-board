import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'lang'
  | 'toggleLang'
  | 'openProfile'
  | 'headerAvatarBg'
  | 'headerAvatarInitial'
  | 'userEmail'
  | 'signOut'
  | 'selectedMonth'
  | 'monthOptions'
  | 'onMonthChange'
  | 'balanceLabel'
  | 'incomeLabel'
  | 'expenseLabel'
>;

export const BoardHeader = ({
  t,
  lang,
  toggleLang,
  openProfile,
  headerAvatarBg,
  headerAvatarInitial,
  userEmail,
  signOut,
  selectedMonth,
  monthOptions,
  onMonthChange,
  balanceLabel,
  incomeLabel,
  expenseLabel,
}: Props) => (
  <div
    className="px-6 pb-[30px] pt-6.5"
    style={{ background: '#132119', color: '#EFFCF4' }}
  >
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={openProfile}
        className="flex items-center gap-2.5"
      >
        <div
          className="flex size-8.5 items-center justify-center rounded-[10px] font-manrope text-[15px] font-extrabold text-white"
          style={{ background: headerAvatarBg }}
        >
          {headerAvatarInitial}
        </div>
        <div className="text-[13px]" style={{ color: '#9FCBB1' }}>
          {userEmail}
        </div>
      </button>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleLang}
          className="rounded-[9px] px-2.5 py-2 text-xs font-bold"
          style={{ background: 'rgba(255,255,255,0.10)', color: '#D9F5E5' }}
        >
          {lang === 'th' ? 'EN' : 'TH'}
        </button>
        <button
          type="button"
          onClick={signOut}
          className="rounded-[9px] px-3 py-2 text-[12.5px]"
          style={{ background: 'rgba(255,255,255,0.10)', color: '#D9F5E5' }}
        >
          {t.signOut}
        </button>
      </div>
    </div>

    <div className="mt-5.5 flex items-center justify-between">
      <div className="text-[13px]" style={{ color: '#8FBFA3' }}>
        {t.available}
      </div>
      <select
        value={selectedMonth}
        onChange={(e) => onMonthChange(e.target.value)}
        className="rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold"
        style={{ background: 'rgba(255,255,255,0.10)', color: '#EFFCF4' }}
      >
        {monthOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>

    <div className="mt-1 font-manrope text-[38px] font-extrabold">
      {balanceLabel}
    </div>

    <div className="mt-4 flex gap-5.5">
      <div>
        <div className="text-[11.5px]" style={{ color: '#7FAF95' }}>
          {t.income}
        </div>
        <div className="mt-0.5 text-[15px] font-bold">{incomeLabel}</div>
      </div>
      <div>
        <div className="text-[11.5px]" style={{ color: '#7FAF95' }}>
          {t.spent}
        </div>
        <div className="mt-0.5 text-[15px] font-bold">{expenseLabel}</div>
      </div>
    </div>
  </div>
);
