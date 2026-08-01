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
  | 'oauthProviders'
  | 'signInWithOAuth'
  | 'toggleAuthMode'
  | 'themeTokens'
>;

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v2.99h3.87c2.27-2.09 3.58-5.17 3.58-8.81z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-2.99c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.09A12 12 0 0 0 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.27a12 12 0 0 0 0 10.76z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.76 0 3.34.61 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75z"
    />
  </svg>
);

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
  oauthProviders,
  signInWithOAuth,
  toggleAuthMode,
  themeTokens,
}: Props) => {
  const authButtonLabel = authLoading
    ? t.pleaseWait
    : { signin: t.signIn, signup: t.signUp }[authMode];

  return (
    <div className="flex flex-1 flex-col px-8 pb-8 pt-11">
      <div className="flex items-center justify-between">
        <img src="/icon-512.png" alt="" className="size-11 rounded-xl" />
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

      {oauthProviders.map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() => signInWithOAuth(provider)}
          disabled={authLoading}
          className="mt-3.5 flex items-center justify-center gap-2.5 rounded-xl border p-4 text-[15px] font-semibold first:mt-6"
          style={{
            borderColor: themeTokens.inputBorder,
            color: themeTokens.text,
          }}
        >
          {provider === 'google' && <GoogleLogo />}
          {t.continueWithProvider.replace('{provider}', capitalize(provider))}
        </button>
      ))}

      {oauthProviders.length > 0 && (
        <div className="mt-4.5 flex items-center gap-3">
          <div
            className="h-px flex-1"
            style={{ background: themeTokens.inputBorder }}
          />
          <div className="text-[12.5px]" style={{ color: themeTokens.subtext }}>
            {t.authDividerOr}
          </div>
          <div
            className="h-px flex-1"
            style={{ background: themeTokens.inputBorder }}
          />
        </div>
      )}

      <div className="mt-4.5 flex flex-col gap-3.5">
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
