import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showRuleInfo'
  | 'toggleRuleInfo'
  | 'openRatioModal'
  | 'categoryCards'
  | 'themeTokens'
>;

export const BudgetSplit = ({
  t,
  showRuleInfo,
  toggleRuleInfo,
  openRatioModal,
  categoryCards,
  themeTokens,
}: Props) => (
  <section className="flex flex-col gap-3">
    <div className="relative flex items-center justify-between">
      <div className="flex items-center gap-1">
        <h2 className="text-base font-semibold">{t.ruleTitle}</h2>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleRuleInfo}
          aria-label={t.ruleTitle}
          aria-expanded={showRuleInfo}
          className="text-muted-foreground"
        >
          <Info />
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={openRatioModal}>
        {t.editRatio}
      </Button>

      {showRuleInfo && (
        <div className="absolute left-0 top-8 z-10 w-72 max-w-[80vw] rounded-lg bg-popover p-3 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <div className="text-sm font-medium">{t.ruleTitle}</div>
          <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {t.ruleBody}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleRuleInfo}
            className="mt-2.5"
          >
            {t.gotIt}
          </Button>
        </div>
      )}
    </div>

    <div className="grid grid-cols-2 gap-3">
      {categoryCards.map((card) => {
        const isDark = themeTokens.mode === 'dark';
        // Each category keeps its user-chosen colour pair; dark mode swaps
        // the pair so the chip stays legible on the Tinysoy dark surface.
        const chipBg = isDark ? card.dark : card.color;
        const chipFg = isDark ? card.color : card.dark;

        return (
          <Card
            key={card.id}
            size="sm"
            className="gap-2"
            style={{ gridColumn: card.gridColumn }}
          >
            <div className="flex items-center justify-between gap-2 px-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-md"
                  style={{ background: chipBg, color: chipFg }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={card.iconPath} />
                  </svg>
                </span>
                <span className="truncate text-base font-medium">
                  {card.name}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                {card.pctLabel}%
              </span>
            </div>
            <div className="px-3 text-xs leading-snug text-muted-foreground">
              {card.items}
            </div>
            <div className="flex-1" />
            <div className="px-3 text-sm font-semibold tabular-nums">
              {card.spentLabel}{' '}
              <span className="font-normal text-muted-foreground">
                / {card.budgetLabel}
              </span>
            </div>
            <div className="mx-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${card.pct}%`, background: chipBg }}
              />
            </div>
          </Card>
        );
      })}
    </div>
  </section>
);
