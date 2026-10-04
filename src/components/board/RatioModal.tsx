import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showRatioModal'
  | 'closeRatioModal'
  | 'ratioRows'
  | 'ratioSum'
  | 'saveRatios'
  | 'ratiosSaveError'
>;

export const RatioModal = ({
  t,
  showRatioModal,
  closeRatioModal,
  ratioRows,
  ratioSum,
  saveRatios,
  ratiosSaveError,
}: Props) => {
  const isBalanced = ratioSum === 100;

  return (
    <Dialog
      open={showRatioModal}
      onOpenChange={(open) => {
        if (!open) closeRatioModal();
      }}
    >
      <DialogContent closeLabel={t.closeLabel}>
        <DialogHeader>
          <DialogTitle>{t.adjustSplit}</DialogTitle>
          <DialogDescription>{t.splitDesc}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {ratioRows.map((row) => (
            <div key={row.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="size-2.5 rounded-sm"
                    style={{ background: row.color }}
                  />
                  <span className="text-sm font-medium">{row.name}</span>
                </div>
                <Input
                  type="number"
                  value={row.value}
                  onChange={(e) => row.onChange(Number(e.target.value))}
                  min={0}
                  max={100}
                  aria-label={row.name}
                  className="w-16 text-right"
                />
              </div>
              <input
                type="range"
                value={row.value}
                onChange={(e) => row.onChange(Number(e.target.value))}
                min={0}
                max={100}
                aria-label={row.name}
                className="mt-2 w-full"
                style={{ accentColor: row.color }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t.total}</span>
          <span
            className={`text-base font-semibold tabular-nums ${
              isBalanced ? 'text-primary' : 'text-destructive'
            }`}
          >
            {ratioSum}%
          </span>
        </div>

        {ratiosSaveError && (
          <Alert variant="destructive">{ratiosSaveError}</Alert>
        )}

        <Button size="lg" onClick={saveRatios} disabled={!isBalanced}>
          {t.saveSplit}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
