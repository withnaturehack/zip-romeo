-- Run in Supabase Dashboard → SQL Editor
-- Fixes referral validation (anon read) and consumption (authenticated RPC).

CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  current_uses integer NOT NULL DEFAULT 0,
  max_uses integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY,
  first_name text,
  social_handle text,
  bio text,
  photo_urls text[] DEFAULT '{}',
  referral_code text,
  phase text NOT NULL DEFAULT 'PROFILE',
  questionnaire_answers jsonb,
  archetype text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid,
  user_b uuid,
  status text,
  a_response text,
  b_response text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_active_referral_codes" ON referral_codes;
CREATE POLICY "anon_read_active_referral_codes"
  ON referral_codes FOR SELECT
  TO anon, authenticated
  USING (active = true);

DROP POLICY IF EXISTS "profiles_owner_select" ON profiles;
CREATE POLICY "profiles_owner_select"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_owner_upsert" ON profiles;
CREATE POLICY "profiles_owner_upsert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_owner_update" ON profiles;
CREATE POLICY "profiles_owner_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "matches_owner_select" ON matches;
CREATE POLICY "matches_owner_select"
  ON matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "photos_public_select" ON storage.objects;
CREATE POLICY "photos_public_select"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "photos_owner_insert" ON storage.objects;
CREATE POLICY "photos_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = split_part(name, '/', 1));

CREATE OR REPLACE FUNCTION public.consume_referral_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row referral_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM referral_codes
  WHERE upper(trim(code)) = upper(trim(p_code))
  LIMIT 1;

  IF NOT FOUND OR NOT v_row.active OR v_row.current_uses >= v_row.max_uses THEN
    RETURN false;
  END IF;

  UPDATE referral_codes
  SET current_uses = current_uses + 1
  WHERE id = v_row.id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_referral_code(text) TO authenticated;

INSERT INTO referral_codes (code, max_uses, active)
VALUES ('LAUNCH-001', 100, true)
ON CONFLICT (code) DO NOTHING;
