# Board brief: what should Money Spending Board add next?

## The question
The owner asks which next feature is worth building for Money Spending Board, and what else should be added to the system.

## The product today
- Personal budgeting web app, Thai and English.
- Manual income and expense entry, with transfers between the user's own accounts.
- 50/30/20 split (needs / savings / wants), editable.
- Trend chart (monthly totals) and Compare chart (selected month vs previous month, by category).
- Import of credit-card statement PDFs (one bank parser today), with auto-categorisation by merchant keywords and duplicate flagging.
- iOS Shortcuts API: a bank-slip screenshot is OCR'd and saved as a transaction. Parsers exist for K PLUS, Bangkok Bank and TTB slips. Each saved row is marked as needing review.
- Landing page with user and transaction counts; PWA install and offline shell.

## Facts that are known
- Users sign in with Supabase (email or Google). Data is per user.
- Only the owner's usage is known. No user counts beyond the landing page's public stats.

## Facts that are NOT known (name them as open questions, do not guess)
- Who the paying or target users are, and how many exist.
- Whether any user would pay; no price exists.
- Which banks or wallets the owner's users actually use beyond K PLUS, BBL and TTB.
- Acquisition channel, and cost to acquire a user.

## What the board should decide
Rank candidate next features by expected value to the target user, and state which one to build first, with conditions. Candidates are open to the board; examples the owner mentioned are the 50/30/20 split, Trend and Compare charts, statement import and the Shortcuts API.
