## 1. Schema
- [x] 1.1 Migration `20261025090000_transactions_slip_ref.sql`: nullable `slip_ref text` on `spending_board.transactions`.
- [x] 1.1b Migration `20261025100000_transactions_slip_device.sql`: nullable `slip_device text`.
- [ ] 1.2 Apply the migration to the Supabase project (Supabase MCP was unreachable in the build session).

## 2. Edge function
- [x] 2.1 `index.ts`: store trimmed `ts` as `slip_ref` on slip rows.
- [x] 2.1b `index.ts`: store trimmed `device` as `slip_device`.
- [ ] 2.2 Redeploy `shortcut-transaction`.

## 3. Board UI
- [x] 3.1 `Transaction.slip_ref?` and `SLIP_VIEWER_SHORTCUT` in `BoardConfig.ts`.
- [x] 3.2 `slipShortcutUrl` and `isIosDevice` in `boardHelpers.ts` + tests.
- [x] 3.3 `transactionRows` exposes `slipUrl`; `TransactionList` renders the iOS-only button.
- [x] 3.4 Thai/English strings (`openSlipLabel`, `apiUsageSlipViewer`) and the note in `ApiTokensModal`.

- [x] 3.5 `slipLinkAvailable` + `useDeviceName` hook; device-name field in `ApiTokensModal`; `slipUrl` gated by device match; tests.

## 4. Verification
- [x] 4.1 `check-types`, `lint`, `test` pass.
- [ ] 4.2 On a real iPhone: create the "Open Slip" Shortcut, add a `device` field (Device Name) to the upload request, enter the device name in the board, upload a slip, tap the button, confirm the photo opens (adjust the Find Photos date window if needed).
