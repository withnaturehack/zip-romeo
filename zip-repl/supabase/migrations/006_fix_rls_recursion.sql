-- Fixes infinite recursion in profiles RLS policy.
-- Run in Supabase Dashboard → SQL Editor.

CREATE OR REPLACE FUNCTION public.get_my_own_referral_code()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT own_referral_code FROM profiles WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_own_referral_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_own_referral_code() TO authenticated;

DROP POLICY IF EXISTS "profiles_referred_select" ON profiles;
CREATE POLICY "profiles_referred_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    referral_code = public.get_my_own_referral_code()
  );
