/* eslint-disable import/no-extraneous-dependencies */
const { execSync } = require('child_process');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const { version } = require('./package.json');

// Prefer Vercel's own system env var (set on every build, no git checkout
// depth to worry about) and fall back to shelling out to git for local/
// non-Vercel builds. Best-effort either way — a git-less environment just
// means the commit badge is omitted (see AppConfig.ts), not a build failure.
const getBuildCommit = () => {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return '';
  }
};

module.exports = withBundleAnalyzer({
  output: 'export',
  poweredByHeader: false,
  trailingSlash: true,
  basePath: '',
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_BUILD_COMMIT: getBuildCommit(),
    // Minute precision, not just the date: a redeploy of the same commit on
    // the same day must still produce a different label (every deploy gets
    // a new one), which a date-only value wouldn't.
    NEXT_PUBLIC_BUILD_TIME: new Date()
      .toISOString()
      .slice(0, 16)
      .replace('T', ' '),
  },
});
