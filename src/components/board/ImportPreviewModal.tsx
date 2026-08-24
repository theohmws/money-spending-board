'use client';

import { useRef } from 'react';

import type { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { fmtMoney } from '@/utils/boardHelpers';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'importStatus'
  | 'importSourceChoices'
  | 'selectImportFile'
  | 'importPreviewRows'
  | 'importParseError'
  | 'importParseErrorDetail'
  | 'passwordIsRetry'
  | 'importError'
  | 'submitPassword'
  | 'cancelImport'
  | 'toggleRowIncluded'
  | 'editRowDescription'
  | 'editRowCategory'
  | 'confirmImport'
  | 'categoryChoices'
  | 'themeTokens'
>;

export const ImportPreviewModal = ({
  t,
  importStatus,
  importSourceChoices,
  selectImportFile,
  importPreviewRows,
  importParseError,
  importParseErrorDetail,
  passwordIsRetry,
  importError,
  submitPassword,
  cancelImport,
  toggleRowIncluded,
  editRowDescription,
  editRowCategory,
  confirmImport,
  categoryChoices,
  themeTokens,
}: Props) => {
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const sourceFileInputRef = useRef<HTMLInputElement>(null);

  if (importStatus === 'idle') return null;

  const includedCount = importPreviewRows.filter((row) => row.included).length;

  const stepTitle = {
    source: t.importSourceStepTitle,
    parsing: t.importPreviewTitle,
    password: t.importPasswordTitle,
    preview: t.importPreviewTitle,
  }[importStatus];

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center"
      style={{ background: 'rgba(15,20,17,0.45)' }}
    >
      <div
        className="max-h-[85vh] w-[430px] max-w-full overflow-y-auto rounded-t-3xl px-6 pb-7.5 pt-6.5"
        style={{ background: themeTokens.cardBg }}
      >
        <div className="flex items-center justify-between">
          <div
            className="font-manrope text-lg font-extrabold"
            style={{ color: themeTokens.text }}
          >
            {stepTitle}
          </div>
          <button
            type="button"
            onClick={cancelImport}
            aria-label={t.importCancelBtn}
            className="flex size-7.5 items-center justify-center rounded-[9px] text-base"
            style={{
              background: themeTokens.chipBg,
              color: themeTokens.chipText,
            }}
          >
            ×
          </button>
        </div>

        {importStatus === 'source' && (
          <div className="mt-4.5">
            <div className="flex flex-wrap gap-2">
              {importSourceChoices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={choice.onSelect}
                  className="rounded-[9px] border-[1.5px] px-3.5 py-2.5 text-[13.5px] font-semibold"
                  style={{
                    borderColor: choice.selected
                      ? '#0E8F5F'
                      : themeTokens.inputBorder,
                    background: choice.selected
                      ? '#0E8F5F'
                      : themeTokens.cardBg,
                    color: choice.selected ? '#EFFCF4' : themeTokens.chipText,
                  }}
                >
                  {choice.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => sourceFileInputRef.current?.click()}
              className="mt-5.5 w-full rounded-xl p-4 text-[15px] font-bold"
              style={{ background: '#132119', color: '#EFFCF4' }}
            >
              {t.importChooseFileBtn}
            </button>
            <input
              ref={sourceFileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) selectImportFile(file);
                e.target.value = '';
              }}
            />
          </div>
        )}

        {importStatus === 'parsing' && (
          <div
            className="py-16 text-center text-sm"
            style={{ color: themeTokens.subtext }}
          >
            {t.importParsing}
          </div>
        )}

        {importStatus === 'password' && (
          <div className="mt-4.5">
            <label
              htmlFor="import-pdf-password"
              className="text-[12.5px] font-semibold"
              style={{ color: themeTokens.label }}
            >
              {t.importPasswordLabel}
            </label>
            <input
              id="import-pdf-password"
              ref={passwordInputRef}
              type="password"
              className="mt-1.5 w-full rounded-xl border px-3.5 py-3 text-[14.5px]"
              style={{
                borderColor: themeTokens.inputBorder,
                color: themeTokens.text,
                background: themeTokens.inputBg,
              }}
            />
            {passwordIsRetry && (
              <div
                className="mt-2.5 rounded-[10px] px-3 py-2.5 text-[13px]"
                style={{ background: '#FBEAEC', color: '#C0374A' }}
              >
                {t.importPasswordError}
              </div>
            )}
            <div className="mt-4.5 flex gap-2">
              <button
                type="button"
                onClick={cancelImport}
                className="flex-1 rounded-xl p-3.5 text-[14px] font-bold"
                style={{
                  background: themeTokens.chipBg,
                  color: themeTokens.chipText,
                }}
              >
                {t.importPasswordCancel}
              </button>
              <button
                type="button"
                onClick={() =>
                  submitPassword(passwordInputRef.current?.value ?? '')
                }
                className="flex-1 rounded-xl p-3.5 text-[14px] font-bold"
                style={{ background: '#132119', color: '#EFFCF4' }}
              >
                {t.importPasswordSubmit}
              </button>
            </div>
          </div>
        )}

        {importStatus === 'preview' && (
          <>
            {importParseError && (
              <div
                className="mt-3.5 rounded-[10px] px-3 py-2.5 text-[13px]"
                style={{ background: '#FBEAEC', color: '#C0374A' }}
              >
                {importParseError}
                {importParseErrorDetail && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11.5px] font-semibold">
                      {t.importParseErrorDetailLabel}
                    </summary>
                    <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap break-all text-[10.5px] leading-snug">
                      {importParseErrorDetail}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {importPreviewRows.length === 0 ? (
              <div
                className="py-16 text-center text-sm"
                style={{ color: themeTokens.subtext }}
              >
                {t.importPreviewEmpty}
              </div>
            ) : (
              <div className="mt-4.5 flex flex-col gap-2.5">
                {importPreviewRows.map((row) => (
                  <div
                    key={row.key}
                    className="rounded-[14px] p-3"
                    style={{
                      background: themeTokens.chipBg,
                      opacity: row.included ? 1 : 0.5,
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={row.included}
                        onChange={() => toggleRowIncluded(row.key)}
                        aria-label={row.description}
                        className="mt-1 size-4 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) =>
                            editRowDescription(row.key, e.target.value)
                          }
                          className="w-full bg-transparent text-sm font-semibold outline-none"
                          style={{ color: themeTokens.text }}
                        />
                        <div
                          className="mt-0.5 text-[11px]"
                          style={{ color: themeTokens.subtext2 }}
                        >
                          {row.date}
                        </div>
                      </div>
                      <div
                        className="shrink-0 text-sm font-bold"
                        style={{
                          color: themeTokens.text,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {fmtMoney(row.amount)}
                      </div>
                    </div>

                    {row.possibleDuplicate && (
                      <div
                        className="mt-1.5 pl-6.5 text-[11px] font-semibold"
                        style={{ color: '#C0374A' }}
                      >
                        {t.importDuplicateWarning}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5 pl-6.5">
                      {categoryChoices.map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => editRowCategory(row.key, choice.id)}
                          className="rounded-[7px] border-[1.5px] px-2 py-1 text-[11px] font-semibold"
                          style={{
                            borderColor:
                              row.category === choice.id
                                ? choice.color
                                : themeTokens.inputBorder,
                            background:
                              row.category === choice.id
                                ? choice.color
                                : themeTokens.cardBg,
                            color:
                              row.category === choice.id
                                ? choice.dark
                                : themeTokens.chipText,
                          }}
                        >
                          {choice.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {importError && (
              <div
                className="mt-3.5 rounded-[10px] px-3 py-2.5 text-[13px]"
                style={{ background: '#FBEAEC', color: '#C0374A' }}
              >
                {importError}
              </div>
            )}

            {importPreviewRows.length > 0 && (
              <div className="mt-5.5 flex gap-2">
                <button
                  type="button"
                  onClick={cancelImport}
                  className="flex-1 rounded-xl p-4 text-[15px] font-bold"
                  style={{
                    background: themeTokens.chipBg,
                    color: themeTokens.chipText,
                  }}
                >
                  {t.importCancelBtn}
                </button>
                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={includedCount === 0}
                  className="flex-1 rounded-xl p-4 text-[15px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: '#132119', color: '#EFFCF4' }}
                >
                  {t.importConfirmBtn}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
