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

const mockFrom = jest.fn(() => ({
  select: jest.fn(() => ({
    order: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ data: transactionRows, error: null })
      ),
  })),
}));

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
};

const tx = (overrides: Partial<TxRow> & Pick<TxRow, 'id' | 'date'>): TxRow => ({
  type: 'expense',
  category: 'needs',
  note: '',
  amount: 100,
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
});
