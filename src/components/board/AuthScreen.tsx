import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
>;

const capitalize = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
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
}: Props) => {
  const authButtonLabel = authLoading
    ? t.pleaseWait
    : { signin: t.signIn, signup: t.signUp }[authMode];

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pb-8 pt-10">
      <div className="flex items-center justify-between">
        <img src="/icon-512.png" alt="" className="size-10 rounded-xl" />
        <Button variant="outline" size="sm" onClick={toggleLang}>
          {lang === 'th' ? 'EN' : 'TH'}
        </Button>
      </div>

      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {authMode === 'signin' ? t.welcomeBack : t.createBoard}
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {authMode === 'signin' ? t.signInSubtitle : t.signUpSubtitle}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {oauthProviders.map((provider) => (
          <Button
            key={provider}
            variant="outline"
            size="lg"
            onClick={() => signInWithOAuth(provider)}
            disabled={authLoading}
          >
            {provider === 'google' && <GoogleLogo />}
            {t.continueWithProvider.replace('{provider}', capitalize(provider))}
          </Button>
        ))}
      </div>

      {oauthProviders.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <div className="text-sm text-muted-foreground">{t.authDividerOr}</div>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auth-email">{t.email}</Label>
          <Input
            id="auth-email"
            type="email"
            value={authForm.email}
            onChange={(e) => onAuthEmailChange(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auth-password">{t.password}</Label>
          <Input
            id="auth-password"
            type="password"
            value={authForm.password}
            onChange={(e) => onAuthPasswordChange(e.target.value)}
            placeholder="••••••••"
          />
        </div>
      </div>

      {authError && (
        <Alert variant="destructive" className="mt-3">
          {authError}
        </Alert>
      )}

      <Button
        size="lg"
        onClick={submitAuth}
        disabled={authLoading}
        className="mt-5"
      >
        {authButtonLabel}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={toggleAuthMode}
        className="mt-2 text-muted-foreground"
      >
        {authMode === 'signin' ? t.toggleToSignUp : t.toggleToSignIn}
      </Button>

      <div className="flex-1" />
      <div className="pt-5 text-center text-xs text-muted-foreground">
        {t.footerAuth}
      </div>
    </div>
  );
};
