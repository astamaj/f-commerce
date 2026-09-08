# Scaffold review

Date: 2026-09-08
Reviewer: Copilot Auto
Author model: Opus
Scope: `feat/scaffold` from `aa381fa58a95463d93841555eb9895d844cf6e92` through `HEAD`, plus current untracked files
Verdict: Changes requested

The requested Sonnet reviewer was not available in this session. Copilot Auto provided the independent review instead.

## Major finding

### 1. Required backend environment validation is missing

Location: [backend/src/server.ts](../../backend/src/server.ts#L3-L4)

The server only reads `PORT`. It does not validate the required backend environment values from the stack specification, including database, Redis, JWT, CORS, and Cloudinary configuration.

This allows invalid or missing production settings to pass startup and fail later during requests. It also misses the scaffold acceptance requirement for startup validation.

You could add one startup configuration schema for the required values, while keeping `/health` independent from MongoDB and Redis.

## Minor findings

### 2. Shared contracts are not declared by the applications

Locations: [backend/package.json](../../backend/package.json#L15-L20) and [frontend/package.json](../../frontend/package.json#L13-L24)

Neither application declares `@f-commerce/contracts`. Root workspace hoisting can mask this, but the dependency graph does not express the shared contract boundary and may fail under isolated deployment or dependency pruning.

You could add the workspace dependency to both applications and update the root lockfile.

### 3. The duplicate frontend lockfile violates the monorepo contract

Location: [frontend/package-lock.json](../../frontend/package-lock.json#L1-L8)

The specification requires one root `package-lock.json`, but a nested frontend lockfile is present. It can cause inconsistent dependency resolution when frontend commands run from that workspace.

You could remove the nested lockfile and retain the root lockfile as the sole lockfile.

### 4. Playwright smoke tests are not part of CI

Locations: [.github/workflows/ci.yml](../../.github/workflows/ci.yml#L16-L17) and [frontend/e2e/scaffold.spec.ts](../../frontend/e2e/scaffold.spec.ts#L1-L18)

CI runs Vitest through the root `test` script but never runs the configured Playwright suite. Browser startup and responsive smoke coverage can therefore regress unnoticed.

You could add a frontend end to end script and invoke it in CI with browser installation, or explicitly document why it is excluded.

## Context review

The backend and contracts context files accurately describe their current workspaces. The frontend environment example exists at [frontend/.env.example](../../frontend/.env.example#L1), so the previous report finding about that file is closed.

## Strengths

The workspace names and monorepo layout match the specification. Backend health testing is independent of MongoDB and Redis. Environment examples cover the required backend and frontend variables. Contracts include runtime Zod validation and declaration output. Static diagnostics show no errors in the inspected source files.

## Test signal

Tests are configured with Vitest and Playwright. Runtime tests, builds, lint, and `git diff` were not executed by the read only reviewer because the reviewer had no terminal capability. The findings are based on direct reads of the current files and workspace metadata.

Scope: ticked `Review it` for scaffold.
