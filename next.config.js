/* eslint-disable import/no-extraneous-dependencies */
const { execSync } = require('child_process');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const { version } = require('./package.json');

// Best-effort — a shallow checkout or a git-less deploy environment just
// means the commit badge is omitted (see AppConfig.ts), not a build failure.
const getBuildCommit = () => {
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
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
  },
});
