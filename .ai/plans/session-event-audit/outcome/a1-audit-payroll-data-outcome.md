# WAVE-O-1 — Audit-page payroll dialog data path (Task 3.6 / A1)

**Date:** 2026-09-05 · **Verdict: IMPLEMENTED — document extension only; NO backend change was needed.**

## Decision: extend the existing `classInstance` document (recipe alternative a)

The CROSS-FILE DEPENDENCY report in `outcome/3.6-override-dialog-wiring-outcome.md`
offered two paths: extend `groupClassAudit` with payroll fields (backend change in
`group-class.types.ts` / `group-class.service.ts` / `group-class.pothos.ts`), or select
the payroll fields that `ClassInstanceDetail` already exposes via the existing
`classInstance` query. Investigation confirmed the second path is fully sufficient and
is the minimal-diff choice:

- `ClassInstanceDetailPothosObject` already exposes every payroll field Plan 3 landed
  (`frontend/common/graphql/generated/schema.graphql` → `type ClassInstanceDetail`:
  `calculationStatus`, `calculatedDuration`, `teacherPaidAmount`, `teacherPaidCurrency`,
  `isPartialPercentage`, `payrollNote`, `payrollCalculatedAt`).
- `ClassSessionService.getClassInstanceDetail`
  (`backend/services/session/class-session.service.ts:366-378`) already populates the
  payroll snapshot and **already enforces the accounting permission**: actors without
  `ACCOUNTING_PAYROLL_VIEW` get the snapshot stripped server-side
  (`PAYROLL_SNAPSHOT_DETAIL_FIELDS` at :339-348, `withoutPayrollSnapshot` at :357-364),
  so the fields resolve to `null` for them. No new permission decision was required.
- `classInstance(id: ID!)` is instance-scoped: `buildClassInstanceDetail`
  (`backend/graphql/utils/class-session.utils.ts:95-97`) sets both `id` and
  `instanceId` to the class instance id.
- The audit page already holds the instance id: its route param is passed verbatim as
  `classInstanceId` into `groupClassAudit` (`useClassAuditViewModel.ts:102-105`). The
  same value is a valid `classInstance(id:)` argument — no extra lookup, and
  `groupClassAudit.id` being the *group* id no longer matters.

**Zero backend files were changed.** The only source edit is the document selection
below. No schema migration, no resolver change, no service change.

## Files touched

1. `frontend/common/graphql/sharedDocuments/scheduling/class-session.documents.ts` —
   `classInstanceQueryDocument` now also selects, right after `payrollCredited`:
   `calculationStatus`, `teacherPaidAmount`, `teacherPaidCurrency`,
   `calculatedDuration`, `isPartialPercentage`, `payrollNote`, `payrollCalculatedAt`.
2. `frontend/common/graphql/generated/gql/graphql.ts` + `.../generated/schema.graphql` —
   regenerated via `bun run generate:gqlSchema && bun codegen` (see "Shared-tree note").
3. `frontend/common/graphql/test/classes/class-instance-detail.test.ts` — the
   "admin can read class instance detail" case now asserts `toHaveProperty(...)` for all
   seven payroll fields, pinning the selection contract end-to-end (23 → 30 expects).

## Exact handoff for the frontend wiring wave

- **Document:** `classInstanceQueryDocument` from
  `@/frontend/common/graphql/sharedDocuments` (barrel) or the
  `scheduling/class-session.documents` deep import.
- **Variables:** `{ id: <class instance id> }`. On the audit page this is the existing
  route param `useParams().id` — the same string already passed to `groupClassAudit`.
- **Result type:** `ClassInstanceQuery_classInstance` (operation type `ClassInstanceQuery`).
  For the `OverrideDialog` `row` prop (consume-after-narrowing target from the wiring
  report), build the dialog row from exactly these members:

  | Dialog consumes (`useOverrideDialogViewModel.ts:341-346,354`) | Field on `ClassInstanceQuery_classInstance` | Generated type |
  |---|---|---|
  | submit target + `canSubmit` | `instanceId` | `string \| null` |
  | `calculationStatus` | `calculationStatus` | `CalculationStatus \| null` |
  | `teacherPaidAmount` | `teacherPaidAmount` | `string \| null` |
  | `teacherPaidCurrency` | `teacherPaidCurrency` | `CurrencyCode \| null` |
  | `calculatedDuration` | `calculatedDuration` | `number \| null` |
  | `isPartialPercentage` | `isPartialPercentage` | `number \| null` |
  | `payrollNote` | `payrollNote` | `string \| null` |
  | (extra context for the payroll card) | `payrollCalculatedAt` | `string \| null` |

  The same result also carries the rest of the row context the audit details card may
  want (`id`, `status`, `executionState`, `outcome`, `scheduledDate`, `startTime`,
  `endTime`, `durationMinutes`, `subjectId`, `subjectName`, `student { id name }`,
  `teacher { id name }`, `rateAmount`, `rateCurrency`, `isRateOverridden`).
