# Review Fixes (Backend) — carryover-balance-module

- **Date**: 2026-09-06
- **Scope**: backend review R1 (HIGH 1–3, MEDIUM 4–6) + types review R1 (inline-shape
  re-declarations, repo-local types, anonymous aggregates shape, PaidStatus single source).
- **Status**: ✅ Complete — all findings fixed, every related suite green, sub-loop
  `--lifecycle codescene` green on every touched file.

## Per-finding status

### HIGH-1 — Replay lookup truncation (was `REPLAY_LOOKUP_LIMIT = 100` + JS-only filter)
**Fixed** in `backend/services/teachers/carryover-balance.service.ts`:
`findReplayAuditLogs` now pages the actor+action+60s window via
`AuditRepository.queryAuditLogs` (`limit`/`offset` already supported by the repo —
no cross-file change needed), deduping by log id so a concurrent front-of-window
insert shifting pages can never skip rows, stopping when the full `total` is scanned
(plus a defensive 50-page cap). Matches are sorted deterministically
(`createdAt DESC, id DESC`), so a >100-row bulk batch (up to 500 allowed) replays
completely instead of truncating. The old `REPLAY_LOOKUP_LIMIT` constant is gone.
Regression test: `carryover-balance.service.test.ts` — "replay of a batch larger than
one audit page" seeds 550 keyed audit rows + noise and asserts all 550 groups replay
with zero writes and >1 paged query.

### HIGH-2 — Soft-deleted sessions aggregated/paid out
**Fixed**:
- `SchedulingRepository.getByIdsForUpdate` (`backend/db/repo/scheduling/class-instances.ts`)
  now filters `isNull(classInstances.deletedAt)` (as every other read path in the
  module); a deleted session surfaces through the existing missing-count check.
- `CarryoverBalanceRepository.findLinkedSessions` filters `isNull(deletedAt)`.
- Repo tests with a soft-deleted fixture added to both test files.

### HIGH-3 — Paid-row edits violated the `paid = payable` settlement invariant
**Fixed (strictest spec-consistent behavior)**: `updateCarryoverBalance` rejects **any**
update on an `isPaid` row (lock-then-check; the correction path is unpay → recreate),
with new domain code `CARRYOVER_PAID_CANNOT_EDIT`. New i18n key
`carryover.paidCannotEdit` added to `shared/locale/types/errors/index.ts`,
`shared/locale/en/errors/index.ts`, `shared/locale/ar/errors/index.ts`.
Tests: two new cases in `carryover-crud.service.test.ts` (metadata-only patch and
money-field patch on a paid row both reject, repo never written).
`bun run locale:snapshots` → 260 snapshots processed, 0 writes needed.

### MEDIUM-4 — Deadlock risk from unordered FOR UPDATE reads
**Fixed**: both `getByIdsForUpdate` implementations now sort the id array before
`inArray` (`toSorted((a, b) => a.localeCompare(b))`) and the statement orders by id.
Repo tests assert id-ascending results for reversed input order.

### MEDIUM-5 — Session transitions in settle/unpay/delete ran on unlocked rows
**Fixed**: `findLinkedSessions` gained `FindLinkedSessionsOptions { forUpdate }`
(moved to the types file; throws without `tx` when `forUpdate`, mirroring the
`getById` lock contract). Settle (`markCarryoverPaidAndSettleSessions`), unpay, and
delete/revert (`revertAndUnlinkCarryoverSessions`) now lock the linked sessions
`FOR UPDATE` before writing their status transitions, so a concurrent payroll
recalculation waits on the row locks instead of being clobbered. Service tests
capture and assert `{ forUpdate: true }` on all three paths.

### MEDIUM-6 — Malformed `teacherId` filter hit the uuid column (PG 22P02 → 500)
**Fixed**: `backend/graphql/query/teachers/carryover.query.ts` narrows `teacherId`
(trim; blank → no filter; non-uuid → `ValidationError`, extensions.code `VALIDATION`),
and `app/api/carryover/export/route.ts` validates it via the existing
`readValidatedParam` helper (400 + localized `invalidInput`). Tests added in both
suites. (Note: the route test's `TEACHER_ID` fixture was a non-uuid placeholder
literal — it is now a canonical uuid, since a valid value is required to pass the
new guard; behavior verified by the happy-path row mapping.)

### TYPES-7 — Service inline-shape re-declarations
**Fixed**: `unpayCarryoverBalance` now takes `UnpayCarryoverInput`;
`deleteCarryoverBalance` → `DeleteCarryoverInput` / `DeleteCarryoverResult`;
`bulkDeleteCarryoverBalances` → `BulkDeleteCarryoverInput` / `BulkDeleteCarryoverResult`;
all imported from `@/backend/types`.

### TYPES-8 — Repo-local exported types
**Fixed**: `CarryoverBalanceListRow`, `CarryoverBalancePageResult`,
`CarryoverBalanceUpdatePatch` (plus the new `FindLinkedSessionsOptions`) moved from
`backend/db/repo/teachers/carryover-balance.repository.ts` to
`backend/types/billing/carryover-balance.types.ts`; repo and both affected test
files import them from `@/backend/types`.

