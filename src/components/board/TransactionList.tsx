import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  't' | 'transactionRows' | 'themeTokens'
>;

export const TransactionList = ({ t, transactionRows, themeTokens }: Props) => (
  <div>
    <div className="mt-7.5 flex items-center justify-between">
      <div
        className="font-manrope text-[15px] font-bold"
        style={{ color: themeTokens.text }}
      >
        {t.recentActivity}
      </div>
    </div>

    <div className="mt-2.5 flex flex-col">
      {transactionRows.length === 0 && (
        <div
          className="py-7.5 text-center text-[13.5px]"
          style={{ color: themeTokens.subtext3 }}
        >
          {t.noTransactionsYet}
        </div>
      )}
      {transactionRows.map((tx) => (
        <div
          key={tx.id}
          role="button"
          tabIndex={0}
          onClick={tx.onEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              tx.onEdit();
            }
          }}
          className="flex cursor-pointer items-center gap-3 border-b py-3 text-left"
          style={{ borderColor: themeTokens.divider }}
        >
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] font-manrope text-[13px] font-bold text-white"
            style={{ background: tx.color }}
          >
            {tx.initial}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-sm font-semibold"
              style={{ color: themeTokens.text }}
            >
              {tx.title}
            </div>
            <div
              className="mt-0.5 text-xs"
              style={{ color: themeTokens.subtext2 }}
            >
              {tx.dateLabel}
            </div>
          </div>
          <div
            className="text-[14.5px] font-bold"
            style={{ color: tx.amountColor }}
          >
            {tx.amountLabel}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              tx.onDelete();
            }}
            className="px-0.5 py-1 text-base"
            style={{ color: themeTokens.subtext2 }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  </div>
);
