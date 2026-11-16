# Manzil — Mobile App Feasibility Handover

**Purpose:** Everything you need to research and draft a **mobile app feasibility plan**.  
**Context:** Manzil By AlWahabCo is a **web app today** (`propertygpt/`). This is **not** a web-launch guide.  
**Date:** 2026-11-13  
**Repo:** `https://github.com/talhazaindev/propertygpt.git`  
**Canonical app folder:** `propertygpt/`

---

## 0. Executive verdict (read this first)

| Question | Answer |
|----------|--------|
| Can we build a mobile app on the current backend? | **Yes, with adapters** — domain APIs are mostly JSON REST |
| Biggest technical blockers? | **Cookie-only NextAuth** (no Bearer tokens), **UploadThing web client**, **no push**, public browse missing **Sale/Rent filter** |
| Full feature parity with web? | **No — and you shouldn’t try.** Staff admin CRM/CMS stay on web |
| Best first mobile product? | **Buyer + seller consumer app**; then **agent field companion** |
| AI / payments on mobile? | **Neither exists on web** — do not plan into MVP |
| Feasibility overall | **Medium effort, high leverage** if you reuse APIs and keep admin on web |

**One-liner:** Feasible as a native/Expo app talking to existing Next.js `/api/*` routes, after a thin **mobile auth + upload + (later) push** layer; do not port the admin panel.

---

## 1. What the web product actually is

Manzil is a **Pakistan trust-first verified listings marketplace**:

- Browse/list properties (sale + rental **schema** exists)
- Buyer/seller accounts, email OTP
- Seller listing + verification docs
- Agent onboarding, dashboard, site-verification workflow
- Support inbox (HTTP polling ~4s)
- Lead forms (property request, construction)
- Blogs, dense **staff admin** on web

**Not in the product (despite repo name “PropertyGPT”):** OpenAI/Anthropic, RAG, payments/escrow, maps/lat-lng, SMS OTP.

---

## 2. Tech stack you inherit (backend)

| Layer | Today |
|-------|--------|
| App | Next.js 15 App Router + React 19 |
| API | ~51 route handlers under `src/app/api` |
| DB | MongoDB Atlas + Prisma 6 |
| Auth | NextAuth v4 Credentials + **JWT in HTTP-only cookies** |
| Uploads | UploadThing v7 (CDN URLs stored on records) |
| Email | Resend (OTP, alerts) |
| Messaging | REST + server-side AES encryption; polling primary |
| Hosting assumption | Vercel-friendly (polling, no required WS) |

Mobile clients **reuse the API + DB**, not the React pages.

---

## 3. Architecture options (choose for your plan)

### Option A — Recommended: Native/Expo client + existing Next API

```
[iOS / Android app] ──HTTPS JSON──► [Next.js /api/* on Vercel]
                                      ├── Prisma → MongoDB Atlas
                                      ├── Resend
                                      └── UploadThing (or new signed upload)
```

| Pros | Cons |
|------|------|
| Fastest path; reuse domain logic | Must add Bearer auth adapter |
| One backend for web + mobile | Upload path needs mobile work |
| Team already knows Next/Prisma | Two UIs to maintain |

**Best if:** you want iOS/Android stores and camera/push quality.

### Option B — Flutter or RN/Expo (same backend)

Framework choice is **secondary**. Complexity is auth/uploads/push, not Flutter vs RN. Pick what your developers know.

### Option C — PWA / Capacitor wrapping the web app

| Pros | Cons |
|------|------|
| Least new UI | Cookie auth, admin-heavy chrome, weak camera/push UX |
| | Store approval + “real app” feel often poor |
| | Doesn’t fix API gaps |

**Best if:** experiment only; **not** recommended as the main Manzil mobile product.

### Option D — Separate BFF / rewrite API in Nest/etc.

Overkill for v1. Consider only if you later split web and mobile teams at scale.

**Feasibility recommendation:** **Option A (Expo or RN or Flutter) + Option A backend adapters.** Keep web for marketing + full admin.

---

## 4. Backend readiness for mobile

### 4.1 Reusable as-is (or nearly)

| Area | Endpoints / notes |
|------|-------------------|
| Browse properties | `GET /api/properties`, `GET /api/properties/[id]` |
| Cities | `GET /api/cities` |
| Blogs (read) | `GET /api/blogs`, `GET /api/blogs/[slug]` |
| OTP | `POST /api/auth/otp/send`, `…/verify` |
| Register | `POST /api/register` (needs `signupToken`) |
| Password reset | `POST /api/auth/reset-password` |
| Agent apply | `POST /api/agents/apply` |
| Property / construction leads | `POST /api/requests`, `POST /api/construction` |
| Messaging REST | Conversations + messages (bodies returned **decrypted**) |
| Agent dashboard data | `GET /api/agents/dashboard`, `…/me`, verify submit |
| Create listing (prod pattern) | `POST /api/properties` **JSON with CDN image URLs** |

