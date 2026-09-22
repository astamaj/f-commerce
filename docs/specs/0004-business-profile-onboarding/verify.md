# Verify: business profile and onboarding · spec 0004

_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Register a new account → expect redirect to `/onboarding` → AC-1
- [ ] Fill business name in step 1, click Continue → expect URL stays on `/onboarding` → AC-1
- [ ] Fill address in step 2, click Continue → expect URL stays on `/onboarding` → AC-1
- [ ] Select currency BDT in step 3, upload a logo image → expect logo preview appears → AC-1, AC-3
- [ ] Review step shows name, currency, address, logo → click "Enter order desk" → expect redirect to `/dashboard` → AC-4
- [ ] Inspect Business document in MongoDB: `onboardingComplete` is `true`, draft is cleared → AC-4
- [ ] Reload `/dashboard` → expect order desk renders → AC-4
- [ ] Navigate to `/onboarding` while complete → expect redirect to `/dashboard` → AC-4
- [ ] Close tab mid-wizard, reopen `/onboarding` → expect draft fields pre-filled → wizard resume

## Commands

- [ ] `npm run typecheck --workspace @f-commerce/backend` → expect exit 0
- [ ] `npm run typecheck --workspace @f-commerce/frontend` → expect exit 0
- [ ] `npm run build --workspace @f-commerce/contracts` → expect contracts export BusinessProfileSchema, CurrencyEnum, AddressSchema

## API (manual)

- [ ] `GET /api/business/me` with valid token → expect 200 + `{ name, currency, logoUrl, address, onboardingComplete, onboardingDraft }` → AC-1
- [ ] `GET /api/business/me` without token → expect 401 → AC-5
- [ ] `PUT /api/business/me` as OWNER → expect 200 + updated fields → AC-5
- [ ] `PUT /api/business/me` as STAFF → expect 403 → AC-5
- [ ] `POST /api/business/logo` with multipart image → expect 200 + `{ logoUrl }` → AC-3
- [ ] `POST /api/business/logo` with non-image file → expect 400 → AC-3
- [ ] `POST /api/business/logo` as STAFF → expect 403 → AC-5
- [ ] Complete onboarding API: `PUT /api/business/onboarding` with `{ name, currency, address, logoUrl }` → expect `onboardingComplete: true` → AC-4
- [ ] `PUT /api/business/onboarding/draft` with `{ field, value }` → expect 200 + draft persisted → wizard resume
- [ ] Navigate to `/dashboard` as incomplete business → backend middleware redirects to `/onboarding` → AC-4

## Acceptance-criteria coverage

- AC-1 … covered by step 1-3 (wizard three-step flow) + GET /api/business/me (draft loading)
- AC-2 … schema validation via BusinessProfileSchema and AddressSchema in `packages/contracts/src/business.ts`
- AC-3 … POST /api/business/logo with Cloudinary proxy and file validation (type, size)
- AC-4 … PUT /api/business/onboarding sets onboardingComplete=true; onboarding gate middleware redirects
- AC-5 … GET allows OWNER+STAFF read; PUT/logo/onboarding require OWNER only
