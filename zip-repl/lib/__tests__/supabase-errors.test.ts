// @ts-nocheck
import { getSupabaseUserMessage } from '../supabase-errors';

describe('getSupabaseUserMessage', () => {
  it('maps missing table errors to a schema setup message', () => {
    const message = getSupabaseUserMessage({
      code: '42P01',
      message: 'relation "profiles" does not exist',
    });

    expect(message).toContain('missing the app schema');
  });

  it('keeps other errors as-is', () => {
    expect(getSupabaseUserMessage({ code: '23505', message: 'duplicate key value' }, 'fallback')).toBe('duplicate key value');
  });
});
