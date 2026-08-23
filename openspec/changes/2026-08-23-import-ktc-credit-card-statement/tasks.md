## 1. Schema

- [ ] 1.1 Migration: add `source text` and `needs_review boolean not null default false` to `spending_board.transactions`.
- [ ] 1.2 Migration: create `spending_board.import_category_rules` (`id`, `user_id uuid references auth.users`, `keyword text`, `category text check (category in ('needs','savings','wants'))`, `created_at`), RLS scoped by `(select auth.uid()) = user_id` for select/insert/update/delete, plus explicit `grant`s to `anon`/`authenticated`/`service_role` per this repo's convention (`auto_expose_new_tables` is `false`).
- [ ] 1.3 Apply via Supabase MCP/CLI, not hand-edited on the remote database.

## 2. Dependencies

- [ ] 2.1 Add `pdfjs-dist` to `package.json`. Confirm it works with `output: 'export'` (worker bundling may need a `next.config.js` tweak — verify during implementation, not assumed here).

## 3. KTC parser

- [ ] 3.1 `src/utils/importParsers/ktc.ts`: `parseKtcStatement(text: string): ParsedRow[]` — pure function, no I/O.
- [ ] 3.2 Line filter: only lines starting with `DD/MM/YY DD/MM/YY` are candidate transaction rows; everything else (headers, balance-carried, period totals, continuation lines like `USD 0.01`) is dropped.
- [ ] 3.3 Extract `date` (the first `DD/MM/YY`, converted to `YYYY-MM-DD`; the second date/posting date is not stored — confirm this is acceptable or whether posting date is wanted alongside trans date), raw `description` (whitespace-normalized, verbatim), and `amount`.
- [ ] 3.4 Rows with a negative amount (leading `-`) are dropped unconditionally (card payments/credits, not spending).
- [ ] 3.5 Unit tests against fixture text extracted from a real (personally-identifying details masked/replaced) KTC statement, covering: a normal row, a foreign-currency row with its `USD ...` continuation line, an installment row (`03/10 LAZADA ...`), a negative-amount payment row, and a non-transaction summary line — each asserting it's included/excluded/transformed correctly.

## 4. PDF extraction + password handling

- [ ] 4.1 `src/utils/importParsers/extractPdfText.ts` (or similar): wraps `pdfjs-dist`'s `getDocument()` + page text extraction into a single async function returning the concatenated text of all pages.
- [ ] 4.2 Wire `onPassword` to a caller-supplied callback rather than handling UI here — keeps this a pure-ish IO helper the hook (Task 5) can drive.
- [ ] 4.3 Test (or manually verify, since this touches an external binary format) both an unlocked PDF (the sample) and a deliberately password-protected test PDF, including a wrong-password retry.

## 5. Import hook

