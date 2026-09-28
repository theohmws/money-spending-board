// Pure parsing of OCR'd bank transfer-slip text (iOS Shortcuts' "Extract
// Text from Image" run over a K PLUS slip screenshot) into a transaction.
// Import-free, like payload.ts, so it runs under both Deno and jest.
//
// OCR output is line-based but loose: a label and its value may share a
// line or sit on consecutive lines, dots/spaces in Thai month abbreviations
// get dropped, and thousands separators can go missing. Every extractor
// below therefore tolerates both layouts and falls back to a weaker signal
// rather than failing outright.

export type ParsedSlip = {
  amount: number;
  // Calendar date printed on the slip, if one could be read.
  date: string | null;
  // The bank's transaction reference, used to make re-running the
  // Shortcut over the same screenshot idempotent.
  reference: string | null;
  memo: string | null;
  recipient: string | null;
};

const MONEY_RE = /(\d{1,3}(?:,\d{3})+|\d+)\.\d{2}(?!\d)/g;

const AMOUNT_LABEL_RE = /(จำนวนเงิน|จำนวน|amount)/i;
const FEE_LABEL_RE = /(ค่าธรรมเนียม|fee)/i;
const REFERENCE_LABEL_RE =
  /(เลขที่รายการ|รหัสอ้างอิง|เลขที่อ้างอิง|transaction\s*(id|no)|ref(erence)?\s*(no|id)?)/i;
const MEMO_LABEL_RE = /(บันทึกช่วยจำ|บันทึก|memo|note)\s*[:：]?\s*/i;
const NAME_PREFIX_RE =
  /^(นาย|นาง|น\.?\s?ส\.?|ด\.?\s?[ชญ]\.?|บจก\.?|บริษัท|หจก\.?|mr\.?|mrs\.?|ms\.?|miss)\s*\S/i;

const THAI_MONTHS: [string, number][] = [
  ['มค', 1],
  ['กพ', 2],
  ['มีค', 3],
  ['เมย', 4],
  ['พค', 5],
  ['มิย', 6],
  ['กค', 7],
  ['สค', 8],
  ['กย', 9],
  ['ตค', 10],
  ['พย', 11],
  ['ธค', 12],
];
const EN_MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

const toMoney = (raw: string) => Number(raw.replace(/,/g, ''));

const moneyIn = (line: string) =>
  Array.from(line.matchAll(MONEY_RE), (m) => toMoney(m[0]));

const lines = (text: string) =>
  text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

// Value of a "label: value" pair, whether the value follows on the same
// line or on the next one.
const valueAfterLabel = (all: string[], index: number, label: RegExp) => {
  const line = all[index] ?? '';
  const match = label.exec(line);
  const rest = match
    ? line
        .slice(match.index + match[0].length)
        .replace(/^\s*[:：]\s*/, '')
        .trim()
    : '';
  return rest || (all[index + 1] ?? '').trim();
};

export const extractAmount = (all: string[]): number | null => {
  for (let i = 0; i < all.length; i += 1) {
    const line = all[i]!;
    if (AMOUNT_LABEL_RE.test(line) && !FEE_LABEL_RE.test(line)) {
      const found = [
        ...moneyIn(line),
        ...moneyIn(all[i + 1] ?? ''),
        ...moneyIn(all[i + 2] ?? ''),
      ].find((value) => value > 0);
      if (found) return found;
    }
  }
  // No usable label: the transfer amount is the largest figure on a slip
  // (the fee, if any, is always smaller).
  const values = all
    .filter((line) => !FEE_LABEL_RE.test(line))
    .flatMap(moneyIn)
    .filter((value) => value > 0);
  return values.length ? Math.max(...values) : null;
};

export const extractReference = (all: string[]): string | null => {
  const looksLikeRef = (token: string) =>
    /^[0-9A-Za-z]{10,}$/.test(token) && /\d/.test(token);

  for (let i = 0; i < all.length; i += 1) {
    if (REFERENCE_LABEL_RE.test(all[i]!)) {
      const token = valueAfterLabel(all, i, REFERENCE_LABEL_RE)
        .split(' ')
        .find(looksLikeRef);
      if (token) return token;
    }
  }
  const fallback = all
    .flatMap((line) => line.split(' '))
    .find((token) => looksLikeRef(token) && token.length >= 15);
  return fallback ?? null;
};

export const extractMemo = (all: string[]): string | null => {
  for (let i = 0; i < all.length; i += 1) {
    if (MEMO_LABEL_RE.test(all[i]!)) {
      const value = valueAfterLabel(all, i, MEMO_LABEL_RE);
      // The next line may itself be another label (empty memo).
      if (value && !/[:：]\s*$/.test(value) && !/สแกน|scan/i.test(value)) {
        return value.slice(0, 200);
      }
    }
  }
  return null;
};

// A slip lists the sender first and the recipient second; both usually
// start with an honorific or company prefix.
export const extractRecipient = (all: string[]): string | null => {
  const names = all.filter((line) => NAME_PREFIX_RE.test(line));
  return names[1] ?? null;
};

const isoDate = (y: number, m: number, d: number) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
};

// Thai slips print a Buddhist-era year, usually 2-digit ("28 ก.ย. 69" is
// 28 Sep 2569 BE = 2026 CE); English slips print a CE year.
const resolveYear = (raw: string, thai: boolean) => {
  let year = Number(raw);
  if (raw.length === 2) year += thai ? 2500 : 2000;
  if (year > 2400) year -= 543;
  return year;
};

export const extractDate = (all: string[]): string | null => {
  const thaiAlternation = THAI_MONTHS.map(([key]) =>
    Array.from(key)
      .map((ch) => `${ch}\\.?\\s?`)
      .join('')
  ).join('|');
  const thaiRe = new RegExp(
    `(\\d{1,2})\\s*(${thaiAlternation})\\s*(\\d{4}|\\d{2})(?!\\d)`
  );
  const enRe =
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(\d{4}|\d{2})(?!\d)/i;

  for (const line of all) {
    const thai = thaiRe.exec(line);
    if (thai) {
      const key = thai[2]!.replace(/[.\s]/g, '');
      const month = THAI_MONTHS.find(([k]) => k === key)?.[1];
      if (month) {
        const date = isoDate(
          resolveYear(thai[3]!, true),
          month,
          Number(thai[1])
        );
        if (date) return date;
      }
    }
    const en = enRe.exec(line);
    if (en) {
      const month = EN_MONTHS.indexOf(en[2]!.toLowerCase().slice(0, 3)) + 1;
      const date = isoDate(resolveYear(en[3]!, false), month, Number(en[1]));
      if (date) return date;
    }
  }
  return null;
};

export const parseSlipText = (text: string): ParsedSlip | null => {
  const all = lines(text);
  const amount = extractAmount(all);
  if (!amount) return null;
  return {
    amount: Math.round(amount * 100) / 100,
    date: extractDate(all),
    reference: extractReference(all),
    memo: extractMemo(all),
    recipient: extractRecipient(all),
  };
};

// A body looks like a slip upload (the "Upload Bank Slip" Shortcut sends
// { ts, text, album }) when it carries OCR text and no explicit amount.
export const isSlipBody = (body: unknown): body is Record<string, unknown> =>
  typeof body === 'object' &&
  body !== null &&
  !Array.isArray(body) &&
  typeof (body as Record<string, unknown>).text === 'string' &&
  (body as Record<string, unknown>).amount === undefined;
