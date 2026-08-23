import { act, renderHook } from '@testing-library/react';

import { I18N } from '@/utils/BoardConfig';

import { useImportCategoryRules } from './useImportCategoryRules';

const t = I18N.th;

const makeClient = () => {
  const insertSelect = jest.fn();
  const deleteEq = jest.fn().mockResolvedValue({ error: null });
  const selectResult = jest.fn();

  const client = {
    from: jest.fn(() => ({
      select: jest.fn(() => selectResult()),
      insert: jest.fn(() => ({ select: insertSelect })),
      delete: jest.fn(() => ({ eq: deleteEq })),
    })),
  };

  return { client, insertSelect, deleteEq, selectResult };
};

describe('useImportCategoryRules', () => {
  it('defaults to no rules and guesses "wants" for anything', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useImportCategoryRules(clientRef, 'user-1', t)
    );

    expect(result.current.rules).toEqual([]);
    expect(result.current.guessCategory('STARBUCKS BANGKOK TH')).toBe('wants');
  });

  it('loads rules from the shared client', async () => {
    const { client, selectResult } = makeClient();
    selectResult.mockResolvedValue({
      data: [{ id: 'r1', keyword: 'STARBUCKS', category: 'wants' }],
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useImportCategoryRules(clientRef, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });

    expect(result.current.rules).toEqual([
      { id: 'r1', keyword: 'STARBUCKS', category: 'wants' },
    ]);
  });

  it('guesses a category by keyword match, case-insensitively', async () => {
    const { client, selectResult } = makeClient();
    selectResult.mockResolvedValue({
      data: [{ id: 'r1', keyword: 'starbucks', category: 'wants' }],
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useImportCategoryRules(clientRef, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });

    expect(result.current.guessCategory('STARBUCKS BANGKOK TH')).toBe('wants');
    expect(result.current.guessCategory('SOMETHING ELSE')).toBe('wants');
  });

  it('prefers the longer, more specific keyword when two rules match', async () => {
    const { client, selectResult } = makeClient();
    selectResult.mockResolvedValue({
      data: [
        { id: 'r1', keyword: 'LINEPAY', category: 'wants' },
        { id: 'r2', keyword: 'LINEPAY*LP_LINE MAN', category: 'needs' },
      ],
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useImportCategoryRules(clientRef, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });

    expect(
      result.current.guessCategory('LINEPAY*LP_LINE MAN WO BANGKOK THA')
    ).toBe('needs');
  });

  it('adds a rule and appends it to state', async () => {
    const { client, insertSelect } = makeClient();
    insertSelect.mockResolvedValue({
      data: [{ id: 'r1', keyword: 'GRAB', category: 'needs' }],
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useImportCategoryRules(clientRef, 'user-1', t)
    );

    act(() => {
      result.current.onNewRuleKeywordChange('GRAB');
      result.current.onNewRuleCategoryChange('needs');
    });
    await act(async () => {
      await result.current.addRule();
    });

    expect(result.current.rules).toEqual([
      { id: 'r1', keyword: 'GRAB', category: 'needs' },
    ]);
    expect(result.current.newRuleKeyword).toBe('');
  });

  it('does not add a rule with a blank keyword', async () => {
    const { client, insertSelect } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useImportCategoryRules(clientRef, 'user-1', t)
    );

    await act(async () => {
      await result.current.addRule();
    });

    expect(insertSelect).not.toHaveBeenCalled();
    expect(result.current.rules).toEqual([]);
  });

  it('surfaces an error when adding a rule fails', async () => {
    const { client, insertSelect } = makeClient();
    insertSelect.mockResolvedValue({
      data: null,
      error: new Error('Failed to fetch'),
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useImportCategoryRules(clientRef, 'user-1', t)
    );

    act(() => {
      result.current.onNewRuleKeywordChange('GRAB');
    });
    await act(async () => {
      await result.current.addRule();
    });

    expect(result.current.ruleError).toBe('Failed to fetch');
    expect(result.current.rules).toEqual([]);
  });

  it('removes a rule via the shared client', async () => {
    const { client, selectResult, deleteEq } = makeClient();
    selectResult.mockResolvedValue({
      data: [{ id: 'r1', keyword: 'GRAB', category: 'needs' }],
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useImportCategoryRules(clientRef, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });
    expect(result.current.rules).toHaveLength(1);

    await act(async () => {
      await result.current.removeRule('r1');
    });

    expect(deleteEq).toHaveBeenCalledWith('id', 'r1');
    expect(result.current.rules).toEqual([]);
  });

  it('resets to no rules on clear', async () => {
    const { client, selectResult } = makeClient();
    selectResult.mockResolvedValue({
      data: [{ id: 'r1', keyword: 'GRAB', category: 'needs' }],
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() =>
      useImportCategoryRules(clientRef, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });
    expect(result.current.rules).toHaveLength(1);

    act(() => {
      result.current.clear();
    });

    expect(result.current.rules).toEqual([]);
  });
});
