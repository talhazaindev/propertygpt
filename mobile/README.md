# Manzil mobile (Expo)

Official Manzil by AlWahabCo consumer app for iOS and Android.

## Stack

- Expo SDK 58 + Expo Router
- TypeScript strict
- TanStack Query + Zustand (UI-only)
- Expo SecureStore for tokens
- Design tokens mirrored from the web `globals.css` Manzil palette

## Setup

```bash
cd propertygpt/mobile
npm install
npx expo start
```

### API base URL (important)

| Client | `EXPO_PUBLIC_API_BASE_URL` |
|--------|----------------------------|
| Physical phone (Expo Go QR) | Mac LAN IP, e.g. `http://10.10.0.24:3000` |
| Android emulator | `http://127.0.0.1:3000` **plus** `./scripts/adb-reverse-api.sh` — or the same LAN IP |
| Production | `https://propertygpt-six.vercel.app` |

`127.0.0.1` on a real phone is the phone itself, so the API will never connect. Detect your LAN URL:

```bash
./scripts/print-lan-api-url.sh
```

Then put it in `mobile/.env` and restart Expo (`npx expo start -c` if the old URL is cached).

Phone + Mac must share the same Wi‑Fi. Backend already binds `0.0.0.0:3000`.

## Architecture

- `app/` — Expo Router screens
- `src/theme` — brand tokens (do not invent colors)
- `src/services/api` — Axios client with Bearer + single-flight refresh
- `src/services/storage` — SecureStore only for auth tokens
- `src/components/ui` — reusable UI primitives

## Security prerequisites (web)

Before shipping authenticated mobile features, deploy Hotfix A/B on the Next.js API:

- Admin routes must require real staff sessions (no `x-admin-auth`)
- Verification documents must use private UploadThing ACL + signed downloads

```bash
cd ..
npm run test:security:static
# with API running:
npm run test:security:admin
# after enabling private ACL in UploadThing dashboard:
DRY_RUN=1 npm run migrate:verification-docs:private
APPLY=1 npm run migrate:verification-docs:private
```

## Current status

- Phase 1 foundation: app shell + tabs + theme + API/SecureStore scaffolding
- Phase 2+ (backend mobile auth, browse, sell, inbox) not yet implemented
