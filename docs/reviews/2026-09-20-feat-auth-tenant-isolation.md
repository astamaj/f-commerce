# Review: feat/auth-tenant-isolation

**Date**: 2026-09-20  
**Reviewer**: Fresh Model (Gemini 3.8 Flash)  
**Author model**: Gemini 3.1 Pro / Opus  
**Scope**: `feat/auth-tenant-isolation` vs `main` (Spec 0003, `backend/src/`, `packages/contracts/`, `frontend/src/`)  
**Verdict**: **Approved**

---

## Executive Summary

This fresh-model review evaluates the `feat/auth-tenant-isolation` branch implementing [Spec 0003: Authentication and tenant isolation](../../docs/specs/0003-authentication-tenant-isolation/index.md).

All functional requirements (AC-1 through AC-6), architectural constraints from `AGENTS.md`, and previously identified blocking quality issues have been completely addressed:

1. **Mongoose Schema Contradiction**: `role` and `businessId` were removed from `UserModel`, properly decoupling global identity from tenant-scoped `BusinessMember` records.
2. **AC-5 Staff Invitation**: Implemented with `authRouter.post('/invite')` using `requireBusinessRole(['OWNER'])` and `AuthService.inviteStaff`.
3. **Tenant Isolation Bypass**: Patched in `BaseSchema.ts` with `pre('aggregate')` tenant filtering and mutation guards on `businessId` in update/save operations.
4. **OAuth Security**: Protected by disabling mock OAuth in production environments (`501 Not Implemented`).
5. **Clean Architecture Compliance**: Repository interfaces (`IAuthRepository`) decoupled the Application layer (`AuthService`) from Mongoose infrastructure. Dependency Injection is used to inject `MongooseAuthRepository`.
6. **Input Validation & Shared Contracts**: `@f-commerce/contracts` defines canonical Zod schemas (`RegisterSchema`, `LoginSchema`, `OAuthLoginSchema`, `InviteStaffSchema`) consumed by presentation controllers.
7. **Typed Domain Errors**: Replaced string-matching error handlers with strongly typed `DomainError` subclasses (`DuplicateEmailError`, `UnauthorizedError`, `ConflictError`, `NotFoundError`).
8. **Lint & Formatting Quality**: Resolved all 75 ESLint errors. ESLint, Prettier, TypeScript, and Vitest now pass cleanly with zero warnings or errors.

---

## Architectural & Invariant Analysis

### 1. Clean Architecture Layering & Inversion of Control

