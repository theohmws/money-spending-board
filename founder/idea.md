# Money Spending Board

- What it is: a personal budgeting web app (Next.js + Supabase) that records income and spending, splits them 50/30/20 (needs / savings / wants), charts trends and month comparisons, imports credit-card statement PDFs, and accepts bank-slip screenshots through an iOS Shortcuts API.
- Who it is for: individuals in Thailand who want to track spending by hand and from bank slips and cards, in Thai or English. (Stated by the owner; no market research yet.)
- What it sells, at what price: not stated. Currently a personal app with no paid tier. Price is an open question.
- Where and how: online web app with PWA install and an offline read-only shell. Users sign in with email or Google. Acquisition channel is not stated.
- Budget and constraints: not stated. Existing stack and decisions: Supabase schema `spending_board`, Next.js static export, Supabase Edge Function for the Shortcuts API, bank-specific slip parsers (K PLUS, BBL, TTB). Open question: which next feature the owner wants.
