import { describe, it, expect, jest } from '@jest/globals';

// expo-secure-store reaches into the native bridge via expo-modules-core,
// which is not present in the Jest Node environment. Stub it here — this
// test only smoke-checks that the supabase client wires up correctly.
jest.mock('expo-secure-store', () => ({
  getItemAsync: async () => null,
  setItemAsync: async () => undefined,
  deleteItemAsync: async () => undefined,
}));

describe('supabase client', () => {
  it('exports a client when env vars are set', () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key';
    jest.isolateModules(() => {
      const { supabase } = require('../supabase');
      expect(supabase).toBeDefined();
      expect(typeof supabase.from).toBe('function');
    });
  });
});
