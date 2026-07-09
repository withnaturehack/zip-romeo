-- Run this in Supabase Dashboard → SQL Editor
-- Fixes: profile insert RLS, storage photo upload policy, anon profile creation

-- 1. Allow anon role to also insert profiles (handles cases where session token
--    is not yet propagated in the Authorization header right after signup)
DROP POLICY IF EXISTS "profiles_anon_insert" ON profiles;
CREATE POLICY "profiles_anon_insert"
  ON profiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- 2. Also allow UPDATE from anon (for upsert to work without a fully established session)
DROP POLICY IF EXISTS "profiles_anon_update" ON profiles;
CREATE POLICY "profiles_anon_update"
  ON profiles FOR UPDATE
  TO anon
  USING (true);

-- 3. Fix storage: allow anon to upload photos too (session may not be ready)
DROP POLICY IF EXISTS "photos_owner_insert" ON storage.objects;
CREATE POLICY "photos_owner_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'photos');

-- 4. Helper RPC: create initial profile row safely
--    Called right after signup to guarantee the row exists
CREATE OR REPLACE FUNCTION public.create_initial_profile(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (user_id, phase)
  VALUES (p_user_id, 'PROFILE')
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.create_initial_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_initial_profile(uuid) TO authenticated, anon;
