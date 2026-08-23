import { useMemo, useState } from 'react';

import type { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { fmtSignedMoney } from '@/utils/boardHelpers';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'transactionRows'
  | 'transactionFilter'
  | 'setTransactionFilter'
  | 'badgeColors'
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
        netColor: net >= 0 ? '#0E8F5F' : '#C0374A',
      };
    });
  }, [transactionRows]);

  const toggleDay = (date: string) =>
    setCollapsedDays((prev) => ({ ...prev, [date]: !prev[date] }));

  return (
    <div>
      <div className="mt-7.5 flex items-center justify-between">
        <div
          className="font-manrope text-[15px] font-bold"
          style={{ color: themeTokens.text }}
        >
          {t.recentActivity}
        </div>
        <div
          className="flex gap-1 rounded-[9px] p-0.5"
          style={{ background: themeTokens.chipBg }}
        >
          <button
            type="button"
            onClick={() => setTransactionFilter('all')}
            className="rounded-lg px-2.5 py-1 text-[11.5px] font-semibold"
            style={{
              background:
                transactionFilter === 'all'
                  ? themeTokens.cardBg
                  : 'transparent',
              color:
                transactionFilter === 'all'
                  ? themeTokens.text
                  : themeTokens.chipText,
            }}
          >
            {t.allTransactionsFilterLabel}
          </button>
          <button
            type="button"
            onClick={() => setTransactionFilter('needsReview')}
            className="rounded-lg px-2.5 py-1 text-[11.5px] font-semibold"
            style={{
              background:
                transactionFilter === 'needsReview'
                  ? themeTokens.cardBg
                  : 'transparent',
              color:
                transactionFilter === 'needsReview'
                  ? themeTokens.text
                  : themeTokens.chipText,
            }}
          >
            {t.needsReviewFilterLabel}
          </button>
        </div>
      </div>

      {transactionFilter === 'needsReview' && (
        <div
          className="mt-2 text-[11.5px] leading-relaxed"
          style={{ color: themeTokens.subtext2 }}
        >
          {t.needsReviewFilterHint}
        </div>
      )}

      {deleteError && (
        <div
          className="mt-2.5 rounded-[10px] px-3 py-2.5 text-[13px]"
          style={{ background: '#FBEAEC', color: '#C0374A' }}
        >
          {deleteError}
        </div>
      )}

      <div className="mt-2.5 flex flex-col">
        {transactionRows.length === 0 && (
          <div className="flex flex-col items-center py-7.5 text-center">
            <div
              className="flex size-11 items-center justify-center rounded-full"
              style={{
                background: themeTokens.chipBg,
                color: themeTokens.subtext2,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14 M5 12h14" />
              </svg>
            </div>
            <div
              className="mt-3 text-[13.5px] font-semibold"
              style={{ color: themeTokens.subtext }}
            >
              {t.noTransactionsYet}
            </div>
            <div
              className="mt-1 text-[12px]"
              style={{ color: themeTokens.subtext3 }}
            >
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
                className="flex w-full items-center justify-between border-b py-2 text-left"
                style={{ borderColor: themeTokens.divider }}
              >
                <span
                  className="text-[12.5px] font-bold"
                  style={{ color: themeTokens.subtext }}
                >
                  {group.dayLabel}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: themeTokens.subtext2 }}
                  >
                    {t.total}
                  </span>
                  <span
                    className="text-[13.5px] font-bold"
                    style={{
                      color: group.netColor,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {group.netLabel}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      color: themeTokens.subtext2,
                      transform: isCollapsed
                        ? 'rotate(-90deg)'
                        : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
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
                    className="relative flex items-center gap-3 border-b py-3 pl-2.5 text-left"
                    style={{
                      borderColor: themeTokens.divider,
                      cursor: isOnline ? 'pointer' : 'default',
                      opacity: isOnline ? 1 : 0.6,
                    }}
                  >
                    {tx.needsReview && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-2 left-0 w-[3px] rounded-full"
                        style={{ background: needsReviewColor }}
                      />
                    )}
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-[10px] font-manrope text-[13px] font-bold text-white"
                      style={{ background: tx.color }}
                    >
                      {tx.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-sm font-semibold"
                        style={{ color: themeTokens.text }}
                      >
                        {tx.title}
                      </div>
                      {(tx.subtitle !== tx.title || tx.sourceLabel) && (
                        <div
                          className="mt-0.5 flex items-center gap-1.5 truncate text-xs"
                          style={{ color: themeTokens.subtext2 }}
                        >
                          {tx.subtitle !== tx.title && (
                            <span>{tx.subtitle}</span>
                          )}
                          {tx.sourceLabel && (
                            <span
                              className="font-manrope text-[10px] font-extrabold uppercase tracking-wide"
                              style={{ color: sourceColor }}
                            >
                              {tx.sourceLabel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      className="text-[14.5px] font-bold"
                      style={{
                        color: tx.amountColor,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {tx.amountLabel}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        tx.onDelete();
                      }}
                      disabled={!isOnline}
                      className="px-0.5 py-1 text-base disabled:cursor-not-allowed"
                      style={{ color: themeTokens.subtext2 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
