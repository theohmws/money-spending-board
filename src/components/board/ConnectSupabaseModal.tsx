import type { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { SQL_SNIPPET } from '@/utils/BoardConfig';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showConnectModal'
  | 'closeConnectModal'
  | 'configForm'
  | 'onConfigUrlChange'
  | 'onConfigKeyChange'
  | 'useDemoModeAction'
  | 'saveConfig'
  | 'themeTokens'
>;

export const ConnectSupabaseModal = ({
  t,
  showConnectModal,
  closeConnectModal,
  configForm,
  onConfigUrlChange,
  onConfigKeyChange,
  useDemoModeAction,
  saveConfig,
  themeTokens,
}: Props) => {
  if (!showConnectModal) return null;

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
            {t.connectSupabase}
          </div>
          <button
            type="button"
            onClick={closeConnectModal}
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
          {t.connectDesc}
        </div>

        <div className="mt-4">
          <label
            htmlFor="supabase-url"
            className="text-[12.5px] font-semibold"
            style={{ color: themeTokens.label }}
          >
            {t.projectUrl}
          </label>
          <input
            id="supabase-url"
            type="text"
            value={configForm.url}
            onChange={(e) => onConfigUrlChange(e.target.value)}
            placeholder="https://xxxx.supabase.co"
            className="mt-1.5 w-full rounded-[10px] border p-3 text-[13.5px]"
            style={{
              borderColor: themeTokens.inputBorder,
              color: themeTokens.text,
              background: themeTokens.inputBg,
            }}
          />
        </div>
        <div className="mt-3">
          <label
            htmlFor="supabase-key"
            className="text-[12.5px] font-semibold"
            style={{ color: themeTokens.label }}
          >
            {t.anonKey}
          </label>
          <input
            id="supabase-key"
            type="text"
            value={configForm.key}
            onChange={(e) => onConfigKeyChange(e.target.value)}
            placeholder="eyJhbGciOi..."
            className="mt-1.5 w-full rounded-[10px] border p-3 text-[13.5px]"
            style={{
              borderColor: themeTokens.inputBorder,
              color: themeTokens.text,
              background: themeTokens.inputBg,
            }}
          />
        </div>

        <div
          className="mt-4.5 rounded-xl p-3.5"
          style={{ background: themeTokens.chipBg }}
        >
          <div
            className="text-xs font-bold"
            style={{ color: themeTokens.text }}
          >
            {t.requiredTable}
          </div>
          <pre
            className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed"
            style={{ color: themeTokens.chipText }}
          >
            {SQL_SNIPPET}
          </pre>
        </div>

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={useDemoModeAction}
            className="flex-1 rounded-[11px] p-3.5 text-[13.5px] font-semibold"
            style={{
              background: themeTokens.chipBg,
              color: themeTokens.chipText,
            }}
          >
            {t.useDemoModeBtn}
          </button>
          <button
            type="button"
            onClick={saveConfig}
            className="flex-1 rounded-[11px] p-3.5 text-[13.5px] font-bold"
            style={{ background: '#132119', color: '#EFFCF4' }}
          >
            {t.saveReload}
          </button>
        </div>
      </div>
    </div>
  );
};
