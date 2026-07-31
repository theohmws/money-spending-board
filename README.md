# 💰 Money Spending Board

A personal budgeting app built with Next.js 16 (App Router), TypeScript, and Tailwind CSS. Track transactions, split your budget across an editable needs/savings/wants ratio (50/30/20 by default), view trend and compare spending charts, and switch between Thai and English — all backed by a fixed Supabase project configured via environment variables.

### Features

- 🔐 Email/password + Google OAuth sign-in via [Supabase](https://supabase.com) (other providers configurable via env var)
- 💸 Add, edit, delete, and categorize transactions with per-category icons and colors
- 📊 Editable needs/savings/wants budget split (defaults to 50/30/20, must sum to 100)
- 📈 Trend and compare spending charts (Overview/Graph tabs — monthly income/expense trend and this-month-vs-previous per category)
- 🌗 Light/dark theme toggle
- 🇹🇭 🇬🇧 Thai/English language toggle
- 📱 Responsive, self-contained board UI (`app/page.tsx`)

### Tech stack

- [Next.js 16](https://nextjs.org) App Router, statically exported (`output: 'export'` in `next.config.js`)
- TypeScript in strict mode
- Tailwind CSS v3
- [Supabase](https://supabase.com) (`@supabase/supabase-js`) for auth + data, required at build time
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

Copy `.env.example` to `.env.local` and fill in your Supabase project's publishable key (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — from Project Settings → API Keys in the Supabase dashboard). These are required at build time; there's no in-app config flow or offline fallback. `NEXT_PUBLIC_SUPABASE_AUTH_PROVIDERS` (comma-separated, defaults to `google`) controls which OAuth "Continue with ___" buttons render — each provider must also be enabled in the Supabase dashboard under Auth → Providers; set it to an empty string to disable OAuth and use email/password only.

```shell
cp .env.example .env.local
```

Then run the dev server:

```shell
npm run dev
```

Open http://localhost:3000.

### Project structure

```shell
.
├── app                      # Next.js App Router routes
│   ├── page.tsx              # The board — the actual product
│   ├── about, blog            # Unmodified boilerplate placeholders
│   ├── layout.tsx, sitemap.ts, robots.ts
├── src
│   ├── hooks/useSpendingBoard.ts   # Orchestrator composing the domain-sliced hooks below
│   ├── hooks/useAuthSession.ts     # Supabase session, email/password + OAuth sign-in
│   ├── hooks/useTransactions.ts    # Supabase-backed transactions CRUD + add/edit modal state
│   ├── hooks/useRatios.ts, useProfile.ts, useCategoryMeta.ts  # localStorage-backed slices
│   ├── hooks/useI18n.ts, useTheme.ts   # Language + theme state
│   ├── components/board/          # Board UI: BoardCard, AuthScreen, BoardHeader, BoardTabs,
│   │                               #   BudgetSplit, TransactionList, TrendChart, CompareChart, modals
│   ├── templates/Main.tsx         # Site chrome (header/nav/footer) for about/blog
│   ├── utils/BoardConfig.ts       # Category groups, icons, colors, Thai/English i18n dictionary
│   ├── utils/boardHelpers.ts      # Pure helpers (fmtMoney, themeTokens, monthKey, ...)
│   └── utils/AppConfig.ts         # Site metadata
├── supabase/migrations         # Schema for the spending_board.transactions table + RLS policies
├── openspec                    # Change proposals and specs for non-trivial features
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
