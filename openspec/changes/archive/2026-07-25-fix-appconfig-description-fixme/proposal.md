## Why

`AppConfig.description` still holds the boilerplate placeholder `'Template - Money Spending Board'`, and it feeds directly into page `<meta description>` and OpenGraph tags — real users/crawlers see template text instead of a description of the app.

## What Changes

- Replace `AppConfig.description` with a real one-line description of the app (budgeting app: Supabase auth, transactions, editable 50/30/20 needs/savings/wants split).
- Remove the `FIXME` comment atop `src/utils/AppConfig.ts` since the config will no longer be template-derived.

## Capabilities

### New Capabilities
- `site-metadata`: The app's site-wide metadata (title, description, OG tags) must describe the actual product, not template/placeholder text.

### Modified Capabilities
(none — no existing `openspec/specs/` capabilities cover site metadata content; not spec-level behavior, just a config value)

## Impact

- `src/utils/AppConfig.ts`: `description` field value, remove FIXME comment.
- Consumers unaffected in structure: `app/layout.tsx` (metadata/OG tags), `src/templates/Main.tsx` (about/blog chrome) — both just read the new string, no code changes needed there.
