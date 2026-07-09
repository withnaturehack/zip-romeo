-- Run in Supabase Dashboard → SQL Editor (one-time).
-- Adds per-user referral codes so each member can invite friends and see who joined.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS own_referral_code text UNIQUE;

-- Lets a signed-in user see the (limited) profile rows of people who joined using
-- their personal code — needed for the "Referrals" screen list.
DROP POLICY IF EXISTS "profiles_referred_select" ON profiles;
CREATE POLICY "profiles_referred_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    referral_code = (SELECT p.own_referral_code FROM profiles p WHERE p.user_id = auth.uid())
  );

-- Generates (if missing) and returns the caller's personal referral code, also
-- registering it in referral_codes so it works at sign-up like any other code.
CREATE OR REPLACE FUNCTION public.ensure_my_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_name text;
BEGIN
  SELECT own_referral_code, first_name INTO v_code, v_name
  FROM profiles WHERE user_id = auth.uid();

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  v_code := upper(regexp_replace(coalesce(v_name, 'FRIEND'), '[^A-Za-z]', '', 'g'));
  v_code := left(coalesce(v_code, 'FRIEND'), 8) || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

  UPDATE profiles SET own_referral_code = v_code WHERE user_id = auth.uid();

  INSERT INTO referral_codes (code, max_uses, active)
  VALUES (v_code, 1000, true)
  ON CONFLICT (code) DO NOTHING;

  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_referral_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_referral_code() TO authenticated;

-- Returns the people who joined using the caller's personal code, most recent first.
CREATE OR REPLACE FUNCTION public.get_my_referrals()
RETURNS TABLE (first_name text, phase text, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.first_name, p.phase, p.created_at
  FROM profiles p
  WHERE p.referral_code = (SELECT own_referral_code FROM profiles WHERE user_id = auth.uid())
  ORDER BY p.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_my_referrals() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_referrals() TO authenticated;
