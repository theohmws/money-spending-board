// Insert or update a transaction from outside the board (an iOS Shortcut),
// authenticated by a personal API token instead of a Supabase session.
//
//   POST /functions/v1/shortcut-transaction
//   Authorization: Bearer msb_...
//   { "amount": 120, "note": "Coffee", "category": "wants", "date": "2026-09-28" }
//   { "id": "<existing id>", "amount": 150 }   <- update, only given fields
//   { "ts": "...", "text": "<OCR of a bank slip>", "album": "K PLUS" }
//                                              <- parse a bank slip (slip.ts)
//
// Deployed with verify_jwt = false (supabase/config.toml): the bearer token
// is ours, not a Supabase JWT, and is checked below against
// spending_board.api_tokens. See
// openspec/changes/2026-09-28-ios-shortcuts-transaction-api/design.md.
import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  bearerToken,
  guessCategory,
  parseDate,
  parsePayload,
  SHORTCUT_SOURCE,
  slipSource,
  todayIn,
} from './payload.ts';
import { isOwnTransfer, isSlipBody, parseSlipText } from './slip.ts';

const BOARD_TIMEZONE = Deno.env.get('BOARD_TIMEZONE') ?? 'Asia/Bangkok';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed, use POST' });
  }

  const token = bearerToken(req.headers.get('Authorization'));
  if (!token) return json(401, { error: 'Missing or malformed API token' });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Body must be valid JSON' });
  }

  const slipBody = isSlipBody(body) ? body : null;
  const parsed = slipBody ? null : parsePayload(body);
  if (parsed && !parsed.ok) return json(400, { error: parsed.error });
  const slipText = String(slipBody?.text ?? '');
  const slip = slipBody ? parseSlipText(slipText) : null;
  // 200, not 4xx: the slip Shortcut loops over every photo in an album, and
  // one unreadable image shouldn't look like a failed run.
  if (slipBody && !slip) {
    return json(200, {
      status: 'skipped',
      message: 'Skipped: no amount found on this image',
    });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { db: { schema: 'spending_board' }, auth: { persistSession: false } }
  );

  const { data: tokenRow, error: tokenError } = await admin
    .from('api_tokens')
    .select('id, user_id')
    .eq('token_hash', await sha256Hex(token))
    .maybeSingle();
  if (tokenError) return json(500, { error: 'Could not verify API token' });
  if (!tokenRow) return json(401, { error: 'Invalid or revoked API token' });

  const userId: string = tokenRow.user_id;

  // Best-effort bookkeeping; a failure here shouldn't fail the request.
  await admin
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenRow.id);

  const guess = async (description: string) => {
    const { data: rules } = await admin
      .from('import_category_rules')
      .select('keyword, category')
      .eq('user_id', userId);
    return guessCategory(description, rules ?? []);
  };

  if (slip) {
    // Duplicates are detected by the slip's own transaction ID only: the
    // row id is derived from user + slip ID, so re-running the Shortcut over
    // the same day's screenshots skips slips already saved. Without a
    // readable ID there's no reliable key (the Shortcut resends every
    // photo on each run), so the slip is skipped rather than risk
    // inserting it again on every run.
    if (!slip.reference) {
      return json(200, {
        status: 'skipped',
        message: `Skipped ฿${slip.amount.toFixed(
          2
        )}: couldn't read the slip ID (เลขที่รายการ)`,
      });
    }
    const id = `slip_${(await sha256Hex(`${userId}:${slip.reference}`)).slice(
      0,
      32
    )}`;
    // Bank detected from the slip text, else the Shortcut's album name
    // (e.g. "K PLUS"), so an unlabeled slip still says which bank it's from.
    const album =
      typeof slipBody?.album === 'string' ? slipBody.album.trim() : '';
    const bankLabel = slip.bank ?? (album || null);
    const note = slip.memo ?? slip.recipient ?? bankLabel ?? 'Bank slip';
    const { data: settings } = await admin
      .from('board_settings')
      .select('own_names')
      .eq('user_id', userId)
      .maybeSingle();
    const isTransfer = isOwnTransfer(
      slip,
      (settings?.own_names as string[] | null) ?? []
    );
    const row = {
      id,
      user_id: userId,
      type: isTransfer ? 'transfer' : 'expense',
      category: isTransfer
        ? null
        : await guess(`${slip.memo ?? ''} ${slip.recipient ?? ''}`),
      note,
      amount: slip.amount,
      date: slip.date ?? parseDate(slipBody?.ts) ?? todayIn(BOARD_TIMEZONE),
      source: slipSource(slip.bank, album || null),
      // OCR is a best guess — flag it for the board's "Needs review" filter.
      needs_review: true,
    };
    const { data, error } = await admin
      .from('transactions')
      .upsert(row, { onConflict: 'id', ignoreDuplicates: true })
      .select();
    if (error) return json(400, { error: error.message });
    const created = (data ?? []).length > 0;
    return json(created ? 201 : 200, {
      status: created ? 'created' : 'duplicate',
      slipId: slip.reference,
      bank: bankLabel,
      message: `${created ? 'Saved' : 'Already saved'} ฿${slip.amount.toFixed(
        2
      )} · ${note}`,
      transaction: created ? data![0] : row,
    });
  }

  const payload = parsed!.value;

  // The service role bypasses RLS, so every query below scopes to the
  // token owner's user_id explicitly.
  if (payload.kind === 'update') {
    const { data, error } = await admin
      .from('transactions')
      .update(payload.changes)
      .eq('id', payload.id)
      .eq('user_id', userId)
      .select()
      .maybeSingle();
    if (error) return json(400, { error: error.message });
    if (!data) return json(404, { error: 'Transaction not found' });
    return json(200, { status: 'updated', transaction: data });
  }

  let { category } = payload;
  if (payload.type === 'expense' && !category) {
    category = await guess(payload.note ?? '');
  }

  const { data, error } = await admin
    .from('transactions')
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      type: payload.type,
      category,
      note:
        payload.note ??
        { expense: 'Expense', income: 'Income', transfer: 'Transfer' }[
          payload.type
        ],
      amount: payload.amount,
      date: payload.date ?? todayIn(BOARD_TIMEZONE),
      source: SHORTCUT_SOURCE,
      needs_review: false,
    })
    .select()
    .single();
  if (error) return json(400, { error: error.message });
  return json(201, {
    status: 'created',
    message: `Saved ฿${payload.amount.toFixed(2)} · ${data.note}`,
    transaction: data,
  });
});
