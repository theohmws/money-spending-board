## ADDED Requirements

### Requirement: Composition root preserves the existing public state shape
`useSpendingBoard` SHALL remain the single entry point consumed by `BoardCard.tsx`, and SHALL return an object with the same keys and equivalent values as the pre-refactor implementation, regardless of how many internal domain hooks it composes.

#### Scenario: BoardCard renders unchanged after the split
- **WHEN** `BoardCard` calls `useSpendingBoard()` after the hook has been decomposed into domain-sliced hooks
- **THEN** every field `BoardCard` and its child components read (e.g. `t`, `themeTokens`, `categoryCards`, `transactionRows`, `showAddModal`, `saveTransaction`) is present and behaves identically to before the refactor
- **AND** no prop type or import in `src/components/board/*` requires modification

### Requirement: Domain state is independently testable
Each domain of board state (auth/session, theme, i18n, ratios, profile, category metadata, transactions) SHALL be implemented as its own hook that can be unit-tested in isolation, without constructing unrelated domains' state or a Supabase client.

#### Scenario: Testing ratio logic requires no Supabase setup
- **WHEN** a test renders `useRatios` in isolation via `renderHook`
- **THEN** the test exercises `saveRatios`/`onRatioChange`/`ratioSum` without creating a Supabase client, a session, or any other domain hook

#### Scenario: Testing transaction logic requires no ratio/profile/category state
- **WHEN** a test renders `useTransactions` in isolation
- **THEN** the test can verify `saveTransaction`/`deleteTx`/income-expense aggregation without needing `useRatios`, `useProfile`, or `useCategoryMeta` to be mounted

### Requirement: Cross-slice derived views are computed exactly once, in the composition root
Derived views that blend two or more domains (`categoryCards`, `transactionRows`, `categoryOptions`, `categorySettingsRows`, `ratioRows`) SHALL be computed in `useSpendingBoard`, not duplicated inside any individual domain hook.

#### Scenario: categoryCards reflects changes from any contributing domain
- **WHEN** `categoryMeta`, `ratios`, the current month's transactions, or `profile.monthlyIncome` changes
- **THEN** `categoryCards` recomputes to reflect the new value
- **AND** the recomputation happens in exactly one place (the composition root), not once per domain hook

### Requirement: User-scoped data loads on session resolution, orchestrated centrally
When a session is established or restored, every domain hook that owns user-scoped persisted data (transactions, ratios, profile, category metadata) SHALL load its data, triggered by the composition root rather than by domain hooks independently subscribing to auth state.

#### Scenario: Session resolves after sign-in
- **WHEN** `useAuthSession` resolves a non-null session (via `getSession` or `onAuthStateChange`)
- **THEN** the composition root invokes the load function for transactions, ratios, profile, and category metadata with the resolved Supabase client and user email
- **AND** `useAuthSession` itself does not call into any other domain hook's loader directly

### Requirement: A single Supabase client instance is shared across domains that need it
Domain hooks that perform Supabase queries (currently only transactions) SHALL use the one client instance owned by `useAuthSession`, not create their own.

#### Scenario: Transactions hook performs queries using the shared client
- **WHEN** `useTransactions`'s `saveTransaction`, `deleteTx`, or its loader executes a Supabase query
- **THEN** it uses the `SupabaseClient` instance provided by `useAuthSession` via the composition root
- **AND** no additional `SupabaseClient` is constructed elsewhere
