# Scope: F-Commerce Order Manager

A mobile-first SaaS for small businesses selling products through Facebook, WhatsApp, Instagram and similar channels. Sellers create, confirm, ship and track orders while managing inventory, customers and profit.

**Build approach:** Tracer Bullet (vertical slices every feature built end to end through DB, API and UI).

**Workflow:** GA (verify, test, model review, document after develop).

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| #   | Feature                           | Phase      | Status      |
| --- | --------------------------------- | ---------- | ----------- |
| 1   | Stack & architecture              | Foundation | done        |
| 2   | Data model                        | Foundation | done        |
| 3   | Coding standards & tooling        | Foundation | done        |
| 4   | Design system & UI foundation     | Foundation | done        |
| 5   | Authentication & tenant isolation | Slice 1    | planned     |
| 6   | Business profile & onboarding     | Slice 1    | planned     |
| 7   | Customers                         | Slice 1    | planned     |
| 8   | Products & categories             | Slice 2    | planned     |
| 9   | Orders (CRUD + status workflow)   | Slice 2    | planned     |
| 10  | Payments                          | Slice 2    | planned     |
| 11  | Inventory management              | Slice 3    | planned     |
| 12  | Delivery & shipping               | Slice 3    | planned     |
| 13  | Expenses & profit calculation     | Slice 3    | planned     |
| 14  | Dashboard                         | Slice 3    | planned     |
| 15  | Reports                           | Slice 4    | planned     |
| 16  | Search & filters                  | Slice 4    | planned     |
| 17  | Notifications                     | Slice 4    | planned     |
| 18  | Invoice generation                | Slice 4    | planned     |

## Foundations

### 1. Stack & architecture · done

Decide the full stack (frontend, backend, database) and scaffold a runnable project.
**Done when:** the chosen stack is captured in the spec, the repo boots locally, and the workspace smoke tests pass.

- [x] Design it (spec): `/architect stack & architecture`
      Spec [0001](../specs/0001-stack-and-architecture.md)
- [x] Build it: `/develop scaffold`
  - [x] Workspace monorepo and shared contracts scaffolded (AC scaffold acceptance)
  - [x] Frontend and backend runnable with health smoke test (AC frontend and backend startup)
  - [x] Local services, environment examples, lint, tests, builds, and CI added (AC local services and tooling)
- [x] Verify it: `/check verify scaffold`
- [x] Test it: `/test scaffold`
- [x] Review it (fresh model): `/check review scaffold`
- [x] Document it: `/document scaffold`
      Spec 0001 · code in `frontend/`, `backend/`, and `packages/contracts/`

### 2. Data model · done

Core entities: users, businesses, customers, products, categories, orders, order items, payments, expenses, inventory transactions.
**Done when:** schema supports full order lifecycle with tenant isolation and historical snapshots.

- [x] Design it (spec): `/architect data model`
- [x] Build it: `/develop data model`
      Spec 0002 · code in `backend/src/domain/entities` and `backend/src/infrastructure/database/mongoose/models`
- [x] Verify it: `/check verify data model`
- [x] Test it: `/test data model`
- [x] Review it (fresh model): `/check review data model`
- [x] Document it: `/document data model`

### 3. Coding standards & tooling · done

Lint, format, type checking, and project guardrails from the real scaffolded monorepo.
**Done when:** workspace conventions and automation reflect the project accurately, and the enforcement checks run clean on the main branch.

- [x] Setup tooling: `/develop tooling`
- [x] Finish workspace checks and review follow-ups: `/check verify tooling`
      Root `AGENTS.md`, workspace scripts, and repo-level tooling are in place; startup validation and CI follow-up still need final pass.

### 4. Design system & UI foundation · done

Typography, colors, spacing, and base components for mobile-first SaaS UI.
**Done when:** `design.md` defines the language; base components are accessible and keyboard friendly.

- [x] Design it (spec): `/architect design system & UI foundation`
      Spec [0001](../specs/frontend/0001-design-system-ui-foundation.md)
- [x] Build it: `/develop design system & UI foundation` - [x] Tailwind tokens, fonts, themes, and `design.md` (AC-1) - [x] Responsive seller shell and theme boundary (AC-2) - [x] Accessible primitives and shared async states (AC-3, AC-4) - [x] Replace scaffold page and add primitive tests (AC-5)
      Code in `frontend/`
- [x] Verify it: `/check verify design system & UI foundation`
- [x] Test it: `/test design system & UI foundation`
- [x] Review it (fresh model): `/check review design system & UI foundation`
- [x] Document it: `/document design system & UI foundation`

## Slice 1: Core Order Management

### 5. Authentication & tenant isolation · needs a decision

User auth, JWT tokens, role management (owner/staff), strict multi-tenant data rules.
**Done when:** users can register/login; each query enforces businessId isolation; unauthorized access is impossible.

- [ ] Design it (spec): `/architect authentication & tenant isolation`

### 6. Business profile & onboarding · needs a decision

