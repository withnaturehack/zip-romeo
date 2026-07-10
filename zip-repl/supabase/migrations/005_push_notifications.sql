-- Push notifications: store each user's Expo push token, and notify them
-- via the notify-letter-ready edge function when their phase flips to
-- LETTER_READY.
-- Run in Supabase Dashboard → SQL Editor, or via `supabase db push`.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expo_push_token text;

-- Lets the authenticated user write only their own token (already covered by
-- the existing "profiles_owner_update" policy from 001_referral_codes.sql,
-- since expo_push_token is just another column on the same row).

CREATE OR REPLACE FUNCTION notify_letter_ready()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.phase = 'LETTER_READY' AND (OLD.phase IS DISTINCT FROM 'LETTER_READY') THEN
    PERFORM net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/notify-letter-ready',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
      ),
      body := jsonb_build_object('user_id', NEW.user_id, 'expo_push_token', NEW.expo_push_token)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_letter_ready ON profiles;
CREATE TRIGGER trg_letter_ready
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_letter_ready();

-- NOTE: this trigger uses `pg_net` (net.http_post) and Supabase Vault secrets
-- named "project_url" / "service_role_key". Enable the `pg_net` extension and
-- create those two vault secrets before deploying this migration:
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');
