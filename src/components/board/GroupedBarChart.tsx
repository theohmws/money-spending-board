import type { ThemeTokens } from '@/utils/boardHelpers';

export type BarSpec = {
  id: string;
  value: number;
  color: string;
  emphasized?: boolean;
};

export type BarGroupSpec = {
  label: string;
  bars: BarSpec[];
};

type Props = {
  groups: BarGroupSpec[];
  themeTokens: ThemeTokens;
};

const CHART_HEIGHT = 100;
const GROUP_GAP = 3;
const BAR_GAP = 1.5;

export const GroupedBarChart = ({ groups, themeTokens }: Props) => {
  const maxValue = Math.max(
    1,
    ...groups.flatMap((group) => group.bars.map((bar) => bar.value))
  );
  const groupWidth = groups.length > 0 ? 100 / groups.length : 100;

  return (
    <div>
      <svg
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="h-36 w-full"
      >
        {groups.flatMap((group, groupIndex) => {
          const groupX = groupIndex * groupWidth + GROUP_GAP / 2;
          const availableWidth = groupWidth - GROUP_GAP;
          const barCount = group.bars.length || 1;
          const barWidth =
            (availableWidth - BAR_GAP * (barCount - 1)) / barCount;

          return group.bars.map((bar, barIndex) => {
            const barHeight = Math.max(
              0.5,
              (bar.value / maxValue) * CHART_HEIGHT
            );
            const x = groupX + barIndex * (barWidth + BAR_GAP);
            const y = CHART_HEIGHT - barHeight;
            return (
              <rect
                key={`${group.label}-${bar.id}`}
                x={x}
                y={y}
                width={Math.max(barWidth, 0)}
                height={barHeight}
                rx={1.2}
                fill={bar.color}
                opacity={bar.emphasized === false ? 0.4 : 1}
              />
            );
          });
        })}
      </svg>
      <div className="mt-1.5 flex">
        {groups.map((group) => (
          <div
            key={group.label}
            className="flex-1 truncate text-center text-[10.5px]"
            style={{ color: themeTokens.subtext2 }}
          >
            {group.label}
          </div>
        ))}
      </div>
    </div>
  );
};
