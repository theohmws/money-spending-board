import manifest from './manifest';

describe('manifest', () => {
  it('declares an installable, standalone app', () => {
    const result = manifest();

    expect(result.name).toBeTruthy();
    expect(result.short_name).toBeTruthy();
    expect(result.start_url).toBe('/');
    expect(result.display).toBe('standalone');
    expect(result.background_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(result.theme_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('includes 192x192 and 512x512 icons plus a maskable variant', () => {
    const { icons } = manifest();

    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192', type: 'image/png' }),
        expect.objectContaining({ sizes: '512x512', type: 'image/png' }),
        expect.objectContaining({ purpose: 'maskable' }),
      ])
    );
  });
});
