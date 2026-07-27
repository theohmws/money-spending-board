import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

import { GroupedBarChart } from './GroupedBarChart';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  'compareRows' | 'themeTokens'
>;

export const CompareChart = ({ compareRows, themeTokens }: Props) => (
  <GroupedBarChart
    themeTokens={themeTokens}
    groups={compareRows.map((row) => ({
      label: row.name,
      bars: [
        {
          id: 'previous',
          value: row.previousSpend,
          color: row.color,
          emphasized: false,
        },
        {
          id: 'selected',
          value: row.selectedSpend,
          color: row.color,
          emphasized: true,
        },
      ],
    }))}
  />
);
