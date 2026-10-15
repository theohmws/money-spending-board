// Appends the package.json `iconVersion` (exposed via next.config.js) as a
// query string so a changed icon gets a fresh URL: Safari/iOS caches icon
// files aggressively and would otherwise reuse the old one when the app is
// added to the home screen again. Bump `iconVersion` when the artwork changes.
export const iconUrl = (path: string) => {
  const version = process.env.NEXT_PUBLIC_ICON_VERSION;
  return version ? `${path}?v=${version}` : path;
};
