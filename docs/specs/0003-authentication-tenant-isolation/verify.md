# Verify: Authentication & tenant isolation · spec 0003

_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Visit POST `/api/auth/register` with valid email, password, name, businessName → Expect 201 and JWT in response, Refresh Token in cookie → AC-1, AC-2
- [ ] Visit POST `/api/auth/login` with created credentials → Expect 200 and JWT in response, Refresh Token in cookie → AC-1, AC-2
- [ ] Visit POST `/api/auth/oauth/google` with mock Google payload → Expect 200 and JWT/Refresh Token → AC-1
- [ ] Visit POST `/api/auth/oauth/google` with existing email → Expect 200 and linked account (no error) → AC-6
- [ ] Visit POST `/api/auth/refresh` with valid cookie → Expect 200 and new JWT → AC-2
- [ ] Visit GET `/api/auth/me` with valid JWT in auth header → Expect 200 and user profile + business memberships (OWNER role) → AC-3
- [ ] Verify database queries automatically isolate data by attempting a find query outside `AsyncLocalStorage` context without `bypassTenantIsolation` → Expect Error thrown → AC-4
- [ ] Make a request to a protected route with a `STAFF` role token but route requires `OWNER` → Expect 403 Insufficient permissions → AC-5

## Commands

- [ ] `npm run typecheck --workspace @f-commerce/backend` → Expected to pass (0 errors) → AC-1 to AC-6

## Acceptance-criteria coverage

- AC-1 is covered by register, login, oauth manual steps
- AC-2 is covered by register, login, refresh manual steps
- AC-3 is covered by GET /me step verifying membership output
- AC-4 is covered by DB query context error manual step
- AC-5 is covered by OWNER protected route manual step
- AC-6 is covered by OAuth duplicate email manual step
