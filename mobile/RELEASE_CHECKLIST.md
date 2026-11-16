# Manzil mobile — release checklist (Phase 4)

Release-blocking until checked. Consumer app only — no admin surfaces.

## Security (Hotfix A / B)

- [ ] Hotfix A deployed: staff-auth only; no `x-admin-auth` trust; messaging cannot impersonate
- [ ] Hotfix B deployed: verification docs private ACL + signed downloads only
- [ ] Legacy public doc URLs remigrated (`APPLY=1` script run in prod)
- [ ] Security regression tests green on CI / local
- [ ] `MOBILE_JWT_SECRET` set on Vercel (and rotated if ever leaked)
- [ ] Mobile never ships admin routes or staff impersonation headers

## Backend / API

- [ ] Production API reachable from device (`EXPO_PUBLIC_API_BASE_URL`)
- [ ] Mobile login / refresh / logout-all work against production
- [ ] Absolute image URLs in listing responses
- [ ] UploadThing Bearer uploads work for photos + private docs

## App quality

- [ ] Loading / empty / error + Retry on Home, Browse, Sell, Inbox, Detail
- [ ] TalkBack / VoiceOver: primary CTAs, tabs, search, property cards labeled
- [ ] Browse list scrolls without jank on mid-range Android
- [ ] Tokens only in SecureStore; Sentry breadcrumbs redact Bearer / JWT
- [ ] `EXPO_PUBLIC_SENTRY_DSN` set for production builds (optional for preview)

## Legal / store

- [ ] `/privacy` and `/terms` live on production web (counsel review before submit)
- [ ] Account screen opens Privacy + Terms
- [ ] Store metadata filled in `store/METADATA.md`
- [ ] Account deletion path documented (email is acceptable for MVP)
- [ ] Screenshots + icons ready (see `store/METADATA.md`)

## Builds / QA

- [ ] EAS project linked (`eas init` → `extra.eas.projectId`)
- [ ] `eas build --profile preview` installs and talks to staging/prod API
- [ ] Maestro smoke flows pass:
  - `maestro/smoke-home-browse.yaml`
  - `maestro/smoke-account-login.yaml` (with `MAESTRO_EMAIL` / `MAESTRO_PASSWORD`)
  - `maestro/smoke-privacy-terms.yaml`
- [ ] No secrets committed (`.env`, Google service account, Sentry auth token)

## Explicit non-goals for this release

- Admin / staff tools in the consumer app
- Push notifications
- Agent field companion (Phase 5)
