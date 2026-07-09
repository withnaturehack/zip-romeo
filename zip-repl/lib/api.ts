// lib/api.ts — All calls go directly to Supabase. No backend server required.
import { supabase } from './supabase';
import { clearPendingReferral } from './referral-pending';
import { getSupabaseUserMessage } from './supabase-errors';

// ─── Referral ─────────────────────────────────────────────────────────────────
// Schema: referral_codes(id, code, current_uses int, max_uses int, active bool, created_at)
// Run supabase/migrations/001_referral_codes.sql in the Supabase SQL editor.

export async function validateReferral(code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const normalised = code.toUpperCase().trim();

    const { data, error } = await supabase
      .from('referral_codes')
      .select('id, current_uses, max_uses, active')
      .ilike('code', normalised)
      .maybeSingle();

    if (error) {
      console.error('[validateReferral] Supabase error:', error.code, error.message);
      return { ok: false, error: getSupabaseUserMessage(error, `Validation error (${error.code ?? 'unknown'}): ${error.message}`) };
    }

    if (!data) return { ok: false, error: "That code doesn't open any door here." };
    if (!data.active) return { ok: false, error: 'This invitation code is no longer active.' };
    if (data.current_uses >= data.max_uses) return { ok: false, error: 'This code has reached its limit.' };

    return { ok: true };
  } catch {
    return { ok: false, error: 'Connection error — check your internet and try again.' };
  }
}

/** @deprecated Use validateReferral — kept for existing imports */
export const redeemReferral = validateReferral;

async function consumeReferralCode(code: string): Promise<void> {
  const normalised = code.toUpperCase().trim();
  const { error: rpcErr } = await supabase.rpc('consume_referral_code', { p_code: normalised });
  if (!rpcErr) return;

  const { data } = await supabase
    .from('referral_codes')
    .select('id, current_uses, max_uses, active')
    .ilike('code', normalised)
    .maybeSingle();

  if (!data?.active || data.current_uses >= data.max_uses) return;

  const { error: updateErr } = await supabase
    .from('referral_codes')
    .update({ current_uses: data.current_uses + 1 })
    .eq('id', data.id);

  if (updateErr) console.error('[consumeReferralCode]', updateErr.code, updateErr.message);
}

export async function getMyReferralCode(): Promise<{ code: string | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('ensure_my_referral_code');
    if (error) return { code: null, error: getSupabaseUserMessage(error, error.message) };
    return { code: data as string };
  } catch {
    return { code: null, error: 'Connection error — check your internet and try again.' };
  }
}

export type MyReferral = { first_name: string | null; phase: string; created_at: string };

export async function getMyReferrals(): Promise<{ referrals: MyReferral[]; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_my_referrals');
    if (error) return { referrals: [], error: getSupabaseUserMessage(error, error.message) };
    return { referrals: (data ?? []) as MyReferral[] };
  } catch {
    return { referrals: [], error: 'Connection error — check your internet and try again.' };
  }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function saveProfile(input: {
  firstName: string;
  socialHandle?: string | null;
  bio?: string | null;   // kept in input type for UI compat; not stored (no DB column)
  photoUrls: string[];
  referralCode?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return { ok: false, error: 'You must be signed in to save your profile.' };

    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          first_name: input.firstName,
          social_handle: input.socialHandle ?? null,
          // bio is intentionally omitted — no 'bio' column in profiles schema
          photo_urls: input.photoUrls,
          referral_code: input.referralCode ?? null,
          phase: 'PENDING_APPROVAL',
        },
        { onConflict: 'user_id' }
      );

    if (error) return { ok: false, error: getSupabaseUserMessage(error, error.message) };

    if (input.referralCode) {
      await consumeReferralCode(input.referralCode);
    }

    await clearPendingReferral();

    return { ok: true };
  } catch {
    return { ok: false, error: 'Connection error — check your internet and try again.' };
  }
}
