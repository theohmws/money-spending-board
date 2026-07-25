## ADDED Requirements

### Requirement: Site metadata describes the real product
`AppConfig.description` SHALL describe the actual Money Spending Board app and MUST NOT contain template/placeholder text (e.g. the literal word "Template").

#### Scenario: Description rendered in page metadata
- **WHEN** `app/layout.tsx` builds page metadata from `AppConfig`
- **THEN** the rendered `description` and OpenGraph description reflect the real app (budgeting, transactions, 50/30/20 split)
- **AND** the string does not contain the word "Template"
