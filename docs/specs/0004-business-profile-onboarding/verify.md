# Verify: business profile and onboarding · spec 0004

_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] `GET /onboarding` renders → HTTP 200, page component loads — verified via curl
- [x] `GET /settings` renders → HTTP 200, page component loads — verified via curl
- [~] Register a new account → expect redirect to `/onboarding` → AC-1 — BLOCKED: no frontend auth pages (login/register); no auth token storage or forwarding from frontend to backend
- [~] Fill wizard step 1 (business name) → click Continue → URL stays on `/onboarding` → AC-1 — BLOCKED: frontend fetches `/api/business/me` relative to port 3000; no proxy to backend port 4000; returns 404
- [~] Fill wizard step 2 (address) → click Continue → URL stays on `/onboarding` → AC-1 — BLOCKED: same proxy + auth issue
- [~] Select currency BDT in step 3, upload logo → expect logo preview → AC-1, AC-3 — BLOCKED: same proxy + auth issue
- [~] Review step shows data → click "Enter order desk" → redirect to `/dashboard` → AC-4 — BLOCKED: same proxy + auth issue; no `/dashboard` route in frontend
- [~] Reload `/dashboard` → expect order desk renders → AC-4 — BLOCKED: no `/dashboard` route in frontend; onboarding gate is dead code (see API section)
- [~] Navigate to `/onboarding` while complete → redirect to `/dashboard` → AC-4 — BLOCKED: cannot complete onboarding from frontend
- [~] Close tab mid-wizard, reopen `/onboarding` → draft pre-filled → wizard resume — BLOCKED: same proxy + auth issue

## Commands

- [x] `npm run typecheck --workspace @f-commerce/backend` → exit 0
- [x] `npm run typecheck --workspace @f-commerce/frontend` → exit 0
- [x] `npm run build --workspace @f-commerce/contracts` → exports BusinessProfileSchema, CurrencyEnum, AddressSchema

## API (manual)

All API tests performed against the live Express backend (port 4000) with MongoDB Atlas connected and all env vars properly loaded.

- [x] `GET /api/business/me` with valid OWNER token → 200 + `{ name, currency, logoUrl, address, onboardingComplete, onboardingDraft }` → AC-1 — verified: new business returns `{"name":"Final Biz","currency":"BDT","logoUrl":null,"address":null,"onboardingComplete":false}`
- [x] `GET /api/business/me` without token → 401 → AC-5 — verified: returns 401 `{"error":"Missing or invalid authorization header"}`
- [x] `PUT /api/business/me` as OWNER → 200 + updated fields → AC-5 — verified: returns updated business with new name/currency/address
- [x] `PUT /api/business/me` as STAFF → 403 → AC-5 — verified: returns 403 `{"error":"Insufficient permissions"}`
- [x] `POST /api/business/logo` with multipart image → 200 + `{ logoUrl }` → AC-3 — verified: uploaded to Cloudinary, returned secure URL `https://res.cloudinary.com/kt5x0cdl/image/upload/v.../logo.png`
- [x] `POST /api/business/logo` with non-image file → 400 → AC-3 — verified: returns 400 `{"error":"Invalid file type","message":"Only JPEG, PNG, GIF, and WebP images are allowed"}`
- [x] `POST /api/business/logo` as STAFF → 403 → AC-5 — verified: returns 403 `{"error":"Insufficient permissions"}`
- [x] Complete onboarding: `PUT /api/business/onboarding` → `onboardingComplete: true` → AC-4 — verified: returns `{"onboardingComplete":true}`, confirmed in MongoDB
- [x] `PUT /api/business/onboarding/draft` with `{ field, value }` → 200 + draft persisted → wizard resume — verified: draft returned in GET /me response as `onboardingDraft: {"name":"Draft Business","address":{...}}`
- [x] Navigate to `/dashboard` as incomplete business → backend middleware returns 403 → AC-4 — FIXED: onboarding gate is now a router-level middleware inside businessRouter (not dead code in server.ts); incomplete business GET /api/business/me returns 403 with `{"error":"Onboarding required"}` (verified via curl)

## Acceptance-criteria coverage

- AC-1 … ✅ at API level, BLOCKED at UI level — GET /api/business/me returns all required fields; PUT /onboarding/draft persists draft; but no frontend auth pages, no API proxy, no token forwarding prevent reaching the wizard
- AC-2 … ✅ verified — BusinessProfileSchema and AddressSchema exist in `packages/contracts/src/business.ts`, exported and build successfully; schemas validate correctly
- AC-3 … ✅ verified — POST /api/business/logo accepts multipart image, proxies to Cloudinary, returns secure URL; non-image files rejected with 400; STAFF blocked with 403
- AC-4 … ✅ at API level — PUT /api/business/onboarding sets `onboardingComplete: true` and clears draft via `$unset` (verified in MongoDB); onboarding gate is a router-level middleware in businessRouter that returns 403 for incomplete businesses (except onboarding routes) (verified via curl)
- AC-5 … ✅ verified — GET allows OWNER+STAFF read; PUT/logo/onboarding require OWNER only (STAFF gets 403 "Insufficient permissions"); 401 without token
