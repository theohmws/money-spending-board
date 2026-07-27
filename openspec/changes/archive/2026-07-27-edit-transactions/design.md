## Context

`useTransactions` (`src/hooks/useTransactions.ts`) currently only supports `saveTransaction` (always `INSERT`) and `deleteTx` (`DELETE ... WHERE id = ?`). `TransactionList.tsx` renders each row with no click handler — the only interactive element is the `×` delete button. `AddTransactionModal.tsx` is driven entirely by hook-owned state (`txType`, `txForm`, `showAddModal`) and has no notion of "editing an existing row" vs. "creating a new one."

The database side is already correct for this: the `spending_board.transactions` migration (`supabase/migrations/20260727125029_spending_board_schema.sql`, carried over from the original `public.transactions` migration) defines an `UPDATE` policy with both `USING` and `WITH CHECK` on `auth.uid() = user_id`, and `authenticated` has the table-level `UPDATE` grant. No schema or policy change is needed.

## Goals / Non-Goals

**Goals:**
- Let a user edit amount, category, note, date, and type of an existing transaction.
- Reuse `AddTransactionModal` as-is (no new component) by making it mode-aware.
- Keep `useTransactions`'s public shape additive — no existing consumer (`BoardCard.tsx`, `useSpendingBoard.ts`) breaks.

**Non-Goals:**
- No multi-field validation beyond what `saveTransaction` already does (amount > 0).
- No optimistic-UI rollback on failed update (matches existing `saveTransaction`/`deleteTx` behavior, which also doesn't roll back on error today — consistency over scope creep).
- No swipe gestures or a dedicated edit icon — row-tap is the sole entry point (see Decisions).
- No locking of `type` during edit — full modal reuse, no field restrictions.

## Decisions

**1. Entry point: tap the row body, not a new icon or swipe gesture.**
The row already has a large touch target and no existing click handler. A dedicated pencil icon adds visual clutter to an already-dense row (icon, title, date, amount, delete button); a swipe gesture is real interaction-engineering cost (gesture library or manual touch handlers) disproportionate to the value here. Tap-to-edit is the established pattern in comparable finance-tracker UIs (Cash App, Copilot) that this board's visual language already echoes.
Alternative considered: explicit edit icon next to `×`. Rejected for now — more discoverable but adds a fifth interactive element to a row that's already tight at `size-9` icon + title + date + amount + delete. Can be revisited if user testing shows tap-to-edit isn't discovered.

**2. Reuse `AddTransactionModal` via a single `editingTxId: string | null` field, not a second modal component.**
The modal's fields (type toggle, amount, category, note, date) are identical between create and edit. Forking a second component would duplicate every input's markup and styling for zero behavioral difference. `editingTxId` set (vs. `null`) is the only signal the modal and hook need to distinguish modes.

**3. `saveTransaction` branches on `editingTxId` at the Supabase-call level, not via a separate `updateTransaction` function.**
Keeps one call site, one loading/error path, one place that constructs the row shape from `txForm`/`txType`. The branch is a single ternary: `client.from('transactions').insert(...)` vs. `.update(...).eq('id', editingTxId)`. A separate function would need to duplicate the amount-parsing/validation/note-fallback logic that already lives in `saveTransaction`.

**4. Local state reconciliation: `map` (replace in place) for edit, existing `prepend` stays for insert.**
Editing a transaction shouldn't change its position in the (date-sorted, then re-sorted-by-`transactionRows`) list — replacing in place is both correct and cheaper than refetching. This only touches the success branch of `saveTransaction`, gated on the same `editingTxId` check as the insert/update branch.

**5. `type` stays editable during edit — no field locking.**
Locking `type` would need conditional rendering logic in `AddTransactionModal` (a prop like `lockType`) purely to prevent a scenario (accidentally flipping expense↔income) that's no worse than the existing risk of picking the wrong type when first creating a transaction. Simplicity wins; if this proves to be a real footgun in practice, it's a small follow-up (disable the toggle when `editingTxId` is set).

## Risks / Trade-offs

- **[Risk] Reopening an edit modal for a transaction whose note was left blank at creation time shows the auto-filled placeholder text (`t.expense`/`t.income`) as if the user typed it** — `saveTransaction` back-fills blank notes with the translated type word, and that fallback isn't distinguishable from a real user-entered note once persisted. → **Mitigation**: none in this change (pre-existing behavior, not introduced by editing); noted here so it isn't mistaken for a new bug. Could be fixed later by storing note as nullable and rendering the fallback only at display time, not at write time — out of scope.
- **[Trade-off] No confirmation dialog before overwriting a transaction's fields on save.** Matches the existing add-transaction flow (no "are you sure" either), so this is consistent rather than a new gap.

## Migration Plan

Frontend-only change, no data migration. Ships as a normal PR; no feature flag needed since it's purely additive (new capability on existing rows, no schema change, no breaking change to `useTransactions`'s returned shape — `editingTxId`, `openEditModal` are new fields, not renames).

## Open Questions

None outstanding — the two open questions raised during exploration (entry point, and whether `type` should be lockable) are resolved above (Decisions 1 and 5). Revisit if user feedback says otherwise.
