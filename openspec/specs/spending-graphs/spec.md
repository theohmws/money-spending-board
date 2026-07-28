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

### Requirement: Trend chart shows a user-selectable series (income or expense) per month as a horizontal stacked bar, highlighting the selected month
The `Trend` sub-tab SHALL render one horizontal bar per month drawn from months that have at least one transaction, always including `selectedMonth` even if it has none. A series toggle SHALL let the user pick between viewing `income` or `expense` (defaulting to `expense`); the income view renders a single solid segment per month, while the expense view SHALL split each bar into one segment per category (`needs`, `savings`, `wants`, in that order, using the same colors as the Overview tab's category cards), stacked end-to-end. Bars are scaled against the total (income, or expense, matching the active series) of the widest month shown. The number of recent populated months shown SHALL be user-selectable from a fixed set of options (3, 6, 12, 15, 24 months), defaulting to 6, plus `selectedMonth` as an additional row if it falls outside that window. The row for `selectedMonth` SHALL be visually distinguished from the others.

#### Scenario: Only populated months appear, except the selected one
- **WHEN** a user has transactions in 3 distinct months out of the last 12, with the month-range control set to 12
- **THEN** the Trend chart shows rows for those 3 months plus `selectedMonth` if it isn't already one of them
- **AND** it does not show rows for the other 9 empty months in the 12-month picker window

#### Scenario: Selected month is visually emphasized
- **WHEN** the Trend chart renders
- **THEN** the row corresponding to `selectedMonth` is rendered with a distinct visual treatment (bold label, full-opacity bar) from all other months' rows, which are dimmed

#### Scenario: Selecting an old month outside the current range window still shows it
- **WHEN** `selectedMonth` is populated but falls outside the currently-selected number of most recent populated months
- **THEN** the Trend chart still includes a row for `selectedMonth`, in addition to the rows for the selected range

#### Scenario: User changes the number of months shown
- **WHEN** a user picks a different option from the month-range control (3, 6, 12, 15, or 24)
- **THEN** the Trend chart re-renders showing up to that many of the most recent populated months (plus `selectedMonth` per the scenario above)

#### Scenario: Expense view breaks each month down by category
- **WHEN** a user selects the `expense` series
- **THEN** each month's bar shows one stacked segment per category with a non-zero spend that month, in `needs`/`savings`/`wants` order
- **AND** a legend identifies each category segment by color and name

#### Scenario: Income view shows a single undivided segment
- **WHEN** a user selects the `income` series
- **THEN** each month's bar shows a single solid segment (no category breakdown, since income has no category dimension)
- **AND** no legend is shown (a single series is already named by the toggle itself)

#### Scenario: Hovering or focusing a segment shows its value
- **WHEN** a user hovers or keyboard-focuses an income or expense segment of a row
- **THEN** a tooltip shows that month's label, the series name (income or expense), and its formatted value

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

### Requirement: Both charts carry a legend and a per-mark hover/focus tooltip
Any chart with two or more series (Trend's income/expense; Compare's this-month/last-month) SHALL display a legend identifying each series by color swatch and label. Every individual mark (bar or segment) SHALL be focusable and SHALL show a tooltip with its category, series, and formatted value on hover or keyboard focus, and SHALL visually brighten while hovered or focused.

#### Scenario: Legend identifies series without relying on color alone
- **WHEN** either chart renders
- **THEN** a legend row above the chart shows one swatch + label per series

#### Scenario: Tooltip reachable by keyboard, not just mouse
- **WHEN** a user tabs to a bar or segment
- **THEN** the same tooltip that would show on mouse hover appears on keyboard focus
