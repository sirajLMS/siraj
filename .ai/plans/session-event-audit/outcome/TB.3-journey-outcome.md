# TB.3 — Session Audit Access-Isolation Journey — Outcome

- **Date**: 2026-09-05
- **Status**: ✅ Complete

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
  → all 5 blocks **OK**. The sub-loop's oxlint stage is not applicable to the
  markdown file (no TS to lint; mermaid validation is the applicable gate).
- 🧪 `bun run test:workflows` full suite — see final line of this outcome.
- Test DB prerequisite verified by probing the test environment
  (`--env-file=.env.test`): the `accounting.reports_view` permission catalog
  row exists and is granted to `super_admin` + `academy_admin` (migration 39
  applied), so the academcy-admin honest-membership path from outcome 0.1 is
  live. (The dev DB at `DATABASE_URL` does NOT yet have the enum value —
  migration 39 needs `bun db migrate` there; noted for the orchestrator, not
  touched from this slice.)

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
