import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

import { GroupedBarChart } from './GroupedBarChart';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  't' | 'compareRows' | 'themeTokens'
>;

export const CompareChart = ({ t, compareRows, themeTokens }: Props) => (
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