- **Domain Layer** (`backend/src/domain/`):
  - [IAuthRepository](file:///home/devziaus/projects/f-commerce/backend/src/domain/repositories/auth.repository.ts) specifies data operations without any external dependencies.
  - [user.entity.ts](file:///home/devziaus/projects/f-commerce/backend/src/domain/entities/user.entity.ts) defines clean domain entities.
  - [errors.ts](file:///home/devziaus/projects/f-commerce/backend/src/domain/errors.ts) establishes an extensible hierarchy of typed domain exceptions.
- **Application Layer** (`backend/src/application/`):
  - [auth.service.ts](file:///home/devziaus/projects/f-commerce/backend/src/application/services/auth.service.ts) serves as a thin orchestrator. It receives `IAuthRepository` via its constructor, removing all direct references to Mongoose models.
- **Infrastructure Layer** (`backend/src/infrastructure/`):
  - [auth.repository.ts](file:///home/devziaus/projects/f-commerce/backend/src/infrastructure/database/mongoose/repositories/auth.repository.ts) implements `IAuthRepository`, translating Mongoose documents into plain domain types.
  - [context.ts](file:///home/devziaus/projects/f-commerce/backend/src/infrastructure/database/mongoose/context.ts) manages tenant scoping using Node.js `AsyncLocalStorage`.
- **Presentation Layer** (`backend/src/presentation/`):
  - [auth.controller.ts](file:///home/devziaus/projects/f-commerce/backend/src/presentation/controllers/auth.controller.ts) maps HTTP requests/responses, validates payloads via Zod, and translates domain errors to semantic HTTP statuses (400, 401, 404, 409, 500).
  - [auth.middleware.ts](file:///home/devziaus/projects/f-commerce/backend/src/presentation/middlewares/auth.middleware.ts) validates JWTs and wraps request handling inside `runWithContext(...)`.

### 2. Multi-Tenant Isolation & Database Defense

- [BaseSchema.ts](file:///home/devziaus/projects/f-commerce/backend/src/infrastructure/database/mongoose/models/BaseSchema.ts):
  - Automatically injects `{ businessId: tenantId }` into queries (`find`, `findOne`, `countDocuments`, `update`, `delete`).
  - Pre-aggregate hook automatically prepends `$match: { businessId: ObjectId(tenantId) }` to pipeline queries.
  - Guard logic blocks mutation of `businessId` during updates and prevents cross-tenant document creation on `save`.
  - Supports explicit `bypassTenantIsolation` for system-level administrative jobs.

### 3. Shared Boundary Contracts & DTOs

- [packages/contracts/src/auth.ts](file:///home/devziaus/projects/f-commerce/packages/contracts/src/auth.ts) provides single-source-of-truth validation schemas. Controllers invoke `safeParse()` to reject malformed input before domain execution.

---

## Minor Non-Blocking Recommendations (Technical Debt)

The following items are low priority and do not block merge; they can be addressed during subsequent slices:

1. **Repository Return Signatures**:
   - In [auth.repository.ts](file:///home/devziaus/projects/f-commerce/backend/src/domain/repositories/auth.repository.ts), methods such as `findBusinessMember` and `findRefreshToken` currently return `unknown | null` or `unknown[]`. While type-safe, introducing concrete domain types (e.g., `BusinessMembership`, `RefreshTokenRecord`) will improve domain model richness once those entities are formally needed by other services.
2. **Dependency Injection Scalability**:
   - The presentation layer currently performs manual instantiation (`new MongooseAuthRepository()`, `new AuthService(repo)`). When future services are added in Slice 2, adopting a lightweight DI container or central composition root will simplify dependency graph assembly.
3. **Production OAuth Provider Verification**:
   - In production, mock OAuth is properly rejected with `501 Not Implemented`. Real OAuth provider token verification (Google/Facebook OAuth SDKs) will need to be configured when production provider credentials become available.

---

## Quality Gate & Test Signal

All automated checks mandated by `AGENTS.md` execute cleanly:

- **Linting** (`npm run lint`): **Passed** (0 errors, 0 warnings across `@f-commerce/frontend`, `@f-commerce/backend`, and `@f-commerce/contracts`).
- **Formatting** (`npm run format:check`): **Passed** (All files match Prettier code style).
- **Typecheck** (`npm run typecheck`): **Passed** (0 TypeScript errors in any workspace).
- **Test Suite** (`npm run test`): **Passed** (53 total tests passing):
  - Backend: 49 passing tests across 6 suites ([auth.service.test.ts](file:///home/devziaus/projects/f-commerce/backend/src/application/services/auth.service.test.ts), [auth.controller.test.ts](file:///home/devziaus/projects/f-commerce/backend/src/presentation/controllers/auth.controller.test.ts), [BaseSchema.test.ts](file:///home/devziaus/projects/f-commerce/backend/src/infrastructure/database/mongoose/models/BaseSchema.test.ts), [auth.middleware.test.ts](file:///home/devziaus/projects/f-commerce/backend/src/presentation/middlewares/auth.middleware.test.ts), [models.test.ts](file:///home/devziaus/projects/f-commerce/backend/src/infrastructure/database/mongoose/models/models.test.ts), [server.test.ts](file:///home/devziaus/projects/f-commerce/backend/src/server.test.ts)).
  - Frontend: 2 passing tests ([page.test.tsx](file:///home/devziaus/projects/f-commerce/frontend/src/app/page.test.tsx)).
  - Contracts: 2 passing tests ([index.test.ts](file:///home/devziaus/projects/f-commerce/packages/contracts/src/index.test.ts)).
- **Production Build** (`npm run build`): **Passed** (Next.js frontend and TypeScript backends compile without error).

---

## Verdict & Next Steps

**Verdict**: **Approved**

The `feat/auth-tenant-isolation` implementation is verified, architecturally sound, and compliant with all project standards.

Ready to proceed to the final step:

```bash
/document authentication & tenant isolation
```