- [ ] 5.1 New domain hook (e.g. `useCreditCardImport.ts`) following the pattern of `useTransactions.ts`/`useRatios.ts`: owns selected-file state, parsing/loading state, password-prompt state (prompt visibility, error on wrong password), parsed preview rows (editable in place), per-row include/exclude, and confirm/cancel actions.
- [ ] 5.2 Category auto-guess: for each parsed row, look up `import_category_rules` (loaded for the signed-in user) by keyword-in-description match; unmatched rows default to `'wants'` per the existing category default used elsewhere (`useTransactions.ts`'s `txForm` default).
- [ ] 5.3 Dedupe flagging: for each preview row, check the already-loaded `transactions` array for an existing row with matching `date` + `amount` AND `source` set (i.e. previously imported); mark the preview row accordingly. No new query — reuse `useTransactions`'s already-loaded data via the composition root.
- [ ] 5.4 Confirm action: for rows still included, bulk-insert into `transactions` with `source` (e.g. `'ktc_import'`) and `needs_review` (`false` for rows the user edited in preview, `true` for rows saved as-parsed).
- [ ] 5.5 Compose the new hook into `useSpendingBoard.ts` alongside the existing domain hooks; load `import_category_rules` on session resolution the same way transactions/ratios/profile/categoryMeta already do (per `spending-board-state`'s "User-scoped data loads on session resolution, orchestrated centrally" requirement).

## 6. Bulk insert on `useTransactions`

- [ ] 6.1 Add a bulk-insert function to `useTransactions.ts` (single `.insert([...])` call with an array), separate from the existing single-row `saveTransaction`. Update local `transactions` state with all inserted rows on success.
- [ ] 6.2 Thread `source`/`needs_review` through the `Transaction` type (`src/utils/BoardConfig.ts`) and through `useTransactions`'s load/save paths.

## 7. Preview UI

- [ ] 7.1 File-picker entry point (button in `BoardHeader` or above `TransactionList` — confirm placement during implementation) that accepts `.pdf`.
- [ ] 7.2 Password-prompt step (only rendered when `onPassword` fires), following the existing modal visual pattern (`AddTransactionModal`/`RatioModal`).
- [ ] 7.3 Preview modal: editable table (date, description, category picker, amount, include/exclude toggle), duplicate-warning indicator per flagged row, a count of unrecognized/dropped lines (per design.md's parser-miss mitigation), and a confirm/cancel footer.
- [ ] 7.4 Row edits in the preview clear that row's eventual `needs_review` flag on import; untouched rows keep it set.

## 8. Needs-review + imported-origin surfaces on `TransactionList`

- [ ] 8.1 `needs_review` indicator: a left-edge accent stripe on the row (not a pill, not inline text) — reuses the `review`/`review-dark` color pair (the previously-unused 5th `PALETTE` entry).
- [ ] 8.2 `source` indicator: a bare colored text label (e.g. `KTC`, small caps, no background fill), inline with the row's subtitle — reuses the `source`/`source-dark` color pair (the previously-unused 4th `PALETTE` entry). Independent of 8.1; both can render on the same row at once (see design.md Decision 5b).
- [ ] 8.3 Filter/tab scoped to needs-review-only rows, alongside (not replacing) the existing full list.
- [ ] 8.4 Confirm `transactionRows` (the cross-slice derived view in `useSpendingBoard.ts`) threads both `needs_review` and `source` through; no duplicate computation outside the composition root, per `spending-board-state`'s existing rule.
- [ ] 8.5 Opening a needs-review row still goes through the existing `AddTransactionModal` edit flow unchanged (per `transaction-editing`); saving it clears `needs_review` but leaves `source` (and therefore the imported badge) untouched.

## 9. Category-rule management UI

- [ ] 9.1 Basic CRUD (add/edit/remove a keyword → category rule), placed alongside `CategorySettingsModal` or as its own small settings surface (confirm placement during implementation).
- [ ] 9.2 Supabase-backed hook actions (insert/update/delete on `import_category_rules`), following the same client/error-handling shape as `useTransactions`'s Supabase calls.

## 10. i18n

- [ ] 10.1 Add `th`/`en` strings to `I18nDict` (`src/utils/BoardConfig.ts`) for: import entry point, password prompt, preview table headers/actions, duplicate-warning text, needs-review badge/filter labels, imported-origin badge label, category-rule CRUD UI.

## 11. Tests

- [ ] 11.1 `parseKtcStatement` unit tests (Task 3.5).
- [ ] 11.2 `useCreditCardImport` unit tests: category-guess matching, dedupe flagging logic, confirm/cancel state transitions — isolated per `spending-board-state`'s "domain state is independently testable" rule (no full Supabase client needed to test the pure logic).
- [ ] 11.3 Bulk-insert path on `useTransactions` (mock Supabase client, assert single batched call).
- [ ] 11.4 `transactionRows`/needs-review filter derivation tests.

## 12. Verification

- [ ] 12.1 `npm run check-types`, `npm run lint`, `npm run test` all clean.
- [ ] 12.2 Manually verify in the browser (per the project's `verify` skill, local Supabase stack): import the sample-shaped statement end to end — preview shows correct rows, negative-amount row absent, foreign-currency continuation line doesn't appear as its own row, installment row's raw text is preserved, duplicate warning appears on a deliberately re-imported row, needs-review badge/filter work, category-rule CRUD persists and is picked up on the next import.
