## Context

The board is a static export (`output: 'export'` in `next.config.js`) — there is no API route or server process to hand a PDF to. Every domain of board state is a client-side hook composed into `useSpendingBoard.ts` (per the `spending-board-state` spec): `useTransactions` is the one slice backed by Supabase; `useRatios`/`useProfile`/`useCategoryMeta` persist to `localStorage`, namespaced per signed-in email.

`transactions` (`spending_board.transactions`) currently has no way to distinguish an imported row from a hand-typed one, and `useTransactions.saveTransaction` inserts/updates exactly one row per call.

A real KTC PLATINUM MASTERCARD statement PDF (Sept 2025 cycle) was read during exploration. Its extracted text lays out the transaction table as one line per row:

```
DD/MM/YY DD/MM/YY <description, incl. city/country, variable whitespace>   <amount>
```

Concretely, from the sample:

```
20/08/25 20/08/25 SHOPEETH                BANGKOK    TH               207.00
25/08/25 26/08/25 Netfix.com              Los Gatos  SGP               169.00
03/09/25 04/09/25 GITHUB, INC.            SAN FRANCISCO USA              0.32
USD 0.01
10/09/25 10/09/25 03/10 LAZADA            BANGKOK                    1,590.00
02/09/25 02/09/25 Payment-KTB Internet                               - 8,544.15
```

Observed, load-bearing facts:
- Dates are Gregorian (`25` = 2025), not Buddhist Era — no calendar conversion needed.
- Non-transaction lines (previous-balance-carried, period totals) have no leading date, so requiring a `DD/MM/YY` prefix is a sufficient filter.
- A foreign-currency purchase (the GitHub row) emits a second, date-less continuation line showing the original-currency amount (`USD 0.01`) — this line must be recognized and dropped, not parsed as its own transaction.
- An installment purchase (the Lazada row) embeds its installment counter (`03/10`) inline in the description text, not in a separate column.
- A card payment (money paid *into* the card, not spending) renders with a negative amount (`- 8,544.15`).
- The card statement masks its own card number already (`5239-10XX-XXXX-2618`); no extra masking is needed on our end for what we store.

## Goals / Non-Goals

**Goals:**
- Parse a real KTC statement PDF client-side and produce an editable, previewable list of candidate transactions.
- Never write to Supabase until the user explicitly confirms the import.
- Make "I'll clean this up later" a real, trackable state, not an invisible one.
- Warn on likely duplicate re-imports without ever silently blocking a legitimate transaction.
- Let the user grow their own merchant → category mapping over time, from any device.

**Non-Goals:**
- Any bank other than KTC. No parser interface/registry — see Decision 2.
- OCR / scanned-image statements. KTC statements are digital text PDFs; if that changes, it's a separate change.
- Migrating `ratios`/`profile`/`categoryMeta` off `localStorage` onto Supabase. Discussed during exploration, explicitly deferred to its own future proposal — not bundled here even though the new category-rule table breaks the "config is local-only" pattern for one specific piece of data.
- Hard-blocking duplicate imports. Dedupe here is advisory only.
- Splitting "merchant name" from "city/country" out of the raw description algorithmically. The column spacing survives in the extracted text only as inconsistent runs of whitespace — not reliably parseable — so the full raw description is kept verbatim and left to the user to clean up.

## Decisions

**1. `pdfjs-dist` for client-side text extraction; no OCR library.**
The only place this can run is the browser (no server route to receive an upload). `pdfjs-dist` extracts text from digital PDFs and — critically — has a built-in encrypted-PDF flow (see Decision 9), which a lighter-weight text-only extractor likely wouldn't. OCR (e.g. `tesseract.js`) is unnecessary because KTC statements aren't scanned images, and would add a much heavier dependency and a much slower, lower-fidelity extraction path for a case that doesn't occur.

**2. The parser is `parseKtcStatement(text: string)` — a hardcoded function, not a multi-bank interface/registry.**
There is exactly one bank to support right now. This codebase's own precedent (`CompareChart` deliberately doesn't share a rendering abstraction with `TrendChart` because "their layouts never converged and a shared abstraction had only one real consumer") is to not build the abstraction until a second real consumer exists.
Alternative considered: a `StatementParser` type + a bank registry from the start. Rejected — with one implementation, the "interface" would just be `parseKtcStatement`'s own signature restated, adding a layer with nothing to abstract over yet. Revisit when a second bank is actually being added; extracting the interface at that point is a mechanical refactor, not a redesign.

