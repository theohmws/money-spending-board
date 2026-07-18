import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'lang'
  | 'toggleLang'
  | 'authMode'
  | 'authForm'
  | 'onAuthEmailChange'
  | 'onAuthPasswordChange'
  | 'authError'
  | 'authLoading'
  | 'submitAuth'
  | 'toggleAuthMode'
  | 'themeTokens'
>;

export const AuthScreen = ({
  t,
  lang,
  toggleLang,
  authMode,
  authForm,
  onAuthEmailChange,
  onAuthPasswordChange,
  authError,
  authLoading,
  submitAuth,
  toggleAuthMode,
  themeTokens,
}: Props) => {
  const authButtonLabel = authLoading
    ? t.pleaseWait
    : { signin: t.signIn, signup: t.signUp }[authMode];

  return (
    <div className="flex flex-1 flex-col px-8 pb-8 pt-11">
      <div className="flex items-center justify-between">
        <div
          className="flex size-11 items-center justify-center rounded-xl font-manrope text-lg font-extrabold"
          style={{ background: '#0E3B2A', color: '#8CF2C4' }}
        >
          $
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleLang}
            className="rounded-lg px-2.5 py-1.5 text-xs font-bold"
            style={{ background: 'rgba(0,0,0,0.06)', color: '#4A554D' }}
          >
            {lang === 'th' ? 'EN' : 'TH'}
          </button>
        </div>
      </div>

      <div className="mt-7">
        <div
          className="font-manrope text-[26px] font-extrabold"
          style={{ color: themeTokens.text }}
        >
          {authMode === 'signin' ? t.welcomeBack : t.createBoard}
        </div>
        <div
          className="mt-1.5 text-sm leading-relaxed"
          style={{ color: themeTokens.subtext }}
        >
          {authMode === 'signin' ? t.signInSubtitle : t.signUpSubtitle}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3.5">
        <div>
          <label
            htmlFor="auth-email"
            className="text-[12.5px] font-semibold"
            style={{ color: themeTokens.label }}
          >
            {t.email}
          </label>
          <input
            id="auth-email"
            type="email"
            value={authForm.email}
            onChange={(e) => onAuthEmailChange(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-xl border px-3.5 py-3 text-base"
            style={{
              borderColor: themeTokens.inputBorder,
              color: themeTokens.text,
              background: themeTokens.inputBg,
            }}
          />
        </div>
        <div>
          <label
            htmlFor="auth-password"
            className="text-[12.5px] font-semibold"
            style={{ color: themeTokens.label }}
          >
            {t.password}
          </label>
          <input
            id="auth-password"
            type="password"
            value={authForm.password}
            onChange={(e) => onAuthPasswordChange(e.target.value)}
            placeholder="••••••••"
            className="mt-1.5 w-full rounded-xl border px-3.5 py-3 text-base"
            style={{
              borderColor: themeTokens.inputBorder,
              color: themeTokens.text,
              background: themeTokens.inputBg,
            }}
          />
        </div>
      </div>

      {authError && (
        <div
          className="mt-3.5 rounded-[10px] px-3 py-2.5 text-[13px]"
          style={{ background: '#FBEAEC', color: '#C0374A' }}
        >
          {authError}
        </div>
      )}

      <button
        type="button"
        onClick={submitAuth}
        disabled={authLoading}
        className="mt-5.5 rounded-xl p-4 text-[15px] font-semibold"
        style={{ background: '#132119', color: '#EFFCF4' }}
      >
        {authButtonLabel}
      </button>

      <button
        type="button"
        onClick={toggleAuthMode}
        className="mt-3.5 text-[13.5px]"
        style={{ color: themeTokens.label }}
      >
        {authMode === 'signin' ? t.toggleToSignUp : t.toggleToSignIn}
      </button>

      <div className="flex-1" />
      <div
        className="pt-5 text-center text-[11.5px]"
        style={{ color: themeTokens.subtext3 }}
      >
        {t.footerAuth}
      </div>
    </div>
  );
};
