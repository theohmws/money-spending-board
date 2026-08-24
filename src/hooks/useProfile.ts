'use client';

import type { RefObject } from 'react';
import { useCallback, useMemo, useState } from 'react';

import type { BoardSupabaseClient } from '@/hooks/useAuthSession';
import type { I18nDict, Profile } from '@/utils/BoardConfig';
import { AVATAR_COLORS, DEFAULT_PROFILE } from '@/utils/BoardConfig';
import { loadBoardSettingField } from '@/utils/boardHelpers';

const profileKey = (email: string | undefined) => `msb_profile_${email}`;

// Supabase-backed (board_settings.profile), migrating once from the legacy
// msb_profile_<email> localStorage key on first load. See design.md
// Decisions 3-4 in
// openspec/changes/2026-08-24-migrate-profile-ratios-categorymeta-to-supabase.
export const useProfile = (
  clientRef: RefObject<BoardSupabaseClient | null>,
  userId: string | undefined,
  t: I18nDict
) => {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [profileForm, setProfileForm] = useState<Profile>(DEFAULT_PROFILE);
  const [showProfile, setShowProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  const load = useCallback(
    (
      client: BoardSupabaseClient,
      currentUserId: string | undefined,
      currentEmail: string | undefined
    ) => {
      if (!currentUserId) return;
      loadBoardSettingField(
        client,
        currentUserId,
        'profile',
        profileKey(currentEmail),
        DEFAULT_PROFILE
      ).then(setProfile);
    },
    []
  );

  const clear = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setProfileForm(DEFAULT_PROFILE);
  }, []);

  const openProfile = useCallback(() => {
    setProfileForm(profile);
    setProfileSaveError(null);
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
  const saveProfile = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !userId) return;

    setProfileSaveError(null);
    try {
      const { error } = await client
        .from('board_settings')
        .upsert({ user_id: userId, profile: profileForm });
      if (error) throw error;
      setProfile(profileForm);
      setShowProfile(false);
    } catch (err) {
      setProfileSaveError(
        err instanceof Error ? err.message : t.profileSaveError
      );
    }
  }, [clientRef, profileForm, t, userId]);

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
    profileSaveError,
    load,
    clear,
  };
};
