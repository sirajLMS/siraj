# TB.1 Outcome — Auto-calculation → payroll visibility journey

**Task**: `test/workflows/payroll/auto-calculation-to-payroll-visibility.test.ts` (cross-actor journey, real services + real DB, committed fixtures)
**Requirements**: US-2, US-3, US-4, US-5, AC-2.1–AC-2.6, AC-9.1

## Summary

8-step journey green (8 pass / 0 fail, 64 expect() calls):
1. Teacher telemetry — own teacher activates + starts the session (RUNNING, actualStartAt set).
2. Operator stops the session — terminal COMPLETED + payroll snapshot (CALCULATED, 120.00 SAR, 60 min, attributed operator) commit in the same transaction.
3. Student absence after the waiting period — operator `updateStatusAbsent`: full scheduled window payable (ABSENT + backfilled join telemetry → student-absence branch).
4. Unattended historical session — operator reconciliation via `PayrollCalculationService.calculateForInstance`: zero pay (CALCULATED, 0.00, duration 0, isTeacherAbsence) for teaching time that never happened.
5. Operator reads all three rows through `PayrollCalculationService.getReport` (teacherId filter): per-row branch flags, totals (240.00 SAR), status counts (3 CALCULATED / 0 NOT_CALCULATED).
6. Teacher + student class-detail surfaces expose NO payroll data (all 8 payroll snapshot keys stripped — see product fix below).
7. Audit trail — exactly one attributed `PAYROLL_STATUS_TRANSITION` event per calculation (idempotent), zero `PAYROLL_OVERRIDE` events on the auto-calc journey.
8. Denial paths — teacher, student, and parent cannot read the payroll report (honest permission resolution, translated error substrings).

## Findings (product gaps surfaced by the journey — both fixed)

### F1 — Payroll snapshot leaked on the shared class-detail surface (HIGH, fixed)
`getClassInstanceDetail` applied only `assertClassInstanceDetailViewAuth` (own-session teachers via SESSION_VIEW_DETAILS and the session student via STUDENT_VIEW_OWN_DASHBOARD pass legitimately) and returned the full detail including all payroll snapshot fields; the `ClassInstanceDetailPothosObject` likewise exposes the fields with no authScopes — teachers/students could read teacher compensation data.
**Fix**: `getClassInstanceDetail` now resolves `PermissionsService.hasPermission(actor, ACCOUNTING_PAYROLL_VIEW)` and strips the 8 payroll snapshot fields (`withoutPayrollSnapshot`) for viewers without it. `calculationStatus` on the detail Pothos object is now explicitly `nullable: true` (the generated schema already serialized it as nullable — no schema/codegen diff, zero frontend fallout; accounting UI reads payroll data via the `payrollReport` query, unaffected). `payrollCredited` (pre-existing scheduling/quota flag) and the pre-existing rate-snapshot fields are intentionally NOT stripped.

### F2 — No operator force-stop path to a zero-telemetry terminal row (design clarification, test adapted)
`stop()` from ACTIVATED is an invalid state-machine transition (join telemetry required) and `markClassAbsent` always backfills `actualStartAt ?? now`, so every live operator path to COMPLETED carries telemetry. The teacher-absence zero-pay branch (`classifyPayrollBranch`: `actualStartAt == null`) is reached in production by historical/migrated rows and is reconciled through the operator-run standalone calculation — the same path `scripts/payroll-backfill.ts` uses. Step 4 now models exactly that: the cast inserts the unattended instance directly as a terminal COMPLETED row with no telemetry (historical shape), and the operator runs the calculation through the real service entry.

## Files created
- `test/workflows/payroll/auto-calculation-to-payroll-visibility.test.ts` (8-step journey)
- `test/workflows/helpers/payroll-cast.ts` (reusable cast: operator academy_admin, teacher_default, student_default, permissionless parent; fresh subject/category with no rate so the rate cascade pins to the teacher tier at 120.00 SAR/h; three instance fixtures — on-time, student-absent 3h past, unattended historical terminal; provision/cleanup with FK-safe hard deletes)
- `test/workflows/payroll/DIAGRAMS.md` (mermaid sequence, validated)
- `test/workflows/helpers/index.ts` (+1 export line)

## Files modified
- `backend/services/session/class-session.service.ts` — `getClassInstanceDetail` actor-aware payroll strip (`withoutPayrollSnapshot`)
- `backend/graphql/pothos/classes/class-session.pothos.ts` — `calculationStatus` explicit `nullable: true`

## Files NOT modified (and why)
- `buildClassInstanceDetail` (backend/graphql/utils/class-session.utils.ts) — strip applied at the service call site; shared builder signature untouched (minimal diff).
- `getClassStatusEvents` — second-order exposure (payroll amounts inside event fromState/toState JSON) deferred to the pentest wave as D22.
- `backend/services/teacher/payroll-calculation.service.ts` — no product change needed; the calculator behaved correctly on every branch.

## Verification
- sub-loop `--lifecycle codescene` exit 0 on all 4 code files (service, pothos, cast, journey test).
- `bun run validate:mermaid test/workflows/payroll/DIAGRAMS.md` → OK.
- `run-test.ts` on the journey: **8 pass / 0 fail**.
- Product-fix fallout re-runs: `scheduling-payroll-trigger.test.ts` 20/20, `payroll-report.repository.test.ts` 25/25.
- `generate:gqlSchema` + `codegen` re-run: no schema/type diff (schema already serialized the field as nullable).
- Full `bun run test:workflows` result recorded in the session worklog.

## Carry-forward knowledge for TB.2 / TB.3
- `provisionPayrollJourneyCast(prefix)` / `cleanupPayrollJourneyCast(cast)` from `@/test/workflows/helpers` — operator (academy_admin: payroll view+manage), teacher (teacher_default), student (student_default), permissionless parent, pinned 120.00 SAR/h teacher rate, three instance shapes. TB.2 can reuse the operator+teacher actors and drive CALCULATED rows; TB.3 reuses all four actors for denials.
- Terminal-state driving: teacher `activate` + `updateStatusStart`, then operator `stop` (COMPLETED + auto-calc in-tx); operator `activateOverride` + `updateStatusAbsent` for student-absence; historical rows inserted directly terminal + operator `calculateForInstance` for reconciliation.
- Report reads: `PayrollCalculationService.getReport(actorUserId, filters, { limit, offset }, tErrors)` (VIEW-gated); override entry: `applyOverride` (MANAGE-gated, idempotent, note required for Refund/Partially).
- Detail-surface denial assertion pattern: `collectPayrollKeys` walk with the explicit 8-key anchored pattern; operator sees fields, teacher/student see none.
- Event assertions: `ClassSessionService.getClassStatusEvents(operatorUserId, instanceId, tErrors)` — exactly one `PAYROLL_STATUS_TRANSITION` per fresh calculation, `PAYROLL_OVERRIDE` only from `applyOverride`.
- `dispatchSpy` on `NotificationDispatchHelpers.dispatchWithPreferences` must be installed in `beforeAll` BEFORE provisioning (fan-out during provisioning) and restored before cleanup.

## Cross-file dependencies
None outstanding. The events-surface second-order exposure is tracked as D22 (pentest wave decision: filter PAYROLL_* events for non-payroll viewers vs gating the audit page).
