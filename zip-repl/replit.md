# Romeo & Juliet — Expo App (rj-app)

Native iOS, Android, and web app built with Expo SDK 54, Expo Router, React Native, and TypeScript. Reuses the existing Supabase backend.

## Stack

- **Framework:** Expo SDK 54 + React Native + TypeScript
- **Routing:** Expo Router (file-based, stack-only — preserves the linear letter metaphor)
- **Backend:** Supabase (same project as the web app) — JS client for direct reads/writes
- **Auth:** Supabase Auth + Google OAuth via `expo-auth-session` + `expo-web-browser`
- **Voice:** ElevenLabs (`@elevenlabs/react-native`) — simulated in web/Expo Go; real integration requires EAS dev-client build
- **Animations:** Reanimated 3 + react-native-svg
- **Session storage:** `expo-secure-store` (native, chunked) / `localStorage` (web)

## How to Run

### Web preview (Replit)

The workflow starts automatically:

```sh
./node_modules/.bin/expo start --web --port 5000
```

Visit the preview pane — the app loads at port 5000.

### iOS / Android via Expo Go

To test on a physical device with Expo Go:

1. In the Replit shell, run:
   ```sh
   ./node_modules/.bin/expo start --tunnel
   ```
2. Scan the QR code with **Expo Go** (iOS App Store / Google Play).

> Note: Some native modules (`@elevenlabs/react-native`, LiveKit) require a full **EAS development build** — they won't run in Expo Go. Use `pnpm build:android` / `pnpm build:ios` via EAS CLI for those.

### Native builds (EAS)

```sh
pnpm build:android   # EAS cloud build → .apk / .aab
pnpm build:ios       # EAS cloud build → .ipa
```

## Environment Variables

Copy `.env.local.example` → `.env.local` and fill in:

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_ELEVENLABS_AGENT_ID` | ElevenLabs agent ID |
| `EXPO_PUBLIC_ELEVENLABS_VOICE_ID` | ElevenLabs voice ID (optional) |
| `NGROK_AUTHTOKEN` | ngrok token for tunnel mode |

Expo SDK 50+ auto-loads `.env.local` — no manual export needed.

## Supabase Auth Setup

In your **Supabase dashboard → Authentication → URL Configuration → Redirect URLs**, add:

- `rj-app://auth/callback` (native deep link)
- `http://localhost:5000/auth/callback` (web dev)
- `https://your-domain/auth/callback` (production)

## Build Status

| Phase | Status |
|---|---|
| 1 — Foundation + Auth | ✅ Done |
| 2 — Onboarding + Conversation | ✅ Done |
| 3 — Letter flow | ✅ Done |
| 4 — Home + Settings | 🔄 In progress |
| 5 — Push notifications | ⏳ Planned |
| 6 — EAS Build + store submission | ⏳ Planned |

See `STATUS.md` for the full breakdown and known issues.

## Useful Commands

```sh
pnpm typecheck    # TypeScript check
pnpm lint         # ESLint
pnpm test         # Jest
pnpm doctor       # Expo health check
```

## User Preferences

- Keep existing project structure — do not restructure or migrate the stack
- Phases 4–6 are next planned work; see STATUS.md for resume checklist
