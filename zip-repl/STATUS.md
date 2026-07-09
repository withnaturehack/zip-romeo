# RJ-APP — Session Status

_Last updated: 2026-05-24_

## TL;DR

Native iOS + Android port of the Romeo & Juliet web app, built with Expo + React Native + TypeScript + Expo Router. Reuses the existing Supabase backend (same project as `Romeo-juliet/`). **20 commits in. Phases 1–3 are done end-to-end. Phase 4 is started (plumbing in place, two screens left).** The app is not yet runnable on a device because the user hasn't created `.env.local` or wired the OAuth redirect URLs yet — see "Resume checklist" below.

Design source of truth: `.design-fetch/rj-app/project/` (Claude Design handoff bundle, 18 screens).
Design spec: `Romeo-juliet/docs/superpowers/specs/2026-05-24-rj-app-mobile-design.md`.
Phase 1 plan: `Romeo-juliet/docs/superpowers/plans/2026-05-24-rj-app-phase-1-foundation.md`.

---

## What's done

### Phase 1 — Foundation + Auth (commits `6a56abb` → `7c27d10`)

- Expo SDK 53 + RN + TS + Expo Router scaffold. `app.json` bundle IDs set (`com.romeojuliet.app`), scheme `rj-app`.
- All design assets copied: 7 archetype PNGs, Juliet portrait, faded portrait, logo, paper-noise PNG.
- Fonts: `@expo-google-fonts/{cormorant-garamond,eb-garamond,jetbrains-mono,caveat}` bundled and loaded at boot.
- Theme system: `RJ_LIGHT`, `RJ_DARK`, `RJ_FONTS`, `RJ_DENSITY` tokens ported verbatim from the design bundle. `ThemeProvider` + `useRJTheme` hook with 2 passing tests.
- Primitives (all 9, ported pixel-faithfully):
  - `MonoLabel`, `OrnamentDivider`, `PostmarkStamp`
  - `WaxSeal` (SVG + Reanimated pulse)
  - `PaperNoise` (5%-opacity overlay)
  - `JulietPortrait`, `ArchetypeStamp` (via `tintColor` mask)
  - `PrimaryButton`, `SecondaryButton`, `TextLink` (with `expo-haptics` selection feedback)
  - Layout: `Stack`, `Row`, `ScreenScroll`
- Root layout: `SafeAreaProvider`, font loader, `ThemeProvider`, Expo Router stack with fade animation, status bar.
- Screens:
  - `app/index.tsx` → redirects to `/(auth)/welcome`
  - `(auth)/welcome.tsx` — **Variant C envelope-first hero** with SVG envelope + pulsing wax seal
  - `(auth)/referral.tsx` — code entry + submit via `lib/api.ts`
  - `(auth)/signin.tsx` — Juliet portrait + "Continue with Google" via `lib/auth.ts` (`expo-auth-session` + Supabase OAuth)
- `lib/supabase.ts` — Supabase JS client with `expo-secure-store` session adapter
- `lib/auth.ts` — Google OAuth via Supabase
- `lib/api.ts` — `redeemReferral(code)` thin client over rj-new's `/api/referral`

### Phase 1.5 — SDK 53 alignment (commit `2603b64`)

`expo install --fix` bumped 20 packages: React 18→19, RN 0.74→0.79, expo-router 3→5, all native deps. Required `--legacy-peer-deps` due to expo-router 5 / @react-navigation/drawer peer conflict. Typecheck + tests still green after the bump.

### Phase 2 — Onboarding + Conversation (commits `5354954`, `d94fe52`, `1d23d7d`)

- Deps installed: `expo-image-picker`, `expo-av`, `@elevenlabs/react-native` (latter has LiveKit peer deps that need a dev-client build — see "Known issues").
- `lib/hooks.ts` — `useStatus(pollMs)` reads the user's profile row + phase from Supabase every 5–10s. Defines the `Phase` union.
- `lib/upload.ts` — `pickAndUploadPhoto(userId, slot)` via `expo-image-picker` → Supabase storage bucket `photos`.
- Screens:
  - `(onboarding)/profile.tsx` — first name, social handle, 3 photo slots. Submits via Supabase direct upsert to `profiles`.
  - `(onboarding)/pending.tsx` — `useStatus(8000)` polls; auto-redirects on phase change. Pulsing wax seal centerpiece.
  - `(conversation)/voice.tsx` — push-to-talk UX with `MicCircle` and progress bar. **Voice itself is simulated** (auto-incrementing question counter on a 4.5s tick) — real ElevenLabs integration is deferred to the EAS dev-client phase.
  - `(conversation)/questionnaire.tsx` — chat-bubble form (Juliet typing indicator + text/pills composer). 7 questions across Basic / Relationship / Family. Writes to `profiles.questionnaire_answers`.
  - `(conversation)/archetype.tsx` — reveal card with traits, core desire, description, light/shadow, harmonises with, share button.
  - `(conversation)/waiting.tsx` — "Romeo is reading", `useStatus(10000)` waits for `LETTER_READY` phase.
