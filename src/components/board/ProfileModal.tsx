import { useRef } from 'react';

import type { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { AppConfig } from '@/utils/AppConfig';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showProfile'
  | 'closeProfile'
  | 'profileForm'
  | 'onProfileNameChange'
  | 'onProfileIncomeChange'
  | 'avatarSwatches'
  | 'headerAvatarInitial'
  | 'saveProfile'
  | 'editSplitFromProfile'
  | 'openCategorySettings'
  | 'startImport'
  | 'openImportSettings'
  | 'profileRatioLabel'
  | 'userEmail'
  | 'theme'
  | 'setTheme'
  | 'themeTokens'
>;

export const ProfileModal = ({
  t,
  showProfile,
  closeProfile,
  profileForm,
  onProfileNameChange,
  onProfileIncomeChange,
  avatarSwatches,
  headerAvatarInitial,
  saveProfile,
  editSplitFromProfile,
  openCategorySettings,
  startImport,
  openImportSettings,
  profileRatioLabel,
  userEmail,
  theme,
  setTheme,
  themeTokens,
}: Props) => {
  const importFileInputRef = useRef<HTMLInputElement>(null);

  if (!showProfile) return null;

  const isLight = theme !== 'dark';

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
            {t.profileTitle}
          </div>
          <button
            type="button"
            onClick={closeProfile}
            className="flex size-7.5 items-center justify-center rounded-[9px] text-base"
            style={{
              background: themeTokens.chipBg,
              color: themeTokens.chipText,
            }}
          >
            ×
          </button>
        </div>

        <div className="mt-3.5 flex flex-col items-center">
          <div
            className="flex size-16 items-center justify-center rounded-full font-manrope text-2xl font-extrabold text-white"
            style={{ background: profileForm.avatarColor }}
          >
            {headerAvatarInitial}
          </div>
          <div className="mt-3 flex gap-2">
            {avatarSwatches.map((swatch) => (
              <button
                key={swatch.color}
                type="button"
                aria-label={swatch.color}
                onClick={swatch.onSelect}
                className="size-5.5 rounded-full border-2"
                style={{
                  background: swatch.color,
                  borderColor: themeTokens.cardBg,
                  boxShadow: swatch.selected
                    ? `0 0 0 1.5px ${swatch.color}`
                    : undefined,
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-5.5">
          <label
            htmlFor="profile-name"
            className="text-[12.5px] font-semibold"
            style={{ color: themeTokens.label }}
          >
            {t.name}
          </label>
          <input
            id="profile-name"
            type="text"
            value={profileForm.name}
            onChange={(e) => onProfileNameChange(e.target.value)}
            placeholder="Your name"
            className="mt-1.5 w-full rounded-[10px] border p-3 text-[14.5px]"
            style={{
              borderColor: themeTokens.inputBorder,
              color: themeTokens.text,
              background: themeTokens.inputBg,
            }}
          />
        </div>

        <div className="mt-3.5">
          <div
            className="text-[12.5px] font-semibold"
            style={{ color: themeTokens.label }}
          >
            {t.email}
          </div>
          <div
            className="mt-1.5 rounded-[10px] p-3 text-[14.5px]"
            style={{
              background: themeTokens.chipBg,
              color: themeTokens.subtext,
            }}
          >
            {userEmail}
          </div>
        </div>

        <div className="mt-3.5">
          <label
            htmlFor="profile-income"
            className="text-[12.5px] font-semibold"
            style={{ color: themeTokens.label }}
          >
            {t.monthlyIncome}
          </label>
          <input
            id="profile-income"
            type="number"
            value={profileForm.monthlyIncome}
            onChange={(e) => onProfileIncomeChange(e.target.value)}
            placeholder="e.g. 30000"
            className="mt-1.5 w-full rounded-[10px] border p-3 text-[14.5px]"
            style={{
              borderColor: themeTokens.inputBorder,
              color: themeTokens.text,
              background: themeTokens.inputBg,
            }}
          />
          <div
            className="mt-1 text-[11.5px]"
            style={{ color: themeTokens.subtext2 }}
          >
            {t.monthlyIncomeHint}
          </div>
        </div>

        <div
          className="mt-4.5 flex items-center justify-between rounded-xl px-3.5 py-3"
          style={{ background: themeTokens.chipBg }}
        >
          <div>
            <div
              className="text-sm font-semibold"
              style={{ color: themeTokens.text }}
            >
              {t.splitRatio}
            </div>
            <div
              className="mt-0.5 text-xs"
              style={{ color: themeTokens.subtext }}
            >
              {profileRatioLabel} · {t.needsWantsSavings}
            </div>
          </div>
          <button
            type="button"
            onClick={editSplitFromProfile}
            className="text-[12.5px] font-semibold"
            style={{ color: '#0E8F5F' }}
          >
            {t.edit}
          </button>
        </div>

        <div
          className="mt-3 flex items-center justify-between rounded-xl px-3.5 py-3"
          style={{ background: themeTokens.chipBg }}
        >
          <div>
            <div
              className="text-sm font-semibold"
              style={{ color: themeTokens.text }}
            >
              {t.categories}
            </div>
            <div
              className="mt-0.5 text-xs"
              style={{ color: themeTokens.subtext }}
            >
              {t.iconColorPerCategory}
            </div>
          </div>
          <button
            type="button"
            onClick={openCategorySettings}
            className="text-[12.5px] font-semibold"
            style={{ color: '#0E8F5F' }}
          >
            {t.edit}
          </button>
        </div>

        <button
          type="button"
          onClick={() => importFileInputRef.current?.click()}
          className="mt-3 flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left"
          style={{ background: themeTokens.chipBg }}
        >
          <div>
            <div
              className="text-sm font-semibold"
              style={{ color: themeTokens.text }}
            >
              {t.importEntryLabel}
            </div>
            <div
              className="mt-0.5 text-xs"
              style={{ color: themeTokens.subtext }}
            >
              {t.importEntryDesc}
            </div>
          </div>
          <span
            className="text-[12.5px] font-semibold"
            style={{ color: '#0E8F5F' }}
          >
            +
          </span>
        </button>
        <input
          ref={importFileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) startImport(file);
            e.target.value = '';
          }}
        />

        <div
          className="mt-3 flex items-center justify-between rounded-xl px-3.5 py-3"
          style={{ background: themeTokens.chipBg }}
        >
          <div>
            <div
              className="text-sm font-semibold"
              style={{ color: themeTokens.text }}
            >
              {t.importSettingsEntryLabel}
            </div>
            <div
              className="mt-0.5 text-xs"
              style={{ color: themeTokens.subtext }}
            >
              {t.importSettingsEntryDesc}
            </div>
          </div>
          <button
            type="button"
            onClick={openImportSettings}
            className="text-[12.5px] font-semibold"
            style={{ color: '#0E8F5F' }}
          >
            {t.edit}
          </button>
        </div>

        <div
          className="mt-3 flex items-center justify-between rounded-xl px-3.5 py-3"
          style={{ background: themeTokens.chipBg }}
        >
          <div
            className="text-sm font-semibold"
            style={{ color: themeTokens.text }}
          >
            {t.currency}
          </div>
          <div className="text-[12.5px]" style={{ color: themeTokens.subtext }}>
            {t.thaiBaht}
          </div>
        </div>

        <div className="mt-4.5">
          <div
            className="text-[12.5px] font-semibold"
            style={{ color: themeTokens.label }}
          >
            {t.appearance}
          </div>
          <div
            className="mt-2 flex gap-2 rounded-[11px] p-1"
            style={{ background: themeTokens.chipBg }}
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              className="flex-1 rounded-lg p-2.5 text-[13.5px] font-semibold"
              style={{
                background: isLight ? '#132119' : 'transparent',
                color: isLight ? '#EFFCF4' : themeTokens.label,
              }}
            >
              {t.light}
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className="flex-1 rounded-lg p-2.5 text-[13.5px] font-semibold"
              style={{
                background: !isLight ? '#132119' : 'transparent',
                color: !isLight ? '#EFFCF4' : themeTokens.label,
              }}
            >
              {t.dark}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={saveProfile}
          className="mt-5.5 w-full rounded-xl p-4 text-[15px] font-bold"
          style={{ background: '#132119', color: '#EFFCF4' }}
        >
          {t.saveProfileBtn}
        </button>

        {AppConfig.version && (
          <div
            className="mt-4 text-center text-[11.5px]"
            style={{ color: themeTokens.subtext3 }}
          >
            v{AppConfig.version}
          </div>
        )}
      </div>
    </div>
  );
};
