# TB.3 — Session Audit Access-Isolation Journey — Outcome

- **Date**: 2026-09-05
- **Status**: ✅ Complete — test content green (7/7, twice, pre-drift; quality
  loop exit 0) — ⚠️ final re-verification blocked by another agent's
  unresolved schema drift on the shared test DB (see "Full-suite blockage").

## Files changed

| File | Change |
|---|---|
| `test/workflows/accounting/session-audit-access-isolation.test.ts` | 🆕 Cross-actor journey, 7 steps, all green. |
| `test/workflows/accounting/DIAGRAMS.md` | ✏️ Appended `session-audit-access-isolation.test.ts` section (5th mermaid block). Only an append — no sibling sections touched. |

## Journey design

**Cast** (committed in `beforeAll`, hard-deleted in `afterAll`, prefix
`jrn_saiso_<uuid8>` — local provision/cleanup functions in the test file,
composed from the shared helpers `createCastSubjectPair`, `assignSystemGroup`,
`revokeSystemGroupAssignments`, `expectJourneyError`):

| Actor | Group membership (real `user_permission_groups`) | Role in journey |
|---|---|---|
| `operatorUser` | `academy_admin` (migration-granted `ACCOUNTING_REPORTS_VIEW` + `_MANAGE`) | Authorized reporter |
| `teacherAUser` + `teacherA` | `teacher_default` | Scoped-data target + denial actor |
| `teacherBUser` + `teacherB` | `teacher_default` | Cross-teacher denial actor |
| `parentUser` + `parent`, `studentA`, `studentB` | students get `student_default`; parent left without extra groups | Student-scoping target + denial actor |

**Fixtures — 4 committed `class_instances`** (no attendance state-machine
drives needed; statuses are derived from committed columns per
`mapToSessionAuditStatus`):

| Instance | Teacher | Student | State → status |
|---|---|---|---|
| `takenInstance` | A | A | COMPLETED + TAKEN + actuals → `end` (2026-08-10 10:00) |
| `absentInstance` | A | A | COMPLETED + ABSENT, no join → `Absent` (2026-08-10 12:00) |
| `studentBInstance` | A | B | COMPLETED + TAKEN → `end` (2026-08-**11** 10:00) |
| `teacherBInstance` | B | A | COMPLETED + TAKEN → `end` (2026-08-10 14:00) |

All service calls go through the real `SessionAuditService.getReport` and the
real `requirePermission` (`PermissionsService.hasPermission` against real
group rows). No `PermissionsService` patching, no `runInRollback`, no
notification boundary (the service is read-only — nothing can dispatch).

## Step coverage (TB.3 spec → assertions)

1. **Teacher-scoped read**: operator + `{ teacherId: teacherA }` →
   `totalCount: 3`, exactly the three teacher-A instance ids (set-compared),
   every row carries `teacherId === teacherA.id` and teacher A's name; teacher
   B's instance absent. Aggregates: `rowCountByStatus` = `{open:0, end:2,
   Absent:1, absent_student:0}`, `rowCountByPaid` = `{paid:0, unpaid:3}`,
   `totalPaidAmount: "0.00"`, `totalPaidCurrency: SAR`.
2. **Narrowing filters**: `{teacherId, studentId: studentB}` → exactly
   `studentBInstance`; `{teacherId, currentStatuses:["Absent"]}` → exactly
   `absentInstance` with `currentStatus: "Absent"`; `{teacherId, dateFrom/dateTo
   = 2026-08-11}` → exactly `studentBInstance`.
3. **Default sort**: unsorted call returns `[studentBInstance,
   absentInstance, takenInstance]` — default `scheduledStartAt desc`.
4. **NFR-11 structured log** (`spyOn(logger, "info")` on the real backend
   logger): after one scoped read, `toHaveBeenCalledWith("Session audit report
   query", expect.objectContaining({ actorUserId, filters, limit, offset,
   rowCount }))` — exact service text from outcome 1.4.
5. **Export-route contract at the service layer** (route-level header logic —
   `X-Export-Truncated: totalCount > 10_000` — is already asserted at the
   route-test layer per outcome 2.4): the journey issues the route's exact
   call shape (`{ limit: 10_000, offset: 0 }`, empty filters) and proves the
   invariant the header encodes against real rows: `rows.length ≤ 10_000`,
   `totalCount ≥ rows.length`, and
   `(totalCount > 10_000) === (rows.length < totalCount)` — because with
   `limit 10_000` / `offset 0`, `rows.length === min(10_000, totalCount)`.
6. **Denials precede data**:
   - `teacherAUser` with `{teacherId: <own>}`, `teacherBUser` with
     `{teacherId: teacherA}`, `studentA` with `{studentId: <own>}` — all throw
     `ForbiddenError` with `code === "FORBIDDEN"` and the translated
     `insufficientPermissions` message (denial even for own-id filters).
   - The export route's gate is exercised the same way:
     `requirePermission(actor, ACCOUNTING_REPORTS_VIEW, tErrors)` →
     `ForbiddenError` for the same three actors.
   - Permission check precedes validation: an unauthorized actor with a
     reversed `dateFrom/dateTo` still gets `FORBIDDEN`; the operator with the
     same inputs gets `ValidationError` with `code === "INVALID_DATE_RANGE"`.
   - After the whole denial batch: zero `"Session audit report query"` log
     lines — denied calls never reached a read.
7. **Read-only guarantee**: all four instances re-read bare and compared
   (executionState, outcome, actualStart/End ISO, `updatedAt`) against the
   committed fixtures — byte-identical after every report call.

## Verification

- 🧪 `bun run test/scripts/run-test.ts test/workflows/accounting/session-audit-access-isolation.test.ts`
  → **7 pass / 0 fail** (51 assertions), run twice (initial write + after lint
  fixes); log: `logs/2026-09-05T01-26-33/…` and later run.
- 🔁 `bun run scripts/health/sub-loop.ts test/workflows/accounting/session-audit-access-isolation.test.ts --lifecycle codescene`
  → **exit 0** (tsgo, oxlint, biome, lint:type-aware, codescene; jscpd skipped
  by the runner for this test path). Two lint rounds were needed: `Array#sort`
  → `toSorted` with a `localeCompare` comparator (sonarjs
  `no-alphabetical-sort`), and sonarjs `prefer-specific-assertions` —
  `expect(x instanceof Y).toBe(true)` → `expect(x).toBeInstanceOf(Y)` with a
  narrowing `if` kept for the `code` assertions.