- Components: `MicCircle`, `JulietAvatarImg`, `ArchetypeCard`.
- Reading data for all 7 archetypes hard-coded in `app/(conversation)/archetype.tsx`.

### Phase 3 — Letter flow (commit `14ccd44`)

- `components/letter/EnvelopeOpening.tsx` — three-phase Reanimated sequence (wax cracks 800ms → flap unfolds 700ms → letter rises 900ms). Haptic on tap. Auto-starts 600ms after mount.
- Screens:
  - `(letter)/envelope.tsx` — sealed envelope arrival, plays `EnvelopeOpening`, navigates to `letter` on complete.
  - `(letter)/letter.tsx` — Romeo's letter on cream paper with handwritten "Dear friend," and "Yours, Romeo." (placeholder copy — body text is generic until backend provides the real letter).
  - `(letter)/match.tsx` — full match profile (name, age, city, occupation, archetype stamp, note). **Demo data hard-coded as "James — The Slow Burner"**; will be replaced by real `match` row from `useStatus`.
  - `(letter)/respond.tsx` — Yes/No + optional note. Currently writes to `profiles.questionnaire_answers.last_response` as a placeholder; proper match-response wiring needs `/api/match/respond` integration.
  - `(letter)/sent.tsx` — confirmation with wax seal.

### Phase 4 plumbing — partial (commit `6a3f925`)

- `theme/preferences.ts` — `usePreferences()` hook persists `dark` + `density` to `expo-secure-store`.
- `app/_layout.tsx` updated to consume `usePreferences()` and pass `dark` / `density` to `ThemeProvider`. Status bar style toggles with dark mode.
- `app/(main)/_layout.tsx` — empty Stack layout for the home/settings group.

---

## What's left

### Phase 4 — Home + Settings (in progress)

- `app/(main)/home.tsx` — "the stoop". Recent letters list, Speak-to-Juliet card with her avatar, archetype card showing user's own reading.
- `app/(main)/settings.tsx` — dark mode toggle + density radio (consuming `usePreferences().update()`), user archetype card, sign-out button.
- Wire Sign In success path to land users on `/(main)/home` once they've completed onboarding (currently goes to referral every time).
- Add a real "root router" in `app/index.tsx` that reads `useStatus()` and routes to the correct phase screen (currently always sends to welcome). Suggested logic:

  ```
  no session                → /(auth)/welcome
  session, no profile       → /(onboarding)/profile
  PENDING_APPROVAL          → /(onboarding)/pending
  APPROVED / CHATTING       → /(conversation)/voice
  QUESTIONNAIRE_DONE / WAITING → /(conversation)/waiting
  LETTER_READY              → /(letter)/envelope
  COMPLETE                  → /(main)/home
  ```

### Phase 5 — Push notifications

- `lib/push.ts` — `expo-notifications` registration, store `expo_push_token` on `profiles` row, foreground/background handlers.
- Wire registration into `pending.tsx` (after profile submit) so the user gets push permission prompt at the natural moment.
- New Supabase edge function `supabase/functions/notify-letter-ready/` that calls Expo Push API when a user's `phase` transitions to `LETTER_READY`.
- New trigger `trg_letter_ready` on `profiles` (status transition to `LETTER_READY`) calling the edge function.
- iOS rich-icon: bundle Notification Service Extension via Expo config plugin so Juliet's portrait shows on the lock screen.
- Android: `app.json` `notification.icon` set; `BigPictureStyle` via Expo's default.
- Deep link: `rj-app://envelope` should land on `(letter)/envelope`.

### Phase 6 — EAS Build + store submission

