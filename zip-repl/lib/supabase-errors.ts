export type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

export function getSupabaseUserMessage(error: SupabaseErrorLike | null | undefined, fallback = 'Connection error — check your internet and try again.') {
  if (!error) return fallback;

  const message = error.message ?? '';
  const code = error.code ?? '';

  if (code === '42P01' || message.toLowerCase().includes('does not exist') || message.toLowerCase().includes('relation')) {
    return 'Your Supabase project is missing the app schema. Please run the SQL setup in supabase/migrations/001_referral_codes.sql and add the profiles/matches tables expected by the app.';
  }

  if (code === '42501' || message.toLowerCase().includes('policy')) {
    return 'Supabase access is blocked by RLS. Please update your table policies for profiles and matches.';
  }

  return message || fallback;
}
