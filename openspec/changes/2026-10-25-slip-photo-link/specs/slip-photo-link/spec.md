## ADDED Requirements

### Requirement: Slip uploads remember their photo
The `shortcut-transaction` endpoint SHALL store the request's `ts` value as the transaction's `slip_ref` when saving a slip.

#### Scenario: Slip upload with a timestamp
- **WHEN** a slip body `{ ts, text, album }` creates a transaction
- **THEN** the row's `slip_ref` equals the trimmed `ts`

#### Scenario: No timestamp
- **WHEN** `ts` is missing or blank
- **THEN** `slip_ref` is null and the row is otherwise saved as before

### Requirement: Slip uploads remember their device
The endpoint SHALL store the request's trimmed `device` (max 100 chars) as `slip_device`, or null when absent.

### Requirement: Transactions link to their slip photo on iOS
The board SHALL show an "Open slip photo" button on a transaction row that has a `slip_ref`, only on iOS devices, linking to `shortcuts://run-shortcut` for the "Open Slip" Shortcut with the `slip_ref` as text input.

#### Scenario: iPhone, row with slip_ref
- **WHEN** the board is viewed on an iPhone and a row has a `slip_ref`
- **THEN** the row shows the button and activating it does not open the edit modal

#### Scenario: Row uploaded from a different device
- **WHEN** a row's `slip_device` differs from the device name entered on this device (or none is entered)
- **THEN** no button is shown

#### Scenario: Row uploaded before device tracking
- **WHEN** a row has a `slip_ref` but no `slip_device`
- **THEN** the button is shown on any iOS device

#### Scenario: Non-iOS device or row without slip_ref
- **WHEN** the device is not iOS, or the row has no `slip_ref`
- **THEN** no button is shown

### Requirement: Editing keeps the link
Editing a transaction through `AddTransactionModal` SHALL NOT change its `slip_ref`.
