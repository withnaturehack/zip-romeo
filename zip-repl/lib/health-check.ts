// RJ-APP/lib/health-check.ts
import { Platform } from 'react-native';

interface HealthStatus {
  platform: string;
  supabaseUrl: boolean;
  supabaseKey: boolean;
  supabaseClient: string;
  error?: string;
}

export async function checkHealth(): Promise<HealthStatus> {
  const status: HealthStatus = {
    platform: Platform.OS,
    supabaseUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    supabaseClient: 'pending',
  };

  try {
    // Try to import and initialize Supabase
    const { supabase } = await import('./supabase');
    if (supabase) {
      status.supabaseClient = 'ready';
      console.log('[HealthCheck] Supabase client initialized successfully');
    } else {
      status.supabaseClient = 'failed - no client';
      status.error = 'Supabase client is undefined';
    }
  } catch (e) {
    status.supabaseClient = 'error';
    status.error = e instanceof Error ? e.message : String(e);
    console.error('[HealthCheck] Supabase initialization error:', status.error);
  }

  console.log('[HealthCheck] Status:', JSON.stringify(status, null, 2));
  return status;
}

export function logHealth(status: HealthStatus): void {
  console.log(`[HealthCheck] Platform: ${status.platform}`);
  console.log(`[HealthCheck] Supabase URL: ${status.supabaseUrl ? '✓' : '✗'}`);
  console.log(`[HealthCheck] Supabase Key: ${status.supabaseKey ? '✓' : '✗'}`);
  console.log(`[HealthCheck] Supabase Client: ${status.supabaseClient}`);
  if (status.error) {
    console.error(`[HealthCheck] Error: ${status.error}`);
  }
}
