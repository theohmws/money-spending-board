import { act, renderHook, waitFor } from '@testing-library/react';

import { useSpendingBoard } from './useSpendingBoard';

const mockSession = {
  user: { email: 'demo@example.com', id: 'user-1' },
};

const mockAuth = {
  getSession: jest.fn().mockResolvedValue({ data: { session: mockSession } }),
  onAuthStateChange: jest.fn().mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
};

let transactionRows: unknown[] = [];

const mockFrom = jest.fn((table: string) => {
  if (table === 'import_category_rules') {
    return {
      select: jest.fn(() => Promise.resolve({ data: [], error: null })),
    };
  }
  if (table === 'board_settings') {
    return {
      select: jest.fn(() => ({
        maybeSingle: jest
          .fn()
          .mockImplementation(() =>
            Promise.resolve({ data: null, error: null })
          ),
      })),
    };
  }
  return {
    select: jest.fn(() => ({
      order: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve({ data: transactionRows, error: null })
        ),
    })),
  };
});

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ auth: mockAuth, from: mockFrom })),
}));

type TxRow = {
  id: string;
  type: 'expense' | 'income';
  category: 'needs' | 'savings' | 'wants' | null;
  note: string;
  amount: number;
  date: string;
  source: string | null;
  needs_review: boolean;
};

const tx = (overrides: Partial<TxRow> & Pick<TxRow, 'id' | 'date'>): TxRow => ({
  type: 'expense',
  category: 'needs',
  note: '',
  amount: 100,
  source: null,
  needs_review: false,
  ...overrides,
});

