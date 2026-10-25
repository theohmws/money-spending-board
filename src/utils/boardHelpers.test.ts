import {
  isIosDevice,
  previousMonthKey,
  slipLinkAvailable,
  slipShortcutUrl,
} from '@/utils/boardHelpers';

describe('slipShortcutUrl', () => {
  it('encodes the shortcut name and photo timestamp', () => {
    expect(slipShortcutUrl('Open Slip', '2026-09-28T14:05:00+07:00')).toBe(
      'shortcuts://run-shortcut?name=Open%20Slip&input=text&text=2026-09-28T14%3A05%3A00%2B07%3A00'
    );
  });
});

describe('slipLinkAvailable', () => {
  it('shows legacy rows (no device recorded) on any device', () => {
    expect(slipLinkAvailable(null, '')).toBe(true);
    expect(slipLinkAvailable(undefined, 'iPad')).toBe(true);
  });

  it('shows device-tagged rows only on the matching device', () => {
    expect(slipLinkAvailable('Apisith’s iPhone', "apisith's  iPhone ")).toBe(
      true
    );
    expect(slipLinkAvailable("Apisith's iPhone", "Apisith's iPad")).toBe(false);
    expect(slipLinkAvailable("Apisith's iPhone", '')).toBe(false);
  });
});

describe('isIosDevice', () => {
  it('detects iPhone and iPadOS-as-Mac, but not desktop Mac or Android', () => {
    expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe(true);
    expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 5)).toBe(
      true
    );
    expect(isIosDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 0)).toBe(
      false
    );
    expect(isIosDevice('Mozilla/5.0 (Linux; Android 14)')).toBe(false);
  });
});

describe('previousMonthKey', () => {
  it('returns the prior month within the same year', () => {
    expect(previousMonthKey('2026-07')).toBe('2026-06');
  });

  it('rolls over to December of the prior year for January', () => {
    expect(previousMonthKey('2026-01')).toBe('2025-12');
  });

  it('pads single-digit months', () => {
    expect(previousMonthKey('2026-03')).toBe('2026-02');
  });
});
