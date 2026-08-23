## ADDED Requirements

### Requirement: User can import transactions from a KTC statement PDF
The board SHALL let a signed-in user select a KTC credit-card statement PDF file, parse it entirely client-side, and preview the extracted transactions before any of them are saved.

#### Scenario: Selecting a valid, unlocked statement goes straight to preview
- **WHEN** a user selects a KTC statement PDF that isn't password-protected
- **THEN** the file is parsed client-side and the user is taken directly to the preview step, with no password prompt shown

#### Scenario: Selecting a password-protected statement prompts for a password
- **WHEN** a user selects a KTC statement PDF that is password-protected
- **THEN** a password prompt is shown before parsing continues
- **AND** an incorrect password re-prompts with an error, rather than silently failing or crashing

#### Scenario: Nothing is saved until the user confirms
- **WHEN** a user is on the preview step, however they got there
- **THEN** no transaction from the file has been written to `transactions` yet
- **AND** rows are only inserted once the user explicitly confirms the import

### Requirement: KTC statement parsing extracts transaction rows and excludes non-spending lines
The parser SHALL treat only lines beginning with two `DD/MM/YY` dates as candidate transaction rows, and SHALL exclude rows representing money paid into the card rather than spending.

#### Scenario: A normal purchase line is parsed correctly
- **WHEN** the statement text contains a line like `20/08/25 20/08/25 SHOPEETH BANGKOK TH 207.00`
- **THEN** the preview includes a row with that date and amount, and the description preserved verbatim (whitespace-normalized)

#### Scenario: Non-transaction lines are excluded
- **WHEN** the statement text contains a line with no leading date (e.g. a "previous balance carried" or period-total line)
- **THEN** no preview row is produced from that line

#### Scenario: A foreign-currency continuation line is not treated as its own row
- **WHEN** a transaction line is followed by a date-less continuation line showing an original foreign-currency amount (e.g. `USD 0.01`)
- **THEN** that continuation line does not produce a separate preview row

#### Scenario: A negative-amount row is always excluded
- **WHEN** the statement text contains a line whose amount is negative, regardless of its description text
- **THEN** no preview row is produced from that line

#### Scenario: An installment row's description is preserved as-is
- **WHEN** the statement text contains a line with an embedded installment counter in the description (e.g. `03/10 LAZADA BANGKOK`)
- **THEN** the preview row's description includes that text verbatim, with no attempt to strip or reinterpret the installment counter

### Requirement: Preview rows are editable and individually excludable before import
The preview step SHALL let the user edit a row's description, category, or amount, and SHALL let the user exclude individual rows from the import, all before confirming.

#### Scenario: Editing a row in preview
- **WHEN** a user changes a preview row's description or category
- **THEN** the edited value is what gets saved for that row on confirm, not the originally parsed value

#### Scenario: Excluding a row from the import
- **WHEN** a user excludes a preview row before confirming
- **THEN** that row is not inserted into `transactions` when the import is confirmed

### Requirement: Confirmed rows track whether they still need review
A row confirmed from the preview step SHALL be saved with `needs_review = true` unless the user edited that specific row in preview, in which case it SHALL be saved with `needs_review = false`.

#### Scenario: An untouched row is flagged for review
- **WHEN** a user confirms the import without editing a given row
- **THEN** that row is saved with `needs_review = true`

#### Scenario: An edited row is not flagged for review
- **WHEN** a user edits a given row's description or category during preview, then confirms
- **THEN** that row is saved with `needs_review = false`

### Requirement: Transactions needing review are visibly flagged and separately reachable
`TransactionList` SHALL show a visible indicator on rows where `needs_review` is `true`, and SHALL offer a way to view only those rows, without removing them from the normal full list.

#### Scenario: A needs-review row is visually marked in the normal list
- **WHEN** the transaction list renders a row with `needs_review = true`
- **THEN** that row shows a distinct badge/indicator not present on other rows

