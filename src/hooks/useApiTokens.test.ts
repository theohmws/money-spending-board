import { act, renderHook } from '@testing-library/react';

import { I18N } from '@/utils/BoardConfig';

import { useApiTokens } from './useApiTokens';

jest.mock('@/utils/apiTokens', () => ({
  ...jest.requireActual('@/utils/apiTokens'),
  generateApiToken: () => 'msb_plaintextSecretToken',
  hashApiToken: async () => 'a'.repeat(64),
}));

const t = I18N.en;

const makeClient = () => {
  const insert = jest.fn();
  const insertSelect = jest.fn();
  const deleteEq = jest.fn().mockResolvedValue({ error: null });
  const order = jest.fn();

  const client = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({ order })),
      insert: jest.fn((row) => {
        insert(row);
        return { select: insertSelect };
      }),
      delete: jest.fn(() => ({ eq: deleteEq })),
    })),
  };

  return { client, insert, insertSelect, deleteEq, order };
};

const token = {
  id: 'tok-1',
  name: 'iPhone',
  token_prefix: 'msb_plaint',
  created_at: '2026-09-28T00:00:00Z',
  last_used_at: null,
};

describe('useApiTokens', () => {
  it('loads tokens from the shared client', async () => {
    const { client, order } = makeClient();
    order.mockResolvedValue({ data: [token], error: null });
    const { result } = renderHook(() =>
      useApiTokens({ current: client as any }, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });

    expect(client.from).toHaveBeenCalledWith('api_tokens');
    expect(result.current.apiTokens).toEqual([token]);
  });

  it('stores only the hash and reveals the plaintext once', async () => {
    const { client, insert, insertSelect } = makeClient();
    insertSelect.mockResolvedValue({ data: [token], error: null });
    const { result } = renderHook(() =>
      useApiTokens({ current: client as any }, 'user-1', t)
    );

    act(() => result.current.onNewTokenNameChange('  iPhone '));
    await act(async () => {
      await result.current.createApiToken();
    });

    expect(insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      name: 'iPhone',
      token_hash: 'a'.repeat(64),
      token_prefix: 'msb_plaint',
    });
    expect(JSON.stringify(insert.mock.calls)).not.toContain(
      'msb_plaintextSecretToken'
    );
    expect(result.current.revealedToken).toBe('msb_plaintextSecretToken');
    expect(result.current.apiTokens).toEqual([token]);
    expect(result.current.newTokenName).toBe('');

    act(() => result.current.dismissRevealedToken());
    expect(result.current.revealedToken).toBeNull();
  });

  it('does nothing without a name', async () => {
    const { client, insert } = makeClient();
    const { result } = renderHook(() =>
      useApiTokens({ current: client as any }, 'user-1', t)
    );

    await act(async () => {
      await result.current.createApiToken();
    });

    expect(insert).not.toHaveBeenCalled();
  });

  it('surfaces an insert error and reveals nothing', async () => {
    const { client, insertSelect } = makeClient();
    insertSelect.mockResolvedValue({ data: null, error: new Error('boom') });
    const { result } = renderHook(() =>
      useApiTokens({ current: client as any }, 'user-1', t)
    );

    act(() => result.current.onNewTokenNameChange('iPhone'));
    await act(async () => {
      await result.current.createApiToken();
    });

    expect(result.current.apiTokenError).toBe('boom');
    expect(result.current.revealedToken).toBeNull();
  });

  it('revokes a token', async () => {
    const { client, order, deleteEq } = makeClient();
    order.mockResolvedValue({ data: [token], error: null });
    const { result } = renderHook(() =>
      useApiTokens({ current: client as any }, 'user-1', t)
    );

    await act(async () => {
      result.current.load(client as any);
      await Promise.resolve();
    });
    await act(async () => {
      await result.current.revokeApiToken('tok-1');
    });

    expect(deleteEq).toHaveBeenCalledWith('id', 'tok-1');
    expect(result.current.apiTokens).toEqual([]);
  });
});
