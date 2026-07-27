'use client';

import type { RefObject } from 'react';
import { useCallback, useMemo, useState } from 'react';

import type { BoardSupabaseClient } from '@/hooks/useAuthSession';
import type {
  CategoryId,
  I18nDict,
  Transaction,
  TxType,
} from '@/utils/BoardConfig';
import { monthKey, todayStr, uid } from '@/utils/boardHelpers';

type TxForm = {
  amount: string;
  note: string;
  category: CategoryId;
  date: string;
};

export const useTransactions = (
  clientRef: RefObject<BoardSupabaseClient | null>,
  userId: string | undefined,
  t: I18nDict,
  locale: string
) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(todayStr().slice(0, 7));
  const [showAddModal, setShowAddModal] = useState(false);
  const [txType, setTxType] = useState<TxType>('expense');
  const [txForm, setTxForm] = useState<TxForm>({
    amount: '',
    note: '',
    category: 'needs',
    date: todayStr(),
  });

  const load = useCallback((client: BoardSupabaseClient) => {
    client
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setTransactions(data as Transaction[]);
      });
  }, []);

  const clear = useCallback(() => setTransactions([]), []);

  const onMonthChange = useCallback(
    (value: string) => setSelectedMonth(value),
    []
  );

  const monthTx = useMemo(
    () => transactions.filter((tx) => monthKey(tx.date) === selectedMonth),
    [transactions, selectedMonth]
  );

  const monthOptions = useMemo(() => {
    const monthSet = new Set([todayStr().slice(0, 7), selectedMonth]);
    const now = new Date();
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(now);
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      monthSet.add(d.toISOString().slice(0, 7));
    }
    transactions.forEach((tx) => monthSet.add(monthKey(tx.date)));

    return Array.from(monthSet)
      .sort((a, b) => (a < b ? 1 : -1))
      .map((month) => ({
        value: month,
        label: new Date(`${month}-02T00:00:00`).toLocaleDateString(locale, {
          month: 'long',
          year: 'numeric',
        }),
      }));
  }, [transactions, selectedMonth, locale]);

  const income = monthTx
    .filter((tx) => tx.type === 'income')
    .reduce((a, tx) => a + Number(tx.amount), 0);
  const expense = monthTx
    .filter((tx) => tx.type === 'expense')
    .reduce((a, tx) => a + Number(tx.amount), 0);
  const balance = income - expense;

  const openAddModal = useCallback(() => {
    setTxType('expense');
    setTxForm({ amount: '', note: '', category: 'needs', date: todayStr() });
    setShowAddModal(true);
  }, []);
  const closeAddModal = useCallback(() => setShowAddModal(false), []);
  const onTxAmountChange = useCallback(
    (value: string) => setTxForm((prev) => ({ ...prev, amount: value })),
    []
  );
  const onTxNoteChange = useCallback(
    (value: string) => setTxForm((prev) => ({ ...prev, note: value })),
    []
  );
  const onTxDateChange = useCallback(
    (value: string) => setTxForm((prev) => ({ ...prev, date: value })),
    []
  );
  const onTxCategoryChange = useCallback(
    (category: CategoryId) => setTxForm((prev) => ({ ...prev, category })),
    []
  );

  const deleteTx = useCallback(
    async (id: string) => {
      await clientRef.current?.from('transactions').delete().eq('id', id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    },
    [clientRef]
  );

  const saveTransaction = useCallback(async () => {
    const amount = parseFloat(txForm.amount);
    if (!amount || amount <= 0) return;

    const tx: Transaction = {
      id: uid(),
      type: txType,
      category: txType === 'expense' ? txForm.category : null,
      note: txForm.note || (txType === 'income' ? t.income : t.expense),
      amount,
      date: txForm.date || todayStr(),
    };

    const client = clientRef.current;
    if (!client || !userId) return;

    const { data, error } = await client
      .from('transactions')
      .insert({ ...tx, user_id: userId })
      .select();
    if (!error) {
      setTransactions((prev) => [
        (data?.[0] as Transaction | undefined) ?? tx,
        ...prev,
      ]);
    }
    setShowAddModal(false);
  }, [clientRef, t, txForm, txType, userId]);

  return {
    selectedMonth,
    onMonthChange,
    monthOptions,
    monthTx,
    income,
    expense,
    balance,
    showAddModal,
    openAddModal,
    closeAddModal,
    txType,
    setTxType,
    txForm,
    onTxAmountChange,
    onTxNoteChange,
    onTxDateChange,
    onTxCategoryChange,
    saveTransaction,
    deleteTx,
    load,
    clear,
  };
};
