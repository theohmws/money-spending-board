import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  't' | 'lang' | 'toggleLang' | 'themeTokens'
> & {
  onGetStarted: () => void;
  onSignIn: () => void;
};

export const LandingPage = ({
  t,
  lang,
  toggleLang,
  themeTokens,
  onGetStarted,
  onSignIn,
}: Props) => (
  <div className="flex w-full flex-1 flex-col px-6 pb-10 pt-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <img src="/icon-512.png" alt="" className="size-9 rounded-xl" />
        <span
          className="hidden whitespace-nowrap font-manrope text-[15px] font-extrabold sm:inline"
          style={{ color: themeTokens.text }}
        >
          {t.landingTagline}
        </span>
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
        <button
          type="button"
          onClick={onSignIn}
          className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold"
          style={{ color: themeTokens.text }}
        >
          {t.landingSignIn}
        </button>
      </div>
    </div>

    <div className="mx-auto mt-14 max-w-screen-sm text-center">
      <h1
        className="font-manrope text-[32px] font-extrabold leading-tight"
        style={{ color: themeTokens.text }}
      >
        {t.landingHeadline}
      </h1>
      <p
        className="mt-3.5 text-[15px] leading-relaxed"
        style={{ color: themeTokens.subtext }}
      >
        {t.landingSubhead}
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onGetStarted}
          className="rounded-xl px-6 py-3.5 text-[15px] font-semibold"
          style={{ background: '#132119', color: '#EFFCF4' }}
        >
          {t.landingGetStarted}
        </button>
        <button
          type="button"
          onClick={onSignIn}
          className="rounded-xl border px-6 py-3.5 text-[15px] font-semibold"
          style={{
            borderColor: themeTokens.inputBorder,
            color: themeTokens.text,
          }}
        >
          {t.landingSignIn}
        </button>
      </div>
    </div>

    <h2
      className="mt-14 font-manrope text-lg font-extrabold"
      style={{ color: themeTokens.text }}
    >
      {t.landingFeaturesTitle}
    </h2>
    <ul className="mt-4 grid gap-3.5 sm:grid-cols-2">
      {t.landingFeatures.map((feature) => (
        <li
          key={feature.title}
          className="rounded-2xl border p-4"
          style={{ borderColor: themeTokens.inputBorder }}
        >
          <div className="text-2xl" aria-hidden="true">
            {feature.icon}
          </div>
          <div
            className="mt-2 text-[15px] font-bold"
            style={{ color: themeTokens.text }}
          >
            {feature.title}
          </div>
          <div
            className="mt-1 text-[13.5px] leading-relaxed"
            style={{ color: themeTokens.subtext }}
          >
            {feature.desc}
          </div>
        </li>
      ))}
    </ul>

    <div
      className="pt-8 text-center text-[11.5px]"
      style={{ color: themeTokens.subtext3 }}
    >
      {t.footerAuth}
    </div>
  </div>
);
