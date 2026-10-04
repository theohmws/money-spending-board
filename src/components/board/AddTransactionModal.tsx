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

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'showAddModal'
  | 'editingTxId'
  | 'closeAddModal'
  | 'txType'
  | 'setTxType'
  | 'txForm'
  | 'onTxAmountChange'
  | 'onTxNoteChange'
  | 'onTxDateChange'
  | 'categoryOptions'
  | 'saveTransaction'
  | 'saveError'
  | 'isOnline'
>;

export const AddTransactionModal = ({
  t,
  showAddModal,
  editingTxId,
  closeAddModal,
  txType,
  setTxType,
  txForm,
  onTxAmountChange,
  onTxNoteChange,
  onTxDateChange,
  categoryOptions,
  saveTransaction,
  saveError,
  isOnline,
}: Props) => {
  const isExpense = txType === 'expense';
  const isEditing = editingTxId !== null;

  return (
    <Dialog
      open={showAddModal}
      onOpenChange={(open) => {
        if (!open) closeAddModal();
      }}
    >
      <DialogContent closeLabel={t.closeLabel}>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t.editTransaction : t.addTransaction}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={txType}
          onValueChange={(value) => setTxType(value as typeof txType)}
        >
          <TabsList>
            <TabsTrigger value="expense">{t.expense}</TabsTrigger>
            <TabsTrigger value="income">{t.income}</TabsTrigger>
            <TabsTrigger value="transfer">{t.transfer}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tx-amount">{t.amount}</Label>
          <Input
            id="tx-amount"
            type="number"
            value={txForm.amount}
            onChange={(e) => onTxAmountChange(e.target.value)}
            placeholder="0.00"
            className="h-10 text-lg tabular-nums"
          />
        </div>

        {isExpense && (
          <div className="flex flex-col gap-1.5">
            <div className="text-sm font-medium leading-none">{t.category}</div>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  size="sm"
                  onClick={option.onSelect}
                  aria-pressed={option.selected}
                  className="border-2"
                  style={
                    option.selected
                      ? {
                          background: option.color,
                          borderColor: option.color,
                          color: option.dark,
                        }
                      : undefined
                  }
                >
                  {option.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tx-note">{t.note}</Label>
          <Input
            id="tx-note"
            type="text"
            value={txForm.note}
            onChange={(e) => onTxNoteChange(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tx-date">{t.date}</Label>
          <Input
            id="tx-date"
            type="date"
            value={txForm.date}
            onChange={(e) => onTxDateChange(e.target.value)}
          />
        </div>

        {(saveError || !isOnline) && (
          <Alert variant="destructive">
            {isOnline ? saveError : t.offlineBanner}
          </Alert>
        )}

        <Button size="lg" onClick={saveTransaction} disabled={!isOnline}>
          {isEditing ? t.updateTransactionBtn : t.saveTransactionBtn}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
