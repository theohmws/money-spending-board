import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

import { GroupedBarChart } from './GroupedBarChart';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  'monthlyTotals' | 'themeTokens'
>;

export const TrendChart = ({ monthlyTotals, themeTokens }: Props) => (
  <GroupedBarChart
    themeTokens={themeTokens}
    groups={monthlyTotals.map((entry) => ({
      label: entry.label,
      bars: [
        {
          id: 'income',
          value: entry.income,
          color: '#0E8F5F',
          emphasized: entry.isSelected,
        },
        {
          id: 'expense',
          value: entry.expense,
          color: '#C0374A',
          emphasized: entry.isSelected,
        },
      ],
    }))}
  />
);