**3. Any row with a negative amount is skipped, unconditionally — not pattern-matched by description.**
The one sample shows `Payment-KTB Internet` as the negative-amount case, but other payment channels (`Payment-SCB`, `Payment-Bualuang`, etc.) or refund credits would plausibly render the same way (negative amount, different description text). Matching on the sign of the amount is the general rule that actually captures "this isn't spending"; matching on specific description substrings would need to enumerate every possible payment-channel string and still miss refunds.

**4. A parsed row's `note` is the raw description string, verbatim (whitespace-normalized), never split into merchant/city.**
See Non-Goals — the spacing that separated merchant name from city/country visually in the PDF collapses to inconsistent whitespace runs in extracted text, with no reliable delimiter. Preview-time editing (or later, via the needs-review flow) is the correction mechanism, not parsing cleverness.

**5. Imported rows get `needs_review: boolean`; unset only when the user has touched that row in the preview step.**
`transactions` gains a `needs_review` column (default `false`, so existing/manually-typed rows are unaffected). Any row confirmed from the preview step that the user didn't edit is inserted with `needs_review = true`. `TransactionList` renders a small badge on `needs_review` rows and offers a filter/tab scoped to just them, so "come back to this later" is a real, findable queue rather than a row indistinguishable from any other. This is a new `ADDED` surface on `TransactionList`, not a change to `transaction-editing`'s existing open/edit/save requirements — a flagged row is edited through the exact same `AddTransactionModal` flow already specified there, and saving it clears `needs_review` like any other field update.

**5a. A second, separate badge shows a row's `source` — permanent, independent of `needs_review`.**
`needs_review` and `source` answer different questions ("does this still need a look?" vs. "where did this come from?") and shouldn't be collapsed into one indicator. Without a `source`-based badge, a row that was imported and *already* cleaned up in preview (`needs_review = false`) would look, in the list, indistinguishable from one the user typed by hand — the fact that it came from a KTC statement would be silently lost the moment it's reviewed. So `TransactionList` renders two independent badges per row: a "needs review" indicator shown only while `needs_review` is `true` (clears on save, per Decision 5), and an "imported" indicator shown whenever `source` is set (e.g. `'ktc_import'`), which persists for the life of the row regardless of review status. A manually-typed row (`source = null`) never shows the imported indicator.

