# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Money Spending Board is a personal budgeting UI built on the [Next.js Boilerplate](https://github.com/ixartz/Next-js-Boilerplate) template (Next.js 13 pages router + TypeScript + Tailwind CSS). Most of the app is still template scaffolding (`about`, `blog` pages contain Lorem ipsum placeholders); the actual product code lives in `src/pages/index.tsx`, which renders a 50/30/20 budget board (ความจำเป็น/ออม/ความต้องการ — "needs/savings/wants") using hardcoded placeholder data. `src/utils/AppConfig.ts` is marked `FIXME` and still has template-derived values.

The app is statically exported (`output: 'export'`-style via `next export`), not server-rendered — see `build-prod` below.

## Commands

```shell
npm install                 # install deps

npm run dev                 # dev server with live reload, http://localhost:3000

npm run lint                 # next lint (ESLint)
npm run format                # lint --fix + prettier on json/yaml
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

npm run build                  # next build
npm run build-prod             # clean + build + export -> static site in `out/`
npm run start                  # next start (production server mode)

npm run commit                  # Commitizen prompt for a Conventional Commit message
```

CI (`.github/workflows/CI.yml`) runs on Node 16/18/20 for `build-prod`, and on Node 16 for: commitlint (on PRs), `lint`, `check-types`, `test`, `test-storybook:ci`, and `e2e:headless` (via Percy, needs `PERCY_TOKEN`).

## Architecture

- **Routing**: Next.js `pages` router under `src/pages/`. `src/pages/blog/[slug].tsx` is a static dynamic route using `getStaticPaths`/`getStaticProps` (`fallback: false`), generating `blog-0`..`blog-9`.
- **Page composition**: pages compose `Main` (layout template) wrapping page content, with a `Meta` (SEO/head) component passed as the `meta` prop.
  - `src/templates/Main.tsx` — page chrome: header/nav/footer, pulls title/description from `AppConfig`.
  - `src/layouts/Meta.tsx` — `<Head>` favicons + `next-seo`'s `NextSeo` for title/description/OpenGraph, keyed off `AppConfig`.
  - `src/utils/AppConfig.ts` — single source of site-wide config (name, title, description, locale). Update this when rebranding instead of hardcoding strings in pages.
  - `src/components/` — small reusable UI pieces (currently just `Card`, a bordered rounded container).
- **Tests are colocated** with source (`Foo.tsx` + `Foo.test.tsx`), except pages: Next.js treats everything under `src/pages` as a route, so page tests live in the parallel `src/pages.test/` directory instead (mirrors file names, e.g. `src/pages.test/blog.test.tsx` tests `src/pages/blog.tsx`).
- **Path aliases** (`tsconfig.json` + mirrored in `jest.config.js`): `@/*` → `src/*`, `@/public/*` → `public/*`, `@/lib/*` → `lib/*`, `@/translations/*` → `translations/*`. Always import via `@/...`, not relative paths across directories.
- **Mocks**: `__mocks__/next/router.ts` provides a Jest mock for `next/router` (used by components like `Meta` that call `useRouter`), aliased as `__mocks__/*`.
- **Styling**: Tailwind CSS; custom theme overrides (fixed `gray`/`blue` palettes, custom `fontSize` scale, `h-90%` utility) live in `tailwind.config.js`. Global CSS is `src/styles/global.css`.
- **Storybook**: stories are colocated (`*.stories.tsx`, e.g. `Main.stories.tsx`), config in `.storybook/`.
- **E2E**: Cypress specs in `cypress/e2e/*.cy.ts`, with its own `cypress/tsconfig.json` (excluded from the main `tsconfig.json`) and its own ESLint override block.

## Conventions

- **Commits**: enforced [Conventional Commits](https://www.conventionalcommits.org/) via commitlint (validated in CI on PRs); use `npm run commit` for the guided Commitizen flow. Releases are automated with `semantic-release` on `main` (changelog + GitHub release), driven by these commit types.
- **ESLint** (`.eslintrc`): Airbnb + Airbnb TypeScript + `next/core-web-vitals` + Tailwind + Prettier, with project-specific overrides worth knowing:
  - `simple-import-sort` is enforced — imports/exports must be sorted; let `npm run format` fix this rather than hand-ordering.
  - `unused-imports/no-unused-imports` is an error; unused vars prefixed with `_` are allowed.
  - `@typescript-eslint/consistent-type-imports` is enforced — use `import type { X }` for type-only imports.
  - `import/prefer-default-export` is off — prefer named exports (as seen throughout, e.g. `export { Main }`, `export { Card }`).
  - `react/jsx-props-no-spreading` and `react/require-default-props` are off.
- **TypeScript**: strict mode is on (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, etc.) — `npm run check-types` must stay clean.
- Component prop types use the `I`-prefixed interface/type naming convention (e.g. `ICard`, `IMainProps`, `IMetaProps`, `IBlogUrl`).
- Function components are typically defined with `const X = (props: IXProps) => (...)` and exported via a trailing named `export { X }` (not `export default`), except Next.js pages which require `export default`.
