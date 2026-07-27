import { previousMonthKey } from '@/utils/boardHelpers';

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
