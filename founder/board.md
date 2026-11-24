# Board summary: next feature for Money Spending Board

## 1. Vote
2 of 3 would fund only if conditions are met. Vote: 3 × FUND IF.
Scores: Offers 3, Monopoly 4, Product 6. Average 4.3 / 10.

## 2. Risks raised by more than one member
- **No evidence of paying users.** Only the owner uses the app. No price exists. (Offers, Monopoly, Product)
- **No reachable channel and unknown cost to acquire a user.** (Offers, Monopoly)
- **Feature sprawl before the core loop is proven.** (Product, Offers)
- **TTB parser is tested only on a synthetic slip,** not a real one. (Offers, Product)

## 3. Conditions (checklist)
- [ ] Name one small target group, with a count of people in it.
- [ ] Get at least one non-owner user into the capture path, with a retention threshold set in advance.
- [ ] Run a paid-intent test (waitlist or pre-sale) at one price. Measure conversion. If nobody signs up, the verdict is PASS.
- [ ] Measure cost per user from one acquisition channel with real numbers.
- [ ] Pick the first feature by measured effort reduction. Slip capture → needs_review → confirm is the likely first build.
- [ ] Test the TTB parser on a real slip before claiming TTB support.
- [ ] Add banks or wallets only when real users need them (Monopoly).
- [ ] Each new feature gets a one-sentence justification. Cut unused features before adding more.

## 4. Strongest version the board can see
Narrow the product to "snap a bank slip, review it, done" for Thai users who already use K PLUS, BBL or TTB. Its edge is local bank-slip knowledge and low manual entry, not charts. Charts and the 50/30/20 split are supporting features, not the lead. Open questions still block any decision on market size, price and acquisition cost.

## Open questions (answered by other skills)
- Market size, price, willingness to pay → `/founder-consumer`, `/founder-pricing`
- Competitors and substitutes → `/founder-competitors`
- Unit economics and cost per user → `/founder-cfo`