describe('useSpendingBoard', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';
    mockAuth.getSession.mockResolvedValue({ data: { session: mockSession } });
    transactionRows = [];
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  });

  const renderBoard = async () => {
    const view = renderHook(() => useSpendingBoard());
    await waitFor(() => expect(view.result.current.booting).toBe(false));
    return view;
  };

  describe('tab state', () => {
    it('defaults to the overview tab and trend sub-tab', async () => {
      const { result } = await renderBoard();

      expect(result.current.activeTab).toBe('overview');
      expect(result.current.activeGraphTab).toBe('trend');
    });

    it('switches tabs via their setters', async () => {
      const { result } = await renderBoard();

      act(() => {
        result.current.setActiveTab('graph');
        result.current.setActiveGraphTab('compare');
      });

      expect(result.current.activeTab).toBe('graph');
      expect(result.current.activeGraphTab).toBe('compare');
    });

    it('does not persist tab selection across a fresh mount', async () => {
      const { result: firstResult } = await renderBoard();
      act(() => {
        firstResult.current.setActiveTab('graph');
        firstResult.current.setActiveGraphTab('compare');
      });
      expect(firstResult.current.activeTab).toBe('graph');

      const { result: secondResult } = await renderBoard();
      expect(secondResult.current.activeTab).toBe('overview');
      expect(secondResult.current.activeGraphTab).toBe('trend');
    });
  });

  describe('monthlyTotals', () => {
    it('only includes populated months, plus the selected month even when empty', async () => {
      transactionRows = [
        tx({ id: '1', date: '2024-01-15', type: 'income', amount: 500 }),
        tx({ id: '2', date: '2024-02-10', type: 'expense', amount: 200 }),
      ];
      const { result } = await renderBoard();

      act(() => {
        result.current.onMonthChange('2024-03');
      });

      const months = result.current.monthlyTotals.map((m) => m.month);
      expect(months).toEqual(['2024-01', '2024-02', '2024-03']);
      const selected = result.current.monthlyTotals.find(
        (m) => m.month === '2024-03'
      );
      expect(selected).toMatchObject({
        income: 0,
        expense: 0,
        isSelected: true,
      });
    });

    it('caps to the 6 most recent populated months', async () => {
      transactionRows = [
        '2024-01',
        '2024-02',
        '2024-03',
        '2024-04',
        '2024-05',
        '2024-06',
        '2024-07',
        '2024-08',
      ].map((month, i) =>
        tx({
          id: `tx-${i}`,
          date: `${month}-05`,
          type: 'income',
          amount: 100,
        })
      );
      const { result } = await renderBoard();

      act(() => {
        result.current.onMonthChange('2024-08');
      });

      const months = result.current.monthlyTotals.map((m) => m.month);
      expect(months).toHaveLength(6);
      expect(months).toEqual([
        '2024-03',
        '2024-04',
        '2024-05',
        '2024-06',
        '2024-07',
        '2024-08',
      ]);
    });

    it('appends the selected month even if outside the 6-month cap window', async () => {
      transactionRows = [
        '2024-01',
        '2024-02',
        '2024-03',
        '2024-04',
        '2024-05',
        '2024-06',
        '2024-07',
      ].map((month, i) =>
        tx({
          id: `tx-${i}`,
          date: `${month}-05`,
          type: 'income',
          amount: 100,
        })
      );
      const { result } = await renderBoard();

      act(() => {
        result.current.onMonthChange('2024-01');
      });

      const months = result.current.monthlyTotals.map((m) => m.month);
      expect(months).toContain('2024-01');
      expect(months).toHaveLength(7);
      expect(
        result.current.monthlyTotals.find((m) => m.month === '2024-01')
      ).toMatchObject({ isSelected: true });
    });

    it('respects a user-selected trendMonthLimit instead of the default 6', async () => {
      transactionRows = [
        '2024-01',
        '2024-02',
        '2024-03',
        '2024-04',
        '2024-05',
        '2024-06',
        '2024-07',
        '2024-08',
      ].map((month, i) =>
        tx({
          id: `tx-${i}`,
          date: `${month}-05`,
          type: 'income',
          amount: 100,
        })
      );
      const { result } = await renderBoard();

      act(() => {
        result.current.onMonthChange('2024-08');
        result.current.setTrendMonthLimit(3);
      });
      expect(result.current.monthlyTotals.map((m) => m.month)).toEqual([
        '2024-06',
        '2024-07',
        '2024-08',
      ]);

      act(() => {
        result.current.setTrendMonthLimit(12);
      });
      expect(result.current.monthlyTotals.map((m) => m.month)).toEqual([
        '2024-01',
        '2024-02',
        '2024-03',
        '2024-04',
        '2024-05',
        '2024-06',
        '2024-07',
        '2024-08',
      ]);
    });

    it('includes a per-category expense breakdown for each month', async () => {
      transactionRows = [
        tx({
          id: '1',
          date: '2024-05-10',
          type: 'expense',
          category: 'needs',
          amount: 300,
        }),
        tx({
          id: '2',
          date: '2024-05-12',
          type: 'expense',
          category: 'wants',
          amount: 50,
        }),
      ];
      const { result } = await renderBoard();

      act(() => {
        result.current.onMonthChange('2024-05');
      });

      const entry = result.current.monthlyTotals.find(
        (m) => m.month === '2024-05'
      );
      expect(entry?.categoryBreakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'needs', amount: 300 }),
          expect.objectContaining({ id: 'savings', amount: 0 }),
          expect.objectContaining({ id: 'wants', amount: 50 }),
        ])
      );
    });
  });

  describe('trendSeries', () => {
    it('defaults to expense and switches via the setter', async () => {
      const { result } = await renderBoard();

      expect(result.current.trendSeries).toBe('expense');

      act(() => {
        result.current.setTrendSeries('income');
      });

      expect(result.current.trendSeries).toBe('income');
    });
  });

  describe('compareRows', () => {
    it('computes selected vs. previous month spend per category', async () => {
      transactionRows = [
        tx({
          id: '1',
          date: '2024-05-10',
          type: 'expense',
          category: 'needs',
          amount: 300,
        }),
        tx({
          id: '2',
          date: '2024-04-10',
          type: 'expense',
          category: 'needs',
          amount: 150,
        }),
      ];
      const { result } = await renderBoard();

      act(() => {
        result.current.onMonthChange('2024-05');
      });

      const needsRow = result.current.compareRows.find((r) => r.id === 'needs');
      expect(needsRow).toMatchObject({
        selectedSpend: 300,
        previousSpend: 150,
      });
    });

    it('shows zero previousSpend when the previous month has no transactions', async () => {
      transactionRows = [
        tx({
          id: '1',
          date: '2024-05-10',
          type: 'expense',
          category: 'wants',
          amount: 80,
        }),
      ];
      const { result } = await renderBoard();

      act(() => {
        result.current.onMonthChange('2024-05');
      });

      const wantsRow = result.current.compareRows.find((r) => r.id === 'wants');
      expect(wantsRow).toMatchObject({ selectedSpend: 80, previousSpend: 0 });
    });

    it('handles the January -> December year rollover', async () => {
      transactionRows = [
        tx({
          id: '1',
          date: '2024-01-05',
          type: 'expense',
          category: 'savings',
          amount: 60,
        }),
        tx({
          id: '2',
          date: '2023-12-20',
          type: 'expense',
          category: 'savings',
          amount: 40,
        }),
      ];
      const { result } = await renderBoard();

      act(() => {
        result.current.onMonthChange('2024-01');
      });

      const savingsRow = result.current.compareRows.find(
        (r) => r.id === 'savings'
      );
      expect(savingsRow).toMatchObject({
        selectedSpend: 60,
        previousSpend: 40,
      });
    });
  });

  describe('transactionRows needs-review filter', () => {
    beforeEach(() => {
      transactionRows = [
        tx({
          id: 'imported-unreviewed',
          date: '2024-03-05',
          note: 'SHOPEETH BANGKOK TH',
          source: 'ktc_import',
          needs_review: true,
        }),
        tx({
          id: 'manual',
          date: '2024-03-06',
          note: 'Coffee',
          source: null,
          needs_review: false,
        }),
      ];
    });

    it('shows every row by default, tagged with needsReview/sourceLabel', async () => {
      const { result } = await renderBoard();

      act(() => {
        result.current.onMonthChange('2024-03');
      });

      expect(result.current.transactionFilter).toBe('all');
      expect(result.current.transactionRows).toHaveLength(2);

      const imported = result.current.transactionRows.find(
        (row) => row.id === 'imported-unreviewed'
      );
      expect(imported).toMatchObject({
        needsReview: true,
        sourceLabel: 'KTC',
        ariaLabel: expect.stringContaining('SHOPEETH BANGKOK TH'),
      });

      const manual = result.current.transactionRows.find(
        (row) => row.id === 'manual'
      );
      expect(manual).toMatchObject({
        needsReview: false,
        sourceLabel: null,
      });
    });

    it('filters to only needs-review rows when switched', async () => {
      const { result } = await renderBoard();

      act(() => {
        result.current.onMonthChange('2024-03');
        result.current.setTransactionFilter('needsReview');
      });

      expect(result.current.transactionRows).toHaveLength(1);
      expect(result.current.transactionRows[0]?.id).toBe('imported-unreviewed');
    });
  });
});
