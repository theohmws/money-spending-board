# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Money Spending Board is a personal budgeting app (Supabase auth + transactions, editable 50/30/20 needs/savings/wants split, Thai/English i18n) built on Next.js 16 App Router + TypeScript + Tailwind CSS, originally scaffolded from the [Next.js Boilerplate](https://github.com/ixartz/Next-js-Boilerplate) template. The home page (`app/page.tsx`) is the actual product; `about`/`blog` remain unmodified boilerplate placeholders (Lorem ipsum). `src/utils/AppConfig.ts` is still marked `FIXME` with template-derived site metadata.

The app is statically exported (`output: 'export'` in `next.config.js`) — see `build-prod` below.

## Commands

```shell
npm install                 # install deps (Cypress's binary download is flaky in sandboxes;
                             # set CYPRESS_INSTALL_BINARY=0 to skip it if you don't need e2e)

npm run dev                 # dev server with live reload, http://localhost:3000

npm run lint                 # eslint . (legacy .eslintrc, NOT `next lint` — removed in Next 16)
npm run format                # eslint --fix + prettier on json/yaml
npm run check-types           # tsc --noEmit for both app and cypress tsconfigs

npm run test                  # jest (unit tests, colocated *.test.tsx)
npm run test -- Card.test    # run a single test file/pattern (standard jest CLI filtering)

npm run storybook             # Storybook dev server on :6006
npm run storybook:build       # build static storybook
npm run test-storybook:ci     # serve built storybook + run @storybook/test-runner against it

npm run cypress                # open Cypress interactively
npm run cypress:headless       # run Cypress headless
npm run e2e                    # start dev server + run Cypress (interactive)
npm run e2e:headless            # start dev server + run Cypress (headless) — used in CI with Percy

npm run build                  # next build -> static export in `out/` (output: 'export')
npm run build-prod             # clean + build
npm run start                  # next start (production server mode)

npm run commit                  # Commitizen prompt for a Conventional Commit message
```

CI (`.github/workflows/CI.yml`) runs on Node 20/22 for `build-prod`, and on Node 20 for: commitlint (on PRs), `lint`, `check-types`, `test`, `test-storybook:ci`, and `e2e:headless` (via Percy, needs `PERCY_TOKEN`).

**ESLint stays on v8** (`eslint-config-airbnb`/`-typescript` have no flat-config release yet, and pairing them with ESLint 9+ means peer-dependency conflicts across the whole Airbnb/`@typescript-eslint` chain). `eslint-config-next` is deliberately pinned to `^15.5.9` rather than matching `next`'s major, since `eslint-config-next@16` requires ESLint 9+. Don't "helpfully" bump either without re-checking this — it's a known, considered pin, not drift.

## Architecture

