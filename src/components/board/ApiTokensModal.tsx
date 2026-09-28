'use client';

import { useState } from 'react';

import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showApiTokens'
  | 'closeApiTokens'
  | 'apiTokenRows'
  | 'newTokenName'
  | 'onNewTokenNameChange'
  | 'createApiToken'
  | 'creatingToken'
  | 'revealedToken'
  | 'dismissRevealedToken'
  | 'apiTokenError'
  | 'shortcutEndpoint'
  | 'isOnline'
  | 'themeTokens'
>;

const EXAMPLE_INSERT = `{
  "amount": 120,
  "note": "Coffee",
  "type": "expense",
  "category": "wants",
  "date": "2026-09-28"
}`;

const EXAMPLE_UPDATE = `{
  "id": "<transaction id>",
  "amount": 150
}`;

export const ApiTokensModal = ({
  t,
  showApiTokens,
  closeApiTokens,
  apiTokenRows,
  newTokenName,
  onNewTokenNameChange,
  createApiToken,
  creatingToken,
  revealedToken,
  dismissRevealedToken,
  apiTokenError,
  shortcutEndpoint,
  isOnline,
  themeTokens,
}: Props) => {
  const [copied, setCopied] = useState<'endpoint' | 'token' | null>(null);

  if (!showApiTokens) return null;

  const copy = (what: 'endpoint' | 'token', value: string) => {
    navigator.clipboard?.writeText(value).then(
      () => setCopied(what),
      () => setCopied(null)
    );
  };

  const codeStyle = {
    background: themeTokens.chipBg,
    color: themeTokens.text,
  };

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
            {t.apiTokensTitle}
          </div>
          <button
            type="button"
            onClick={closeApiTokens}
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
          className="mt-3 text-[12.5px] leading-relaxed"
          style={{ color: themeTokens.subtext }}
        >
          {t.apiTokensDesc}
        </div>

        <div className="mt-4">
          <div
            className="text-[12.5px] font-semibold"
            style={{ color: themeTokens.label }}
          >
            {t.apiEndpointLabel}
          </div>
          <div className="mt-1.5 flex gap-2">
            <code
              className="min-w-0 flex-1 break-all rounded-[10px] px-3 py-2 text-[12px]"
              style={codeStyle}
            >
              POST {shortcutEndpoint}
            </code>
            <button
              type="button"
              onClick={() => copy('endpoint', shortcutEndpoint)}
              className="rounded-[10px] px-3 text-[12.5px] font-semibold"
              style={{ color: '#0E8F5F' }}
            >
              {copied === 'endpoint'
                ? t.apiTokenCopiedLabel
                : t.apiTokenCopyBtn}
            </button>
          </div>
        </div>

        {revealedToken && (
          <div
            className="mt-4 rounded-xl p-3.5"
            style={{ background: '#E6F6EE', color: '#0B5C3E' }}
          >
            <div className="text-sm font-bold">{t.apiTokenRevealTitle}</div>
            <code className="mt-2 block break-all rounded-lg bg-white/70 p-2.5 text-[12px]">
              {revealedToken}
            </code>
            <div className="mt-2 text-[12px] leading-relaxed">
              {t.apiTokenRevealHint}
            </div>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => copy('token', revealedToken)}
                className="flex-1 rounded-[10px] p-2.5 text-[13px] font-bold"
                style={{ background: '#132119', color: '#EFFCF4' }}
              >
                {copied === 'token' ? t.apiTokenCopiedLabel : t.apiTokenCopyBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCopied(null);
                  dismissRevealedToken();
                }}
                className="flex-1 rounded-[10px] border p-2.5 text-[13px] font-bold"
                style={{ borderColor: '#0B5C3E' }}
              >
                {t.apiTokenDoneBtn}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-1.5">
          {apiTokenRows.length === 0 && (
            <div
              className="text-[12.5px]"
              style={{ color: themeTokens.subtext2 }}
            >
              {t.apiTokensEmpty}
            </div>
          )}
          {apiTokenRows.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between rounded-[10px] px-3 py-2"
              style={{ background: themeTokens.chipBg }}
            >
              <div className="min-w-0">
                <div
                  className="text-[13px] font-semibold"
                  style={{ color: themeTokens.text }}
                >
                  {token.name}{' '}
                  <span
                    className="font-mono text-[11.5px] font-normal"
                    style={{ color: themeTokens.subtext2 }}
                  >
                    {token.prefix}…
                  </span>
                </div>
                <div
                  className="text-[11.5px]"
                  style={{ color: themeTokens.subtext2 }}
                >
                  {token.lastUsedLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={token.onRevoke}
                disabled={!isOnline}
                aria-label={t.apiTokenRevokeAria}
                className="px-1 text-base disabled:opacity-50"
                style={{ color: themeTokens.subtext2 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newTokenName}
            onChange={(e) => onNewTokenNameChange(e.target.value)}
            placeholder={t.apiTokenNamePlaceholder}
            maxLength={60}
            aria-label={t.apiTokenNamePlaceholder}
            className="min-w-0 flex-1 rounded-[10px] border px-3 py-2 text-[13px]"
            style={{
              borderColor: themeTokens.inputBorder,
              color: themeTokens.text,
              background: themeTokens.inputBg,
            }}
          />
          <button
            type="button"
            onClick={() => {
              setCopied(null);
              createApiToken();
            }}
            disabled={!newTokenName.trim() || creatingToken || !isOnline}
            className="rounded-[10px] px-3.5 text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: '#132119', color: '#EFFCF4' }}
          >
            {t.apiTokenCreateBtn}
          </button>
        </div>

        {apiTokenError && (
          <div
            className="mt-2.5 rounded-[10px] px-3 py-2.5 text-[13px]"
            style={{ background: '#FBEAEC', color: '#C0374A' }}
          >
            {apiTokenError}
          </div>
        )}

        <div className="mt-5">
          <div
            className="text-sm font-bold"
            style={{ color: themeTokens.text }}
          >
            {t.apiUsageTitle}
          </div>
          <ol
            className="mt-1.5 list-decimal pl-4.5 text-[12.5px] leading-relaxed"
            style={{ color: themeTokens.subtext }}
          >
            <li>{t.apiUsageStep1}</li>
            <li>{t.apiUsageStep2}</li>
            <li>{t.apiUsageStep3}</li>
          </ol>
          <pre
            className="mt-1.5 overflow-x-auto rounded-[10px] p-3 text-[11.5px]"
            style={codeStyle}
          >
            {EXAMPLE_INSERT}
          </pre>
          <div
            className="mt-2 text-[12.5px] leading-relaxed"
            style={{ color: themeTokens.subtext }}
          >
            {t.apiUsageUpdateHint}
          </div>
          <pre
            className="mt-1.5 overflow-x-auto rounded-[10px] p-3 text-[11.5px]"
            style={codeStyle}
          >
            {EXAMPLE_UPDATE}
          </pre>
        </div>
      </div>
    </div>
  );
};