**5b. Visual treatment: neither indicator is a filled pill.**
Two options were mocked up and compared (light/dark, using the board's real `themeTokens`) before picking a direction — a filled tag/pill was one of the options for each and was rejected for both:
- **`needs_review` → a left-edge accent stripe on the row** (a thin colored bar flush against the row's left edge, spanning its height), not a pill or an inline dot. It reads as "flagged" without touching the title/subtitle text line at all, and disappears cleanly the moment the row is reviewed and saved.
- **`source` → a bare colored text label** (e.g. `KTC`, small caps, no background fill), inline with the subtitle, not a filled tag and not a badge on the avatar. Lighter-weight than a filled pill, and reads as a label rather than a status chip — appropriate since, unlike `needs_review`, it's permanent and will be present on every imported row, on every load, indefinitely.

Both reuse the two previously-unused `PALETTE` entries (`#7FB3F2`/`#1E3A5C` for `source`, `#C9A6F2`/`#4B2A6B` for `needs_review`) rather than introducing new colors, following the same light/dark flip (`isDark ? dark : color` for the foreground, since neither has a filled background here) already established by `BudgetSplit`'s category cards.

**6. Dedupe is a soft warning, matched on `date` + `amount` against previously-imported rows only.**
Matching also on the existing row's `note` would mean comparing a statement's raw description (`SHOPEETH BANGKOK TH`) against a user's own hand-typed note (`Coffee`) — that comparison would essentially never fire, so it isn't useful as a signal. Restricting the comparison set to rows where `source` is already set (i.e. themselves came from a prior import) avoids flagging a coincidental manual entry that happens to share a date and amount. The warning never blocks — it's a note on the preview row, and the user decides. False positives (two genuinely different statement rows sharing a date and amount — plausible given how many small LINEPAY charges appear on a single day in the sample) are an accepted, low-cost trade-off of a warning that never blocks.

**7. The category-guess mapping is a new Supabase table (`spending_board.import_category_rules`), not `localStorage` — a deliberate exception to this board's existing local-only config pattern.**
`ratios`/`profile`/`categoryMeta` are `localStorage`-only today (per-browser, no sync). The user explicitly wants this mapping to survive across devices (phone/computer/iPad) since they plan to keep extending it themselves, which local-only storage can't do. This is a conscious, scoped exception — not a precedent applied retroactively to the other three. Migrating those is a separate, explicitly deferred future proposal (see Non-Goals).
Basic CRUD (add/edit/remove a keyword → category rule) ships as part of this change: a table the user can never populate isn't useful, and they've said they intend to grow it.

**8. Bulk insert is a new, separate code path — not a loop calling the existing single-row `saveTransaction`.**
`useTransactions.saveTransaction` does one Supabase `insert`/`update` per call by design (it's driven by a single-row modal form). Looping it per imported row would mean N round-trips for an N-line statement and partial-failure states that are awkward to reason about (row 12 of 40 fails — now what?). A single `.insert([...])` call with the whole confirmed batch is one round trip and one atomic-enough outcome to reason about in the UI.

**9. Password handling: don't pre-detect; react to `pdfjs-dist`'s own `onPassword` callback.**
`pdfjs-dist`'s `getDocument()` only invokes `onPassword` if the PDF is actually encrypted, and tells the caller whether this is the first prompt or a retry after a wrong password. Wiring a password-prompt UI directly to that callback means an unlocked statement (the common case — the sample PDF wasn't locked) never shows any password UI at all, and a locked one (e.g. emailed statements, sometimes locked with card number/citizen ID) gets prompted exactly when needed, with no separate detection step to keep in sync with `pdfjs-dist`'s own logic.

## Risks / Trade-offs

- **[Risk] The parser is built and tested against one real statement.** KTC has multiple card products (PROUD, JCB, Visa/Mastercard affinity cards) that may format differently in ways not seen here (e.g. a differently-shaped continuation line, a refund row that isn't simply amount-negative). → **Mitigation**: the preview step is the safety net — a misparsed row is still visible and editable/excludable before anything saves, so a parsing miss degrades to "user fixes it in preview," not silent data corruption. Rows that fail to parse as a transaction at all are simply omitted from the preview (never guessed-into-existence), and worth surfacing as a visible "N lines weren't recognized" note so a systematic parser gap doesn't go unnoticed.
- **[Trade-off] Soft-only dedupe can both under- and over-warn.** → Accepted; see Decision 6. A hard block would risk silently discarding a legitimate transaction that happens to collide, which is worse than an occasional unnecessary warning.
- **[Trade-off] `import_category_rules` living on Supabase while `ratios`/`profile`/`categoryMeta` stay local is an inconsistency in the codebase, at least until the deferred migration proposal happens.** → Accepted deliberately (Decision 7); flagged here so it reads as a known, chosen gap rather than an oversight.

## Migration Plan

Additive only. New migration(s), via Supabase MCP/CLI per this repo's convention:
- `alter table spending_board.transactions add column source text, add column needs_review boolean not null default false;` — existing rows get `source = null`, `needs_review = false`, which is the correct semantic (they were manually entered, not imported, and need no review).
- New `spending_board.import_category_rules` table, RLS scoped by `(select auth.uid()) = user_id` (per this repo's `auth_rls_initplan`-safe pattern), with explicit `grant`s to the Data API roles (since `auto_expose_new_tables` is `false`).

No backfill, no feature flag — ships as a normal PR once merged. Rollback is a normal revert plus a down-migration for the added columns/table (or leaving them as inert unused columns, if reverting the migration itself is judged riskier than the code revert).

## Open Questions

None blocking. One thing worth re-checking once this is in front of real usage: whether `import_category_rules` should eventually gain per-rule priority/ordering if a description matches more than one keyword — not needed for a first version with a small, user-curated list, but worth watching as the list grows.