- **Routing**: App Router under `app/`. `app/blog/[slug]/page.tsx` uses `generateStaticParams()` + async `params` (a `Promise`, per Next 16 convention) to statically generate `blog-0`..`blog-9`; `generateMetadata()` sets the per-slug title.
- **SEO/metadata**: no `next-seo` — every route exports `metadata` (or `generateMetadata`) directly, per the native Metadata API. `app/layout.tsx` sets the site-wide defaults from `AppConfig`; `app/sitemap.ts`/`app/robots.ts` (both need `export const dynamic = 'force-static'` for static export) replace the old `next-sitemap` dependency.
- **Site chrome**: `src/templates/Main.tsx` (header/nav/footer, pulls title from `AppConfig`) wraps `about`/`blog`, but **not** the board — `app/page.tsx` renders full-bleed since the board has its own self-contained header/UI that would clash with `Main`'s nav.
- **The board feature** (`app/page.tsx` → `BoardCard`):
  - `src/hooks/useSpendingBoard.ts` — single hook holding all state/handlers for the whole app (session, transactions, ratios, category icons/colors, profile, theme, lang, every modal's open/form state) plus derived values (category cards, transaction rows, month options). The Supabase project is fixed via `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`), read at build time and used to create the client in `useEffect`; there is no in-app config UI, localStorage-based project override, or offline demo mode — if either env var is missing the hook sets `showConfigError` and the board renders a config-missing message instead of `AuthScreen`/the app.
  - `src/components/board/*` — eight presentational components (`AuthScreen`, `BoardHeader`, `BudgetSplit`, `TransactionList`, and four modals: `AddTransactionModal`, `CategorySettingsModal`, `ProfileModal`, `RatioModal`), each typed via `Pick<ReturnType<typeof useSpendingBoard>, ...>` rather than duplicating prop types. Static/structural styling is Tailwind; genuinely dynamic per-theme/per-category colors are inline `style` (can't be static Tailwind classes since they're runtime-computed).
  - `src/utils/BoardConfig.ts` — all constants: category groups, icon SVG paths, color palette, and the full Thai/English `I18N` dictionary. `src/utils/boardHelpers.ts` — pure helpers (`fmtMoney`, `themeTokens`, etc.).
  - `next/font/google` (Manrope + Inter) is loaded in `app/page.tsx` and scoped to the board via Tailwind's `font-manrope`/`font-sans` (see `tailwind.config.js`), deliberately *not* changing the site-wide font (`global.css` still sets IBM Plex Sans Thai globally for `about`/`blog`).
- **Path aliases** (`tsconfig.json`): `@/*` → `src/*`, `@/public/*` → `public/*`, `@/lib/*` → `lib/*`, `@/translations/*` → `translations/*`. Only the first two are mirrored in `jest.config.js`'s `moduleNameMapper` and only the first two directories (`src/`, `public/`) actually exist — `lib/` and `translations/` are reserved but unused, so add their `jest.config.js` mapping if code ever lands there. Always import via `@/...` for cross-directory imports.
- **Tests are colocated** directly next to what they test — including routes, e.g. `app/about/page.test.tsx` tests `app/about/page.tsx`. This works because App Router only treats reserved filenames (`page`, `layout`, `route`, etc.) as routes, unlike the old Pages Router where anything under `src/pages/` was magic; there's no more `pages.test/` workaround directory.
- **Styling**: Tailwind CSS v3. `tailwind.config.js` extends the default spacing scale with half-steps (`4.5`–`9.5`) that the board's components rely on — if you add a new fractional spacing class, make sure it's either in that extension or a default Tailwind value, since silently-unmatched classes (e.g. a stray `pb-25`) generate no CSS at all. `content` covers both `src/**` and `app/**`.
- **Storybook**: stories are colocated (`*.stories.tsx`, e.g. `Main.stories.tsx`). Storybook 10 — `@storybook/addon-essentials`/`-interactions`/`@storybook/testing-library` were folded into core; use `storybook/test` for interaction-testing utilities (`userEvent`, `within`), not the old separate packages.
- **E2E**: Cypress specs in `cypress/e2e/*.cy.ts` predate the board feature and assert against the old Pages Router boilerplate content — treat them as known-stale, not a regression bar, until someone rewrites them for the current app.

## Conventions

- **Commits**: enforced [Conventional Commits](https://www.conventionalcommits.org/) via commitlint (validated in CI on PRs); use `npm run commit` for the guided Commitizen flow. Releases are automated with `semantic-release` on `main`.
- **ESLint** (`.eslintrc`, legacy format — see the pin note above): Airbnb + Airbnb TypeScript + `next/core-web-vitals` + Tailwind + Prettier, with project-specific overrides worth knowing:
  - `simple-import-sort` is enforced — imports/exports must be sorted; let `npm run format` fix this rather than hand-ordering.
  - `unused-imports/no-unused-imports` is an error; unused vars prefixed with `_` are allowed.
  - `@typescript-eslint/consistent-type-imports` is enforced — use `import type { X }` for type-only imports.
  - `import/prefer-default-export` is off — prefer named exports, except Next.js `page.tsx`/`layout.tsx` files which require `export default`.
  - `react/jsx-props-no-spreading` and `react/require-default-props` are off.
  - `jsx-a11y/label-has-associated-control` and `jsx-a11y/control-has-associated-label` are enforced — every `<label>` needs a matching `htmlFor`/`id` pair (or use a plain `<div>` if it's a group heading, not a real form label), and icon-only buttons need `aria-label`.
- **TypeScript**: strict mode is on (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, etc.) — `npm run check-types` must stay clean. `moduleResolution: "bundler"` (required for modern `exports`-map packages like Storybook 10); `target: "es2017"`.
- Component prop types use the `I`-prefixed interface/type naming convention in the original boilerplate files (`ICard`, `IMainProps`); the board's newer files instead derive prop types from the hook's return shape (`Pick<ReturnType<typeof useSpendingBoard>, 'foo' | 'bar'>`) rather than hand-duplicating them — follow whichever convention matches the file you're in.
- Function components are typically defined with `const X = (props) => (...)` and exported via a trailing named `export { X }` (not `export default`), except Next.js route files which require `export default`.
