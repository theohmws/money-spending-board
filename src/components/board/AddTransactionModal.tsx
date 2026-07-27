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
  | 'themeTokens'
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
  themeTokens,
}: Props) => {
  if (!showAddModal) return null;

  const isExpense = txType === 'expense';
  const isEditing = editingTxId !== null;

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center"
      style={{ background: 'rgba(15,20,17,0.45)' }}
    >
      <div
        className="max-h-[85vh] w-[430px] max-w-full overflow-y-auto rounded-t-3xl px-6 pb-7.5 pt-6.5"
        style={{ background: themeTokens.cardBg }}
      >
        <div className="flex items-center justify-between">
          <div
            className="font-manrope text-lg font-extrabold"
            style={{ color: themeTokens.text }}
          >
            {isEditing ? t.editTransaction : t.addTransaction}
          </div>
          <button
            type="button"
            onClick={closeAddModal}
            className="flex size-7.5 items-center justify-center rounded-[9px] text-base"
            style={{
              background: themeTokens.chipBg,
              color: themeTokens.chipText,
            }}
          >
            ×
          </button>
        </div>

        <div
          className="mt-5 flex gap-2 rounded-[11px] p-1"
          style={{ background: themeTokens.chipBg }}
        >
          <button
            type="button"
            onClick={() => setTxType('expense')}
            className="flex-1 rounded-lg p-2.5 text-[13.5px] font-semibold"
            style={{
              background: isExpense ? '#132119' : 'transparent',
              color: isExpense ? '#EFFCF4' : themeTokens.label,
            }}
          >
            {t.expense}
          </button>
          <button
            type="button"
            onClick={() => setTxType('income')}
            className="flex-1 rounded-lg p-2.5 text-[13.5px] font-semibold"
            style={{
              background: !isExpense ? '#132119' : 'transparent',
              color: !isExpense ? '#EFFCF4' : themeTokens.label,
            }}
          >
            {t.income}
          </button>
        </div>

        <div className="mt-4.5">
          <label
            htmlFor="tx-amount"
            className="text-[12.5px] font-semibold"
            style={{ color: themeTokens.label }}
          >
            {t.amount}
          </label>
          <input
            id="tx-amount"
            type="number"
            value={txForm.amount}
            onChange={(e) => onTxAmountChange(e.target.value)}
            placeholder="0.00"
            className="mt-1.5 w-full rounded-xl border px-3.5 py-3 text-[17px]"
            style={{
              borderColor: themeTokens.inputBorder,
              color: themeTokens.text,
              background: themeTokens.inputBg,
            }}
          />
        </div>

        {isExpense && (
          <div className="mt-3.5">
            <div
              className="text-[12.5px] font-semibold"
              style={{ color: themeTokens.label }}
            >
              {t.category}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={option.onSelect}
                  className="rounded-[9px] border-[1.5px] px-3 py-2 text-[13px] font-semibold"
                  style={{
                    borderColor: option.selected
                      ? option.color
                      : themeTokens.inputBorder,
                    background: option.selected
                      ? option.color
                      : themeTokens.cardBg,
                    color: option.selected ? option.dark : themeTokens.chipText,
                  }}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3.5">
          <label
            htmlFor="tx-note"
            className="text-[12.5px] font-semibold"
            style={{ color: themeTokens.label }}
          >
            {t.note}
          </label>
          <input
            id="tx-note"
            type="text"
            value={txForm.note}
            onChange={(e) => onTxNoteChange(e.target.value)}
            placeholder="Optional"
            className="mt-1.5 w-full rounded-xl border px-3.5 py-3 text-[14.5px]"
            style={{
              borderColor: themeTokens.inputBorder,
              color: themeTokens.text,
              background: themeTokens.inputBg,
            }}
          />
        </div>

        <div className="mt-3.5">
          <label
            htmlFor="tx-date"
            className="text-[12.5px] font-semibold"
            style={{ color: themeTokens.label }}
          >
            {t.date}
          </label>
          <input
            id="tx-date"
            type="date"
            value={txForm.date}
            onChange={(e) => onTxDateChange(e.target.value)}
            className="mt-1.5 w-full rounded-xl border px-3.5 py-3 text-[14.5px]"
            style={{
              borderColor: themeTokens.inputBorder,
              color: themeTokens.text,
              background: themeTokens.inputBg,
            }}
          />
        </div>

        <button
          type="button"
          onClick={saveTransaction}
          className="mt-5.5 w-full rounded-xl p-4 text-[15px] font-bold"
          style={{ background: '#132119', color: '#EFFCF4' }}
        >
          {isEditing ? t.updateTransactionBtn : t.saveTransactionBtn}
        </button>
      </div>
    </div>
  );
};
