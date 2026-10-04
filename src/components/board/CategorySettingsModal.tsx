import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showCategorySettings'
  | 'closeCategorySettings'
  | 'categorySettingsRows'
  | 'saveCategoryMeta'
  | 'categoryMetaSaveError'
>;

export const CategorySettingsModal = ({
  t,
  showCategorySettings,
  closeCategorySettings,
  categorySettingsRows,
  saveCategoryMeta,
  categoryMetaSaveError,
}: Props) => (
  <Dialog
    open={showCategorySettings}
    onOpenChange={(open) => {
      if (!open) closeCategorySettings();
    }}
  >
    <DialogContent closeLabel={t.closeLabel}>
      <DialogHeader>
        <DialogTitle>{t.categoryIconsColors}</DialogTitle>
        <DialogDescription>{t.categoryIconsDesc}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        {categorySettingsRows.map((row) => (
          <div key={row.id} className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2.5">
              <div
                className="flex size-8 items-center justify-center rounded-md"
                style={{ background: row.color, color: row.dark }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={row.iconPath} />
                </svg>
              </div>
              <div className="text-sm font-medium">{row.name}</div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {row.iconOptions.map((icon) => (
                <Button
                  key={icon.id}
                  variant={icon.selected ? 'default' : 'outline'}
                  size="icon"
                  aria-label={icon.id}
                  aria-pressed={icon.selected}
                  onClick={icon.onSelect}
                  style={
                    icon.selected
                      ? { background: row.color, color: row.dark }
                      : undefined
                  }
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={icon.d} />
                  </svg>
                </Button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              {row.paletteOptions.map((palette) => (
                <button
                  key={palette.color}
                  type="button"
                  aria-label={palette.color}
                  aria-pressed={palette.selected}
                  onClick={palette.onSelect}
                  className="size-6 rounded-full border-2 border-muted outline-none focus-visible:ring focus-visible:ring-ring/50"
                  style={{
                    background: palette.color,
                    boxShadow: palette.selected
                      ? `0 0 0 1.5px ${palette.color}`
                      : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {categoryMetaSaveError && (
        <Alert variant="destructive">{categoryMetaSaveError}</Alert>
      )}

      <Button size="lg" onClick={saveCategoryMeta}>
        {t.saveCategories}
      </Button>
    </DialogContent>
  </Dialog>
);
