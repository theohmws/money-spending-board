import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

import { GroupedBarChart } from './GroupedBarChart';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  't' | 'compareRows' | 'themeTokens'
>;

export const CompareChart = ({ t, compareRows, themeTokens }: Props) => {
  const hasData = compareRows.some(
    (row) => row.previousSpend > 0 || row.selectedSpend > 0
  );

  if (!hasData) {
    return (
      <div
        className="py-7.5 text-center text-[13.5px]"
        style={{ color: themeTokens.subtext3 }}
      >
        {t.noCompareData}
      </div>
    );
  }

  return (
    <GroupedBarChart
      themeTokens={themeTokens}
      legend={[
        {
          id: 'previous',
          label: t.chartPreviousMonth,
          color: themeTokens.text,
          dimmed: true,
        },
        { id: 'selected', label: t.chartThisMonth, color: themeTokens.text },
      ]}
      groups={compareRows.map((row) => ({
        label: row.name,
        bars: [
          {
            id: 'previous',
            label: t.chartPreviousMonth,
            value: row.previousSpend,
            color: row.color,
            emphasized: false,
          },
          {
            id: 'selected',
            label: t.chartThisMonth,
            value: row.selectedSpend,
            color: row.color,
            emphasized: true,
          },
        ],
      }))}
    />
  );
};
