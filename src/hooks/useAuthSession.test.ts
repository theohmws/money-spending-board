import { act, renderHook, waitFor } from '@testing-library/react';

import { I18N } from '@/utils/BoardConfig';

import { useAuthSession } from './useAuthSession';

const mockSession = {
  user: { email: 'demo@example.com', id: 'user-1' },
};

const mockAuth = {
  getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
  onAuthStateChange: jest.fn().mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  }),
  signInWithPassword: jest
    .fn()
    .mockResolvedValue({ data: { session: mockSession }, error: null }),
  signUp: jest
    .fn()
    .mockResolvedValue({ data: { session: mockSession }, error: null }),
  signInWithOAuth: jest.fn().mockResolvedValue({ error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ auth: mockAuth })),
}));

const t = I18N.th;

describe('useAuthSession', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const originalProviders = process.env.NEXT_PUBLIC_SUPABASE_AUTH_PROVIDERS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.getSession.mockResolvedValue({ data: { session: null } });
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-key';
    delete process.env.NEXT_PUBLIC_SUPABASE_AUTH_PROVIDERS;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
    process.env.NEXT_PUBLIC_SUPABASE_AUTH_PROVIDERS = originalProviders;
  });

  it('should report configMissing when env vars are absent', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const onSessionResolved = jest.fn();

    const { result } = renderHook(() => useAuthSession(t, onSessionResolved));

    await waitFor(() => expect(result.current.booting).toBe(false));
    expect(result.current.configMissing).toBe(true);
  });

  it('should settle booting with no session when none is stored', async () => {
    const onSessionResolved = jest.fn();

    const { result } = renderHook(() => useAuthSession(t, onSessionResolved));

    await waitFor(() => expect(result.current.booting).toBe(false));
    expect(result.current.session).toBeNull();
    expect(onSessionResolved).not.toHaveBeenCalled();
  });

  it('should restore a stored session and call onSessionResolved', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: mockSession } });
    const onSessionResolved = jest.fn();

    const { result } = renderHook(() => useAuthSession(t, onSessionResolved));

    await waitFor(() => expect(result.current.session).not.toBeNull());
    expect(result.current.session?.user.email).toBe('demo@example.com');
    expect(onSessionResolved).toHaveBeenCalledWith(
      expect.anything(),
      'demo@example.com',
      'user-1'
    );
  });

  it('should reject submitAuth with empty email/password', async () => {
    const onSessionResolved = jest.fn();
    const { result } = renderHook(() => useAuthSession(t, onSessionResolved));
    await waitFor(() => expect(result.current.booting).toBe(false));

    await act(async () => {
      await result.current.submitAuth();
    });

    expect(result.current.authError).toBe(t.enterEmailPassword);
    expect(mockAuth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('should sign in and call onSessionResolved on success', async () => {
    const onSessionResolved = jest.fn();
    const { result } = renderHook(() => useAuthSession(t, onSessionResolved));
    await waitFor(() => expect(result.current.booting).toBe(false));

    act(() => {
      result.current.onAuthEmailChange('demo@example.com');
      result.current.onAuthPasswordChange('password123');
    });

    await act(async () => {
      await result.current.submitAuth();
    });

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'demo@example.com',
      password: 'password123',
    });
    expect(result.current.session?.user.email).toBe('demo@example.com');
    expect(result.current.authLoading).toBe(false);
    expect(onSessionResolved).toHaveBeenCalledWith(
      expect.anything(),
      'demo@example.com',
      'user-1'
    );
  });

  it('should surface an error message when sign-in fails', async () => {
    mockAuth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null },
      error: new Error('Invalid credentials'),
    });
    const onSessionResolved = jest.fn();
    const { result } = renderHook(() => useAuthSession(t, onSessionResolved));
    await waitFor(() => expect(result.current.booting).toBe(false));

    act(() => {
      result.current.onAuthEmailChange('demo@example.com');
      result.current.onAuthPasswordChange('wrong');
    });

    await act(async () => {
      await result.current.submitAuth();
    });

    expect(result.current.authError).toBe('Invalid credentials');
    expect(result.current.authLoading).toBe(false);
  });

  it('should default oauthProviders to google when the env var is unset', async () => {
    const onSessionResolved = jest.fn();
    const { result } = renderHook(() => useAuthSession(t, onSessionResolved));
    await waitFor(() => expect(result.current.booting).toBe(false));

    expect(result.current.oauthProviders).toEqual(['google']);
  });

  it('should parse a comma-separated provider list from the env var', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_AUTH_PROVIDERS = 'google, github ,gitlab';
    const onSessionResolved = jest.fn();
    const { result } = renderHook(() => useAuthSession(t, onSessionResolved));
    await waitFor(() => expect(result.current.booting).toBe(false));

    expect(result.current.oauthProviders).toEqual([
      'google',
      'github',
      'gitlab',
    ]);
  });

  it('should return no oauthProviders when the env var is set empty', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_AUTH_PROVIDERS = '';
    const onSessionResolved = jest.fn();
    const { result } = renderHook(() => useAuthSession(t, onSessionResolved));
    await waitFor(() => expect(result.current.booting).toBe(false));

    expect(result.current.oauthProviders).toEqual([]);
  });

  it('should call signInWithOAuth with the current origin as redirectTo', async () => {
    const onSessionResolved = jest.fn();
    const { result } = renderHook(() => useAuthSession(t, onSessionResolved));
    await waitFor(() => expect(result.current.booting).toBe(false));

    await act(async () => {
      await result.current.signInWithOAuth('google');
    });

    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    // authLoading is deliberately left true on success — the browser
    // navigates away for the OAuth redirect, so there's nothing to reset.
    expect(result.current.authLoading).toBe(true);
  });

  it('should surface an error message when signInWithOAuth fails', async () => {
    mockAuth.signInWithOAuth.mockResolvedValueOnce({
      error: new Error('OAuth provider misconfigured'),
    });
    const onSessionResolved = jest.fn();
    const { result } = renderHook(() => useAuthSession(t, onSessionResolved));
    await waitFor(() => expect(result.current.booting).toBe(false));

    await act(async () => {
      await result.current.signInWithOAuth('google');
    });

    expect(result.current.authError).toBe('OAuth provider misconfigured');
    expect(result.current.authLoading).toBe(false);
  });

  it('should sign out and clear the session', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: mockSession } });
    const onSessionResolved = jest.fn();
    const { result } = renderHook(() => useAuthSession(t, onSessionResolved));
    await waitFor(() => expect(result.current.session).not.toBeNull());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockAuth.signOut).toHaveBeenCalled();
    expect(result.current.session).toBeNull();
  });
});
