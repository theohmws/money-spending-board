## Why

Every transaction on the board today is typed in by hand, one at a time, via `AddTransactionModal`. For a credit card statement with dozens of line items a month, that's tedious and error-prone — and the data already exists as a PDF the bank hands you every cycle. Letting a user import directly from that PDF removes the duplicate typing while keeping them in control of correctness: nothing hits the database until they've previewed it, and merchant names/categories can be cleaned up either right there or later.

KTC (Krungthai Card) is the first bank supported, based on a real KTC PLATINUM MASTERCARD statement examined during exploration.

## What Changes

- New "Import from PDF" entry point. User picks a KTC statement PDF; it's parsed entirely client-side (this app is `output: 'export'` static — there's no server to do it) via `pdfjs-dist`. No OCR — KTC statements are digital text PDFs, not scans.
- A preview step shows every extracted row (date, raw description, amount, guessed category) before anything is saved. The user can edit any row inline, exclude rows, or leave them as-is and clean them up later.
- Rows the user didn't touch in preview are saved with `needs_review = true`; `TransactionList` shows a small badge on these plus a dedicated filter to find them later, so "edit later" is a real, findable state, not just an unmarked row indistinguishable from any other.
- Statement rows with a negative amount (money paid *into* the card — bill payments, refunds) are always skipped; they aren't spending.
- If a row's date+amount exactly matches an existing transaction that itself came from a prior import, the preview flags it as a possible duplicate (soft warning only — the user decides whether to import it anyway). Matches against manually-typed transactions are never flagged, since a manual note text will essentially never match a statement's raw description and the match would be meaningless.
- Category is auto-guessed per row from a merchant-keyword → category mapping that lives in a new Supabase table (not `localStorage`, unlike the board's other per-user config) so it survives across the user's devices — they intend to keep extending it themselves over time. Basic add/edit/remove UI for this mapping ships as part of this change, since without it the table has no way to grow.
- Parsing logic is a single hardcoded function for KTC's statement format — no multi-bank abstraction layer. The board has no second bank to support yet, and this codebase's convention (see `TrendChart`/`CompareChart`) is to not build a shared abstraction until there's a second real consumer.

## Capabilities

### New Capabilities
- `credit-card-import`: PDF selection and parsing, the preview/edit step, the KTC statement format parser, dedupe-flagging, the needs-review badge/filter surfaced in the transaction list, and the category-guess rule table + its CRUD UI.

### Modified Capabilities
(none — `transaction-editing`'s existing open/edit/save requirements are unchanged; imported rows are edited through the same `AddTransactionModal` flow already specified there. `spending-board-state`'s composition-root rules are followed, not altered: import state is a new domain-sliced hook composed the same way `useTransactions`/`useRatios` already are.)

## Impact

- New dependency: `pdfjs-dist`.
- New migration(s) (`supabase/migrations/`): `transactions` gains `source text` and `needs_review boolean not null default false`; new `spending_board.import_category_rules` table (RLS scoped by user, following the existing `transactions` policy pattern).
- New hook: `useCreditCardImport` (or similar), composed into `useSpendingBoard.ts` alongside the other domain hooks.
- New components: an import entry point (button in `BoardHeader` or `TransactionList`), a password-prompt step, a preview modal with an editable table, and a small settings surface for the category-rule mapping (likely folded into the existing `CategorySettingsModal` area rather than a wholly new modal — TBD in design).
- `src/hooks/useTransactions.ts`: needs a genuine bulk-insert path (`saveTransaction` today inserts one row at a time) and the `needs_review`/`source` fields threaded through its loaded `Transaction` shape.
- `src/components/board/TransactionList.tsx`: needs-review badge per row, plus a filter/tab for "needs review only".
- `src/utils/BoardConfig.ts`: new i18n strings (import flow labels, needs-review badge/filter, category-rule UI).
- No changes to `useRatios`/`useProfile`/`useCategoryMeta` or their `localStorage` persistence — migrating those to Supabase was discussed but is explicitly out of scope here; it would be a separate future proposal.
