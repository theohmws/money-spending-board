import type { ReactNode } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { AppConfig } from '@/utils/AppConfig';
import type { Palette } from '@/utils/BoardConfig';
import { PALETTES } from '@/utils/BoardConfig';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showProfile'
  | 'closeProfile'
  | 'profileForm'
  | 'onProfileNameChange'
  | 'onProfileIncomeChange'
  | 'avatarSwatches'
  | 'headerAvatarInitial'
  | 'saveProfile'
  | 'profileSaveError'
  | 'editSplitFromProfile'
  | 'openCategorySettings'
  | 'openImportSettings'
  | 'openApiTokens'
  | 'profileRatioLabel'
  | 'userEmail'
  | 'theme'
  | 'setTheme'
  | 'palette'
  | 'setPalette'
>;

// Light-mode theme hue of each Tinysoy palette, shown as the swatch.
const PALETTE_SWATCH: Record<Palette, string> = {
  edamame: 'oklch(0.5 0.13 140)',
  kuromame: 'oklch(0.24 0.012 70)',
  dry: 'oklch(0.5 0.035 80)',
  thuanao: 'oklch(0.52 0.12 55)',
};

const SettingRow = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action: ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2.5">
    <div className="min-w-0">
      <div className="text-sm font-medium">{title}</div>
      {description && (
        <div className="mt-0.5 text-xs text-muted-foreground">
          {description}
        </div>
      )}
    </div>
    {action}
  </div>
);

export const ProfileModal = ({
  t,
  showProfile,
  closeProfile,
  profileForm,
  onProfileNameChange,
  onProfileIncomeChange,
  avatarSwatches,
  headerAvatarInitial,
  saveProfile,
  profileSaveError,
  editSplitFromProfile,
  openCategorySettings,
  openImportSettings,
  openApiTokens,
  profileRatioLabel,
  userEmail,
  theme,
  setTheme,
  palette,
  setPalette,
}: Props) => (
  <Dialog
    open={showProfile}
    onOpenChange={(open) => {
      if (!open) closeProfile();
    }}
  >
    <DialogContent closeLabel={t.closeLabel}>
      <DialogHeader>
        <DialogTitle>{t.profileTitle}</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col items-center">
        <div
          className="flex size-16 items-center justify-center rounded-full text-2xl font-semibold text-white"
          style={{ background: profileForm.avatarColor }}
        >
          {headerAvatarInitial}
        </div>
        <div className="mt-3 flex gap-2">
          {avatarSwatches.map((swatch) => (
            <button
              key={swatch.color}
              type="button"
              aria-label={swatch.color}
              aria-pressed={swatch.selected}
              onClick={swatch.onSelect}
              className="size-6 rounded-full border-2 border-popover outline-none focus-visible:ring focus-visible:ring-ring/50"
              style={{
                background: swatch.color,
                boxShadow: swatch.selected
                  ? `0 0 0 1.5px ${swatch.color}`
                  : undefined,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-name">{t.name}</Label>
        <Input
          id="profile-name"
          type="text"
          value={profileForm.name}
          onChange={(e) => onProfileNameChange(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-sm font-medium leading-none">{t.email}</div>
        <div className="flex h-8 items-center rounded-lg bg-muted px-2.5 text-sm text-muted-foreground">
          {userEmail}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-income">{t.monthlyIncome}</Label>
        <Input
          id="profile-income"
          type="number"
          value={profileForm.monthlyIncome}
          onChange={(e) => onProfileIncomeChange(e.target.value)}
          placeholder="e.g. 30000"
        />
        <div className="text-xs text-muted-foreground">
          {t.monthlyIncomeHint}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SettingRow
          title={t.splitRatio}
          description={`${profileRatioLabel} · ${t.needsWantsSavings}`}
          action={
            <Button variant="ghost" size="sm" onClick={editSplitFromProfile}>
              {t.edit}
            </Button>
          }
        />
        <SettingRow
          title={t.categories}
          description={t.iconColorPerCategory}
          action={
            <Button variant="ghost" size="sm" onClick={openCategorySettings}>
              {t.edit}
            </Button>
          }
        />
        <SettingRow
          title={t.importSettingsEntryLabel}
          description={t.importSettingsEntryDesc}
          action={
            <Button variant="ghost" size="sm" onClick={openImportSettings}>
              {t.edit}
            </Button>
          }
        />
        <SettingRow
          title={t.apiTokensEntryLabel}
          description={t.apiTokensEntryDesc}
          action={
            <Button variant="ghost" size="sm" onClick={openApiTokens}>
              {t.edit}
            </Button>
          }
        />
        <SettingRow
          title={t.currency}
          action={
            <span className="text-sm text-muted-foreground">{t.thaiBaht}</span>
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium leading-none">{t.appearance}</div>
        <Tabs
          value={theme}
          onValueChange={(value) => setTheme(value as typeof theme)}
        >
          <TabsList>
            <TabsTrigger value="light">{t.light}</TabsTrigger>
            <TabsTrigger value="dark">{t.dark}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium leading-none">{t.paletteLabel}</div>
        <div className="grid grid-cols-2 gap-2">
          {PALETTES.map((name) => (
            <Button
              key={name}
              variant="outline"
              onClick={() => setPalette(name)}
              aria-pressed={palette === name}
              className={
                palette === name
                  ? 'justify-start border-primary ring-1 ring-primary'
                  : 'justify-start'
              }
            >
              <span
                className="size-3.5 rounded-full"
                style={{ background: PALETTE_SWATCH[name] }}
              />
              {t.paletteNames[name]}
            </Button>
          ))}
        </div>
      </div>

      {profileSaveError && (
        <Alert variant="destructive">{profileSaveError}</Alert>
      )}

      <Button size="lg" onClick={saveProfile}>
        {t.saveProfileBtn}
      </Button>

      {AppConfig.versionLabel && (
        <div className="text-center text-xs text-muted-foreground">
          {AppConfig.versionLabel}
        </div>
      )}
    </DialogContent>
  </Dialog>
);
