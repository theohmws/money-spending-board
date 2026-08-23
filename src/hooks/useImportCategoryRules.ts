'use client';

import type { RefObject } from 'react';
import { useCallback, useState } from 'react';

import type { BoardSupabaseClient } from '@/hooks/useAuthSession';
import type {
  CategoryId,
  I18nDict,
  ImportCategoryRule,
} from '@/utils/BoardConfig';

// A per-user, Supabase-backed merchant-keyword -> category mapping used to
// auto-guess a category for imported rows. Deliberately DB-backed rather
// than localStorage (unlike ratios/profile/categoryMeta) so it follows the
// user across devices — see design.md Decision 7 in
// openspec/changes/2026-08-23-import-ktc-credit-card-statement.
export const useImportCategoryRules = (
  clientRef: RefObject<BoardSupabaseClient | null>,
  userId: string | undefined,
  t: I18nDict
) => {
  const [rules, setRules] = useState<ImportCategoryRule[]>([]);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<CategoryId>('wants');

  const load = useCallback((client: BoardSupabaseClient) => {
    client
      .from('import_category_rules')
      .select('id, keyword, category')
      .then(({ data, error }) => {
        if (!error && data) setRules(data as ImportCategoryRule[]);
      });
  }, []);

  const clear = useCallback(() => setRules([]), []);

  const onNewRuleKeywordChange = useCallback(
    (value: string) => setNewRuleKeyword(value),
    []
  );
  const onNewRuleCategoryChange = useCallback(
    (category: CategoryId) => setNewRuleCategory(category),
    []
  );

  const addRule = useCallback(async () => {
    const client = clientRef.current;
    const keyword = newRuleKeyword.trim();
    if (!client || !userId || !keyword) return;

    setRuleError(null);
    try {
      const { data, error } = await client
        .from('import_category_rules')
        .insert({ keyword, category: newRuleCategory, user_id: userId })
        .select('id, keyword, category');
      if (error) throw error;

      const saved = data?.[0] as ImportCategoryRule | undefined;
      if (saved) setRules((prev) => [...prev, saved]);
      setNewRuleKeyword('');
    } catch (err) {
      setRuleError(
        err instanceof Error ? err.message : t.categoryRuleSaveError
      );
    }
  }, [clientRef, newRuleCategory, newRuleKeyword, t, userId]);

  const removeRule = useCallback(
    async (id: string) => {
      const client = clientRef.current;
      if (!client) return;

      setRuleError(null);
      try {
        const { error } = await client
          .from('import_category_rules')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setRules((prev) => prev.filter((rule) => rule.id !== id));
      } catch (err) {
        setRuleError(
          err instanceof Error ? err.message : t.categoryRuleDeleteError
        );
      }
    },
    [clientRef, t]
  );

  // Longest keyword first, so a more specific rule (e.g. "STARBUCKS
  // RESERVE") wins over a shorter one that would also match ("STARBUCKS").
  const guessCategory = useCallback(
    (description: string): CategoryId => {
      const upper = description.toUpperCase();
      const match = [...rules]
        .sort((a, b) => b.keyword.length - a.keyword.length)
        .find((rule) => upper.includes(rule.keyword.toUpperCase()));
      return match?.category ?? 'wants';
    },
    [rules]
  );

  return {
    rules,
    ruleError,
    newRuleKeyword,
    onNewRuleKeywordChange,
    newRuleCategory,
    onNewRuleCategoryChange,
    addRule,
    removeRule,
    guessCategory,
    load,
    clear,
  };
};
