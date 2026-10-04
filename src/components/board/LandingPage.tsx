import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PublicStats } from '@/hooks/usePublicStats';
import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

import { CountUp } from './CountUp';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  't' | 'lang' | 'toggleLang'
> & {
  stats: PublicStats | null;
  onGetStarted: () => void;
  onSignIn: () => void;
};

export const LandingPage = ({
  t,
  lang,
  toggleLang,
  stats,
  onGetStarted,
  onSignIn,
}: Props) => {
  const visibleStats = [
    { value: stats?.users, label: t.landingStatUsers },
    { value: stats?.transactions, label: t.landingStatTransactions },
  ].flatMap((stat) =>
    typeof stat.value === 'number'
      ? [{ value: stat.value, label: stat.label }]
      : []
  );

  return (
    <div className="flex w-full flex-1 flex-col px-4 pb-10 pt-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/icon-512.png" alt="" className="size-9 rounded-xl" />
          <span className="hidden whitespace-nowrap text-base font-semibold sm:inline">
            {t.landingTagline}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleLang}>
            {lang === 'th' ? 'EN' : 'TH'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onSignIn}>
            {t.landingSignIn}
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-screen-sm text-center">
        <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight">
          {t.landingHeadline}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {t.landingSubhead}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button size="lg" onClick={onGetStarted} className="px-5">
            {t.landingGetStarted}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onSignIn}
            className="px-5"
          >
            {t.landingSignIn}
          </Button>
        </div>
      </div>

      {visibleStats.length > 0 && (
        <dl className="mx-auto mt-12 flex w-full max-w-screen-sm gap-3">
          {visibleStats.map((stat) => (
            <Card
              key={stat.label}
              className="flex-1 flex-col-reverse items-center gap-1 text-center"
            >
              <dt className="text-sm text-muted-foreground">{stat.label}</dt>
              <dd className="text-3xl font-semibold text-primary">
                <CountUp value={stat.value} suffix="+" />
              </dd>
            </Card>
          ))}
        </dl>
      )}

      <h2 className="mt-14 text-lg font-semibold">{t.landingFeaturesTitle}</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {t.landingFeatures.map((feature) => (
          <li key={feature.title}>
            <Card className="h-full gap-1.5">
              <div className="flex items-center gap-2 px-4">
                <span className="text-base font-medium">{feature.title}</span>
                {feature.pill && (
                  <Badge variant="secondary">{feature.pill}</Badge>
                )}
              </div>
              <div className="px-4 text-sm leading-relaxed text-muted-foreground">
                {feature.desc}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <div className="pt-8 text-center text-xs text-muted-foreground">
        {t.footerAuth}
      </div>
    </div>
  );
};
