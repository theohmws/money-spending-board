## Purpose

Defines editing behavior for existing transactions: how a user opens an existing transaction for editing, how a save is persisted (update vs. insert), and what remains changeable during an edit.

## Requirements

### Requirement: User can open an existing transaction for editing
Tapping a transaction row in `TransactionList`, anywhere except the delete (`×`) control, SHALL open the add/edit modal in edit mode, prefilled with that transaction's `type`, `amount`, `category`, `note`, and `date`.

#### Scenario: Tapping a row opens it prefilled
- **WHEN** a user taps a transaction row's title, date, or amount area
- **THEN** the modal opens with `txType` set to the row's `type`, and `txForm` populated with the row's `amount`, `category`, `note`, and `date`

#### Scenario: Tapping the delete control does not open edit
- **WHEN** a user taps the row's `×` delete button
- **THEN** the transaction is deleted and the edit modal does not open

### Requirement: Saving an edited transaction updates the existing row, not a new one
When the modal is open in edit mode, submitting SHALL update the existing transaction (by `id`) in Supabase rather than inserting a new row, and SHALL NOT change the transaction's `id`.

#### Scenario: Edit submits an UPDATE
- **WHEN** a user changes a field on a transaction opened in edit mode and submits
- **THEN** the system performs an `UPDATE` on the transaction with that `id`, not an `INSERT`
- **AND** exactly one row exists for that `id` afterward — no duplicate is created

#### Scenario: Local state reflects the edit in place
- **WHEN** an edit succeeds
- **THEN** the transaction's entry in local state is replaced with the updated values at its existing position
- **AND** no new entry is prepended to the list

### Requirement: Transaction type remains editable during edit
The modal SHALL NOT restrict changing `type` (expense/income) when editing an existing transaction — the expense/income toggle behaves identically in edit mode as in create mode.

#### Scenario: Changing type during edit is allowed
- **WHEN** a user opens an expense transaction for editing and toggles it to income (or vice versa)
- **THEN** the toggle switches normally
- **AND** on submit, the updated `type` is persisted
