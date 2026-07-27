## 1. i18n

- [x] 1.1 Add `updateTransactionBtn` (or reuse an existing generic save-label pattern — decide during implementation) to `I18nDict` in `src/utils/BoardConfig.ts`, both `th` and `en`.

## 2. `useTransactions` hook changes

- [x] 2.1 Add `editingTxId: string | null` state.
- [x] 2.2 Add `openEditModal(tx: Transaction)` — sets `editingTxId`, `txType`, and `txForm` from the given transaction, then opens the modal (reuse `showAddModal`).
- [x] 2.3 Update `openAddModal` (or the modal-close path) to reset `editingTxId` to `null` when starting a fresh add.
- [x] 2.4 Branch `saveTransaction`: when `editingTxId` is set, call `.update({...}).eq('id', editingTxId)` instead of `.insert(...)`.
- [x] 2.5 Branch the local-state update in `saveTransaction`'s success path: `map` (replace in place) when editing, existing `prepend` when creating.
- [x] 2.6 Reset `editingTxId` to `null` after a successful save (both branches) and on modal close.
- [x] 2.7 Return `editingTxId` and `openEditModal` from the hook.

## 3. Wiring through `useSpendingBoard`

- [x] 3.1 Thread `editingTxId`/`openEditModal` from `txSlice` into `useSpendingBoard`'s returned object (follow the existing `Pick<ReturnType<typeof useSpendingBoard>, ...>` convention used by other board components).
- [x] 3.2 Wire an `onEdit` callback into `transactionRows` (alongside the existing `onDelete`) that calls `openEditModal(tx)` with the raw `Transaction`, not the display-mapped row.

## 4. UI changes

- [x] 4.1 `TransactionList.tsx`: add an `onClick` to the row container (excluding the `×` button, which must `stopPropagation` or remain a sibling outside the clickable area) that calls `tx.onEdit`.
- [x] 4.2 `AddTransactionModal.tsx`: accept `editingTxId` (or a derived `isEditing` boolean) as a prop; swap the header text and submit button label based on mode (use the new i18n string from Task 1.1 for edit mode, keep `t.addTransaction`/`t.saveTransactionBtn` for create mode).

## 5. Tests

- [x] 5.1 `useTransactions.test.ts`: add cases for `openEditModal` prefilling `txForm`/`txType`, `saveTransaction` performing `update` instead of `insert` when `editingTxId` is set, and local state being replaced in place (not prepended) after an edit.
- [x] 5.2 Verify existing add/delete tests still pass unchanged (this change must be additive to `useTransactions`'s public shape).

## 6. Verification

- [x] 6.1 `npm run check-types`, `npm run lint`, `npm run test` all clean.
- [x] 6.2 Manually verify in the browser (per the project's `verify` skill): edit an expense, edit an income, flip type during edit, edit a transaction with a blank-note-turned-placeholder note (confirm the known pre-existing rough edge from design.md, not a new regression).