### 4.2 Needs adapter layer (plan these explicitly)

| Gap | Why it blocks mobile | Suggested work |
|-----|----------------------|----------------|
| **No Bearer token login** | APIs use `getServerSession` (cookies only) | `POST /api/auth/mobile/login` (+ refresh/logout); `requireAuth` accepts Bearer **or** cookie |
| **UploadThing React-only client** | Native can’t use `@uploadthing/react` as-is | UploadThing RN/Expo SDK **or** presigned S3/R2; middleware must accept Bearer |
| **Relative image URLs** | Some `/images/...` paths from dev/local | Normalize API to absolute URLs |
| **Inconsistent error JSON** | Harder client error handling | Standard `{ error, code, details? }` |
| **Public list ignores `listingType` / search / sort** | Sale vs Rent tabs won’t work | Fix `GET /api/properties` before consumer MVP |
| **No device push API** | Email-only alerts | FCM/APNs + `DeviceToken` model + send on message/verify events |
| **Messaging list not cursor-paginated** | Fine at small scale | Add cursor/limit before scale |
| **Socket.IO companion** | Binds localhost; weak handshake auth | Don’t rely on it for MVP; use polling or push |

### 4.3 Do not reuse on consumer mobile

| Piece | Reason |
|-------|--------|
| Entire `/admin/*` UI | CRM/desktop workflows |
| `x-admin-auth: true` header pattern | Spoofable; unsafe in a shipped app |
| NextAuth browser `signIn` / CSRF cookie flow | Not native-friendly |
| FormData → `public/` filesystem uploads | Dev-only; blocked on Vercel |
| RSC pages / `useAuth` / web hooks | Rebuild in mobile UI kit |

### 4.4 Auth reality (critical for feasibility)

Today:

1. User logs in via NextAuth credentials → **HTTP-only cookie**
2. APIs call `getServerSession(authOptions)`
3. UploadThing uses cookie JWT via `getToken`

There is **no** `Authorization: Bearer` path and **no** `/api/auth/mobile/*` token endpoint.

**Feasibility implication:** Budget a **backend sprint before or in parallel with** mobile UI — otherwise every protected screen is blocked.

OTP/register/reset **are** already API-complete (good for mobile forms). Only **session establishment after login** is the hole.

---

## 5. Personas & suggested mobile surfaces

### Buyer (primary)

Home → Browse (Sale/Rent) → Detail → **Call / WhatsApp** → Request property → Auth → Inbox → Account

### Seller

List property (camera) → My listings (status) → Docs upload → Inbox with Manzil

### Agent (high mobile value — field work)

Dashboard → Assigned verifications → Camera proof/docs → Agent requests → Inbox → Share trust profile  

Join-as-agent can stay web-first for v1.

### Staff (`TeamMember`)

| On mobile? | Recommendation |
|------------|----------------|
| Full admin | **No — keep web** |
| Support reply inbox + push | Phase 2 optional |
| Verify/post/assign/CMS/team/sales | Web only |

### Suggested IA

**Consumer tabs:** Home · Browse · Sell · Inbox · Account  
**Agent mode:** Dashboard · Jobs · Requests · Inbox · Profile  

---

## 6. Feature phasing for the feasibility plan

| Feature | MVP mobile | Phase 2 | Web-only |
|---------|------------|---------|----------|
| Browse + filters + detail | ✅ | | |
| Sale/Rent filter (after API fix) | ✅ | | |
| Call + WhatsApp CTAs | ✅ | | |
| Auth + email OTP + reset | ✅ | Biometric | |
| List property + camera photos | ✅ | | |
| Verification docs capture | ✅ | | |
| Seller my listings | ✅ | Edit listing | |
| Property request lead | ✅ | Track my requests | Admin triage |
| Support inbox (thin) | ✅ | Push + less polling | Staff assign UI |
| Agent verification jobs | Agent MVP | | Admin CRM |
| Agent dashboard read | Agent MVP | | |
| Join as agent | | ✅ or web | |
| Construction lead | | ✅ | Admin |
| Blog reader | | ✅ | Blog CMS |
| Favorites / saved search alerts | | ✅ | |
| Maps / GPS / near me | | ✅ (needs lat/lng) | |
| Offline cached browse | | ✅ | |
| Payments / escrow | | Only if product commits | Don’t fake it |
| Full admin CRM / CMS | | | ✅ |
| AI search | | | N/A (doesn’t exist) |

---

## 7. Mobile-native upsides (why an app is worth it)

Pakistan-market leverage vs wrapping the website:

