'use client';

import type { MutableRefObject } from 'react';
import { useEffect, useState } from 'react';

import type { BoardSupabaseClient } from '@/hooks/useAuthSession';

// `null` means the count is below its display minimum, so the card is hidden.
export type PublicStats = {
  users: number | null;
  transactions: number | null;
};

const isPublicStats = (value: unknown): value is PublicStats => {
  const stats = value as PublicStats | null;
  const isCount = (n: unknown) => n === null || typeof n === 'number';
  return !!stats && isCount(stats.users) && isCount(stats.transactions);
};

// Fetches the landing page's aggregate counts once `enabled` flips on.
// Any failure (function not deployed yet, offline, …) leaves `stats` null
// and the landing page simply hides the stat block.
export const usePublicStats = (
  clientRef: MutableRefObject<BoardSupabaseClient | null>,
  enabled: boolean
) => {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    const client = clientRef.current;
    if (!enabled || !client) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await client.rpc('public_stats');
        if (!cancelled && !error && isPublicStats(data)) setStats(data);
      } catch {
        // stats are decorative; ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientRef, enabled]);

  return stats;
};
