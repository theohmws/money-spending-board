import { iconUrl } from './iconUrl';

describe('iconUrl', () => {
  const original = process.env.NEXT_PUBLIC_ICON_VERSION;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_ICON_VERSION;
    } else {
      process.env.NEXT_PUBLIC_ICON_VERSION = original;
    }
  });

  it('returns the plain path when no icon version is set', () => {
    delete process.env.NEXT_PUBLIC_ICON_VERSION;

    expect(iconUrl('/icon-192.png')).toBe('/icon-192.png');
  });

  it('appends the icon version as a cache-busting query', () => {
    process.env.NEXT_PUBLIC_ICON_VERSION = '2';

    expect(iconUrl('/icon-192.png')).toBe('/icon-192.png?v=2');
  });
});