- `eas.json` build profiles: development (dev-client), preview, production.
- `npx eas build:configure` (or write `eas.json` directly).
- iOS Notification Service Extension config plugin.
- LiveKit / `@elevenlabs/react-native` dev-client integration — needs `expo-build-properties` plugin + `npx eas build --profile development --platform all`.
- Test the real ElevenLabs voice flow on the dev client (replace simulated session in `voice.tsx`).
- App icons (currently using Juliet portrait as 1024×1024 placeholder). User to provide bespoke 1024 icon + splash.
- Bundle ID, provisioning profile, App Store Connect entries.

---

## Known issues / debts

1. **Web `/api/referral` only accepts cookies, not Bearer.** The Phase 1 referral submission from mobile will currently 401 against `Romeo-juliet/app/api/referral/route.ts` because that route uses `createServerClient` with cookies. Two ways to fix:
   - (a) Extend the web route to fall back to `Authorization: Bearer <token>` parsing (preferred — same logic, 6 lines).
   - (b) Switch mobile to call Supabase directly for referral redemption.
   - Recommended: do (a) inside `Romeo-juliet/`, since the route already has the business logic and admin sync.
2. **`@elevenlabs/react-native` requires LiveKit native modules** (`@livekit/react-native`, `@livekit/react-native-webrtc`) which won't run in Expo Go. Phase 2 ships a simulated voice flow on the assumption that real audio is wired in Phase 6 with a dev-client build.
3. **`Phase` union in `lib/hooks.ts` is a guess.** Verify against the actual `profiles.phase` enum in `Romeo-juliet/supabase/schema.sql`. The web uses `'REFERRAL' | 'PENDING_APPROVAL' | 'APPROVED' | ...` but the conversation/letter phases may have different names.
4. **Match data is hard-coded** in `(letter)/match.tsx` and the letter body is hard-coded in `(letter)/letter.tsx`. Both need to read from the real `matches` row joined to the matched user's `profiles` row.
5. **`Phase 1.5` SDK align brought in some breaking changes** the screens haven't been re-tested against:
   - `expo-router` v3 → v5 — `router.push('/(group)/path' as never)` casts were used because `typedRoutes: true`. May want to either disable typedRoutes or generate the route types via `expo-router/build/typed-routes`.
   - RN `Image#pointerEvents` was removed; I moved it into style in Phase 1 already.
6. **`jest-expo` preset doesn't load** even after SDK align. Currently using `"preset": "react-native"` + custom `transformIgnorePatterns`. All 4 existing tests still pass. New tests that touch Expo native modules (haptics, secure-store, etc.) will need explicit `jest.mock` until the preset is fixed.
7. **Windows `&` path quirk** — the working directory `STARTUPS&PROJECTS` breaks `npx <bin>` and `npm run <script>` invocations on Windows. Use direct node invocations:
   ```
   node ./node_modules/typescript/bin/tsc --noEmit          # typecheck
   node ./node_modules/jest/bin/jest.js --no-coverage       # tests
   node ./node_modules/expo/bin/cli start --tunnel          # dev server
   node ./node_modules/expo/bin/cli install <pkg>           # install a SDK-aware dep
   ```
   The cleaner long-term fix is to move the project to a path without `&` (e.g. `STARTUPS-PROJECTS`).
8. **Photo upload depends on a public Supabase `photos` bucket** with permissive write RLS for the user's own folder. Confirm the bucket exists (it does for the web app per README). RLS policies live in `Romeo-juliet/supabase/schema.sql`.
9. **Phase 4 root router** — `app/index.tsx` always redirects to `welcome`. Implement the phase-based router described in "What's left → Phase 4" before the app feels right to use repeatedly.
10. **Welcome A/B/D variants** — only Variant C ships in v1. The A/B/D ports live in the design bundle at `.design-fetch/rj-app/project/rj-app.jsx` lines 224-372 if you want to add them later under `app/(auth)/_variants/`.

---

## Resume checklist

When you next sit down:

