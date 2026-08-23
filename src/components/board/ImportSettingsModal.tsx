'use client';

import type { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { PALETTE } from '@/utils/BoardConfig';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showImportSettings'
  | 'closeImportSettings'
  | 'ruleRows'
  | 'newRuleKeyword'
  | 'onNewRuleKeywordChange'
  | 'newRuleCategory'
  | 'onNewRuleCategoryChange'
  | 'addRule'
  | 'ruleError'
  | 'categoryChoices'
  | 'badgeColorsForm'
  | 'selectBadgeColor'
  | 'saveBadgeColors'
  | 'badgeColorsError'
  | 'themeTokens'
>;

export const ImportSettingsModal = ({
  t,
  showImportSettings,
  closeImportSettings,
  ruleRows,
  newRuleKeyword,
  onNewRuleKeywordChange,
  newRuleCategory,
  onNewRuleCategoryChange,
  addRule,
  ruleError,
  categoryChoices,
  badgeColorsForm,
  selectBadgeColor,
  saveBadgeColors,
  badgeColorsError,
  themeTokens,
}: Props) => {
  if (!showImportSettings) return null;

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
            {t.importSettingsTitle}
          </div>
          <button
            type="button"
            onClick={closeImportSettings}
            className="flex size-7.5 items-center justify-center rounded-[9px] text-base"
            style={{
              background: themeTokens.chipBg,
              color: themeTokens.chipText,
            }}
          >
            ×
          </button>
        </div>

        <div className="mt-5">
          <div
            className="text-sm font-bold"
            style={{ color: themeTokens.text }}
          >
            {t.categoryRulesTitle}
          </div>
          <div
            className="mt-1 text-[12.5px] leading-relaxed"
            style={{ color: themeTokens.subtext }}
          >
            {t.categoryRulesDesc}
          </div>

          {ruleRows.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {ruleRows.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-[10px] px-3 py-2"
                  style={{ background: themeTokens.chipBg }}
                >
                  <div
                    className="text-[13px]"
                    style={{ color: themeTokens.text }}
                  >
                    <span className="font-semibold">{rule.keyword}</span>{' '}
                    <span style={{ color: themeTokens.subtext2 }}>
                      → {rule.categoryName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={rule.onRemove}
                    aria-label={t.removeRuleAria}
                    className="px-1 text-base"
                    style={{ color: themeTokens.subtext2 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newRuleKeyword}
              onChange={(e) => onNewRuleKeywordChange(e.target.value)}
              placeholder={t.categoryRuleKeywordPlaceholder}
              className="min-w-0 flex-1 rounded-[10px] border px-3 py-2 text-[13px]"
              style={{
                borderColor: themeTokens.inputBorder,
                color: themeTokens.text,
                background: themeTokens.inputBg,
              }}
            />
            <button
              type="button"
              onClick={addRule}
              disabled={!newRuleKeyword.trim()}
              className="rounded-[10px] px-3.5 text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: '#132119', color: '#EFFCF4' }}
            >
              {t.addRuleBtn}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categoryChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onNewRuleCategoryChange(choice.id)}
                className="rounded-[7px] border-[1.5px] px-2 py-1 text-[11px] font-semibold"
                style={{
                  borderColor:
                    newRuleCategory === choice.id
                      ? choice.color
                      : themeTokens.inputBorder,
                  background:
                    newRuleCategory === choice.id
                      ? choice.color
                      : themeTokens.cardBg,
                  color:
                    newRuleCategory === choice.id
                      ? choice.dark
                      : themeTokens.chipText,
                }}
              >
                {choice.name}
              </button>
            ))}
          </div>

          {ruleError && (
            <div
              className="mt-2.5 rounded-[10px] px-3 py-2.5 text-[13px]"
              style={{ background: '#FBEAEC', color: '#C0374A' }}
            >
              {ruleError}
            </div>
          )}
        </div>

        <div className="mt-5.5">
          <div
            className="text-sm font-bold"
            style={{ color: themeTokens.text }}
          >
            {t.badgeColorsTitle}
          </div>

          <div className="mt-3">
            <div
              className="text-[12.5px] font-semibold"
              style={{ color: themeTokens.label }}
            >
              {t.needsReviewColorLabel}
            </div>
            <div className="mt-1.5 flex gap-2">
              {PALETTE.map((palette) => (
                <button
                  key={palette.color}
                  type="button"
                  aria-label={palette.color}
                  onClick={() => selectBadgeColor('needsReview', palette)}
                  className="size-6 rounded-full border-2"
                  style={{
                    background: palette.color,
                    borderColor: themeTokens.chipBg,
                    boxShadow:
                      badgeColorsForm.needsReview.color === palette.color
                        ? `0 0 0 1.5px ${palette.color}`
                        : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-3">
            <div
              className="text-[12.5px] font-semibold"
              style={{ color: themeTokens.label }}
            >
              {t.sourceColorLabel}
            </div>
            <div className="mt-1.5 flex gap-2">
              {PALETTE.map((palette) => (
                <button
                  key={palette.color}
                  type="button"
                  aria-label={palette.color}
                  onClick={() => selectBadgeColor('source', palette)}
                  className="size-6 rounded-full border-2"
                  style={{
                    background: palette.color,
                    borderColor: themeTokens.chipBg,
                    boxShadow:
                      badgeColorsForm.source.color === palette.color
                        ? `0 0 0 1.5px ${palette.color}`
                        : undefined,
                  }}
                />
              ))}
            </div>
          </div>

          {badgeColorsError && (
            <div
              className="mt-2.5 rounded-[10px] px-3 py-2.5 text-[13px]"
              style={{ background: '#FBEAEC', color: '#C0374A' }}
            >
              {badgeColorsError}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={saveBadgeColors}
          className="mt-5.5 w-full rounded-xl p-4 text-[15px] font-bold"
          style={{ background: '#132119', color: '#EFFCF4' }}
        >
          {t.saveImportSettingsBtn}
        </button>
      </div>
    </div>
  );
};
