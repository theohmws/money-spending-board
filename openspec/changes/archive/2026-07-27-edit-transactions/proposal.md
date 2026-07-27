## Why

Transactions can only be added or deleted today — fixing a typo in a note, a wrong amount, or the wrong category means deleting the row and re-entering it from scratch. The backend already supports this (the `spending_board.transactions` RLS policy set includes a proper `UPDATE` policy scoped to `auth.uid() = user_id`), so this is purely a client-side gap.

## What Changes

- Tapping a transaction row (outside the delete `×`) opens the existing add/edit bottom-sheet modal, prefilled with that transaction's values.
- `saveTransaction` branches on whether an edit is in progress: `UPDATE ... WHERE id = editingTxId` instead of `INSERT`.
- Modal title and submit button label reflect add vs. edit mode (reusing the existing generic `t.edit` string plus a new submit-label string).
- Local `transactions` state is reconciled by replacing the edited row in place, not by prepending (as insert does today).
- Transaction `type` (expense/income) remains editable during edit — the modal is fully reused as-is, no field is locked.

## Capabilities

### New Capabilities
- `transaction-editing`: covers editing an existing transaction (entry point, prefill behavior, persistence, local state reconciliation).

### Modified Capabilities
(none — `spending-board-state`'s requirements about composition-root architecture aren't changing; this only adds new hook behavior inside the existing `useTransactions` slice)

## Impact

- `src/hooks/useTransactions.ts`: new `editingTxId` state, `openEditModal(tx)`, `saveTransaction` insert/update branch, local-state reconciliation.
- `src/components/board/TransactionList.tsx`: row becomes clickable (excluding the delete button).
- `src/components/board/AddTransactionModal.tsx`: title/button label swap based on edit mode.
- `src/utils/BoardConfig.ts`: one new i18n string (submit button label for edit mode), both `th`/`en`.
- No database migration, no RLS change — `spending_board.transactions`'s existing `UPDATE` policy and grants already cover this.
