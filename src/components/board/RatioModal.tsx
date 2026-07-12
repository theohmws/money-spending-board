import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showRatioModal'
  | 'closeRatioModal'
  | 'ratioRows'
  | 'ratioSum'
  | 'saveRatios'
  | 'themeTokens'
>;

export const RatioModal = ({
  t,
  showRatioModal,
  closeRatioModal,
  ratioRows,
  ratioSum,
  saveRatios,
  themeTokens,
}: Props) => {
  if (!showRatioModal) return null;

  const isBalanced = ratioSum === 100;

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center p-5"
      style={{ background: 'rgba(15,20,17,0.45)' }}
    >
      <div
        className="w-[430px] max-w-full rounded-[20px] px-6 py-6.5"
        style={{ background: themeTokens.cardBg }}
      >
        <div className="flex items-center justify-between">
          <div
            className="font-manrope text-[17px] font-extrabold"
            style={{ color: themeTokens.text }}
          >
            {t.adjustSplit}
          </div>
          <button
            type="button"
            onClick={closeRatioModal}
            className="flex size-7.5 items-center justify-center rounded-[9px] text-base"
            style={{
              background: themeTokens.chipBg,
              color: themeTokens.chipText,
            }}
          >
            ×
          </button>
        </div>
        <div
          className="mt-2 text-[13px] leading-relaxed"
          style={{ color: themeTokens.subtext }}
        >
          {t.splitDesc}
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {ratioRows.map((row) => (
            <div key={row.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="size-2.5 rounded-[3px]"
                    style={{ background: row.color }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: themeTokens.text }}
                  >
                    {row.name}
                  </span>
                </div>
                <input
                  type="number"
                  value={row.value}
                  onChange={(e) => row.onChange(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-16 rounded-[9px] border px-2.5 py-2 text-right text-sm"
                  style={{
                    borderColor: themeTokens.inputBorder,
                    color: themeTokens.text,
                    background: themeTokens.inputBg,
                  }}
                />
              </div>
              <input
                type="range"
                value={row.value}
                onChange={(e) => row.onChange(Number(e.target.value))}
                min={0}
                max={100}
                className="mt-2 w-full"
                style={{ accentColor: row.color }}
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-[13px]" style={{ color: themeTokens.label }}>
            {t.total}
          </span>
          <span
            className="text-[15px] font-bold"
            style={{ color: isBalanced ? '#0E8F5F' : '#C0374A' }}
          >
            {ratioSum}%
          </span>
        </div>

        <button
          type="button"
          onClick={saveRatios}
          disabled={!isBalanced}
          className="mt-4.5 w-full rounded-xl p-4 text-[15px] font-bold"
          style={{
            background: '#132119',
            color: '#EFFCF4',
            opacity: isBalanced ? 1 : 0.5,
          }}
        >
          {t.saveSplit}
        </button>
      </div>
    </div>
  );
};
