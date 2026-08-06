import { useMemo, useState } from 'react';

import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  't' | 'transactionRows' | 'deleteError' | 'isOnline' | 'themeTokens'
>;

export const TransactionList = ({
  t,
  transactionRows,
  deleteError,
  isOnline,
  themeTokens,
}: Props) => {
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
    return groups;
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
      </div>

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
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {!isCollapsed &&
                group.rows.map((tx) => (
                  <div
                    key={tx.id}
                    role="button"
                    tabIndex={isOnline ? 0 : -1}
                    onClick={isOnline ? tx.onEdit : undefined}
                    onKeyDown={(e) => {
                      if (isOnline && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        tx.onEdit();
                      }
                    }}
                    className="flex items-center gap-3 border-b py-3 text-left"
                    style={{
                      borderColor: themeTokens.divider,
                      cursor: isOnline ? 'pointer' : 'default',
                      opacity: isOnline ? 1 : 0.6,
                    }}
                  >
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
                      {tx.subtitle !== tx.title && (
                        <div
                          className="mt-0.5 truncate text-xs"
                          style={{ color: themeTokens.subtext2 }}
                        >
                          {tx.subtitle}
                        </div>
                      )}
                    </div>
                    <div
                      className="text-[14.5px] font-bold"
                      style={{ color: tx.amountColor }}
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
