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
  <div>
    <div className="relative flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <div
          className="font-manrope text-[15px] font-bold"
          style={{ color: themeTokens.text }}
        >
          {t.ruleTitle}
        </div>
        <button
          type="button"
          onClick={toggleRuleInfo}
          className="flex size-4.5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold leading-none"
          style={{
            borderColor: themeTokens.subtext2,
            color: themeTokens.subtext2,
          }}
        >
          i
        </button>
      </div>
      <button
        type="button"
        onClick={openRatioModal}
        className="text-[12.5px] font-semibold"
        style={{ color: '#0E8F5F' }}
      >
        {t.editRatio}
      </button>

      {showRuleInfo && (
        <div
          className="absolute left-0 top-6.5 z-10 w-[280px] max-w-[80vw] rounded-2xl border px-4 py-3.5"
          style={{
            background: themeTokens.cardBg,
            borderColor: themeTokens.inputBorder,
            boxShadow: '0 12px 30px rgba(20,30,25,0.16)',
          }}
        >
          <div
            className="font-manrope text-[13.5px] font-extrabold"
            style={{ color: themeTokens.text }}
          >
            {t.ruleTitle}
          </div>
          <div
            className="mt-1.5 text-[12.5px] leading-relaxed"
            style={{ color: themeTokens.subtext }}
          >
            {t.ruleBody}
          </div>
          <button
            type="button"
            onClick={toggleRuleInfo}
            className="mt-2.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold"
            style={{
              background: themeTokens.chipBg,
              color: themeTokens.chipText,
            }}
          >
            {t.gotIt}
          </button>
        </div>
      )}
    </div>

    <div className="mt-3.5 grid grid-cols-2 gap-2.5">
      {categoryCards.map((card) => {
        const isDark = themeTokens.mode === 'dark';
        // Dark mode swaps each category's light/dark token pair rather than
        // introducing new colors: card.dark (already a deep, muted shade of
        // the same hue) becomes the background, card.color becomes the
        // foreground — so cards read as designed for dark mode, not just
        // inverted, while staying within the existing color tokens.
        const cardBg = isDark ? card.dark : card.color;
        const cardFg = isDark ? card.color : card.dark;

        return (
          <div
            key={card.id}
            className="flex flex-col rounded-2xl p-4"
            style={{
              gridColumn: card.gridColumn,
              background: cardBg,
              color: cardFg,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={card.iconPath} />
                </svg>
                <div className="font-manrope text-[15px] font-extrabold">
                  {card.name}
                </div>
              </div>
              <div className="font-manrope text-[15px] font-extrabold">
                {card.pctLabel}%
              </div>
            </div>
            <div className="mt-1.5 text-[11px] leading-snug opacity-75">
              {card.items}
            </div>
            <div className="flex-1" />
            <div className="text-[12.5px] font-bold">
              {card.spentLabel}{' '}
              <span className="font-medium opacity-75">
                / {card.budgetLabel}
              </span>
            </div>
            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded"
              style={{ background: 'rgba(255,255,255,0.45)' }}
            >
              <div
                className="h-full rounded"
                style={{ width: `${card.pct}%`, background: cardFg }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