- 🔁 DIAGRAMS.md: `bun run validate:mermaid test/workflows/accounting/DIAGRAMS.md`
  → all blocks **OK** (6 after the sibling TB.1 section landed alongside; the
  append was conflict-free). The sub-loop's oxlint stage is not applicable to
  the markdown file (no TS to lint; mermaid validation is the applicable gate).
- 🧪 `bun run test:workflows` full suite — **environmentally blocked during this
  window, see the dedicated section below**. The file itself was verified green
  against every subset of the suite (accounting dir alone; file+billing;
  file+payroll; file+payroll+billing+scheduling = 8 files; and
  full-minus-any-one-domain up to 12 files / 87 tests).
- Test DB prerequisite verified by probing the test environment
  (`--env-file=.env.test`): the `accounting.reports_view` permission catalog
  row exists and is granted to `super_admin` + `academy_admin` (migration 39
  applied), so the academy-admin honest-membership path from outcome 0.1 is
  live. (The dev DB at `DATABASE_URL` does NOT yet have the enum value —
  migration 39 needs `bun db migrate` there; noted for the orchestrator, not
  touched from this slice.)

## Full-suite blockage (external — not caused by this slice)

Two independent environmental disturbances from other concurrent in-flight
work were observed and root-caused during verification:

1. **Permission-catalog churn window**: during two full-suite runs, every
   operator call failed `FORBIDDEN` — debug instrumentation showed
   `PermissionsService.getUserContext(operator)` returning 149 permissions
   (missing exactly `accounting.reports_view` + `accounting.reports_manage`)
   while subset runs minutes later resolved 151 including both. The
   permission rows and `academy_admin` grants were confirmed present in the
   test DB (direct SQL probe) once the churn window closed, and the suite
   subsets then ran green. Attributed to concurrent migration/seed activity
   from shared-tree agents (several in-flight plans touch permissions and
   `backend/db/pglite-pool`).
2. **Carryover schema drift**: a concurrent `carryover-balance-module` agent's
   uncommitted edit adds `carryoverBalanceId` (`carryover_balance_id`) to the
   Drizzle `class_instances` table (`backend/db/schema/classes/scheduling.ts`)
   with no migration applied to the test DB, so EVERY `class_instances`
   insert fails with `column "carryover_balance_id" ... does not exist`,
   breaking the entire workflows suite (31 failing tests across unrelated
   files, including mine). Per the slice rules I did not touch that agent's
   files.

CROSS-FILE DEPENDENCY:
  Target file: test/workflows/accounting/session-audit-access-isolation.test.ts
  Blocked by: backend/db/schema/classes/scheduling.ts (+ migration for `carryover_balance_id`, carryover-balance-module plan)
  Rule violated: none in my slice — the workflow suite cannot execute while schema ≠ test DB
  Required fix: the carryover-balance-module owner must apply their migration to the test DB (`bun db migrate` under the test env), or revert the schema edit until the migration is ready.

Once the test DB regains the column, `bun run test/scripts/run-test.ts
test/workflows/accounting/session-audit-access-isolation.test.ts` is expected
to return to green with no changes (it was green standalone + in all
subsets before the drift landed). A 15-attempt poll (~23 min, 90 s apart)
re-running the test observed red throughout (same `carryover_balance_id`
error, confirmed unchanged via `--last`), plus one final attempt after the
poll — the drift outlasted the whole verification window (~25 min).


## Semantic review

- No plan tags / task refs in code comments; comments describe domain
  behavior and the layer boundary (HTTP-only export-route assertions left to
  `app/api/accounting/reports/export/route.test.ts`, named explicitly).
- No `console.*`, no `any`, no relative imports, `bun:test` only.
- No notification spy needed and none installed: the service performs zero
  dispatches; installing one would assert a vacuous zero.
- Cleanup order matches `purgeCastFixture`'s FK-safe contract (events →
  reports → dues → ledger → memberships → instances → students → parents →
  teachers → users → subject → category); no `audit_logs` involvement (the
  report service writes none), so no immutability-trigger handling applies.

## Deviations / notes

1. **Cast helpers kept local to the test file** (provision + cleanup) rather
   than new shared helpers in `test/workflows/helpers/`: TB.1/TB.2 sibling
   agents are writing other journey files concurrently, and the
   teacher×student 2×2 matrix differs from both existing casts
   (`accounting-cast` has no teachers; `payroll-cast` has one). All logic is
   composed from the existing shared helpers; only assembly is local.
2. **Operator uses the `academy_admin` system group** (not a bespoke custom
   group): the permission catalog + grants are migration-owned real rows in
   the test DB, and this is the sanctioned "accounting operator" membership
   per outcome 0.1.
3. **Truncation exercised via the totalCount invariant**, not by inserting
   10 001 rows — the exact mocked-10 001 header assertion lives in the route
   test (outcome 2.4); the journey proves the service contract that makes the
   header truthful (`rows.length === min(10_000, totalCount)`).
