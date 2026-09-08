# 0001. Adopt the project stack and architecture

**Date**: 2026-09-08
**Status**: Proposed

## Summary

The stack is a separate frontend and backend deployment with Next.js on Vercel and Express on Render, MongoDB with Mongoose, JWT auth, BullMQ for background jobs, and Cloudinary for file storage. This is the right foundation for a mobile-first SaaS with subscription billing to grow into, but the separate-repo choice adds deployment complexity a solo developer must live with.

## Context

A small F-commerce SaaS needs a clean separation between the seller-facing web app and the API that serves it. The product targets solo developers and small teams building for the Bangladesh market (BDT currency, Bengali language). Key forces: mobile-first responsiveness, multi-tenant data isolation, subscription billing in the future, and a 2-3 month MVP timeline with one developer.

## Options considered

### Option 1: Separate frontend and backend repos (chosen)

Two independent repos deployed separately. Frontend on Vercel, backend on Render.

**Pros**: Clean separation of concerns, independent scaling, each repo can evolve its own tooling without affecting the other.

**Cons**: Two deployment pipelines to maintain, two repos to keep in sync, more infrastructure to manage for a solo dev. Cross-origin setup and CORS config add friction.

### Option 2: Monorepo with shared tooling

One repo with frontend and backend packages, single deployment pipeline per workspace.

**Pros**: Single repo for everything, shared linting and types, simpler dependency management.

**Cons**: Requires monorepo tooling (Turborepo, Nx). Adds complexity upfront. Vercel and Render deploy differently, so the monorepo benefit is limited for this stack.

### Option 3: Full-stack Next.js (API routes)

Frontend and API in one Next.js app deployed to Vercel.

**Pros**: Fastest to ship, no cross-origin issues, one deployment.

**Cons**: The user's product spec explicitly calls for a separate backend API. Mixing API routes with the frontend app makes it harder to scale the backend independently later. Not the right shape for a multi-tenant SaaS that may eventually split.

## Decision

**Chosen option**: Option 1: Separate frontend and backend repos.

Two repos deployed independently: the Next.js app on Vercel, the Express API on Render. This matches the product spec and keeps each side cleanly separable as the SaaS grows.

**Implementation skills**: none detected yet (installed skills are not yet recorded in `AGENTS.md`).

## Rationale

The user's product spec (section 37) already called for React + TypeScript on the frontend and Node.js + Express on the backend with MongoDB. The separate-repo choice preserves that separation and lets each side use its own tooling without compromise. The tradeoff is operational: one developer maintains two deploy pipelines. That is acceptable for the MVP timeline because Render's free tier and Vercel's hobby plan keep costs near zero while the product is unproven.

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript | The user's spec requires TypeScript strict mode. Shared types between frontend and backend reduce bugs. |
| Frontend framework | Next.js (app router) | The user chose this over React + Vite. App router gives built-in routing, server components, and SEO readiness if marketing pages are added later. |
| Backend framework | Node.js + Express | Matches the user's spec. Minimal and proven. The controller → service → repository pattern fits naturally. |
| Primary DB | MongoDB + Mongoose | The user's spec recommends MongoDB. Mongoose adds schema validation and middleware hooks that prevent raw driver mistakes. |
| Auth | JWT with custom endpoints | The user's spec requires JWT-based auth. Custom endpoints give full control over token payload (role, businessId) for tenant isolation. |
| Background jobs | BullMQ + Redis | Async email sending and order processing. Adds Redis dependency but is the robust choice for a SaaS that will send notifications. |
| File storage | Cloudinary | The user's spec lists Cloudinary first. Generous free tier, simple API, and easy to swap behind a service abstraction later. |
| Hosting | Frontend: Vercel, Backend: Render | Matches the user's spec. Both have generous free tiers for MVP. Vercel auto-deploys from GitHub; Render handles Node.js simply. |
| API shape | REST JSON | Matches the user's spec. Consistent `{success, data, message}` response format. |
| Observability | Structured console logging | Sufficient for MVP. Winston or pino with JSON output. Add Sentry when the product gains traction. |
| Rate limiting | Simple per-IP limiter | One global limiter (e.g., 100 requests/min). Easy to implement, protects against abuse without complex config. |

## Consequences

**Positive**:
- Clean separation between frontend and backend lets each side evolve independently.
- TypeScript shared types make the API contract explicit and catch bugs at compile time.
- Cloudinary's free tier handles product images without storage infrastructure.
- Render's free tier keeps backend costs near zero for the MVP window.

**Negative / tradeoffs**:
- Two repos means two CI/CD pipelines and two places to check status.
- Cross-origin setup (CORS) adds a small configuration burden and a potential security misconfig point.
- Separate repos make local dev slightly harder (two terminals, two `npm run dev` commands).
- Redis adds one more infrastructure dependency for background jobs.

**Neutral**:
- Next.js app router uses server components by default; the frontend team must decide which components are server vs client.
- BullMQ requires a Redis instance; Render offers Redis as an add-on or a separate service.

## Follow-up

- [ ] Create the `AGENTS.md` conventions file once the scaffold is up (run `/audit` after the first slice lands).
- [ ] Decide the Redis hosting choice: Render Redis add-on vs a standalone Redis provider (affects cost and connection string config).
- [ ] Set up CORS config early (the first cross-origin request will fail without it).
- [ ] Confirm whether the separate-repo choice stays or shifts to a monorepo if the solo dev finds dual pipelines slow.