import { act, renderHook } from '@testing-library/react';

import { DEFAULT_PROFILE } from '@/utils/BoardConfig';

import { useProfile } from './useProfile';

describe('useProfile', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to DEFAULT_PROFILE', () => {
    const { result } = renderHook(() => useProfile('demo@example.com'));

    expect(result.current.profile).toEqual(DEFAULT_PROFILE);
  });

  it('should load a saved profile for the given email on demand', () => {
    localStorage.setItem(
      'msb_profile_demo@example.com',
      JSON.stringify({
        name: 'Ada',
        avatarColor: '#3B82F6',
        monthlyIncome: '50000',
      })
    );
    const { result } = renderHook(() => useProfile('demo@example.com'));

    act(() => {
      result.current.load('demo@example.com');
    });

    expect(result.current.profile.name).toBe('Ada');
  });

  it('should populate profileForm from the current profile when opening', () => {
    const { result } = renderHook(() => useProfile('demo@example.com'));

    act(() => {
      result.current.openProfile();
    });

    expect(result.current.showProfile).toBe(true);
    expect(result.current.profileForm).toEqual(result.current.profile);
  });

  it('should update name/income/avatar fields on the form only', () => {
    const { result } = renderHook(() => useProfile('demo@example.com'));

    act(() => {
      result.current.onProfileNameChange('Grace');
      result.current.onProfileIncomeChange('45000');
    });

    expect(result.current.profileForm.name).toBe('Grace');
    expect(result.current.profileForm.monthlyIncome).toBe('45000');
    expect(result.current.profile.name).toBe('');
  });

  it('should reflect the selected avatar color in avatarSwatches', () => {
    const { result } = renderHook(() => useProfile('demo@example.com'));

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

  it('should save the form, persist per-email, and close', () => {
    const { result } = renderHook(() => useProfile('demo@example.com'));

    act(() => {
      result.current.openProfile();
      result.current.onProfileNameChange('Ada');
    });

    act(() => {
      result.current.saveProfile();
    });

    expect(result.current.profile.name).toBe('Ada');
    expect(result.current.showProfile).toBe(false);
    expect(
      JSON.parse(localStorage.getItem('msb_profile_demo@example.com')!).name
    ).toBe('Ada');
  });
});
