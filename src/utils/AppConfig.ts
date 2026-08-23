const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '';
// Both best-effort (see next.config.js) — '' when unavailable (e.g. a
// shallow/git-less build), in which case the label below just omits that
// part rather than showing a blank commit/date.
const buildCommit = process.env.NEXT_PUBLIC_BUILD_COMMIT ?? '';
const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE ?? '';

const versionLabel = [version && `v${version}`, buildCommit, buildDate]
  .filter(Boolean)
  .join(' · ');

export const AppConfig = {
  site_name: '💰Money Spending',
  title: 'Money Spending Board',
  description:
    'Track spending and split your budget across needs, savings, and wants.',
  locale: 'en',
  version,
  buildCommit,
  buildDate,
  versionLabel,
};