Registration flow creates business account, collects business info (name, logo, currency, address).
**Done when:** new user can complete onboarding and see their business data isolated from others.

- [ ] Design it (spec): `/architect business onboarding`

### 7. Customers · needs a decision

Customer CRUD, search/filter, order history and spending view, clickable phone on mobile.
**Done when:** user can create/edit/search customers and see customer profile with order history.

- [ ] Design it (spec): `/architect customers`

## Slice 2: Product & Order Workflow

### 8. Products & categories · needs a decision

Product CRUD with images, SKU, stock tracking, categories, low-stock thresholds, archive.
**Done when:** user can add products with variants, see stock status (in stock/low/out), and archive them.

- [ ] Design it (spec): `/architect products`

### 9. Orders (CRUD + status workflow) · needs a decision

Order creation from customer/product selection, status states, order history, source tracking, formula calculations.
**Done when:** user can create order in ~60 seconds, see status timeline, and order persists correctly.

- [ ] Design it (spec): `/architect orders`

### 10. Payments · needs a decision

Payment methods (cash, bKash, Nagad, bank transfer), partial/full payments, due tracking, payment records.
**Done when:** user can record multiple payments against an order and see correct due amount.

- [ ] Design it (spec): `/architect payments`

## Slice 3: Inventory & Financials

### 11. Inventory management · needs a decision

Stock reservation on create, deduction on confirm, restoration on cancel/return, transaction history.
**Done when:** inventory transactions are auditable and negative stock is prevented.

- [ ] Design it (spec): `/architect inventory`

### 12. Delivery & shipping · needs a decision

Courier selection, tracking number, shipping address, delivery status history (manual tracking for MVP).
**Done when:** user can assign courier, track delivery progress, and see status changes.

- [ ] Design it (spec): `/architect delivery`

### 13. Expenses & profit calculation · needs a decision

Expense categories, expense CRUD, profit formula (revenue - cost - delivery - expenses).
**Done when:** user can record expenses and see accurate profit on dashboard.

- [ ] Design it (spec): `/architect expenses & profit`

### 14. Dashboard · needs a decision

Mobile-first dashboard with sales summary, order summary, financial summary, inventory status, recent orders.
**Done when:** user sees aggregated metrics on both mobile and desktop.

- [ ] Design it (spec): `/architect dashboard`

## Slice 4: Reporting & Polish

### 15. Reports · needs a decision

Sales, orders, products, customer, source reports with date filters.
**Done when:** user can generate each report type with appropriate metrics.

- [ ] Design it (spec): `/architect reports`

### 16. Search & filters · needs a decision

Global search (order number, customer, product, tracking); order/product/customer filters.
**Done when:** user finds records quickly with debounced search and persistent filter state.

- [ ] Design it (spec): `/architect search & filters`

### 17. Notifications · needs a decision

Email/SMS notifications for order updates, payment reminders, low stock alerts.
**Done when:** user receives configured notifications through their email/SMS.

- [ ] Design it (spec): `/architect notifications`

### 18. Invoice generation · needs a decision

Printable invoice with business info, customer info, items, totals, payment method.
**Done when:** user can print invoice or save as PDF via browser print.

- [ ] Design it (spec): `/architect invoices`

## /scope replan · F-Commerce Order Manager

**3 foundation features are in the current pass (1 done, 2 in progress, 0 deferred), build approach Tracer Bullet, workflow GA.**
Next: `/develop data model`, then `/check verify tooling`, then `/architect design system & UI foundation`
Heads up: the backend scaffold smoke test currently times out while waiting for the startup message. Frontend and contracts tests pass. The remaining product work includes the UI system, auth, onboarding, and the data model build path. Scope written to `docs/scope/scope.md`.

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack & architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle:** the scope updates as a feature moves; each row is what it shows and who sets it:

| State                    | Set by                           | The feature shows                                                            |
| ------------------------ | -------------------------------- | ---------------------------------------------------------------------------- |
| `planned`                | `/scope`                         | one box: `Design it (spec): /architect <feature>`                            |
| `in-progress` (designed) | **`/architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /develop <feature>` + milestones |
| `in-progress` (building) | `/develop`                       | milestone sub-boxes tick one by one                                          |
| `in-progress` (verified) | `/check verify`                  | `Build it` + milestones ticked; `Verify it` ticked                           |
| `done`                   | **you, when you decide it is**   | boxes you ran ticked; tier's last stage completed                            |

- **Approach tag** beside heading overrides project default for that feature.
- **Workflow tier tag** sets one feature's rigor (GA = verify, test, review, document).
- **Pointer line** (`spec <n> · code in <path>`) appears only after those exist.

## Deferred

Out of scope for the current build pass, kept so the plan stays honest.

- **Subscription billing**: integrate Stripe/checkout once MVP proves fit
- **Courier API integrations**: live tracking once core workflow is stable
- **Social channel APIs**: Facebook/WhatsApp order import via future integrations
- **Advanced analytics**: AI insights after basic reporting works
