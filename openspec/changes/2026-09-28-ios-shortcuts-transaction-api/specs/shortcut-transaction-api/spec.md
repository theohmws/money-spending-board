## ADDED Requirements

### Requirement: User can manage personal API tokens
The board SHALL let a signed-in user create named API tokens, see them listed with a short prefix and last-used time, and revoke them. Only a SHA-256 digest of each token SHALL be stored.

#### Scenario: Creating a token shows it exactly once
- **WHEN** a user enters a name and creates a token
- **THEN** the plaintext token is displayed with a copy action
- **AND** only its digest and display prefix are sent to Supabase
- **AND** closing the modal or pressing Done discards the plaintext for good

#### Scenario: Revoking a token
- **WHEN** a user revokes a token
- **THEN** its row is deleted and any further request using it is rejected with 401

### Requirement: A token-authenticated endpoint inserts or updates transactions
`POST /functions/v1/shortcut-transaction` with `Authorization: Bearer <token>` SHALL insert a transaction for the token's owner when the JSON body has no `id`, and SHALL update only the provided fields of the owner's transaction when it does.

#### Scenario: Insert with only an amount
- **WHEN** the body is `{ "amount": 120 }`
- **THEN** an `expense` is created dated today (board timezone), categorized from the owner's keyword rules (default `wants`), with `source = 'ios_shortcut'`, and returned with status 201

#### Scenario: Partial update
- **WHEN** the body is `{ "id": "<owned id>", "amount": 150 }`
- **THEN** only `amount` changes and the updated row is returned with status 200

#### Scenario: Updating someone else's or a missing transaction
- **WHEN** `id` does not belong to the token's owner
- **THEN** the response is 404 and nothing changes

#### Scenario: Bad token or bad input
- **WHEN** the token is missing, malformed, unknown or revoked
- **THEN** the response is 401
- **WHEN** the body is invalid (non-positive amount, unknown type/category, bad date)
- **THEN** the response is 400 with a message naming the problem

### Requirement: Shortcut-created rows are labeled
Transactions with `source = 'ios_shortcut'` SHALL show a "Shortcut" source badge in the transaction list.
