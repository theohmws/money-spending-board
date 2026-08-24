## MODIFIED Requirements

### Requirement: User-scoped data loads on session resolution, orchestrated centrally
When a session is established or restored, every domain hook that owns user-scoped persisted data (transactions, ratios, profile, category metadata, import category rules, board settings) SHALL load its data, triggered by the composition root rather than by domain hooks independently subscribing to auth state.

#### Scenario: Session resolves after sign-in
- **WHEN** `useAuthSession` resolves a non-null session (via `getSession` or `onAuthStateChange`)
- **THEN** the composition root invokes the load function for transactions, ratios, profile, and category metadata with the resolved Supabase client and (for ratios/profile/category metadata) the resolved email
- **AND** `useAuthSession` itself does not call into any other domain hook's loader directly

### Requirement: A single Supabase client instance is shared across domains that need it
Domain hooks that perform Supabase queries (transactions, import category rules, board settings, ratios, profile, category metadata) SHALL use the one client instance owned by `useAuthSession`, not create their own.

#### Scenario: Transactions hook performs queries using the shared client
- **WHEN** `useTransactions`'s `saveTransaction`, `deleteTx`, or its loader executes a Supabase query
- **THEN** it uses the `SupabaseClient` instance provided by `useAuthSession` via the composition root
- **AND** no additional `SupabaseClient` is constructed elsewhere

#### Scenario: Ratios/profile/category-metadata hooks perform queries using the shared client
- **WHEN** `useRatios`'s `saveRatios`, `useProfile`'s `saveProfile`, or `useCategoryMeta`'s `saveCategoryMeta` executes a Supabase query, or their loader runs
- **THEN** each uses the same `SupabaseClient` instance provided by `useAuthSession` via the composition root
- **AND** no additional `SupabaseClient` is constructed elsewhere

### Requirement: Domain state is independently testable
Each domain of board state (auth/session, theme, i18n, ratios, profile, category metadata, transactions) SHALL be implemented as its own hook that can be unit-tested in isolation, without constructing unrelated domains' state.

#### Scenario: Testing ratio logic requires no unrelated domain state
- **WHEN** a test renders `useRatios` in isolation via `renderHook`, supplying a mocked Supabase client
- **THEN** the test exercises `saveRatios`/`onRatioChange`/`ratioSum` without constructing a real session, a real network call, or any other domain hook

#### Scenario: Testing transaction logic requires no ratio/profile/category state
- **WHEN** a test renders `useTransactions` in isolation
- **THEN** the test can verify `saveTransaction`/`deleteTx`/income-expense aggregation without needing `useRatios`, `useProfile`, or `useCategoryMeta` to be mounted

## ADDED Requirements

### Requirement: Ratios, profile, and category metadata persist to Supabase, migrating existing localStorage data on first load
`ratios`, `profile`, and `category metadata` SHALL persist as `jsonb` columns on `spending_board.board_settings` (one row per user), not `localStorage`. For a signed-in user whose corresponding column is still `NULL`, the domain hook's loader SHALL read any existing `localStorage` value for that user, upsert it (or, if none exists, the domain's default value) into the column, and use that as the loaded value — after which the column is the sole source of truth for that user on every subsequent load, on any device.

#### Scenario: A returning user's existing localStorage data is migrated on first post-deploy load
- **GIVEN** a signed-in user has a non-empty `localStorage` value for `msb_profile_<email>` (or `msb_ratios_<email>` / `msb_catmeta_<email>`) from before this change shipped
- **AND** their `board_settings.profile` (or `.ratios` / `.category_meta`) column is `NULL`
- **WHEN** their session resolves and the corresponding domain hook loads
- **THEN** the `localStorage` value is written into the `board_settings` column via an upsert
- **AND** the loaded state reflects that migrated value, not a default

#### Scenario: A brand-new user with no localStorage data gets defaults written to the DB
- **GIVEN** a signed-in user has no `localStorage` value for the relevant key and their `board_settings` column is `NULL`
- **WHEN** their session resolves and the domain hook loads
- **THEN** the domain's default value (`DEFAULT_PROFILE` / `DEFAULT_RATIOS` / `DEFAULT_CATEGORY_META`) is upserted into the column
- **AND** the loaded state reflects that default

#### Scenario: A previously-migrated user's data loads directly from the DB, without touching localStorage
- **GIVEN** a signed-in user's `board_settings` column is already non-`NULL` (migrated on a prior load, on this device or another)
- **WHEN** their session resolves and the domain hook loads
- **THEN** the column's value is used as the loaded state directly
- **AND** `localStorage` is not read

#### Scenario: A save failure is surfaced, not silently swallowed
- **WHEN** `saveProfile`, `saveRatios`, or `saveCategoryMeta` fails (e.g. a Supabase error)
- **THEN** the corresponding save-error state is set and the modal remains open with the user's edits intact
- **AND** the previously-saved value is not overwritten with a partial or failed write