1. **Camera** — listing photos + title docs + agent site proof (core trust loop)
2. **WhatsApp / dialer** — primary conversion (already partially `tel:` on web)
3. **Push** — verified/rejected listing, new support message, agent job assigned (today: email only)
4. **Share sheet** — property + agent referral links
5. **Later:** maps, biometric, offline browse, SMS OTP

In-app chat should stay **Manzil support**, not replace WhatsApp for buyer↔seller deals.

---

## 8. Complexity estimates (RN/Expo or Flutter vs current APIs)

| Area | Size | Notes |
|------|------|-------|
| App shell, branding, nav | S | |
| Browse + detail + Call/WhatsApp | S–M | M until listingType/search fixed |
| Auth + OTP | M | Needs token API |
| List property + multi-image upload | **L** | Camera, compression, upload adapter |
| Seller my listings | S | |
| Lead forms | S | |
| User inbox (polling) | M | **L** with proper push sync |
| Agent dashboard | M | |
| Agent field verification + uploads | **L** | Differentiator |
| Push E2E (FCM/APNs) | **L** | New backend |
| Maps + geo | **L** | Schema change |
| Payments | L+ | Greenfield |
| Port full admin | L+ | **Don’t** |

**Rough planning bands (order-of-magnitude, 1–2 mobile devs + part-time backend):**

| Scope | Backend prep | Mobile build |
|-------|--------------|--------------|
| Consumer MVP (buyer+seller+thin inbox) | ~1–2 weeks adapters + list API fixes | ~6–10 weeks |
| + Agent field companion | + small APIs if any | +4–6 weeks |
| + Push polished | +1–2 weeks | +1–2 weeks |
| + Maps | +schema/backfill | +2–4 weeks |

Treat as **planning ranges**, not commitments — calibrate with your team velocity.

---

## 9. Prerequisites checklist (before believable MVP)

### Backend / product (do first)

- [ ] Mobile login/refresh token endpoints + Bearer on protected routes (keep cookie for web)
- [ ] Wire `listingType` (+ ideally `search`/`sort`) on `GET /api/properties`
- [ ] Mobile-friendly upload path (UploadThing native or signed URLs)
- [ ] Absolute media URLs in API responses
- [ ] Decide: exclude admin APIs from app entirely
- [ ] Privacy Policy + Terms URLs (Play/App Store requirement)
- [ ] Production API base URL strategy (web domain `/api` vs `api.` subdomain)

### Mobile app

- [ ] Choose stack: **Expo (RN)** vs **Flutter** vs bare RN
- [ ] Secure token storage (Keychain/Keystore)
- [ ] Image picker + compression pipeline
- [ ] Deep links for password reset / listing share (`manzil://` or universal links)
- [ ] Store listings assets, screenshots, Pakistan compliance copy
- [ ] Analytics (optional) — not in web today

### Explicitly out of MVP scope (for honest feasibility)

- [ ] Payments
- [ ] AI search
- [ ] Full admin
- [ ] Socket.IO realtime (polling or push instead)

---

## 10. API inventory (mobile-relevant)

### Auth / account

| Method | Path | Mobile use |
|--------|------|------------|
| * | `/api/auth/[...nextauth]` | Web only today |
| POST | `/api/auth/otp/send` | ✅ |
| POST | `/api/auth/otp/verify` | ✅ → `signupToken` |
| POST | `/api/register` | ✅ |
| POST | `/api/auth/reset-password` | ✅ |
| — | `/api/auth/mobile/login` | ❌ **to build** |
| — | `/api/me` | ❌ **recommended** |

### Marketplace

| Method | Path | Mobile use |
|--------|------|------------|
| GET/POST | `/api/properties` | ✅ browse / create |
| GET/PATCH/DELETE | `/api/properties/[id]` | ✅ |
| GET | `/api/cities` | ✅ |
| GET | `/api/blogs*` | ✅ read |
| POST | `/api/requests` | ✅ |
| POST | `/api/construction` | Phase 2 |

### Agents

| Path group | Mobile use |
|------------|------------|
| `/api/agents/apply` | Phase 2 / web |
| `/api/agents/me`, `dashboard`, `requests`, verify | ✅ agent app |
| `/api/agents/[id]` | ✅ public profile |

### Messaging

| Path group | Mobile use |
|------------|------------|
| `/api/messages/conversations*` | ✅ |
| support-agents, user-properties, users/search | Partial (search often staff) |

### Uploads

| Path | Mobile use |
|------|------------|
| `/api/uploadthing` | Needs native client + Bearer-aware auth |

### Admin `/api/admin/*`

**Web staff only.** Do not ship in consumer/agent apps.

---

## 11. Data model notes that affect mobile

Relevant Prisma models: `User`, `Property`, `City`, `AgentProfile`, `AgentRequest`, `AgentActivity`, `AgentTarget`, `PropertyRequest`, `Conversation`, `Message`, `EmailOtp`, `BlogPost`…

