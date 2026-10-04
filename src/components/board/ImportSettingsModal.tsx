'use client';

import { X } from 'lucide-react';

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
import type { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { PALETTE } from '@/utils/BoardConfig';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showImportSettings'
  | 'closeImportSettings'
  | 'ruleRows'
  | 'newRuleKeyword'
  | 'onNewRuleKeywordChange'
  | 'newRuleCategory'
  | 'onNewRuleCategoryChange'
  | 'addRule'
  | 'ruleError'
  | 'categoryChoices'
  | 'badgeColorsForm'
  | 'ownNamesForm'
  | 'onOwnNamesFormChange'
  | 'selectBadgeColor'
  | 'saveBadgeColors'
  | 'badgeColorsError'
>;

export const ImportSettingsModal = ({
  t,
  showImportSettings,
  closeImportSettings,
  ruleRows,
  newRuleKeyword,
  onNewRuleKeywordChange,
  newRuleCategory,
  onNewRuleCategoryChange,
  addRule,
  ruleError,
  categoryChoices,
  badgeColorsForm,
  ownNamesForm,
  onOwnNamesFormChange,
  selectBadgeColor,
  saveBadgeColors,
  badgeColorsError,
}: Props) => (
  <Dialog
    open={showImportSettings}
    onOpenChange={(open) => {
      if (!open) closeImportSettings();
    }}
  >
    <DialogContent closeLabel={t.closeLabel}>
      <DialogHeader>
        <DialogTitle>{t.importSettingsTitle}</DialogTitle>
      </DialogHeader>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">{t.categoryRulesTitle}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t.categoryRulesDesc}
        </p>

        {ruleRows.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {ruleRows.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-lg bg-muted py-1 pl-3 pr-1"
              >
                <div className="text-sm">
                  <span className="font-medium">{rule.keyword}</span>{' '}
                  <span className="text-muted-foreground">
                    → {rule.categoryName}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={rule.onRemove}
                  aria-label={t.removeRuleAria}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            type="text"
            value={newRuleKeyword}
            onChange={(e) => onNewRuleKeywordChange(e.target.value)}
            placeholder={t.categoryRuleKeywordPlaceholder}
            aria-label={t.categoryRuleKeywordPlaceholder}
            className="flex-1"
          />
          <Button onClick={addRule} disabled={!newRuleKeyword.trim()}>
            {t.addRuleBtn}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categoryChoices.map((choice) => {
            const selected = newRuleCategory === choice.id;
            return (
              <Button
                key={choice.id}
                variant="outline"
                size="xs"
                aria-pressed={selected}
                onClick={() => onNewRuleCategoryChange(choice.id)}
                className="border-2"
                style={
                  selected
                    ? {
                        background: choice.color,
                        borderColor: choice.color,
                        color: choice.dark,
                      }
                    : undefined
                }
              >
                {choice.name}
              </Button>
            );
          })}
        </div>

        {ruleError && <Alert variant="destructive">{ruleError}</Alert>}
      </section>

      <section className="flex flex-col gap-2">
        <Label htmlFor="own-names">{t.ownNamesTitle}</Label>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t.ownNamesDesc}
        </p>
        <Input
          id="own-names"
          type="text"
          value={ownNamesForm}
          onChange={(e) => onOwnNamesFormChange(e.target.value)}
          placeholder={t.ownNamesPlaceholder}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">{t.badgeColorsTitle}</h3>

        {(
          [
            ['needsReview', t.needsReviewColorLabel],
            ['source', t.sourceColorLabel],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="flex gap-2">
              {PALETTE.map((palette) => (
                <button
                  key={palette.color}
                  type="button"
                  aria-label={palette.color}
                  aria-pressed={badgeColorsForm[key].color === palette.color}
                  onClick={() => selectBadgeColor(key, palette)}
                  className="size-6 rounded-full border-2 border-popover outline-none focus-visible:ring focus-visible:ring-ring/50"
                  style={{
                    background: palette.color,
                    boxShadow:
                      badgeColorsForm[key].color === palette.color
                        ? `0 0 0 1.5px ${palette.color}`
                        : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        {badgeColorsError && (
          <Alert variant="destructive">{badgeColorsError}</Alert>
        )}
      </section>

      <Button size="lg" onClick={saveBadgeColors}>
        {t.saveImportSettingsBtn}
      </Button>
    </DialogContent>
  </Dialog>
);
