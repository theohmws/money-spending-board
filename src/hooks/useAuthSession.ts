'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { I18nDict } from '@/utils/BoardConfig';

export type BoardSession = {
  user: { email: string; id?: string };
};

type OnSessionResolved = (
  client: SupabaseClient,
  email: string | undefined,
  userId: string | undefined
) => void;

export const useAuthSession = (
  t: I18nDict,
  onSessionResolved: OnSessionResolved
) => {
  const clientRef = useRef<SupabaseClient | null>(null);
  const onSessionResolvedRef = useRef(onSessionResolved);

  useEffect(() => {
    onSessionResolvedRef.current = onSessionResolved;
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const configMissing = !supabaseUrl || !supabasePublishableKey;

  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<BoardSession | null>(null);

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!supabaseUrl || !supabasePublishableKey) {
      setBooting(false);
      return;
    }

    const client = createClient(supabaseUrl, supabasePublishableKey);
    clientRef.current = client;

    client.auth.getSession().then(({ data }) => {
      const nextSession = data.session
        ? {
            user: {
              email: data.session.user.email ?? '',
              id: data.session.user.id,
            },
          }
        : null;
      setSession(nextSession);
      setBooting(false);
      if (nextSession) {
        onSessionResolvedRef.current(
          client,
          nextSession.user.email,
          nextSession.user.id
        );
      }
    });

    client.auth.onAuthStateChange((_event, nextAuthSession) => {
      const nextSession = nextAuthSession
        ? {
            user: {
              email: nextAuthSession.user.email ?? '',
              id: nextAuthSession.user.id,
            },
          }
        : null;
      setSession(nextSession);
      if (nextSession) {
        onSessionResolvedRef.current(
          client,
          nextSession.user.email,
          nextSession.user.id
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAuthEmailChange = useCallback(
    (value: string) => setAuthForm((prev) => ({ ...prev, email: value })),
    []
  );
  const onAuthPasswordChange = useCallback(
    (value: string) => setAuthForm((prev) => ({ ...prev, password: value })),
    []
  );
  const toggleAuthMode = useCallback(() => {
    setAuthMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setAuthError('');
  }, []);

  const submitAuth = useCallback(async () => {
    const { email: formEmail, password } = authForm;
    if (!formEmail || !password) {
      setAuthError(t.enterEmailPassword);
      return;
    }
    const client = clientRef.current;
    if (!client) return;

    setAuthLoading(true);
    setAuthError('');
    try {
      const { data, error } =
        authMode === 'signin'
          ? await client.auth.signInWithPassword({
              email: formEmail,
              password,
            })
          : await client.auth.signUp({ email: formEmail, password });
      if (error) throw error;
      const nextSession = data.session
        ? {
            user: {
              email: data.session.user.email ?? '',
              id: data.session.user.id,
            },
          }
        : null;
      setSession(nextSession);
      setAuthLoading(false);
      if (nextSession) {
        onSessionResolvedRef.current(
          client,
          nextSession.user.email,
          nextSession.user.id
        );
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : t.authFailed);
      setAuthLoading(false);
    }
  }, [authForm, authMode, t]);

  const signInWithGoogle = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;

    setAuthLoading(true);
    setAuthError('');
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await clientRef.current?.auth.signOut();
    setSession(null);
  }, []);

  return {
    clientRef,
    booting,
    session,
    configMissing,

    authMode,
    authForm,
    authError,
    authLoading,
    onAuthEmailChange,
    onAuthPasswordChange,
    toggleAuthMode,
    submitAuth,
    signInWithGoogle,
    signOut,
  };
};
