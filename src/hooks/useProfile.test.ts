import { act, renderHook } from '@testing-library/react';

import { DEFAULT_PROFILE, I18N } from '@/utils/BoardConfig';

import { useProfile } from './useProfile';

const t = I18N.th;

const flush = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const makeClient = () => {
  const maybeSingle = jest.fn();
  const upsert = jest.fn().mockResolvedValue({ error: null });

  const client = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({ maybeSingle })),
      upsert,
    })),
  };

  return { client, maybeSingle, upsert };
};

describe('useProfile', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to DEFAULT_PROFILE', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useProfile(clientRef, 'user-1', t));

    expect(result.current.profile).toEqual(DEFAULT_PROFILE);
  });

  it('loads the profile column as-is when already migrated, without touching localStorage', async () => {
    const { client, maybeSingle, upsert } = makeClient();
    const saved = {
      name: 'Ada',
      avatarColor: '#3B82F6',
      monthlyIncome: '50000',
    };
    maybeSingle.mockResolvedValue({ data: { profile: saved }, error: null });
    localStorage.setItem(
      'msb_profile_demo@example.com',
      JSON.stringify({
        name: 'Stale',
        avatarColor: '#000',
        monthlyIncome: '1',
      })
    );
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useProfile(clientRef, 'user-1', t));

    await act(async () => {
      result.current.load(client as any, 'user-1', 'demo@example.com');
      await flush();
    });

    expect(result.current.profile).toEqual(saved);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('migrates an existing localStorage value into board_settings when the column is null', async () => {
    const { client, maybeSingle, upsert } = makeClient();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const legacy = {
      name: 'Grace',
      avatarColor: '#F59E0B',
      monthlyIncome: '45000',
    };
    localStorage.setItem(
      'msb_profile_demo@example.com',
      JSON.stringify(legacy)
    );
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useProfile(clientRef, 'user-1', t));

    await act(async () => {
      result.current.load(client as any, 'user-1', 'demo@example.com');
      await flush();
    });

    expect(result.current.profile).toEqual(legacy);
    expect(upsert).toHaveBeenCalledWith({ user_id: 'user-1', profile: legacy });
  });

  it('migrates to DEFAULT_PROFILE when the column is null and there is no localStorage value', async () => {
    const { client, maybeSingle, upsert } = makeClient();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useProfile(clientRef, 'user-1', t));

    await act(async () => {
      result.current.load(client as any, 'user-1', 'nobody@example.com');
      await flush();
    });

    expect(result.current.profile).toEqual(DEFAULT_PROFILE);
    expect(upsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      profile: DEFAULT_PROFILE,
    });
  });

  it('does not attempt to load without a resolved userId', async () => {
    const { client, maybeSingle } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useProfile(clientRef, 'user-1', t));

    await act(async () => {
      result.current.load(client as any, undefined, 'demo@example.com');
      await flush();
    });

    expect(maybeSingle).not.toHaveBeenCalled();
    expect(result.current.profile).toEqual(DEFAULT_PROFILE);
  });

  it('should populate profileForm from the current profile when opening', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useProfile(clientRef, 'user-1', t));

    act(() => {
      result.current.openProfile();
    });

    expect(result.current.showProfile).toBe(true);
    expect(result.current.profileForm).toEqual(result.current.profile);
  });

  it('should update name/income/avatar fields on the form only', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useProfile(clientRef, 'user-1', t));

    act(() => {
      result.current.onProfileNameChange('Grace');
      result.current.onProfileIncomeChange('45000');
    });

    expect(result.current.profileForm.name).toBe('Grace');
    expect(result.current.profileForm.monthlyIncome).toBe('45000');
    expect(result.current.profile.name).toBe('');
  });

  it('should reflect the selected avatar color in avatarSwatches', () => {
    const { client } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useProfile(clientRef, 'user-1', t));

    act(() => {
      result.current.avatarSwatches[1]!.onSelect();
    });

    expect(result.current.profileForm.avatarColor).toBe(
      result.current.avatarSwatches[1]!.color
    );
    expect(
      result.current.avatarSwatches.filter((s) => s.selected)
    ).toHaveLength(1);
  });

  it('should save the form, upsert to board_settings, and close', async () => {
    const { client, upsert } = makeClient();
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useProfile(clientRef, 'user-1', t));

    act(() => {
      result.current.openProfile();
      result.current.onProfileNameChange('Ada');
    });

    await act(async () => {
      await result.current.saveProfile();
    });

    expect(upsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      profile: { ...DEFAULT_PROFILE, name: 'Ada' },
    });
    expect(result.current.profile.name).toBe('Ada');
    expect(result.current.showProfile).toBe(false);
  });

  it('surfaces an error and keeps the modal open with edits intact when saving fails', async () => {
    const { client, upsert } = makeClient();
    upsert.mockResolvedValue({ error: new Error('Failed to fetch') });
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useProfile(clientRef, 'user-1', t));

    act(() => {
      result.current.openProfile();
      result.current.onProfileNameChange('Ada');
    });

    await act(async () => {
      await result.current.saveProfile();
    });

    expect(result.current.profileSaveError).toBe('Failed to fetch');
    expect(result.current.showProfile).toBe(true);
    expect(result.current.profileForm.name).toBe('Ada');
    expect(result.current.profile.name).toBe('');
  });

  it('resets to DEFAULT_PROFILE on clear', async () => {
    const { client, maybeSingle } = makeClient();
    maybeSingle.mockResolvedValue({
      data: {
        profile: { name: 'Ada', avatarColor: '#3B82F6', monthlyIncome: '1' },
      },
      error: null,
    });
    const clientRef = { current: client as any };
    const { result } = renderHook(() => useProfile(clientRef, 'user-1', t));

    await act(async () => {
      result.current.load(client as any, 'user-1', 'demo@example.com');
      await flush();
    });
    expect(result.current.profile).not.toEqual(DEFAULT_PROFILE);

    act(() => {
      result.current.clear();
    });

    expect(result.current.profile).toEqual(DEFAULT_PROFILE);
    expect(result.current.profileForm).toEqual(DEFAULT_PROFILE);
  });
});
