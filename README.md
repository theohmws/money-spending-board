# 💰 Money Spending Board

A personal budgeting app built with Next.js 16 (App Router), TypeScript, and Tailwind CSS. Track transactions, split your budget across an editable needs/savings/wants ratio (50/30/20 by default), and switch between Thai and English — all backed by Supabase, with a fully offline **demo mode** for trying it out without any setup.

### Features

- 🔐 Email/password auth via [Supabase](https://supabase.com)
- 💸 Add, edit, and categorize transactions with per-category icons and colors
- 📊 Editable needs/savings/wants budget split (defaults to 50/30/20, must sum to 100)
- 🌗 Light/dark theme toggle
- 🇹🇭 🇬🇧 Thai/English language toggle
- 🧪 **Demo mode** — no Supabase project required. Sign in with any email/password and everything persists to `localStorage`
- 📱 Responsive, self-contained board UI (`app/page.tsx`)

### Tech stack

- [Next.js 16](https://nextjs.org) App Router, statically exported (`output: 'export'` in `next.config.js`)
- TypeScript in strict mode
- Tailwind CSS v3
- [Supabase](https://supabase.com) (`@supabase/supabase-js`) for auth + data, optional
- Jest + React Testing Library, Storybook 10, Cypress (e2e)
- ESLint (Airbnb + Next.js config) + Prettier, Husky + lint-staged, Commitlint + Commitizen, semantic-release

This project was originally scaffolded from the [Next.js Boilerplate](https://github.com/ixartz/Next-js-Boilerplate) template. The `about` and `blog` routes are unmodified boilerplate placeholders kept around from that scaffold — the actual product is the board on the home page.

### Requirements

- Node.js 20+

### Getting started

```shell
git clone https://github.com/theohmws/money-spending-board.git
cd money-spending-board
npm install
```

Then run the dev server:

```shell
npm run dev
```

Open http://localhost:3000 — the board loads straight into **demo mode**: sign in with any email/password and start adding transactions, no backend needed. To connect a real Supabase project instead, use the "Connect Supabase" option in the app to set your project URL and anon key (stored in `localStorage`, no rebuild required).

### Project structure

```shell
.
├── app                      # Next.js App Router routes
│   ├── page.tsx              # The board — the actual product
│   ├── about, blog            # Unmodified boilerplate placeholders
│   ├── layout.tsx, sitemap.ts, robots.ts
├── src
│   ├── hooks/useSpendingBoard.ts   # All board state/handlers (session, transactions, ratios, theme, lang...)
│   ├── components/board/          # Board UI: AuthScreen, BoardHeader, BudgetSplit, TransactionList, modals
│   ├── templates/Main.tsx         # Site chrome (header/nav/footer) for about/blog
│   ├── utils/BoardConfig.ts       # Category groups, icons, colors, Thai/English i18n dictionary
│   ├── utils/boardHelpers.ts      # Pure helpers (fmtMoney, themeTokens, ...)
│   └── utils/AppConfig.ts         # Site metadata
├── cypress/e2e                # Cypress specs (predate the board, stale)
├── tailwind.config.js
└── tsconfig.json
```

See `CLAUDE.md` for a deeper architectural walkthrough.

### Commands

```shell
npm run dev                  # dev server with live reload, http://localhost:3000

npm run lint                  # eslint .
npm run format                 # eslint --fix + prettier on json/yaml
npm run check-types            # tsc --noEmit for both app and cypress tsconfigs

npm run test                   # jest (unit tests, colocated *.test.tsx)
npm run storybook               # Storybook dev server on :6006
npm run storybook:build         # build static storybook
npm run test-storybook:ci       # serve built storybook + run @storybook/test-runner against it

npm run cypress                 # open Cypress interactively
npm run e2e                      # start dev server + run Cypress (interactive)
npm run e2e:headless              # start dev server + run Cypress (headless)

npm run build                    # next build -> static export in `out/`
npm run build-prod                # clean + build
npm run start                     # next start (production server mode)

npm run commit                    # Commitizen prompt for a Conventional Commit message
```

### Testing

Unit tests are colocated next to what they test (e.g. `app/about/page.test.tsx` tests `app/about/page.tsx`). Storybook stories are colocated too (`*.stories.tsx`). Cypress specs under `cypress/e2e` predate the board feature and still assert against the old boilerplate content — they're known-stale, not a regression bar, until rewritten for the current app.

### Commit messages

The project enforces [Conventional Commits](https://www.conventionalcommits.org/), validated by commitlint in CI on PRs. Use the guided Commitizen flow:

```shell
npm run commit
```

Conventional Commits also drive automatic changelog generation and versioning via `semantic-release` on `main`.

### Deploying

The app is statically exported — `npm run build-prod` produces a static site in `out/`, deployable to any static host (Vercel, Netlify, GitHub Pages, etc.). No server runtime is required.

### License

Licensed under the MIT License — see [LICENSE](LICENSE) for more information. Based on the [Next.js Boilerplate](https://github.com/ixartz/Next-js-Boilerplate) by CreativeDesignsGuru.
