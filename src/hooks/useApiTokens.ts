'use client';

import type { RefObject } from 'react';
import { useCallback, useState } from 'react';

import type { BoardSupabaseClient } from '@/hooks/useAuthSession';
import {
  apiTokenDisplayPrefix,
  generateApiToken,
  hashApiToken,
  shortcutEndpointUrl,
} from '@/utils/apiTokens';
import type { ApiToken, I18nDict } from '@/utils/BoardConfig';

const TOKEN_COLUMNS = 'id, name, token_prefix, created_at, last_used_at';

// Personal API tokens for the iOS Shortcuts endpoint. The plaintext token
// only ever lives in `revealedToken` until the user dismisses it; Supabase
// stores just its SHA-256 digest. See design.md in
// openspec/changes/2026-09-28-ios-shortcuts-transaction-api.
export const useApiTokens = (
  clientRef: RefObject<BoardSupabaseClient | null>,
  userId: string | undefined,
  t: I18nDict
) => {
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [apiTokenError, setApiTokenError] = useState<string | null>(null);
  const [creatingToken, setCreatingToken] = useState(false);

  const load = useCallback((client: BoardSupabaseClient) => {
    client
      .from('api_tokens')
      .select(TOKEN_COLUMNS)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setApiTokens(data as ApiToken[]);
      });
  }, []);

  const clear = useCallback(() => {
    setApiTokens([]);
    setRevealedToken(null);
    setNewTokenName('');
    setApiTokenError(null);
  }, []);

  const onNewTokenNameChange = useCallback(
    (value: string) => setNewTokenName(value),
    []
  );

  const createApiToken = useCallback(async () => {
    const client = clientRef.current;
    const name = newTokenName.trim();
    if (!client || !userId || !name) return;

    setApiTokenError(null);
    setCreatingToken(true);
    try {
      const token = generateApiToken();
      const { data, error } = await client
        .from('api_tokens')
        .insert({
          user_id: userId,
          name,
          token_hash: await hashApiToken(token),
          token_prefix: apiTokenDisplayPrefix(token),
        })
        .select(TOKEN_COLUMNS);
      if (error) throw error;

      const saved = data?.[0] as ApiToken | undefined;
      if (saved) setApiTokens((prev) => [saved, ...prev]);
      setRevealedToken(token);
      setNewTokenName('');
    } catch (err) {
      setApiTokenError(
        err instanceof Error ? err.message : t.apiTokenSaveError
      );
    } finally {
      setCreatingToken(false);
    }
  }, [clientRef, newTokenName, t, userId]);

  const revokeApiToken = useCallback(
    async (id: string) => {
      const client = clientRef.current;
      if (!client) return;

      setApiTokenError(null);
      try {
        const { error } = await client.from('api_tokens').delete().eq('id', id);
        if (error) throw error;
        setApiTokens((prev) => prev.filter((token) => token.id !== id));
      } catch (err) {
        setApiTokenError(
          err instanceof Error ? err.message : t.apiTokenDeleteError
        );
      }
    },
    [clientRef, t]
  );

  const dismissRevealedToken = useCallback(() => setRevealedToken(null), []);

  return {
    apiTokens,
    newTokenName,
    onNewTokenNameChange,
    revealedToken,
    dismissRevealedToken,
    apiTokenError,
    creatingToken,
    createApiToken,
    revokeApiToken,
    shortcutEndpoint: shortcutEndpointUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    load,
    clear,
  };
};
