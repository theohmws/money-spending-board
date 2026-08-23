## 1. Schema

- [x] 1.1 Migration: add `source text` and `needs_review boolean not null default false` to `spending_board.transactions`.
- [x] 1.2 Migration: create `spending_board.import_category_rules` (`id`, `user_id uuid references auth.users`, `keyword text`, `category text check (category in ('needs','savings','wants'))`, `created_at`), RLS scoped by `(select auth.uid()) = user_id` for select/insert/update/delete, plus explicit `grant`s to `anon`/`authenticated`/`service_role` per this repo's convention (`auto_expose_new_tables` is `false`).
- [x] 1.3 Migration: create `spending_board.board_settings` (`user_id uuid primary key references auth.users`, `badge_colors jsonb not null default` the two-key default shown in design.md Decision 5c, `updated_at timestamptz not null default now()`), same RLS + grant pattern as 1.2.
- [x] 1.4 Applied via the Supabase MCP tools to the `money-spending-board` project (`yjphlaymjjmbinhmdcqj`), recorded as migration `20260823143820_credit_card_import`. Verified after applying: `transactions` gained `source`/`needs_review` with all 91 existing rows intact (`needs_review` defaulting to `false`); `import_category_rules` and `board_settings` both created with RLS enabled and their policies in place; `get_advisors` shows no new security findings (only a pre-existing, unrelated leaked-password-protection warning).

## 2. Dependencies

- [x] 2.1 Add `pdfjs-dist` to `package.json`. Confirmed working with `output: 'export'`: `npm run build` succeeds and emits the worker as a real static asset (`out/_next/static/media/pdf.worker.min.*.mjs`), referenced from the bundled chunks — no `next.config.js` change was needed, since `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)` is resolved natively by Next's bundler.

## 3. KTC parser

- [x] 3.1 `src/utils/importParsers/ktc.ts`: `parseKtcStatement(text: string): ParsedRow[]` — pure function, no I/O.
- [x] 3.2 Line filter: only lines starting with `DD/MM/YY DD/MM/YY` are candidate transaction rows; everything else (headers, balance-carried, period totals, continuation lines like `USD 0.01`) is dropped.
- [x] 3.3 Extract `date` (the first `DD/MM/YY`, converted to `YYYY-MM-DD`), raw `description` (whitespace-normalized, verbatim), and `amount`. Posting date is intentionally not stored — trans date is what the user experiences the charge as, and the board's `Transaction` type only has one `date` field.
- [x] 3.4 Rows with a negative amount (leading `-`) are dropped unconditionally (card payments/credits, not spending).
- [x] 3.5 Unit tests against fixture text shaped like a real KTC statement, covering: a normal row, a foreign-currency row with its `USD ...` continuation line, an installment row (`03/10 LAZADA ...`), a negative-amount payment row (incl. a different payment-channel description), and non-transaction summary lines — each asserting it's included/excluded/transformed correctly, plus a full multi-line excerpt end to end.

## 4. PDF extraction + password handling

- [x] 4.1 `src/utils/importParsers/extractPdfText.ts`: wraps `pdfjs-dist`'s `getDocument()` + page text extraction (grouping text runs into rows by Y position, since `getTextContent()` has no inherent line breaks) into a single async function returning the concatenated text of all pages.
- [x] 4.2 Wire `onPassword` to a caller-supplied callback rather than handling UI here — keeps this a pure-ish IO helper the hook (Task 5) can drive.
- [ ] 4.3 **Partially done.** `useCreditCardImport`'s handling of the `onPassword` callback (prompt shown, retry flag, cancel, forwarding a submitted password) is unit-tested with a mocked `extractPdfText`. Not done: an actual end-to-end run against a real password-protected KTC PDF in a browser — this session has no display/browser to do that with. Worth doing once this ships to a real environment.

## 5. Import hook

- [x] 5.1 New domain hook `useCreditCardImport.ts` following the pattern of `useTransactions.ts`/`useRatios.ts`: owns parsing/loading state, password-prompt state, parsed preview rows (editable in place), per-row include/exclude, and confirm/cancel actions.
- [x] 5.2 Category auto-guess: `useImportCategoryRules.guessCategory` looks up rules by keyword-in-description match (longest keyword wins on overlap); unmatched rows default to `'wants'`.
- [x] 5.3 Dedupe flagging: each preview row is checked against the already-loaded `transactions` array for a `date`+`amount` match where `source` is set. No new query — reuses `useTransactions`'s already-loaded data via the composition root.
- [x] 5.4 Confirm action: included rows are bulk-inserted with `source: 'ktc_import'` and `needs_review` (`false` for edited rows, `true` for as-parsed rows).
- [x] 5.5 Composed into `useSpendingBoard.ts` alongside the existing domain hooks; `import_category_rules` and `board_settings` both load on session resolution the same way transactions/ratios/profile/categoryMeta already do.

## 6. Bulk insert on `useTransactions`

