// Parses the transaction table of a KTC (Krungthai Card) credit-card
// statement, once its text has been extracted (see extractPdfText.ts).
// Hardcoded to KTC's format on purpose — see design.md Decision 2 in
// openspec/changes/2026-08-23-import-ktc-credit-card-statement: there is
// exactly one bank to support, so there's no parser interface/registry to
// abstract over yet.

export type ParsedKtcRow = {
  date: string; // YYYY-MM-DD, from the transaction (not posting) date
  description: string; // raw statement text, whitespace-normalized, verbatim
  amount: number;
};

// A transaction row is exactly: two DD/MM/YY dates, free-text description,
// then a trailing amount. Anything else (section headers, the previous-
// balance-carried line, period totals, a foreign-currency continuation line
// like "USD 0.01") has no leading date pair and simply doesn't match.
const ROW_RE =
  /^(\d{2}\/\d{2}\/\d{2})\s+\d{2}\/\d{2}\/\d{2}\s+(.+?)\s+(-?\s*[\d,]+\.\d{2})$/;

// KTC statement dates are Gregorian ("25" = 2025), not Buddhist Era.
const toIsoDate = (ddmmyy: string): string => {
  const [dd, mm, yy] = ddmmyy.split('/');
  return `20${yy}-${mm}-${dd}`;
};

export const parseKtcStatement = (text: string): ParsedKtcRow[] => {
  const rows: ParsedKtcRow[] = [];

  text.split('\n').forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    const match = line.match(ROW_RE);
    if (!match) return;

    const [, transDate, descriptionRaw, amountRaw] = match as [
      string,
      string,
      string,
      string
    ];

    // Money paid into the card (bill payments, refunds) renders as a
    // negative amount — never spending, so it's always dropped, regardless
    // of the description text (design.md Decision 3).
    if (amountRaw.includes('-')) return;

    const amount = Number(amountRaw.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) return;

    rows.push({
      date: toIsoDate(transDate),
      description: descriptionRaw.replace(/\s+/g, ' ').trim(),
      amount,
    });
  });

  return rows;
};
