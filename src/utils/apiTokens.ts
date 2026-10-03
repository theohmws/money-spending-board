// Personal API tokens for the iOS Shortcuts endpoint
// (supabase/functions/shortcut-transaction). Generated and hashed entirely
// in the browser: only the SHA-256 hex digest is ever sent to Supabase, and
// the plaintext is shown to the user once.

export const API_TOKEN_PREFIX = 'msb_';

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...Array.from(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const generateApiToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `${API_TOKEN_PREFIX}${toBase64Url(bytes)}`;
};

export const hashApiToken = async (token: string) => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token)
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

// Enough to tell tokens apart in a list, far too little to use.
export const apiTokenDisplayPrefix = (token: string) =>
  token.slice(0, API_TOKEN_PREFIX.length + 6);

export const shortcutEndpointUrl = (supabaseUrl: string | undefined) =>
  supabaseUrl
    ? `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/shortcut-transaction`
    : '';