- [x] 6.1 Added `bulkInsertTransactions` (single `.insert([...])` call with an array), separate from the existing single-row `saveTransaction`. Updates local `transactions` state with all inserted rows on success.
- [x] 6.2 Threaded `source`/`needs_review` through the `Transaction` type and through `useTransactions`'s load/save paths — editing a row via the existing modal now always clears `needs_review` (leaving `source` untouched) on save.

## 7. Preview UI

- [x] 7.1 File-picker entry point: a row in `ProfileModal` ("Import from PDF") triggers a hidden `<input type="file" accept="application/pdf">`.
- [x] 7.2 Password-prompt step (`ImportPreviewModal`, only rendered when `importStatus === 'password'`), following the existing modal visual pattern.
- [x] 7.3 Preview modal (`ImportPreviewModal`): editable table (date, description, category picker, amount, include/exclude checkbox), duplicate-warning indicator per flagged row, confirm/cancel footer. **Not done**: a count of unrecognized/dropped lines — cut for scope/time; the parser doesn't currently distinguish "genuinely malformed transaction line" from "intentionally-excluded non-transaction line" cheaply enough to surface an honest count. Worth a follow-up if misparses turn out to be common in practice.
- [x] 7.4 Row edits in the preview clear that row's eventual `needs_review` flag on import (`edited: true`); untouched rows keep it set.

## 8. Needs-review + imported-origin surfaces on `TransactionList`

- [x] 8.1 `needs_review` indicator: a left-edge accent stripe on the row, colored from `board_settings.badge_colors.needsReview` (falling back to the default pair).
- [x] 8.2 `source` indicator: a bare colored text label (`KTC`) inline with the row's subtitle, colored from `board_settings.badge_colors.source`. Independent of 8.1; both can render on the same row.
- [x] 8.3 Accessible label: the row's `aria-label` includes a "needs review" suffix when `needs_review` is `true`.
- [x] 8.4 Filter/tab ("All" / "Needs review") in `TransactionList`, with an explanatory hint line shown while the needs-review tab is active.
- [x] 8.5 `transactionRows` (in `useSpendingBoard.ts`) threads `needsReview`/`sourceLabel`/`ariaLabel` through and applies the filter; no duplicate computation outside the composition root.
- [x] 8.6 Opening a needs-review row still goes through the existing `AddTransactionModal` edit flow unchanged; saving it clears `needs_review` but leaves `source` untouched.

## 9a. Badge color settings

- [x] 9a.1 `useBoardSettings.ts` loads `board_settings` for the signed-in user on session resolution, falling back to the default `badge_colors` shape if no row exists yet.
- [x] 9a.2 `saveBadgeColors` upserts the whole `badge_colors` object (mirrors `useCategoryMeta.saveCategoryMeta`'s whole-object replace, via Supabase `upsert`).
- [x] 9a.3 Color-picker UI for both badge colors in `ImportSettingsModal`, reusing the existing `PALETTE` swatch-picker pattern from `CategorySettingsModal`.

## 9. Category-rule management UI

- [x] 9.1 Basic CRUD (add/remove a keyword → category rule) in `ImportSettingsModal`, opened from a new row in `ProfileModal`.
- [x] 9.2 `useImportCategoryRules.ts`: Supabase-backed insert/delete, following the same client/error-handling shape as `useTransactions`'s Supabase calls. (Editing an existing rule in place wasn't built — remove and re-add covers it for a first version.)

## 10. i18n

- [x] 10.1 Added `th`/`en` strings to `I18nDict` for: import entry point, password prompt, preview table headers/actions, duplicate-warning text, needs-review badge/filter labels (incl. the `aria-label` suffix), imported-origin badge label, category-rule CRUD UI, badge color-picker UI.

## 11. Tests

- [x] 11.1 `parseKtcStatement` unit tests (Task 3.5) — `src/utils/importParsers/ktc.test.ts`.
- [x] 11.2 `useCreditCardImport` unit tests: category-guess matching (via a mocked `guessCategory`), dedupe flagging (manual vs. previously-imported match), password flow, confirm/cancel state transitions, per-row edit/toggle — `src/hooks/useCreditCardImport.test.ts`. Also added `src/hooks/useImportCategoryRules.test.ts` and `src/hooks/useBoardSettings.test.ts` for the two supporting hooks, matching this repo's one-test-file-per-hook convention.
- [x] 11.3 Bulk-insert path on `useTransactions` (mock Supabase client, assert a single batched `insert` call, plus empty-list and failure cases).
- [x] 11.4 `transactionRows`/needs-review filter derivation tests in `useSpendingBoard.test.ts`.

## 12. Verification

- [x] 12.1 `npm run check-types`, `npm run lint`, `npm run test` all clean (127 tests passing). `npm run build` also verified clean (confirms the pdfjs-dist worker bundles correctly for static export — see Task 2.1).
- [ ] 12.2 **Not done.** The migration (Task 1.4) is now applied to the real project, so this is unblocked, but there's still no browser available in this session to manually walk the import flow end to end. This is the last thing standing between this change and being fully verified — see the `verify` skill.
