## Purpose

Defines the board's visual (graph) view: the Overview/Graph tab structure, the Trend chart's month-selection and highlighting behavior, and the Compare chart's previous-month derivation.

## Requirements

### Requirement: Board offers an Overview/Graph tab structure
The board SHALL present a top-level tab bar with `Overview` (the existing category cards + transaction list, unchanged) and `Graph` tabs. The `Graph` tab SHALL present its own sub-tabs, `Trend` and `Compare`.

#### Scenario: Overview is the default tab
- **WHEN** a user loads the board
- **THEN** the `Overview` tab is active and shows the existing category cards and transaction list exactly as before this change

#### Scenario: Switching to Graph shows Trend by default
- **WHEN** a user selects the `Graph` tab for the first time in a session
- **THEN** the `Trend` sub-tab is active by default
- **AND** the `Compare` sub-tab is reachable via its own control

#### Scenario: Tab selection does not persist across reloads
- **WHEN** a user selects `Graph`/`Compare`, then reloads the page
- **THEN** the board returns to the `Overview` tab (tab state is not read from or written to `localStorage`, unlike theme/language)

### Requirement: Trend chart shows income vs. expense per month, highlighting the selected month
The `Trend` sub-tab SHALL render a bar chart with one income/expense bar pair per month drawn from months that have at least one transaction, always including `selectedMonth` even if it has none, capped to the 6 most recent such months (plus `selectedMonth` as an additional bar if it falls outside that window). The bar(s) for `selectedMonth` SHALL be visually distinguished from the others.

#### Scenario: Only populated months appear, except the selected one
- **WHEN** a user has transactions in 3 distinct months out of the last 12
- **THEN** the Trend chart shows bars for those 3 months plus `selectedMonth` if it isn't already one of them
- **AND** it does not show bars for the other 9 empty months in the 12-month picker window

#### Scenario: Selected month is visually emphasized
- **WHEN** the Trend chart renders
- **THEN** the bar pair corresponding to `selectedMonth` is rendered with a distinct visual treatment (e.g. emphasized color/border) from all other months' bars

#### Scenario: Selecting an old month outside the 6-month cap still shows it
- **WHEN** `selectedMonth` is populated but falls outside the 6 most recent populated months
- **THEN** the Trend chart still includes a bar pair for `selectedMonth`, in addition to the 6 most recent months

### Requirement: Compare chart contrasts the selected month against the immediately preceding calendar month
The `Compare` sub-tab SHALL render a grouped bar chart with one group per category (`needs`, `savings`, `wants`, in that order), each group showing two bars: total expense spend for that category in `selectedMonth`, and total expense spend for that category in the calendar month immediately preceding `selectedMonth`. There SHALL be no separate UI control to choose the comparison month — it is always derived from `selectedMonth`.

#### Scenario: Previous month is calendar-relative, not picker-relative
- **WHEN** `selectedMonth` is `2026-03` and the transaction history has no transactions at all in `2026-02`
- **THEN** the Compare chart's "previous month" bars for `2026-02` show zero for every category (not silently substituting an earlier populated month)

#### Scenario: Category bars use the board's existing category colors
- **WHEN** the Compare chart renders
- **THEN** each category group's bars use that category's existing color from `GROUPS` (the same colors already used by the Overview tab's category cards)

#### Scenario: No second month selector exists
- **WHEN** a user is on the `Compare` sub-tab
- **THEN** there is no additional month-selection control beyond the board's existing single month picker
