// Insert or update a transaction from outside the board (an iOS Shortcut),
// authenticated by a personal API token instead of a Supabase session.
//
//   POST /functions/v1/shortcut-transaction
//   Authorization: Bearer msb_...
//   { "amount": 120, "note": "Coffee", "category": "wants", "date": "2026-09-28" }
//   { "id": "<existing id>", "amount": 150 }   <- update, only given fields
//
// Deployed with verify_jwt = false (supabase/config.toml): the bearer token
// is ours, not a Supabase JWT, and is checked below against
// spending_board.api_tokens. See
// openspec/changes/2026-09-28-ios-shortcuts-transaction-api/design.md.
import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  bearerToken,
  guessCategory,
  parsePayload,
  SHORTCUT_SOURCE,
  todayIn,
} from './payload.ts';

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

  const parsed = parsePayload(body);
  if (!parsed.ok) return json(400, { error: parsed.error });

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

  const payload = parsed.value;

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
    return json(200, { transaction: data });
  }

  let { category } = payload;
  if (payload.type === 'expense' && !category) {
    const { data: rules } = await admin
      .from('import_category_rules')
      .select('keyword, category')
      .eq('user_id', userId);
    category = guessCategory(payload.note ?? '', rules ?? []);
  }

  const { data, error } = await admin
    .from('transactions')
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      type: payload.type,
      category,
      note: payload.note ?? (payload.type === 'income' ? 'Income' : 'Expense'),
      amount: payload.amount,
      date: payload.date ?? todayIn(BOARD_TIMEZONE),
      source: SHORTCUT_SOURCE,
      needs_review: false,
    })
    .select()
    .single();
  if (error) return json(400, { error: error.message });
  return json(201, { transaction: data });
});