- **Permission behavior:** viewers without `ACCOUNTING_PAYROLL_VIEW` receive all six
  summary fields (and `payrollCalculatedAt`) as `null` — the dialog's existing
  `row?.field ?? null` fallbacks render `—`; there is no leak for teachers/students even
  though the details page shares this document.
- **Status events remain separate:** override-history events still come from
  `classStatusEventsQueryDocument` (`class-session.documents.ts:94`), unchanged — its
  dual `ACCOUNTING_PAYROLL_VIEW` filter (`class-session.service.ts:380-393`) already
  drops `PAYROLL_*` events for unauthorized actors.
- **Cache:** `classInstance` selects `id`, so Apollo normalizes it; a later
  `applyPayrollOverride` success can `refetch` this query (or evict the
  `ClassInstanceDetail` cache entry) to refresh the summary — that eviction belongs to
  the wiring wave alongside the `useOverrideDialogViewModel` success path.

## Shared-tree note (generated files)

`bun codegen` regenerates the whole generated file from the current tree, so the diff
of `frontend/common/graphql/generated/gql/graphql.ts` / `schema.graphql` also contains
in-flight additions owned by other waves: the `SessionAuditReport*` operation types
(wave F documents) and the `ACCOUNTING_CARRYOVER_VIEW/MANAGE` enum members (sibling
plan's permission enum edit). None of that was authored here; it is the deterministic
codegen output of the shared working tree at generation time.

## Tests — RUN, green

`frontend/common/graphql/test/classes/class-instance-detail.test.ts` (GraphQL
integration, real dev server via the locked server runner):

```
bun run scripts/lib/run-locked-cmd.ts test:graphql \
  bun run test/scripts/run-server-tests.ts \
    frontend/common/graphql/test/classes/class-instance-detail.test.ts
```

→ **6/6 tests passed, 30 expect() calls** (run twice: once before adding the payroll
assertions to prove no regression, once after — both green). This executes the extended
document against the live schema, proving the payroll selection resolves end-to-end.
No new backend test was added (no backend change), per the minimal-diff decision.

## Quality pipeline

- `bun run scripts/health/sub-loop.ts frontend/common/graphql/sharedDocuments/scheduling/class-session.documents.ts --lifecycle codescene` → **exit 0** (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene), first pass.
- `bun run scripts/health/sub-loop.ts frontend/common/graphql/test/classes/class-instance-detail.test.ts --lifecycle codescene` → **exit 0**, first pass.

## Semantic review / instruction verification

- No `console.*`; no new user-facing strings; no comments added to source (so zero
  plan-artifact references; conventions per `frontend/AGENTS.md` hold trivially).
- No races/dead code: the change is a selection-set extension only; the service's
  permission strip is the single source of truth for payroll visibility.
- Schema/field check honored: every selected field exists on `ClassInstanceDetail` in
  the generated schema (verified against `schema.graphql` before editing).
- `id` is present on every object in the selection (pre-existing); no new embedded
  type was introduced, so `apolloCache.ts` `keyFields: false` additions are not needed.
- Scope discipline: only the scheduling documents file, its integration test, and the
  codegen outputs were touched. `frontend/common/views/dashboard/` audit views and the
  `OverrideDialog` prop narrowing remain the follow-up frontend wave's work (recipe
  steps 3–5 in `3.6-override-dialog-wiring-outcome.md`).
- Remark: the class **details** page shares `classInstanceQueryDocument`, so it now
  also selects the payroll fields. This is safe by construction (server strips them
  for non-`ACCOUNTING_PAYROLL_VIEW` actors) and costs one nullable column set.
