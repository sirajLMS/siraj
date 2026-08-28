# Workflow / Journey Tests (`test/workflows/`)

Cross-actor **journey tests**: sequential, actor-attributed workflows where actor A (e.g. a
teacher) performs an action that changes shared state, and actor B (e.g. a manager) observes and
responds — executed through the **real service layer** against the **real test database**.

Canonical example: `test/workflows/scheduling/lesson-report-lifecycle.test.ts`.

## What a journey is

A journey is an ordered series of steps, each attributed to an actor:

```text
Step 1  teacher   → LessonReportService.submitReport(...)        → report PENDING_REVIEW
Step 2  manager   → LessonReportService.getPendingReviews(...)    → sees the report
Step 3  manager   → LessonReportService.approveReport(...)        → APPROVED + teacher_due + notification to teacher
Step 4  teacher B → submitReport on teacher A's class             → rejected (honest permission/ownership failure)
Step 5  teacher + manager → submit → rejectReport(...)            → REJECTED + credit refund + notification
```

Each step calls a service function directly with the actor's `userId` as the first argument
(`actorUserId`). There is no HTTP server, no GraphQL resolver, no Apollo client — resolver
machinery (DataLoader, subscriptions, cookies) stays with the GraphQL integration layer.

## Where this layer sits

| Layer | Location | Scope |
|---|---|---|
| Repository | `backend/db/test/repo/` | Single repository methods, 100% coverage, `runInRollback` |
| Business logic | `backend/db/test/logic/` | Multi-entity logic & constraints, `runInRollback` (plus committed-fixture precedents) |
| **Journey (this layer)** | `test/workflows/` | **Cross-actor workflows through real services, committed fixtures** |
| Service unit | `backend/services/**/*.test.ts` | Single service, mocked externals, heavy mocking allowed |
| GraphQL integration | `frontend/common/graphql/test/` | Resolvers, schema, permissions over HTTP |
| E2E | `test/ui/e2e/` | Browser-driven user flows |

Journeys fill the gap between service unit tests (one actor, mocked boundaries) and E2E (full
stack, browser): they prove that a multi-step workflow behaves correctly when each step is taken
by a *different actor* with *real permission resolution* against *real committed rows*.

