'use client';

import { useCallback, useMemo, useState } from 'react';

import type { Profile } from '@/utils/BoardConfig';
import { AVATAR_COLORS, DEFAULT_PROFILE } from '@/utils/BoardConfig';
import { readJSON } from '@/utils/boardHelpers';

const profileKey = (email: string | undefined) => `msb_profile_${email}`;

export const useProfile = (email: string | undefined) => {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [profileForm, setProfileForm] = useState<Profile>(DEFAULT_PROFILE);
  const [showProfile, setShowProfile] = useState(false);

  const load = useCallback((currentEmail: string | undefined) => {
    setProfile(readJSON<Profile>(profileKey(currentEmail)) ?? DEFAULT_PROFILE);
  }, []);

  const openProfile = useCallback(() => {
    setProfileForm(profile);
    setShowProfile(true);
  }, [profile]);
  const closeProfile = useCallback(() => setShowProfile(false), []);
  const onProfileNameChange = useCallback(
    (value: string) => setProfileForm((prev) => ({ ...prev, name: value })),
    []
  );
  const onProfileIncomeChange = useCallback(
    (value: string) =>
      setProfileForm((prev) => ({ ...prev, monthlyIncome: value })),
    []
  );
  const selectAvatarColor = useCallback(
    (color: string) =>
      setProfileForm((prev) => ({ ...prev, avatarColor: color })),
    []
  );
  const saveProfile = useCallback(() => {
    localStorage.setItem(profileKey(email), JSON.stringify(profileForm));
    setProfile(profileForm);
    setShowProfile(false);
  }, [email, profileForm]);

  const avatarSwatches = useMemo(
    () =>
      AVATAR_COLORS.map((color) => ({
        color,
        selected: profileForm.avatarColor === color,
        onSelect: () => selectAvatarColor(color),
      })),
    [profileForm.avatarColor, selectAvatarColor]
  );

  return {
    profile,
    profileForm,
    showProfile,
    openProfile,
    closeProfile,
    onProfileNameChange,
    onProfileIncomeChange,
    avatarSwatches,
    saveProfile,
    load,
  };
};