| Detail | Mobile impact |
|--------|---------------|
| `PropertyListingType` SALE/RENTAL | Must filter in public API |
| No lat/lng on Property | Blocks maps MVP |
| `Sale` model weakly used | Don’t build payments UI on it |
| Message encryption server-side | Mobile does **not** need crypto SDK |
| ConstructionRequest outside Prisma | Fine if Phase 2 only |
| Roles BUYER/SELLER/AGENT | Seller often still BUYER role with owned listings — design Account UX around capabilities, not only role enum |

---

## 12. Risks & open decisions for your feasibility doc

### Technical risks

1. Underestimating **auth adapter** work  
2. UploadThing licensing/SDK fit vs rolling your own storage  
3. Naive **4s polling** on mobile → battery/data complaints  
4. Dual maintenance of web UI + app UI  
5. Serverless Mongo connection limits under app traffic + web  

### Product risks

1. Competing with Zameen/OLX without maps or inventory scale  
2. Over-scoping admin into the app  
3. Marketing “GPT” / payments that aren’t real  
4. Agent workflow is your differentiator — cut it and the app is “just another listings browser”

### Decision log (fill in during planning)

| Decision | Options | Your choice |
|----------|---------|-------------|
| Mobile framework | Expo / RN / Flutter | |
| Backend strategy | Adapters on Next vs new BFF | |
| MVP personas | Buyer+Seller / +Agent | |
| WhatsApp vs in-app for deals | WhatsApp primary | Recommended: WhatsApp |
| Push in MVP? | Yes / Phase 2 | |
| iOS + Android together? | Both / Android-first (PK) | |
| Admin on mobile? | No / support-only | Recommended: No |

---

## 13. Suggested feasibility plan outline (use in your doc)

You can paste this structure into a business/engineering feasibility plan:

1. **Problem & goal** — Why mobile (camera, push, field agents, store discovery)  
2. **Current system summary** — Point to this file §1–2  
3. **Options analysis** — §3 with cost/time/risk  
4. **Recommended scope** — §5–6 MVP  
5. **Backend gaps & estimate** — §4 + §9  
6. **Mobile build estimate** — §8  
7. **Dependencies on web team** — listingType fix, legal pages, staging API  
8. **Store / compliance** — Privacy, Terms, account deletion, Pakistan content rules  
9. **Risks & mitigations** — §12  
10. **Go / No-go criteria** — e.g. “Go if auth+upload adapters estimable ≤ 2 weeks and MVP ≤ 1 quarter”  
11. **Phased roadmap** — Consumer → Agent → Push/Maps → (maybe) payments  

---

## 14. Recommended roadmap (engineering)

### Phase 0 — Feasibility confirmed → foundation (web repo)

1. Mobile Bearer auth (login/refresh) + shared `requireAuth`  
2. Fix public property filters (`listingType`, search, sort)  
3. Upload path that works with mobile tokens  
4. Staging environment + absolute URL helpers  
5. Privacy/Terms pages on web (link from app)

### Phase 1 — Consumer MVP app

Browse, detail, Call/WhatsApp, auth/OTP, list property + photos/docs, my listings, request lead, thin inbox (poll or manual refresh)

### Phase 2 — Agent companion

Dashboard, verification jobs, camera evidence, requests, profile share

### Phase 3 — Platform quality

Push notifications, deep links, offline browse cache, biometric unlock

### Phase 4 — Optional differentiation

Maps/geo, SMS OTP, payments only if business commits

---

## 15. Key files for mobile engineers

| Concern | Path |
|---------|------|
| Auth (web today) | `src/lib/auth.ts` |
| Property APIs | `src/app/api/properties/` |
| OTP / register | `src/app/api/auth/otp/`, `src/app/api/register/` |
| Messaging | `src/lib/messaging-service.ts`, `src/app/api/messages/` |
| Polling reference | `src/hooks/useMessagingPolling.ts` |
| UploadThing | `src/app/api/uploadthing/`, `src/lib/uploadthing*` |
| Agent APIs | `src/app/api/agents/` |
| Schema | `prisma/schema.prisma` |
| Env template | `.env.example` |
| Prior web ops notes | `LAUNCH_HANDOVER.md` (launch-oriented; superseded for mobile by this file) |

---

## 16. Bottom line for your feasibility plan

**Feasible:** Build a Manzil mobile app that reuses the existing Next.js API for a **buyer/seller MVP**, then an **agent field app**, while leaving **admin on the web**.

**Not feasible without new work:** Treating the current web UI or cookie sessions as “mobile-ready.”

**Success condition:** Budget backend adapters (auth + uploads + list filters) as first-class workstreams, keep scope honest (no AI/payments/admin), and lean on **camera + WhatsApp + (later) push** as the reason the app exists beyond a mobile browser.
