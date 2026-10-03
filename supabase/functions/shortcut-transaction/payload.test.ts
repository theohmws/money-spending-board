import {
  bearerToken,
  guessCategory,
  parseAmount,
  parseDate,
  parsePayload,
  slipSource,
  todayIn,
} from './payload';

describe('parseAmount', () => {
  it('accepts numbers and locale-formatted strings', () => {
    expect(parseAmount(120)).toBe(120);
    expect(parseAmount('1,234.50')).toBe(1234.5);
    expect(parseAmount('฿ 99')).toBe(99);
    expect(parseAmount('THB45.125')).toBe(45.13);
  });

  it('rejects non-positive or non-numeric values', () => {
    expect(parseAmount(0)).toBeNull();
    expect(parseAmount(-5)).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('1.2.3')).toBeNull();
    expect(parseAmount(true)).toBeNull();
  });
});

describe('parseDate', () => {
  it('accepts a plain date or an ISO 8601 timestamp', () => {
    expect(parseDate('2026-09-28')).toBe('2026-09-28');
    expect(parseDate('2026-09-28T06:15:00+07:00')).toBe('2026-09-28');
  });

  it('rejects malformed or impossible dates', () => {
    expect(parseDate('28/09/2026')).toBeNull();
    expect(parseDate('2026-02-31')).toBeNull();
    expect(parseDate(20260928)).toBeNull();
  });
});

describe('slipSource', () => {
  it('tags the source with the bank, else the album, else nothing', () => {
    expect(slipSource('BBL', 'K PLUS')).toBe('slip_ocr:BBL');
    expect(slipSource(null, ' K  PLUS ')).toBe('slip_ocr:K PLUS');
    expect(slipSource(null, null)).toBe('slip_ocr');
  });
});

describe('todayIn', () => {
  it('uses the given timezone rather than UTC', () => {
    // 23:30 UTC on the 27th is already 06:30 on the 28th in Bangkok.
    const now = new Date('2026-09-27T23:30:00Z');
    expect(todayIn('Asia/Bangkok', now)).toBe('2026-09-28');
    expect(todayIn('UTC', now)).toBe('2026-09-27');
  });
});

describe('parsePayload', () => {
  it('parses an insert with defaults', () => {
    expect(parsePayload({ amount: '120' })).toEqual({
      ok: true,
      value: {
        kind: 'insert',
        type: 'expense',
        amount: 120,
        note: null,
        category: null,
        date: null,
      },
    });
  });

  it('normalizes case and drops category for income', () => {
    expect(
      parsePayload({
        type: 'Income',
        amount: 5000,
        note: ' Salary ',
        category: 'needs',
        date: '2026-09-01',
      })
    ).toEqual({
      ok: true,
      value: {
        kind: 'insert',
        type: 'income',
        amount: 5000,
        note: 'Salary',
        category: null,
        date: '2026-09-01',
      },
    });
  });

  it('requires an amount for an insert', () => {
    expect(parsePayload({ note: 'Coffee' })).toEqual({
      ok: false,
      error: 'amount is required',
    });
  });

  it('parses an update with only the given fields', () => {
    expect(
      parsePayload({ id: 'tx-1', amount: 150, category: 'NEEDS' })
    ).toEqual({
      ok: true,
      value: {
        kind: 'update',
        id: 'tx-1',
        changes: { amount: 150, category: 'needs' },
      },
    });
  });

  it('clears category when an update switches to income', () => {
    const result = parsePayload({ id: 'tx-1', type: 'income' });
    expect(result).toEqual({
      ok: true,
      value: {
        kind: 'update',
        id: 'tx-1',
        changes: { type: 'income', category: null },
      },
    });
  });

  it('rejects an update with nothing to change', () => {
    expect(parsePayload({ id: 'tx-1' })).toEqual({
      ok: false,
      error: 'Nothing to update',
    });
  });

  it('rejects invalid enum values and non-object bodies', () => {
    expect(parsePayload({ amount: 1, type: 'refund' }).ok).toBe(false);
    expect(parsePayload({ amount: 1, category: 'fun' }).ok).toBe(false);
    expect(parsePayload({ amount: 1, date: 'yesterday' }).ok).toBe(false);
    expect(parsePayload([1]).ok).toBe(false);
    expect(parsePayload(null).ok).toBe(false);
  });
});

describe('guessCategory', () => {
  it('prefers the longest matching keyword, defaulting to wants', () => {
    const rules = [
      { keyword: 'lotus', category: 'needs' as const },
      { keyword: "lotus's cafe", category: 'wants' as const },
      { keyword: 'fund', category: 'savings' as const },
    ];
    expect(guessCategory("Lotus's Cafe latte", rules)).toBe('wants');
    expect(guessCategory('LOTUS groceries', rules)).toBe('needs');
    expect(guessCategory('Taxi', rules)).toBe('wants');
  });
});

describe('bearerToken', () => {
  it('extracts an msb_ token from the Authorization header', () => {
    expect(bearerToken('Bearer msb_abc123')).toBe('msb_abc123');
    expect(bearerToken('bearer   msb_abc123 ')).toBe('msb_abc123');
  });

  it('rejects missing, malformed or non-msb tokens', () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken('msb_abc123')).toBeNull();
    expect(bearerToken('Bearer eyJhbGciOi.jwt')).toBeNull();
  });
});

describe('transfer type', () => {
  it('accepts an insert with no category', () => {
    expect(
      parsePayload({ amount: 500, type: 'transfer', category: 'needs' })
    ).toEqual({
      ok: true,
      value: {
        kind: 'insert',
        type: 'transfer',
        amount: 500,
        note: null,
        category: null,
        date: null,
      },
    });
  });

  it('clears the category when updating a row to transfer', () => {
    const result = parsePayload({ id: 'x', type: 'transfer' });
    expect(
      result.ok && result.value.kind === 'update' && result.value.changes
    ).toEqual({
      type: 'transfer',
      category: null,
    });
  });
});