Use a journey test when:
- The workflow spans **multiple actors** (teacher → supervisor, parent → admin, …).
- You need to assert **cross-actor visibility** (A's action appears/disappears for B) and
  **cross-actor side effects** (notifications, dues, refunds targeting *another* user).
- Honest permission checks matter (no `PermissionsService` monkey-patching).

Use a different layer when:
- A single service method in isolation suffices (service unit test with mocks).
- You only exercise repositories/constraints (repo or logic test with `runInRollback`).
- You need resolver wiring, HTTP, or browser behavior (GraphQL / E2E).

## Rule: NO `runInRollback` in journeys

Services use the global `db` and spawn their **own top-level transactions**. Wrapping a journey in
an outer rollback transaction would deadlock or silently miss committed rows. This layer is the
documented exception to the db/test `runInRollback` rule (which targets repository/logic tests).

Precedents:
- `backend/db/test/logic/lms/accounting-payment-workflow.test.ts` (~lines 40–44): fixtures
  **committed** in `beforeAll`, hard-deleted in `afterAll`, UUID-prefixed unique data.
- `backend/db/test/logic/permissions/permission-management.service.test.ts` (~lines 120–124):
  committed fixtures under db/test rule 9.

## Fixture lifecycle

- **`beforeAll`**: provision the full actor "cast" in a short `db.transaction(...)` that
  **commits**. Use `backend/db/test/entity-setup.ts` helpers (`createTestUser`,
  `createTestTeacher`, `createTestStudent`, `createTestParent`, `createCompletedClassInstance`) —
  verify their signatures before calling; they vary.
- **Track every created row id** in the cast object (including rows the *services* create during
  the journey: lesson reports, teacher dues, credit transactions, idempotency-keyed rows).
- **`afterAll`**: hard-delete everything in FK-safe order via the cast's `cleanup` function
  (`test/workflows/helpers/journey-cast.ts`).
- **UUID-prefix discipline**: every suite generates a unique prefix
  (`const prefix = \`jrn_<domain>_${randomUUID().slice(0, 8)}\``) used in names/notes so parallel
  or repeated runs never collide.
- **Never use demo/seeded user rows as fixtures.** Permission catalog rows and system permission
  groups (`teacher_default`, `supervisor_default`, created by migrations) are *definitions*, not
  demo data — assigning them to your own test users via `assignSystemGroup`
  (`test/workflows/helpers/permissions.ts`) is the sanctioned honest-permission path.

## Permissions resolve honestly

Actors hold real `user_permission_groups` membership rows, so `requirePermission` and
`PermissionsService.hasPermission` resolve through the real query path. **Never** monkey-patch
`PermissionsService.getUserContext` / `hasPermission` in a journey — that defeats the layer's
purpose. Negative steps (wrong actor, missing permission) must therefore throw naturally; assert
them with a try/catch helper and translated substrings from
`getServerTranslations("en").errorsTranslations` — **never** `expect(...).rejects.toThrow()`.

## Notification spying

Domain services dispatch notifications through `dispatchWithPreferences` from
`@/backend/services/notification/notification-dispatch.helpers`. **Nothing in a journey may reach
a real external API** (email/SMS/push/meeting/FX). Spy the dispatch boundary:

```typescript
import * as NotificationDispatchHelpers from "@/backend/services/notification/notification-dispatch.helpers";

const dispatchSpy = spyOn(NotificationDispatchHelpers, "dispatchWithPreferences").mockResolvedValue([]);
// ... assert spy calls target the expected actor userIds ...
dispatchSpy.mockRestore();
```

ESM live-binding caveat: `spyOn` on the module namespace intercepts only if the service's import
binding is re-read at call time. The sanctioned pattern (per `backend/services/AGENTS.md`) is
`spyOn` first — asserted empirically (the journey fails if the spy sees no calls); if a module is
found not to intercept, fall back to `mock.module(...)` with restore in `afterAll`. Assert both
that a dispatch happened **and which userIds it targeted** — targeting the wrong actor is exactly
the bug class journeys exist to catch.

## File organization

- One journey file per cross-actor workflow, grouped by domain subdirectory:
  `test/workflows/<domain>/<workflow>.test.ts` (e.g. `test/workflows/scheduling/lesson-report-lifecycle.test.ts`).
- Shared cast/permission scaffolding lives in `test/workflows/helpers/` (never per-file duplicates).
- Layer rules for AI agents: `test/workflows/AGENTS.md`.
- Run with `bun run test:workflows`.

## Recording journeys from specs

Cross-actor journeys are part of the spec workflow — integrated in
`.agents/skills/spec-driven-development/SKILL.md` and the `.agents/spec-process-guide/` templates:

- **Requirements phase** (`requirements-template.md` → "Cross-Actor Workflow Scenarios
  (Journeys)"): capture an **actor table** (actors, their permission groups, and what each
  can/cannot do) and an ordered **step list** (`actor → action → expected shared-state change +
  side effects`), with EARS criteria phrased from the perspective of the actor who OBSERVES the
  outcome. These map 1:1 onto a journey's steps.
- **Design phase** (`design-template.md` → "Cross-Actor Journey Design"): record the **shared-entity
  state machine** (e.g. `PENDING_REVIEW → APPROVED | REJECTED`), the **side-effect matrix** per
  transition (rows created, notifications dispatched, credits moved, idempotency keys), and
  **cross-actor visibility** per state. These become the journey test's assertions.
- **Tasks phase** (`tasks-template.md` → "Journey Test Tasks"): write the journey test **first**
  (test-driven), then implement the service surface until the journey passes. The journey file is
  named after the workflow and lives under the domain subdirectory derived from the spec.

Specs for single-actor features do not need journey sections.