#### Scenario: Filtering to needs-review rows
- **WHEN** a user selects the needs-review filter/tab
- **THEN** only rows with `needs_review = true` are shown

#### Scenario: Reviewing a flagged row clears the flag
- **WHEN** a user opens a needs-review row for editing and saves it (via the existing add/edit transaction flow)
- **THEN** that row's `needs_review` becomes `false`

### Requirement: A transaction's import origin is visibly and permanently distinguishable from manual entry
`TransactionList` SHALL show a visible "imported" indicator on any row with `source` set, independent of that row's `needs_review` state, so a row's origin remains visible even after it has been reviewed.

#### Scenario: An imported row shows the imported badge regardless of review status
- **WHEN** the transaction list renders a row with `source` set (e.g. `'ktc_import'`)
- **THEN** that row shows an "imported" badge, whether or not `needs_review` is `true`

#### Scenario: Reviewing an imported row does not remove the imported badge
- **WHEN** a user reviews and saves a row that has `source` set, clearing its `needs_review` flag
- **THEN** the row's "imported" badge remains visible after the save

#### Scenario: A manually-entered row never shows the imported badge
- **WHEN** the transaction list renders a row with no `source` (entered via the normal add-transaction flow)
- **THEN** that row shows no "imported" badge

#### Scenario: The needs-review indicator is accessible without relying on color alone
- **WHEN** the transaction list renders a row with `needs_review = true`
- **THEN** that row's accessible name (e.g. `aria-label`) includes a "needs review" indication, not just a color-only visual cue

### Requirement: Badge colors are user-configurable and persisted on Supabase
The needs-review and imported-source indicator colors SHALL default to a fixed pair of colors but SHALL be changeable by the user, persisted per-user on Supabase (not `localStorage`) so the choice follows them across devices.

#### Scenario: Default colors apply before any customization
- **WHEN** a user who has never customized badge colors views the transaction list
- **THEN** both indicators render using the built-in default colors

#### Scenario: Changing a badge color persists it
- **WHEN** a user picks a new color for either indicator and saves
- **THEN** that color is used for that indicator going forward, on this and any other device the user signs into

#### Scenario: The two indicator colors are independently configurable
- **WHEN** a user changes the needs-review indicator's color
- **THEN** the imported-source indicator's color is unaffected, and vice versa

### Requirement: Possible duplicate imports are flagged, never blocked
A preview row SHALL be flagged as a possible duplicate if an existing transaction with the same `date` and `amount` exists AND that existing transaction was itself previously imported. The user SHALL still be able to import a flagged row.

#### Scenario: A row matching a previously-imported transaction is flagged
- **WHEN** a preview row's date and amount exactly match an existing transaction that has a `source` set
- **THEN** the preview row is shown with a duplicate-warning indicator

#### Scenario: A row matching only a manually-entered transaction is not flagged
- **WHEN** a preview row's date and amount exactly match an existing transaction that has no `source` (manually entered)
- **THEN** the preview row is not flagged as a possible duplicate

#### Scenario: A flagged row can still be imported
- **WHEN** a preview row is flagged as a possible duplicate
- **THEN** the user can still choose to include it, and confirming the import saves it like any other included row

### Requirement: Category is auto-guessed from a user-maintained, cross-device rule set
Each preview row's category SHALL be auto-guessed by matching its description against a per-user set of keyword-to-category rules stored in Supabase, and the user SHALL be able to add, edit, and remove rules.

#### Scenario: A row matching a rule is pre-categorized
- **WHEN** a preview row's description contains a keyword the user has mapped to a category
- **THEN** that row's category is pre-filled with the mapped category

#### Scenario: A row matching no rule falls back to a default
- **WHEN** a preview row's description matches no configured rule
- **THEN** that row's category defaults to `wants`

#### Scenario: Rules persist across devices
- **WHEN** a user adds a keyword-to-category rule while signed in
- **THEN** that rule is available the next time they sign in from a different device, because it is stored in Supabase rather than local browser storage
