// Pure request parsing/validation for the `shortcut-transaction` Edge
// Function. Deliberately import-free, so it runs unchanged under both Deno
// (imported by index.ts) and jest (payload.test.ts).

export type CategoryId = 'needs' | 'savings' | 'wants';
export type TxType = 'expense' | 'income';

export const SHORTCUT_SOURCE = 'ios_shortcut';
export const SLIP_SOURCE = 'slip_ocr';

// `slip_ocr:<bank>` (e.g. "slip_ocr:BBL") when the issuing bank is known —
// from the slip text first, else the Shortcut's album name — so the board
// can badge the row with the bank; plain `slip_ocr` otherwise.
export const slipSource = (
  bank: string | null,
  album: string | null
): string => {
  const label = (bank ?? album ?? '').replace(/\s+/g, ' ').trim().slice(0, 20);
  return label ? `${SLIP_SOURCE}:${label}` : SLIP_SOURCE;
};
export const TOKEN_PREFIX = 'msb_';

const CATEGORIES: readonly CategoryId[] = ['needs', 'savings', 'wants'];
const TYPES: readonly TxType[] = ['expense', 'income'];
const MAX_NOTE_LENGTH = 200;

export type InsertPayload = {
  kind: 'insert';
  type: TxType;
  amount: number;
  note: string | null;
  // null means "not given": the function guesses it from the note for an
  // expense, and it's always null for income.
  category: CategoryId | null;
  date: string | null;
};

export type UpdatePayload = {
  kind: 'update';
  id: string;
  // Only the keys present in the request body are set; everything else is
  // left untouched on the existing row.
  changes: Partial<{
    type: TxType;
    amount: number;
    note: string;
    category: CategoryId | null;
    date: string;
  }>;
};

export type ParseResult =
  | { ok: true; value: InsertPayload | UpdatePayload }
  | { ok: false; error: string };

const fail = (error: string): ParseResult => ({ ok: false, error });

// Shortcuts' "Number" and "Text" actions both end up in JSON, and a Thai/
// English locale may format the number with thousands separators or a
// currency sign, so accept "1,234.50" / "฿120" as well as a plain number.
export const parseAmount = (raw: unknown): number | null => {
  let value: number;
  if (typeof raw === 'number') {
    value = raw;
  } else if (typeof raw === 'string') {
    const cleaned = raw.replace(/[,\s฿]/g, '').replace(/^THB/i, '');
    if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
    value = Number(cleaned);
  } else {
    return null;
  }
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
};

// Accepts YYYY-MM-DD, or a full ISO 8601 timestamp (Shortcuts' "ISO 8601"
// date format) whose calendar date is taken as-is, without a timezone
// conversion — the date the user saw on their phone is the one they mean.
export const parseDate = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(raw.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(`${y}-${m}-${d}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Rejects rollovers like 2026-02-31 -> 2026-03-03.
  if (date.toISOString().slice(0, 10) !== `${y}-${m}-${d}`) return null;
  return `${y}-${m}-${d}`;
};

// "Today" in the board's home timezone rather than the Edge runtime's UTC,
// so a Shortcut run at 06:00 in Bangkok doesn't land on yesterday.
export const todayIn = (timeZone: string, now = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

const parseCategory = (raw: unknown): CategoryId | null | undefined => {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  return (CATEGORIES as readonly string[]).includes(value)
    ? (value as CategoryId)
    : null;
};

const parseType = (raw: unknown): TxType | null | undefined => {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  return (TYPES as readonly string[]).includes(value)
    ? (value as TxType)
    : null;
};

const parseNote = (raw: unknown): string | null | undefined => {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== 'string') return null;
  return raw.trim().slice(0, MAX_NOTE_LENGTH);
};

export const parsePayload = (body: unknown): ParseResult => {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return fail('Body must be a JSON object');
  }
  const input = body as Record<string, unknown>;

  const type = parseType(input.type);
  if (type === null) return fail('type must be "expense" or "income"');

  const category = parseCategory(input.category);
  if (category === null) {
    return fail('category must be "needs", "savings" or "wants"');
  }

  const note = parseNote(input.note);
  if (note === null) return fail('note must be a string');

  let amount: number | undefined;
  if (input.amount !== undefined && input.amount !== null) {
    const parsed = parseAmount(input.amount);
    if (parsed === null) return fail('amount must be a positive number');
    amount = parsed;
  }

  let date: string | undefined;
  if (input.date !== undefined && input.date !== null && input.date !== '') {
    const parsed = parseDate(input.date);
    if (parsed === null) return fail('date must be YYYY-MM-DD');
    date = parsed;
  }

  const rawId = input.id;
  if (rawId !== undefined && rawId !== null && rawId !== '') {
    if (typeof rawId !== 'string') return fail('id must be a string');

    const changes: UpdatePayload['changes'] = {};
    if (type !== undefined) changes.type = type;
    if (amount !== undefined) changes.amount = amount;
    if (note !== undefined) changes.note = note;
    if (date !== undefined) changes.date = date;
    if (category !== undefined) changes.category = category;
    // Switching a row to income drops its category, same as the in-app
    // edit form (income never carries one).
    if (type === 'income') changes.category = null;

    if (Object.keys(changes).length === 0) {
      return fail('Nothing to update');
    }
    return { ok: true, value: { kind: 'update', id: rawId, changes } };
  }

  if (amount === undefined) return fail('amount is required');

  const resolvedType = type ?? 'expense';
  return {
    ok: true,
    value: {
      kind: 'insert',
      type: resolvedType,
      amount,
      note: note || null,
      category: resolvedType === 'income' ? null : category ?? null,
      date: date ?? null,
    },
  };
};

// Same rule as useImportCategoryRules.guessCategory: longest matching
// keyword wins, case-insensitively, defaulting to "wants".
export const guessCategory = (
  description: string,
  rules: { keyword: string; category: CategoryId }[]
): CategoryId => {
  const upper = description.toUpperCase();
  const match = [...rules]
    .sort((a, b) => b.keyword.length - a.keyword.length)
    .find((rule) => upper.includes(rule.keyword.toUpperCase()));
  return match?.category ?? 'wants';
};

export const bearerToken = (header: string | null): string | null => {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  const token = match?.[1];
  return token && token.startsWith(TOKEN_PREFIX) ? token : null;
};