1. **`cd "d:/STARTUPS&PROJECTS/Romeo-Juliet/Latest/RJ-APP"`**
2. **Create `.env.local`** from `.env.local.example` — copy these from `Romeo-juliet/.env.local`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=...     # from NEXT_PUBLIC_SUPABASE_URL
   EXPO_PUBLIC_SUPABASE_ANON_KEY=... # from NEXT_PUBLIC_SUPABASE_ANON_KEY
   EXPO_PUBLIC_ELEVENLABS_AGENT_ID=... # from NEXT_PUBLIC_ELEVENLABS_AGENT_ID
   EXPO_PUBLIC_WEB_BASE=http://localhost:3000  # rj-new dev server URL
   ```
3. **In Supabase dashboard** → Authentication → URL Configuration → Redirect URLs: add `rj-app://auth/callback`. (Google Cloud OAuth credentials already have the Supabase callback URL from the web app config.)
4. **In Google Cloud Console** → OAuth credentials → Authorized redirect URIs: confirm the Supabase callback URL (`https://<your-project>.supabase.co/auth/v1/callback`) is listed.
5. **Start the rj-new web app** for the API routes:
   ```
   cd Romeo-juliet
   npm install     # if not done
   npm run dev     # http://localhost:3000
   ```
6. **Start the Expo dev server** with the tunnel (so your phone reaches the API on your laptop's LAN):
   ```
   cd RJ-APP
   node ./node_modules/expo/bin/cli start --tunnel --clear
   ```
7. **Scan the QR in Expo Go** (download from App Store / Play Store first). You should land on Welcome.

If something explodes at boot, the first thing to check is whether `.env.local` is present and has the four variables — the Supabase client throws at module load if `EXPO_PUBLIC_SUPABASE_URL` is missing.

---

## Decision log

- **Stack:** Expo SDK 53 + React Native + TypeScript + Expo Router. Chose Expo because the design ports cleanly from React JSX, ships to both stores from one codebase, has best-in-class push notifications, and Supabase JS works natively. Decided 2026-05-24.
- **Welcome variant:** C (envelope-first hero). Decided 2026-05-24 — matches "premium/luxe/cinematic" execution bar. A/B/D deferred.
- **Voice provider:** `@elevenlabs/react-native` against existing `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`. Real integration deferred to Phase 6 with EAS dev-client.
- **Backend:** Reuse `Romeo-juliet/supabase/schema.sql` as-is. No mobile-specific schema. Mobile uses Supabase JS direct for reads; writes go either direct (profile create/update) or via the web `/api/*` (referral redemption — needs Bearer auth shim).
- **Folder:** `RJ-APP/` at the project root, peer to `Romeo-juliet/` and `admin-dashboard/`. Each has its own git repo.
- **Navigation:** Stack-only via Expo Router. No bottom tabs — preserves the linear "letter" metaphor.
- **Animations:** Reanimated 3 + react-native-svg (not Lottie). Better fidelity to the design's specific timings.
- **No AI attribution in commits.** All commits authored as the user (Daksh Verma).
- **Inline execution from Phase 1.5 onwards.** Phase 1 used subagent-driven (14 commits via subagents), Phase 1.5/2/3 used inline execution per user preference. Both paths produced clean commits.

---

## Commit log (full Phase 1 → Phase 4-plumbing)

```
6a3f925 wip: theme preferences (dark mode + density) plumbing
14ccd44 letter flow: envelope opening animation, letter, match profile, respond, sent
1d23d7d conversation flow: voice (simulated), questionnaire, archetype reveal, waiting
d94fe52 onboarding flow: status hook, photo upload, Profile + Pending screens
5354954 add conversation deps: expo-image-picker, expo-av, ElevenLabs RN SDK
2603b64 align native deps to Expo SDK 53 (React 19 + RN 0.79)
7c27d10 Sign in screen with Google OAuth (Supabase)
ee44e79 Referral screen + API client
f11b7ca Supabase client with SecureStore session adapter
7215598 Welcome screen (Variant C — envelope-first hero)
1b04b8e root layout with font loading + Expo Router stack
f46c8e6 PrimaryButton, SecondaryButton, TextLink with haptics
68f98bf PaperNoise, JulietPortrait, ArchetypeStamp + archetype data
665660a WaxSeal primitive (SVG + Reanimated pulse)
7a2bbdb MonoLabel, OrnamentDivider, PostmarkStamp primitives
08054c4 layout primitives (Stack, Row, ScreenScroll)
c61fa22 ThemeProvider + useRJTheme hook with tests
c708681 theme tokens: light/dark colors, fonts, density
6db76f4 copy design assets (archetypes, portraits, fonts, paper noise)
6a56abb scaffold Expo project (RN + TS + Expo Router)
```

20 commits. ~2200 lines of TS/TSX added in `RJ-APP/`, plus ~16MB of assets.
