# TODO

## OAuth / Google redirect fixes
- [ ] Update `lib/auth-redirect.ts` so web redirect goes to the Expo Router callback route that returns to the app correctly.
- [ ] Verify `app/auth/callback.tsx` is the only web callback target used for OAuth.

## Referral “live updates” fixes
- [ ] Locate the screen/component that shows the referrals list.
- [ ] Add a Supabase realtime subscription for the referrals-related table/view.
- [ ] Ensure queries are filtered by the current user and respect RLS.

## Validation
- [ ] Run lint/build checks after changes.
- [ ] Smoke test: sign in with Google → verify redirect lands back in the app.
- [ ] Smoke test: referrals page updates without refresh.

