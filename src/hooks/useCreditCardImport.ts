'use client';

import { useCallback, useRef, useState } from 'react';

import type {
  CategoryId,
  I18nDict,
  ParsedImportRow,
  Transaction,
} from '@/utils/BoardConfig';
import { uid } from '@/utils/boardHelpers';
import { extractPdfText } from '@/utils/importParsers/extractPdfText';
import { parseKtcStatement } from '@/utils/importParsers/ktc';

const KTC_SOURCE = 'ktc_import';

type ImportStatus = 'idle' | 'parsing' | 'password' | 'preview';

type BulkInsertRow = {
  type: 'expense';
  category: CategoryId;
  note: string;
  amount: number;
  date: string;
  source: string;
  needs_review: boolean;
};

// Owns the whole "pick a KTC statement PDF -> preview -> confirm" flow.
// Never writes to Supabase itself — `bulkInsertTransactions` (from
// useTransactions, threaded in by the composition root) is the only thing
// that does, and only once the user confirms. See design.md in
// openspec/changes/2026-08-23-import-ktc-credit-card-statement.
export const useCreditCardImport = (
  t: I18nDict,
  transactions: Transaction[],
  guessCategory: (description: string) => CategoryId,
  bulkInsertTransactions: (rows: BulkInsertRow[]) => Promise<string | null>
) => {
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importRows, setImportRows] = useState<ParsedImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [passwordIsRetry, setPasswordIsRetry] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const passwordSubmitRef = useRef<((password: string | null) => void) | null>(
    null
  );

  // Matched only against transactions that themselves came from a prior
  // import (`source` set) — a coincidental match against a hand-typed
  // transaction isn't a meaningful signal (design.md Decision 6).
  const isPossibleDuplicate = useCallback(
    (date: string, amount: number) =>
      transactions.some(
        (tx) => tx.source && tx.date === date && Number(tx.amount) === amount
      ),
    [transactions]
  );

  const selectFile = useCallback(
    async (file: File) => {
      setImportStatus('parsing');
      setParseError(null);
      setImportRows([]);

      try {
        const text = await extractPdfText(file, {
          onPassword: (submit, isRetry) => {
            passwordSubmitRef.current = submit;
            setPasswordIsRetry(isRetry);
            setImportStatus('password');
          },
        });

        const parsed = parseKtcStatement(text);
        setImportRows(
          parsed.map((row) => ({
            key: uid(),
            date: row.date,
            description: row.description,
            amount: row.amount,
            category: guessCategory(row.description),
            included: true,
            edited: false,
            possibleDuplicate: isPossibleDuplicate(row.date, row.amount),
          }))
        );
        setImportStatus('preview');
      } catch (err) {
        setParseError(err instanceof Error ? err.message : t.importParseError);
        setImportStatus('idle');
      }
    },
    [guessCategory, isPossibleDuplicate, t]
  );

  // `password: null` means the user cancelled the prompt.
  const submitPassword = useCallback((password: string | null) => {
    passwordSubmitRef.current?.(password);
    if (password === null) setImportStatus('idle');
  }, []);

  const cancelImport = useCallback(() => {
    setImportStatus('idle');
    setImportRows([]);
    setParseError(null);
    setImportError(null);
  }, []);

  const toggleRowIncluded = useCallback((key: string) => {
    setImportRows((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, included: !row.included } : row
      )
    );
  }, []);

  const editRowDescription = useCallback((key: string, description: string) => {
    setImportRows((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, description, edited: true } : row
      )
    );
  }, []);

  const editRowCategory = useCallback((key: string, category: CategoryId) => {
    setImportRows((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, category, edited: true } : row
      )
    );
  }, []);

  const confirmImport = useCallback(async () => {
    const included = importRows.filter((row) => row.included);
    if (included.length === 0) return;

    setImportError(null);
    const error = await bulkInsertTransactions(
      included.map((row) => ({
        type: 'expense',
        category: row.category,
        note: row.description,
        amount: row.amount,
        date: row.date,
        source: KTC_SOURCE,
        // A row the user edited in preview doesn't need a second look.
        needs_review: !row.edited,
      }))
    );

    if (error) {
      setImportError(error);
      return;
    }
    setImportStatus('idle');
    setImportRows([]);
  }, [bulkInsertTransactions, importRows]);

  return {
    importStatus,
    importRows,
    parseError,
    passwordIsRetry,
    importError,
    selectFile,
    submitPassword,
    cancelImport,
    toggleRowIncluded,
    editRowDescription,
    editRowCategory,
    confirmImport,
  };
};
