## Context

`AppConfig.description` is boilerplate placeholder text from the original Next.js template, read directly by `app/layout.tsx` (metadata/OG) and `Main.tsx` (about/blog chrome).

## Goals / Non-Goals

**Goals:**
- Replace placeholder string with a real description of the app.
- Remove the now-stale FIXME comment.

**Non-Goals:**
- No change to `AppConfig`'s shape.
- No i18n of site metadata — stays English regardless of the board's Thai/English toggle (per CLAUDE.md, board i18n is separate from site chrome).

## Decisions

### Decision 1: single string replacement, no interface change
No new field, no config restructuring — `description` stays a plain string. Simplest fix that satisfies the spec's "must not be placeholder" requirement.

## Risks / Trade-offs

None — no code paths change, only a string literal.
