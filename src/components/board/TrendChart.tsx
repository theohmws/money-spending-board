import { useState } from 'react';

import type { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { TREND_MONTH_LIMIT_OPTIONS } from '@/hooks/useSpendingBoard';
import { fmtMoney } from '@/utils/boardHelpers';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'monthlyTotals'
  | 'trendMonthLimit'
  | 'setTrendMonthLimit'
  | 'trendSeries'
  | 'setTrendSeries'
  | 'themeTokens'
>;

const INCOME_COLOR = '#0E8F5F';

type Segment = {
  id: string;
  label: string;
  color: string;
  amount: number;
};

type HoverKey = { month: string; segmentId: string } | null;

export const TrendChart = ({
  t,
  monthlyTotals,
  trendMonthLimit,
  setTrendMonthLimit,
  trendSeries,
  setTrendSeries,
  themeTokens,
}: Props) => {
  const [hovered, setHovered] = useState<HoverKey>(null);

  const isExpense = trendSeries === 'expense';

  const rows = monthlyTotals.map((entry) => ({
    month: entry.month,
    label: entry.label,
    isSelected: entry.isSelected,
    total: isExpense ? entry.expense : entry.income,
    segments: (isExpense
      ? entry.categoryBreakdown.map((category) => ({
          id: category.id,
          label: category.name,
          color: category.color,
          amount: category.amount,
        }))
      : [
          {
            id: 'income',
            label: t.income,
            color: INCOME_COLOR,
            amount: entry.income,
          },
        ]) satisfies Segment[],
  }));

  const legend: Segment[] = isExpense ? rows[0]?.segments ?? [] : [];

  const maxTotal = Math.max(1, ...rows.map((row) => row.total));

  return (
    <div>
      <div
        className="flex gap-2 rounded-[11px] p-1"
        style={{ background: themeTokens.chipBg }}
      >
        <button
          type="button"
          onClick={() => setTrendSeries('income')}
          className="flex-1 rounded-lg p-2 text-[12.5px] font-semibold"
          style={{
            background: !isExpense ? themeTokens.cardBg : 'transparent',
            color: !isExpense ? themeTokens.text : themeTokens.subtext2,
          }}
        >
          {t.income}
        </button>
        <button
          type="button"
          onClick={() => setTrendSeries('expense')}
          className="flex-1 rounded-lg p-2 text-[12.5px] font-semibold"
          style={{
            background: isExpense ? themeTokens.cardBg : 'transparent',
            color: isExpense ? themeTokens.text : themeTokens.subtext2,
          }}
        >
          {t.expense}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {TREND_MONTH_LIMIT_OPTIONS.map((option) => {
          const active = option === trendMonthLimit;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setTrendMonthLimit(option)}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: active ? '#132119' : themeTokens.chipBg,
                color: active ? '#EFFCF4' : themeTokens.chipText,
              }}
            >
              {option} {t.monthsUnit}
            </button>
          );
        })}
      </div>

      {legend.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1">
          {legend.map((item) => (
            <div key={item.id} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-[2px]"
                style={{ background: item.color }}
              />
              <span
                className="text-[11px]"
                style={{ color: themeTokens.subtext2 }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2.5">
        {rows.map((row) => {
          const trackWidth = (row.total / maxTotal) * 100;
          const dimmed = !row.isSelected;

          return (
            <div key={row.month} className="flex items-center gap-2.5">
              <div
                className="w-14 shrink-0 truncate text-[10.5px]"
                style={{
                  color: row.isSelected
                    ? themeTokens.text
                    : themeTokens.subtext2,
                  fontWeight: row.isSelected ? 700 : 400,
                }}
              >
                {row.label}
              </div>

              <div
                className="relative h-5 flex-1 overflow-hidden rounded-md"
                style={{ background: themeTokens.chipBg }}
              >
                <div
                  className="flex h-full"
                  style={{
                    width: `${trackWidth}%`,
                    opacity: dimmed ? 0.45 : 1,
                  }}
                >
                  {row.segments
                    .filter((segment) => segment.amount > 0)
                    .map((segment) => {
                      const share =
                        row.total > 0 ? (segment.amount / row.total) * 100 : 0;
                      return (
                        <div
                          key={segment.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`${row.label}, ${
                            segment.label
                          }: ${fmtMoney(segment.amount)}`}
                          className="h-full outline-none"
                          style={{
                            width: `${share}%`,
                            background: segment.color,
                            cursor: 'pointer',
                          }}
                          onMouseEnter={() =>
                            setHovered({
                              month: row.month,
                              segmentId: segment.id,
                            })
                          }
                          onMouseLeave={() => setHovered(null)}
                          onFocus={() =>
                            setHovered({
                              month: row.month,
                              segmentId: segment.id,
                            })
                          }
                          onBlur={() => setHovered(null)}
                        />
                      );
                    })}
                </div>

                {hovered &&
                  hovered.month === row.month &&
                  (() => {
                    const segment = row.segments.find(
                      (s) => s.id === hovered.segmentId
                    );
                    if (!segment) return null;
                    return (
                      <div
                        className="pointer-events-none absolute left-1/2 top-full z-10 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-center shadow-lg"
                        style={{
                          marginTop: 6,
                          background: themeTokens.cardBg,
                          border: `1px solid ${themeTokens.inputBorder}`,
                        }}
                      >
                        <div
                          className="text-[10px]"
                          style={{ color: themeTokens.subtext2 }}
                        >
                          {row.label} · {segment.label}
                        </div>
                        <div
                          className="text-[13px] font-bold"
                          style={{ color: themeTokens.text }}
                        >
                          {fmtMoney(segment.amount)}
                        </div>
                      </div>
                    );
                  })()}
              </div>

              <div
                className="w-16 shrink-0 text-right text-[10.5px] font-semibold"
                style={{
                  color: row.isSelected
                    ? themeTokens.text
                    : themeTokens.subtext2,
                }}
              >
                {fmtMoney(row.total)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
