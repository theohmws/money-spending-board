import { ChevronDown, Plus, Upload, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { fmtSignedMoney } from '@/utils/boardHelpers';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'transactionRows'
  | 'transactionFilter'
  | 'setTransactionFilter'
  | 'badgeColors'
  | 'startImport'
  | 'deleteError'
  | 'isOnline'
  | 'themeTokens'
>;

export const TransactionList = ({
  t,
  transactionRows,
  transactionFilter,
  setTransactionFilter,
  badgeColors,
  startImport,
  deleteError,
  isOnline,
  themeTokens,
}: Props) => {
  const isDark = themeTokens.mode === 'dark';
  // No background fill on either indicator (design.md Decision 5b), so each
  // uses the member of its color pair that reads as legible foreground text
  // against `cardBg` — same "flip by theme" idea BudgetSplit already uses
  // for its category cards, just without ever using the pair as a fill.
  const needsReviewColor = isDark
    ? badgeColors.needsReview.color
    : badgeColors.needsReview.dark;
  const sourceColor = isDark
    ? badgeColors.source.color
    : badgeColors.source.dark;

  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>(
    {}
  );

  const dayGroups = useMemo(() => {
    const groups: {
      date: string;
      dayLabel: string;
      rows: typeof transactionRows;
    }[] = [];
    transactionRows.forEach((tx) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === tx.date) {
        lastGroup.rows.push(tx);
      } else {
        groups.push({ date: tx.date, dayLabel: tx.dayLabel, rows: [tx] });
      }
    });
    return groups.map((group) => {
      const net = group.rows.reduce((sum, row) => sum + row.netAmount, 0);
      return {
        ...group,
        netLabel: fmtSignedMoney(net),
        netColor: net >= 0 ? 'text-chart-4' : 'text-destructive',
      };
    });
  }, [transactionRows]);

  const toggleDay = (date: string) =>
    setCollapsedDays((prev) => ({ ...prev, [date]: !prev[date] }));

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{t.recentActivity}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={startImport}
            aria-label={t.importEntryLabel}
          >
            <Upload />
          </Button>
          <Tabs
            value={transactionFilter}
            onValueChange={(value) =>
              setTransactionFilter(value as typeof transactionFilter)
            }
          >
            <TabsList className="h-7 w-auto">
              <TabsTrigger value="all" className="px-2.5 text-xs">
                {t.allTransactionsFilterLabel}
              </TabsTrigger>
              <TabsTrigger value="needsReview" className="px-2.5 text-xs">
                {t.needsReviewFilterLabel}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {transactionFilter === 'needsReview' && (
        <div className="text-xs leading-relaxed text-muted-foreground">
          {t.needsReviewFilterHint}
        </div>
      )}

      {deleteError && (
        <div
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive dark:bg-destructive/20"
        >
          {deleteError}
        </div>
      )}

      <div className="flex flex-col">
        {transactionRows.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Plus className="size-5" />
            </div>
            <div className="mt-3 text-sm font-medium">
              {t.noTransactionsYet}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {t.noTransactionsHint}
            </div>
          </div>
        )}
        {dayGroups.map((group) => {
          const isCollapsed = !!collapsedDays[group.date];
          return (
            <div key={group.date}>
              <button
                type="button"
                onClick={() => toggleDay(group.date)}
                aria-expanded={!isCollapsed}
                className="flex w-full items-center justify-between border-b py-2 text-left outline-none focus-visible:ring focus-visible:ring-ring/50"
              >
                <span className="text-sm font-medium text-muted-foreground">
                  {group.dayLabel}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {t.total}
                  </span>
                  <span
                    className={`text-sm font-semibold tabular-nums ${group.netColor}`}
                  >
                    {group.netLabel}
                  </span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                </div>
              </button>

              {!isCollapsed &&
                group.rows.map((tx) => (
                  <div
                    key={tx.id}
                    role="button"
                    aria-label={tx.ariaLabel}
                    tabIndex={isOnline ? 0 : -1}
                    onClick={isOnline ? tx.onEdit : undefined}
                    onKeyDown={(e) => {
                      if (isOnline && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        tx.onEdit();
                      }
                    }}
                    className={`relative flex items-center gap-3 border-b py-2.5 pl-2.5 text-left outline-none transition-colors focus-visible:ring focus-visible:ring-ring/50 ${
                      isOnline
                        ? 'cursor-pointer hover:bg-muted/50'
                        : 'cursor-default opacity-60'
                    }`}
                  >
                    {tx.needsReview && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 left-0 w-[3px] rounded-full"
                        style={{ background: needsReviewColor }}
                      />
                    )}
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
                      style={{ background: tx.color }}
                    >
                      {tx.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {tx.title}
                      </div>
                      {(tx.subtitle !== tx.title || tx.sourceLabel) && (
                        <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                          {tx.subtitle !== tx.title && (
                            <span>{tx.subtitle}</span>
                          )}
                          {tx.sourceLabel && (
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wide"
                              style={{ color: sourceColor }}
                            >
                              {tx.sourceLabel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: tx.amountColor }}
                    >
                      {tx.amountLabel}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        tx.onDelete();
                      }}
                      disabled={!isOnline}
                      aria-label={t.deleteLabel}
                      className="text-muted-foreground"
                    >
                      <X />
                    </Button>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </section>
  );
};