### TYPES-9 — Anonymous aggregates shape
**Fixed (backend side)**: named `CarryoverPaidRowCounts { paid; unpaid }` in the
types file; `CarryoverPage.aggregates.rowCountByPaid` and the service's
`countRowsByPaid` use it. Frontend `useCarryoverViewModel` adapter left untouched
(documented JSON-scalar mirror).

### TYPES-10 — Duplicated paid-status literal set
**Fixed (backend side)**: new single source `shared/constants/billing/carryover.enum.ts`
(`CARRYOVER_PAID_STATUS_VALUES` const tuple + derived `CarryoverPaidStatus` type);
`backend/types/billing/carryover-balance.types.ts` derives
`CarryoverPaidStatusFilter` from it; the GraphQL query narrowing and the CSV route
both build their guard set from the shared tuple. Frontend store/filter bar keep
their local literals — the shared path is importable from frontend, but frontend
files are outside this fix's scope (handoff note below).

## Test results (all via `test/scripts/run-test.ts`, final runs green)

| Suite | Result |
|---|---|
| `backend/services/teachers/carryover-balance.service.test.ts` | 21 pass / 0 fail |
| `backend/services/teachers/carryover-crud.service.test.ts` | 54 pass / 0 fail |
| `backend/services/teachers/carryover-to-expense.service.test.ts` | 14 pass / 0 fail |
| `backend/services/teachers/carryover-idempotency.test.ts` | 34 pass / 0 fail |
| `backend/graphql/query/teachers/carryover.query.test.ts` | 24 pass / 0 fail |
| `backend/graphql/mutation/teachers/carryover.mutation.test.ts` | 40 pass / 0 fail |
| `app/api/carryover/export/route.test.ts` | 18 pass / 0 fail |
| `backend/db/test/repo/teachers/carryover.repository.test.ts` | 43 pass / 0 fail |
| `backend/db/test/repo/scheduling/class-instances-carryover.repository.test.ts` | 9 pass / 0 fail |
| `backend/db/test/repo/teachers/teacher.repository.test.ts` (regression) | 29 pass / 0 fail |
| `backend/services/teacher/payroll-calculation.service.test.ts` (regression) | 52 pass / 0 fail |
| `test/workflows/accounting/carryover-bulk-create.journey.test.ts` | 7 pass / 0 fail |
| `test/workflows/accounting/carryover-delete.journey.test.ts` | 12 pass / 0 fail |
| `test/workflows/accounting/carryover-to-expense.journey.test.ts` | 7 pass / 0 fail |
| `test/workflows/accounting/carryover-unpay.journey.test.ts` | 5 pass / 0 fail |
| `test/workflows/billing/credit-adjustment-carryover.test.ts` (regression) | 8 pass / 0 fail |

## Sub-loop (`--lifecycle codescene`) — all exit 0

`backend/services/teachers/carryover-balance.service.ts`, `.../carryover-balance.service.test.ts`,
`.../carryover-crud.service.test.ts`, `.../carryover-to-expense.service.test.ts`,
`backend/db/repo/teachers/carryover-balance.repository.ts`, `backend/db/repo/scheduling/class-instances.ts`,
`backend/types/billing/carryover-balance.types.ts`, `backend/graphql/query/teachers/carryover.query.ts`,
`backend/graphql/query/teachers/carryover.query.test.ts`, `app/api/carryover/export/route.ts`,
`app/api/carryover/export/route.test.ts`, `backend/db/test/repo/teachers/carryover.repository.test.ts`,
`backend/db/test/repo/scheduling/class-instances-carryover.repository.test.ts`,
`shared/constants/billing/carryover.enum.ts`, `shared/constants/billing/index.ts`,
`shared/locale/types/errors/index.ts`, `shared/locale/en/errors/index.ts`, `shared/locale/ar/errors/index.ts`.

Lint recipes exercised: `no-await-in-loop` (pagination rewritten as bounded recursion),
`no-array-sort`/`sonarjs/no-alphabetical-sort` (`toSorted` + `localeCompare` comparator).

## Notes / hand-offs

- **tsgo whole-repo**: exits 1 on two pre-existing errors in
  `test/ui/components/classes/classDetailsAdminView.test.tsx` and
  `test/ui/components/fixtures/classDetailsFixtures.tsx` (`ClassInstanceQuery_classInstance`
  codegen drift) — files not touched by this work (other agents' in-flight GraphQL
  regeneration). No carryover file carries a tsgo error.
- **Frontend dedupe (types R1 medium/low residue, out of scope here)**:
  `frontend/common/stores/carryoverFilterStore.ts`,
  `frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar.tsx`, and
  `useCarryoverViewModel.ts` can now import `CARRYOVER_PAID_STATUS_VALUES` /
  `CarryoverPaidStatus` from `@/shared/constants/billing/carryover.enum` and mirror
  `CarryoverPaidRowCounts` — left to the frontend owner.
- Paid rows are now fully read-only over the update mutation; the frontend Edit
  affordance for paid rows (if shown) will surface `CARRYOVER_PAID_CANNOT_EDIT` —
  the UI may want to disable Edit on paid rows instead.
- New error code: `CARRYOVER_PAID_CANNOT_EDIT` (DomainError → GraphQL
  extensions.code); locale keys added EN+AR.
- No git mutations were performed; only scoped files (plus the i18n/shared-constant
  additions the fixes required) were touched.
