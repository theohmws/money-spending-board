import { useMemo, useState } from 'react';

import type { ThemeTokens } from '@/utils/boardHelpers';
import { fmtMoney } from '@/utils/boardHelpers';

export type BarSpec = {
  id: string;
  label: string;
  value: number;
  color: string;
  emphasized?: boolean;
};

export type BarGroupSpec = {
  label: string;
  bars: BarSpec[];
};

export type LegendItem = {
  id: string;
  label: string;
  color: string;
  dimmed?: boolean;
};

type Props = {
  groups: BarGroupSpec[];
  legend: LegendItem[];
  themeTokens: ThemeTokens;
};

const CHART_HEIGHT = 100;
// Bars only ever grow into the bottom (100 - BAR_MAX_HEIGHT)% of the chart,
// reserving headroom at the top so the value label above the tallest bar
// never collides with the legend row above the chart.
const BAR_MAX_HEIGHT = 80;
const GROUP_GAP = 3;
const BAR_GAP = 1.5;
const LABEL_MIN_HEIGHT = 14;

type BarGeometry = {
  key: string;
  group: BarGroupSpec;
  bar: BarSpec;
  groupIndex: number;
  barIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export const GroupedBarChart = ({ groups, legend, themeTokens }: Props) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const bars = useMemo<BarGeometry[]>(() => {
    const maxValue = Math.max(
      1,
      ...groups.flatMap((group) => group.bars.map((bar) => bar.value))
    );
    const groupWidth = groups.length > 0 ? 100 / groups.length : 100;

    return groups.flatMap((group, groupIndex) => {
      const groupX = groupIndex * groupWidth + GROUP_GAP / 2;
      const availableWidth = groupWidth - GROUP_GAP;
      const barCount = group.bars.length || 1;
      const barWidth = (availableWidth - BAR_GAP * (barCount - 1)) / barCount;

      return group.bars.map((bar, barIndex) => {
        const height = Math.max(0.5, (bar.value / maxValue) * BAR_MAX_HEIGHT);
        const x = groupX + barIndex * (barWidth + BAR_GAP);
        return {
          key: `${group.label}-${bar.id}`,
          group,
          bar,
          groupIndex,
          barIndex,
          x,
          y: CHART_HEIGHT - height,
          width: Math.max(barWidth, 0),
          height,
        };
      });
    });
  }, [groups]);

  const hovered = bars.find((entry) => entry.key === hoveredKey) ?? null;

  return (
    <div>
      {legend.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          {legend.map((item) => (
            <div key={item.id} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-[2px]"
                style={{
                  background: item.color,
                  opacity: item.dimmed ? 0.4 : 1,
                }}
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

      <div className="relative">
        <svg
          viewBox={`0 0 100 ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="h-36 w-full overflow-visible"
        >
          <line
            x1={0}
            y1={CHART_HEIGHT}
            x2={100}
            y2={CHART_HEIGHT}
            stroke={themeTokens.divider}
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
          {bars.map((entry) => {
            const isHovered = entry.key === hoveredKey;
            const baseOpacity = entry.bar.emphasized === false ? 0.4 : 1;
            const ariaLabel = `${entry.group.label}, ${
              entry.bar.label
            }: ${fmtMoney(entry.bar.value)}`;
            return (
              <rect
                key={entry.key}
                x={entry.x}
                y={entry.y}
                width={entry.width}
                height={entry.height}
                rx={1.2}
                fill={entry.bar.color}
                opacity={isHovered ? 1 : baseOpacity}
                stroke={isHovered ? themeTokens.cardBg : 'none'}
                strokeWidth={isHovered ? 1 : 0}
                vectorEffect="non-scaling-stroke"
                tabIndex={0}
                role="img"
                aria-label={ariaLabel}
                onMouseEnter={() => setHoveredKey(entry.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onFocus={() => setHoveredKey(entry.key)}
                onBlur={() => setHoveredKey(null)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </svg>

        {bars
          .filter(
            (entry) => entry.bar.value > 0 && entry.height >= LABEL_MIN_HEIGHT
          )
          .map((entry) => (
            <div
              key={entry.key}
              className="pointer-events-none absolute whitespace-nowrap text-[9.5px] font-semibold"
              style={{
                left: `${entry.x + entry.width / 2}%`,
                top: `${entry.y}%`,
                transform: 'translate(-50%, calc(-100% - 3px))',
                color: themeTokens.text,
                opacity: entry.bar.emphasized === false ? 0.55 : 1,
              }}
            >
              {fmtMoney(entry.bar.value)}
            </div>
          ))}

        {hovered && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg px-2.5 py-1.5 text-center shadow-lg"
            style={{
              left: `${hovered.x + hovered.width / 2}%`,
              top: `${hovered.y}%`,
              transform: 'translate(-50%, calc(-100% - 10px))',
              background: themeTokens.cardBg,
              border: `1px solid ${themeTokens.inputBorder}`,
            }}
          >
            <div
              className="whitespace-nowrap text-[10px]"
              style={{ color: themeTokens.subtext2 }}
            >
              {hovered.group.label} · {hovered.bar.label}
            </div>
            <div
              className="whitespace-nowrap text-[13px] font-bold"
              style={{ color: themeTokens.text }}
            >
              {fmtMoney(hovered.bar.value)}
            </div>
          </div>
        )}
      </div>

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
