import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showCategorySettings'
  | 'closeCategorySettings'
  | 'categorySettingsRows'
  | 'saveCategoryMeta'
  | 'categoryMetaSaveError'
  | 'themeTokens'
>;

export const CategorySettingsModal = ({
  t,
  showCategorySettings,
  closeCategorySettings,
  categorySettingsRows,
  saveCategoryMeta,
  categoryMetaSaveError,
  themeTokens,
}: Props) => {
  if (!showCategorySettings) return null;

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center p-5"
      style={{ background: 'rgba(15,20,17,0.45)' }}
    >
      <div
        className="max-h-[85vh] w-[430px] max-w-full overflow-y-auto rounded-[20px] px-6 py-6.5"
        style={{ background: themeTokens.cardBg }}
      >
        <div className="flex items-center justify-between">
          <div
            className="font-manrope text-[17px] font-extrabold"
            style={{ color: themeTokens.text }}
          >
            {t.categoryIconsColors}
          </div>
          <button
            type="button"
            onClick={closeCategorySettings}
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
          {t.categoryIconsDesc}
        </div>

        <div className="mt-5 flex flex-col gap-5">
          {categorySettingsRows.map((row) => (
            <div
              key={row.id}
              className="rounded-[14px] p-3.5"
              style={{ background: themeTokens.chipBg }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex size-8.5 items-center justify-center rounded-[9px]"
                  style={{ background: row.color, color: row.dark }}
                >
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={row.iconPath} />
                  </svg>
                </div>
                <div
                  className="text-sm font-bold"
                  style={{ color: themeTokens.text }}
                >
                  {row.name}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                {row.iconOptions.map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    aria-label={icon.id}
                    onClick={icon.onSelect}
                    className="flex size-8.5 items-center justify-center rounded-[9px]"
                    style={{
                      background: icon.selected
                        ? row.color
                        : themeTokens.chipBg,
                      color: icon.selected ? row.dark : themeTokens.chipText,
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={icon.d} />
                    </svg>
                  </button>
                ))}
              </div>

              <div className="mt-2.5 flex gap-2">
                {row.paletteOptions.map((palette) => (
                  <button
                    key={palette.color}
                    type="button"
                    aria-label={palette.color}
                    onClick={palette.onSelect}
                    className="size-6 rounded-full border-2"
                    style={{
                      background: palette.color,
                      borderColor: themeTokens.chipBg,
                      boxShadow: palette.selected
                        ? `0 0 0 1.5px ${palette.color}`
                        : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {categoryMetaSaveError && (
          <div
            className="mt-3.5 rounded-[10px] px-3 py-2.5 text-[13px]"
            style={{ background: '#FBEAEC', color: '#C0374A' }}
          >
            {categoryMetaSaveError}
          </div>
        )}

        <button
          type="button"
          onClick={saveCategoryMeta}
          className="mt-5 w-full rounded-xl p-4 text-[15px] font-bold"
          style={{ background: '#132119', color: '#EFFCF4' }}
        >
          {t.saveCategories}
        </button>
      </div>
    </div>
  );
};
