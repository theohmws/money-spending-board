import { act, renderHook } from '@testing-library/react';

import { I18N } from '@/utils/BoardConfig';

import { useTransactions } from './useTransactions';

const t = I18N.th;
const locale = 'th-TH';

const makeClient = () => {
  const insertSelect = jest.fn();
  const deleteEq = jest.fn().mockResolvedValue({ error: null });
  const selectOrder = jest.fn();

  const client = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({ order: selectOrder })),
      insert: jest.fn(() => ({ select: insertSelect })),
      delete: jest.fn(() => ({ eq: deleteEq })),
    })),
  };

  return { client, insertSelect, deleteEq, selectOrder };
};

describe('useTransactions', () => {
  it('should default to no transactions and zero totals', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useTransactions(clientRef, 'user-1', t, locale)
    );

    expect(result.current.monthTx).toEqual([]);
    expect(result.current.income).toBe(0);
    expect(result.current.expense).toBe(0);
    expect(result.current.balance).toBe(0);
  });

  it('should load transactions from the shared client', async () => {
    const { client, selectOrder } = makeClient();
    selectOrder.mockResolvedValue({
      data: [
        {
          id: '1',
          type: 'expense',
          category: 'needs',
          note: 'Rent',
          amount: 500,
          date: new Date().toISOString().slice(0, 10),
        },
      ],
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useTransactions(clientRef, 'user-1', t, locale)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });

    expect(result.current.monthTx).toHaveLength(1);
    expect(result.current.expense).toBe(500);
  });

  it('should reject saving a non-positive amount', async () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useTransactions(clientRef, 'user-1', t, locale)
    );

    act(() => {
      result.current.onTxAmountChange('0');
    });

    await act(async () => {
      await result.current.saveTransaction();
    });

    expect(result.current.monthTx).toEqual([]);
  });

  it('should save a transaction, defaulting the note by type, and close the modal', async () => {
    const { client, insertSelect } = makeClient();
    insertSelect.mockResolvedValue({
      data: [
        {
          id: 'server-1',
          type: 'expense',
          category: 'needs',
          note: t.expense,
          amount: 100,
          date: '2024-01-01',
        },
      ],
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useTransactions(clientRef, 'user-1', t, locale)
    );

    act(() => {
      result.current.openAddModal();
      result.current.onTxAmountChange('100');
    });

    await act(async () => {
      await result.current.saveTransaction();
    });

    expect(result.current.showAddModal).toBe(false);
    expect(client.from).toHaveBeenCalledWith('transactions');
  });

  it('should not save when there is no authenticated user id', async () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useTransactions(clientRef, undefined, t, locale)
    );

    act(() => {
      result.current.onTxAmountChange('100');
    });

    await act(async () => {
      await result.current.saveTransaction();
    });

    expect(result.current.monthTx).toEqual([]);
  });

  it('should delete a transaction via the shared client', async () => {
    const { client, selectOrder } = makeClient();
    const today = new Date().toISOString().slice(0, 10);
    selectOrder.mockResolvedValue({
      data: [
        {
          id: 'tx-1',
          type: 'expense',
          category: 'needs',
          note: 'Rent',
          amount: 500,
          date: today,
        },
      ],
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useTransactions(clientRef, 'user-1', t, locale)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });
    expect(result.current.monthTx).toHaveLength(1);

    await act(async () => {
      await result.current.deleteTx('tx-1');
    });

    expect(result.current.monthTx).toHaveLength(0);
  });

  it('should clear all transactions', async () => {
    const { client, selectOrder } = makeClient();
    const today = new Date().toISOString().slice(0, 10);
    selectOrder.mockResolvedValue({
      data: [
        {
          id: 'tx-1',
          type: 'income',
          category: null,
          note: 'Salary',
          amount: 1000,
          date: today,
        },
      ],
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useTransactions(clientRef, 'user-1', t, locale)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });
    expect(result.current.monthTx).toHaveLength(1);

    act(() => {
      result.current.clear();
    });

    expect(result.current.monthTx).toHaveLength(0);
  });
});
