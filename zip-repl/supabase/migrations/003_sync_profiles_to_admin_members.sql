-- Run in Supabase Dashboard → SQL Editor
-- Syncs new Expo-app profile rows into admin_members automatically

-- ── Trigger function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_profile_to_admin_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  -- Fetch the user's email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = NEW.user_id;

  INSERT INTO public.admin_members (
    user_id,
    email,
    first_name,
    name,
    social_handle,
    instagram,
    photo_url,
    photo_urls,
    phase,
    status,
    ref_code,
    questionnaire_answers,
    created_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    v_email,
    NEW.first_name,
    COALESCE(NEW.first_name, v_email),
    NEW.social_handle,
    NEW.social_handle,
    CASE WHEN array_length(NEW.photo_urls, 1) >= 1 THEN NEW.photo_urls[1] ELSE NULL END,
    NEW.photo_urls,
    NEW.phase,
    CASE
      WHEN NEW.phase = 'PENDING_APPROVAL' THEN 'PENDING'
      WHEN NEW.phase = 'APPROVED'         THEN 'APPROVED'
      WHEN NEW.phase = 'WAITING'          THEN 'APPROVED'
      WHEN NEW.phase = 'CHAT'             THEN 'APPROVED'
      ELSE 'PENDING'
    END,
    NEW.referral_code,
    NEW.questionnaire_answers,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    first_name            = EXCLUDED.first_name,
    name                  = COALESCE(EXCLUDED.first_name, admin_members.email),
    social_handle         = EXCLUDED.social_handle,
    instagram             = EXCLUDED.social_handle,
    photo_url             = EXCLUDED.photo_url,
    photo_urls            = EXCLUDED.photo_urls,
    phase                 = EXCLUDED.phase,
    status                = EXCLUDED.status,
    ref_code              = EXCLUDED.ref_code,
    questionnaire_answers = EXCLUDED.questionnaire_answers,
    updated_at            = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

-- ── Attach trigger to profiles ────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_sync_profile_to_admin ON public.profiles;
CREATE TRIGGER trg_sync_profile_to_admin
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_admin_member();

-- ── One-time backfill: sync all existing profiles that are missing ─────────────
INSERT INTO public.admin_members (
  user_id, email, first_name, name, social_handle, instagram,
  photo_url, photo_urls, phase, status, ref_code,
  questionnaire_answers, created_at, updated_at
)
SELECT
  p.user_id,
  u.email,
  p.first_name,
  COALESCE(p.first_name, u.email),
  p.social_handle,
  p.social_handle,
  CASE WHEN array_length(p.photo_urls, 1) >= 1 THEN p.photo_urls[1] ELSE NULL END,
  p.photo_urls,
  p.phase,
  CASE
    WHEN p.phase = 'PENDING_APPROVAL' THEN 'PENDING'
    WHEN p.phase IN ('APPROVED','WAITING','CHAT') THEN 'APPROVED'
    ELSE 'PENDING'
  END,
  p.referral_code,
  p.questionnaire_answers,
  p.created_at,
  p.updated_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
ON CONFLICT (user_id)
DO UPDATE SET
  first_name            = EXCLUDED.first_name,
  name                  = COALESCE(EXCLUDED.first_name, admin_members.email),
  photo_url             = EXCLUDED.photo_url,
  photo_urls            = EXCLUDED.photo_urls,
  phase                 = EXCLUDED.phase,
  status                = EXCLUDED.status,
  updated_at            = EXCLUDED.updated_at;
