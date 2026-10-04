import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/input';
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
  | 'transferLabel'
>;

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-0.5 truncate text-sm font-semibold tabular-nums">
      {value}
    </div>
  </div>
);

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
  transferLabel,
}: Props) => (
  <header className="flex flex-col gap-4 px-4 pt-4 sm:px-6">
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={openProfile}
        className="flex min-w-0 items-center gap-2 rounded-lg p-1 text-left outline-none transition-colors hover:bg-muted focus-visible:ring focus-visible:ring-ring/50"
      >
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
          style={{ background: headerAvatarBg }}
        >
          {headerAvatarInitial}
        </div>
        <div className="truncate text-sm text-muted-foreground">
          {userEmail}
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" onClick={toggleLang}>
          {lang === 'th' ? 'EN' : 'TH'}
        </Button>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut />
          {t.signOut}
        </Button>
      </div>
    </div>

    <Card className="gap-3">
      <div className="flex items-center justify-between gap-3 px-4">
        <div className="text-sm text-muted-foreground">{t.available}</div>
        <NativeSelect
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          aria-label={t.available}
          className="h-7 w-auto"
        >
          {monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="px-4 text-4xl font-semibold tabular-nums tracking-tight">
        {balanceLabel}
      </div>
      <div className="grid grid-cols-3 gap-3 px-4">
        <Stat label={t.income} value={incomeLabel} />
        <Stat label={t.spent} value={expenseLabel} />
        <Stat label={t.transfer} value={transferLabel} />
      </div>
    </Card>
  </header>
);
