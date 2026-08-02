import { useMemo, useState } from 'react';

import type { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { fmtMoney } from '@/utils/boardHelpers';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  't' | 'compareRows' | 'themeTokens'
>;

const CHART_HEIGHT = 100;
// Bars only ever grow into the bottom (100 - BAR_MAX_HEIGHT)% of the chart,
// reserving headroom at the top so the value label above the tallest bar
// never collides with the legend row above the chart.
const BAR_MAX_HEIGHT = 80;
const GROUP_GAP = 3;
const BAR_GAP = 1.5;
const LABEL_MIN_HEIGHT = 14;

type Bar = { id: 'previous' | 'selected'; label: string; value: number };

type BarGeometry = {
  key: string;
  groupLabel: string;
  bar: Bar;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export const CompareChart = ({ t, compareRows, themeTokens }: Props) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const hasData = compareRows.some(
    (row) => row.previousSpend > 0 || row.selectedSpend > 0
  );

  const bars = useMemo<BarGeometry[]>(() => {
    const maxValue = Math.max(
      1,
      ...compareRows.flatMap((row) => [row.previousSpend, row.selectedSpend])
    );
    const groupWidth = compareRows.length > 0 ? 100 / compareRows.length : 100;

    return compareRows.flatMap((row, groupIndex) => {
      const groupX = groupIndex * groupWidth + GROUP_GAP / 2;
      const availableWidth = groupWidth - GROUP_GAP;
      const rowBars: Bar[] = [
        {
          id: 'previous',
          label: t.chartPreviousMonth,
          value: row.previousSpend,
        },
        { id: 'selected', label: t.chartThisMonth, value: row.selectedSpend },
      ];
      const barWidth =
        (availableWidth - BAR_GAP * (rowBars.length - 1)) / rowBars.length;

      return rowBars.map((bar, barIndex) => {
        const height = Math.max(0.5, (bar.value / maxValue) * BAR_MAX_HEIGHT);
        const x = groupX + barIndex * (barWidth + BAR_GAP);
        return {
          key: `${row.name}-${bar.id}`,
          groupLabel: row.name,
          bar,
          color: row.color,
          x,
          y: CHART_HEIGHT - height,
          width: Math.max(barWidth, 0),
          height,
        };
      });
    });
  }, [compareRows, t.chartPreviousMonth, t.chartThisMonth]);

  const hovered = bars.find((entry) => entry.key === hoveredKey) ?? null;

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
    <div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-[2px]"
            style={{ background: themeTokens.text, opacity: 0.4 }}
          />
          <span className="text-[11px]" style={{ color: themeTokens.subtext2 }}>
            {t.chartPreviousMonth}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-[2px]"
            style={{ background: themeTokens.text }}
          />
          <span className="text-[11px]" style={{ color: themeTokens.subtext2 }}>
            {t.chartThisMonth}
          </span>
        </div>
      </div>

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
            const baseOpacity = entry.bar.id === 'previous' ? 0.4 : 1;
            const ariaLabel = `${entry.groupLabel}, ${
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
                fill={entry.color}
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
                opacity: entry.bar.id === 'previous' ? 0.55 : 1,
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
              {hovered.groupLabel} · {hovered.bar.label}
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
        {compareRows.map((row) => (
          <div
            key={row.name}
            className="flex-1 truncate text-center text-[10.5px]"
            style={{ color: themeTokens.subtext2 }}
          >
            {row.name}
          </div>
        ))}
      </div>
    </div>
  );
};
