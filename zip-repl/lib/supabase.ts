// RJ-APP/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { storage } from './storage';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!url || !anon) {
  console.error(
    '[Supabase] MISSING env vars — EXPO_PUBLIC_SUPABASE_URL and/or EXPO_PUBLIC_SUPABASE_ANON_KEY are not set.\n' +
    'Copy .env.local.example → .env.local and fill in your project credentials.'
  );
}

// Fall back to placeholder so the app can render an error state rather than crashing at import
const safeUrl = url || 'https://placeholder.supabase.co';
const safeKey = anon || 'placeholder-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    // Must be true on web to pick up OAuth tokens from the redirect URL hash
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Helper: sign out and clear all local session data
export async function signOutCompletely(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // best-effort; clear storage manually
  }
  try {
    await storage.removeItem('supabase.auth.token');
    await storage.removeItem('rj-session');
  } catch {
    // ignore
  }
}
