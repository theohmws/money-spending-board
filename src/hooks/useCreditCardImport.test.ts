import { act, renderHook } from '@testing-library/react';

import type { Transaction } from '@/utils/BoardConfig';
import { I18N } from '@/utils/BoardConfig';
import { extractPdfText } from '@/utils/importParsers/extractPdfText';
import { parseKtcStatement } from '@/utils/importParsers/ktc';

import { useCreditCardImport } from './useCreditCardImport';

jest.mock('@/utils/importParsers/extractPdfText', () => ({
  extractPdfText: jest.fn(),
}));
jest.mock('@/utils/importParsers/ktc', () => ({
  parseKtcStatement: jest.fn(),
}));

const mockExtractPdfText = extractPdfText as jest.MockedFunction<
  typeof extractPdfText
>;
const mockParseKtcStatement = parseKtcStatement as jest.MockedFunction<
  typeof parseKtcStatement
>;

const t = I18N.th;
const file = {} as File;

const existingTx = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx-1',
  type: 'expense',
  category: 'wants',
  note: 'Existing',
  amount: 100,
  date: '2025-09-01',
  source: null,
  needs_review: false,
  ...overrides,
});

describe('useCreditCardImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const guessCategory = jest.fn().mockReturnValue('wants');
  const bulkInsertTransactions = jest.fn().mockResolvedValue(null);

  it('starts idle with no rows, defaulting to the only available source', () => {
    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );

    expect(result.current.importStatus).toBe('idle');
    expect(result.current.importRows).toEqual([]);
    expect(result.current.selectedSourceId).toBe('ktc');
  });

  it('opens the source-selection step, and lets a source be selected', () => {
    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );

    act(() => {
      result.current.openSourceStep();
    });
    expect(result.current.importStatus).toBe('source');

    act(() => {
      result.current.selectSource('ktc');
    });
    expect(result.current.selectedSourceId).toBe('ktc');
  });

  it('cancelling from the source step returns to idle', () => {
    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );

    act(() => {
      result.current.openSourceStep();
    });
    expect(result.current.importStatus).toBe('source');

    act(() => {
      result.current.cancelImport();
    });
    expect(result.current.importStatus).toBe('idle');
  });

  it('parses a selected file straight to preview when unlocked', async () => {
    mockExtractPdfText.mockResolvedValue('raw text');
    mockParseKtcStatement.mockReturnValue([
      { date: '2025-09-10', description: 'LAZADA', amount: 1590 },
    ]);
    guessCategory.mockReturnValue('wants');

    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );

    await act(async () => {
      await result.current.selectFile(file);
    });

    expect(result.current.importStatus).toBe('preview');
    expect(result.current.importRows).toHaveLength(1);
    expect(result.current.importRows[0]).toMatchObject({
      date: '2025-09-10',
      description: 'LAZADA',
      amount: 1590,
      category: 'wants',
      included: true,
      edited: false,
      possibleDuplicate: false,
    });
  });

  it('flags a row as a possible duplicate only against a previously-imported transaction', async () => {
    mockExtractPdfText.mockResolvedValue('raw text');
    mockParseKtcStatement.mockReturnValue([
      { date: '2025-09-01', description: 'SHOPEETH', amount: 100 },
    ]);

    const manualMatch = [existingTx({ id: 'manual', source: null })];
    const { result: manualResult } = renderHook(() =>
      useCreditCardImport(t, manualMatch, guessCategory, bulkInsertTransactions)
    );
    await act(async () => {
      await manualResult.current.selectFile(file);
    });
    expect(manualResult.current.importRows[0]?.possibleDuplicate).toBe(false);

    const importedMatch = [
      existingTx({ id: 'imported', source: 'ktc_import' }),
    ];
    const { result: importedResult } = renderHook(() =>
      useCreditCardImport(
        t,
        importedMatch,
        guessCategory,
        bulkInsertTransactions
      )
    );
    await act(async () => {
      await importedResult.current.selectFile(file);
    });
    expect(importedResult.current.importRows[0]?.possibleDuplicate).toBe(true);
  });

  it('surfaces a parse error on the preview step (not idle, or the message would never render)', async () => {
    mockExtractPdfText.mockRejectedValue(new Error('bad pdf'));

    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );

    await act(async () => {
      await result.current.selectFile(file);
    });

    expect(result.current.importStatus).toBe('preview');
    expect(result.current.importRows).toEqual([]);
    expect(result.current.parseError).toBe('bad pdf');
  });

  it('prompts for a password and forwards the submitted value', async () => {
    const submitSpy = jest.fn();
    mockExtractPdfText.mockImplementation(
      (_selectedFile, options) =>
        new Promise(() => {
          options?.onPassword?.(submitSpy, false);
        })
    );

    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );

    await act(async () => {
      result.current.selectFile(file);
      await Promise.resolve();
    });

    expect(result.current.importStatus).toBe('password');
    expect(result.current.passwordIsRetry).toBe(false);

    act(() => {
      result.current.submitPassword('secret');
    });

    expect(submitSpy).toHaveBeenCalledWith('secret');
  });

  it('returns to idle when the password prompt is cancelled', async () => {
    mockExtractPdfText.mockImplementation(
      (_selectedFile, options) =>
        new Promise(() => {
          options?.onPassword?.(() => {}, false);
        })
    );

    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );

    await act(async () => {
      result.current.selectFile(file);
      await Promise.resolve();
    });
    expect(result.current.importStatus).toBe('password');

    act(() => {
      result.current.submitPassword(null);
    });

    expect(result.current.importStatus).toBe('idle');
  });

  it('marks a row edited (and clears its own duplicate flag independence) when its description changes', async () => {
    mockExtractPdfText.mockResolvedValue('raw text');
    mockParseKtcStatement.mockReturnValue([
      { date: '2025-09-01', description: 'SHOPEETH', amount: 100 },
    ]);

    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );
    await act(async () => {
      await result.current.selectFile(file);
    });
    const { key } = result.current.importRows[0]!;

    act(() => {
      result.current.editRowDescription(key, 'Shopee - phone case');
    });

    expect(result.current.importRows[0]).toMatchObject({
      description: 'Shopee - phone case',
      edited: true,
    });
  });

  it('toggles a row out of inclusion', async () => {
    mockExtractPdfText.mockResolvedValue('raw text');
    mockParseKtcStatement.mockReturnValue([
      { date: '2025-09-01', description: 'SHOPEETH', amount: 100 },
    ]);

    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );
    await act(async () => {
      await result.current.selectFile(file);
    });
    const { key } = result.current.importRows[0]!;

    act(() => {
      result.current.toggleRowIncluded(key);
    });

    expect(result.current.importRows[0]?.included).toBe(false);
  });

  it('confirms only included rows, marking edited rows reviewed and others not', async () => {
    mockExtractPdfText.mockResolvedValue('raw text');
    mockParseKtcStatement.mockReturnValue([
      { date: '2025-09-01', description: 'SHOPEETH', amount: 100 },
      { date: '2025-09-02', description: 'GRAB', amount: 50 },
    ]);

    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );
    await act(async () => {
      await result.current.selectFile(file);
    });

    const [row1, row2] = result.current.importRows;
    act(() => {
      result.current.editRowDescription(row1!.key, 'Shopee'); // edited
      result.current.toggleRowIncluded(row2!.key); // excluded, untouched
    });

    await act(async () => {
      await result.current.confirmImport();
    });

    expect(bulkInsertTransactions).toHaveBeenCalledWith([
      {
        type: 'expense',
        category: 'wants',
        note: 'Shopee',
        amount: 100,
        date: '2025-09-01',
        source: 'ktc_import',
        needs_review: false,
      },
    ]);
    expect(result.current.importStatus).toBe('idle');
    expect(result.current.importRows).toEqual([]);
  });

  it('keeps the preview open and surfaces an error when the bulk insert fails', async () => {
    mockExtractPdfText.mockResolvedValue('raw text');
    mockParseKtcStatement.mockReturnValue([
      { date: '2025-09-01', description: 'SHOPEETH', amount: 100 },
    ]);
    bulkInsertTransactions.mockResolvedValueOnce('Failed to fetch');

    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );
    await act(async () => {
      await result.current.selectFile(file);
    });

    await act(async () => {
      await result.current.confirmImport();
    });

    expect(result.current.importError).toBe('Failed to fetch');
    expect(result.current.importStatus).toBe('preview');
    expect(result.current.importRows).toHaveLength(1);
  });

  it('does nothing when confirming with no included rows', async () => {
    mockExtractPdfText.mockResolvedValue('raw text');
    mockParseKtcStatement.mockReturnValue([
      { date: '2025-09-01', description: 'SHOPEETH', amount: 100 },
    ]);

    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );
    await act(async () => {
      await result.current.selectFile(file);
    });
    act(() => {
      result.current.toggleRowIncluded(result.current.importRows[0]!.key);
    });

    await act(async () => {
      await result.current.confirmImport();
    });

    expect(bulkInsertTransactions).not.toHaveBeenCalled();
  });

  it('resets all state on cancel', async () => {
    mockExtractPdfText.mockResolvedValue('raw text');
    mockParseKtcStatement.mockReturnValue([
      { date: '2025-09-01', description: 'SHOPEETH', amount: 100 },
    ]);

    const { result } = renderHook(() =>
      useCreditCardImport(t, [], guessCategory, bulkInsertTransactions)
    );
    await act(async () => {
      await result.current.selectFile(file);
    });
    expect(result.current.importStatus).toBe('preview');

    act(() => {
      result.current.cancelImport();
    });

    expect(result.current.importStatus).toBe('idle');
    expect(result.current.importRows).toEqual([]);
  });
});
