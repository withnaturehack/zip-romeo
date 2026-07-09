# Romeo & Juliet Expo App

Native iOS, Android, and web app built with Expo SDK 54, Expo Router, React Native, TypeScript, and EAS.

## Requirements

- Node.js LTS
- pnpm 9
- Expo Go for managed-device testing, or an EAS development build for native modules that require a dev client

## Setup

```sh
pnpm install
```

Create `.env.local` from `.env.local.example` and fill in the Supabase and API keys used by the app.

## Run

```sh
pnpm start
```

Other useful commands:

```sh
pnpm start:lan
pnpm start:tunnel
pnpm web
pnpm android
pnpm ios
```

## Native Builds

Generate native projects locally when needed:

```sh
pnpm prebuild
```

Create EAS builds:

```sh
pnpm build:android
pnpm build:ios
```

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm doctor
```
# rjfinal
# rjfinal
