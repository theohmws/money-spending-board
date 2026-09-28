/**
 * @jest-environment node
 */
import {
  API_TOKEN_PREFIX,
  apiTokenDisplayPrefix,
  generateApiToken,
  hashApiToken,
  shortcutEndpointUrl,
} from './apiTokens';

describe('apiTokens', () => {
  it('generates distinct, url-safe msb_ tokens with 256 bits of entropy', () => {
    const a = generateApiToken();
    const b = generateApiToken();
    expect(a).not.toBe(b);
    expect(a.startsWith(API_TOKEN_PREFIX)).toBe(true);
    // 32 bytes -> 43 unpadded base64url characters.
    expect(a.slice(API_TOKEN_PREFIX.length)).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('hashes to the SHA-256 hex digest', async () => {
    expect(await hashApiToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });

  it('keeps only a short display prefix', () => {
    expect(apiTokenDisplayPrefix('msb_AbCdEfGhIjKl')).toBe('msb_AbCdEf');
  });

  it('builds the Edge Function URL from the Supabase URL', () => {
    expect(shortcutEndpointUrl('https://x.supabase.co/')).toBe(
      'https://x.supabase.co/functions/v1/shortcut-transaction'
    );
    expect(shortcutEndpointUrl(undefined)).toBe('');
  });
});
