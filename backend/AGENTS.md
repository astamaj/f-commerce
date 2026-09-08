# Backend

## Overview

The backend is the Express API workspace. It currently exposes the health endpoint and will host the application, domain, infrastructure, and presentation layers as features are added.

## Key files

| File                 | Owns                                         |
| -------------------- | -------------------------------------------- |
| `src/server.ts`      | Express app setup and the `/health` endpoint |
| `src/server.test.ts` | Health smoke test without MongoDB or Redis   |
| `package.json`       | Backend scripts and dependencies             |

## Commands

Run from the repository root with npm workspaces:

```bash
npm run dev --workspace @f-commerce/backend
npm run build --workspace @f-commerce/backend
npm run lint --workspace @f-commerce/backend
npm run typecheck --workspace @f-commerce/backend
npm run test --workspace @f-commerce/backend
```

## Conventions

- The workspace uses native ESM and strict TypeScript.
- Keep the health smoke test independent from external services.
- Keep backend dependencies behind the four Clean Architecture layers defined by the root context.
- Use named exports and avoid `any`.

## Gotchas

- The backend development server uses port 4000 by default.
- The scaffold does not connect to MongoDB or Redis yet.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite._
