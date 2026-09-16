# TB.1 Journey — session lifecycle → session-audit grid — Outcome

- **Date**: 2026-09-05
- **Status**: ✅ Complete (WAVE-N-1)

## Files changed

| File | Change |
|---|---|
| `test/workflows/accounting/session-audit-session-lifecycle.test.ts` | 🆕 11-step journey, all green (11 pass / 0 fail / 70 assertions). |
| `test/workflows/accounting/DIAGRAMS.md` | ➕ Appended `session-audit-session-lifecycle.test.ts` sequence-diagram section at EOF (sibling `session-audit-access-isolation.test.ts` section from the concurrent wave left untouched). |

## Journey surface (what the test drives)

Cast: `provisionPayrollJourneyCast` (operator = `academy_admin` → holds `ACCOUNTING_REPORTS_VIEW` via migration 39; teacher = `teacher_default`; permissionless parent) plus a second teacher (+ user + `teacher_default` assignment) and their untouched instance, provisioned in a committing `beforeAll` transaction and hard-deleted in `afterAll` (extra rows first, then `cleanupPayrollJourneyCast`). No `runInRollback`. `dispatchWithPreferences` intercepted via namespace `spyOn` for the whole suite.

Steps:
1. Untouched session reads `open`; payroll snapshot pre-calculation (`NOT_CALCULATED`, null amounts) — graceful degradation intact.
2. `activate` + `updateStatusStart` (teacher) → RUNNING with `actual_start_at`; still `open`.
3. `stop` (operator) → COMPLETED/TAKEN → `end`; auto payroll snapshot surfaces in the grid (`CALCULATED`, `120.00` SAR at the cast's 120/h rate).
4. `activateOverride` + `updateStatusAbsent` → COMPLETED/ABSENT; **the state machine stamps `actual_start_at: existing ?? now`, so the live row maps to `absent_student`** — see "Empirical findings".
5. The cast's telemetry-less `unattendedInstance` (COMPLETED/ABSENT, `actual_start_at` null) maps to `Absent`.
6. Scoped page aggregates: `rowCountByStatus {open:0, end:1, Absent:1, absent_student:1}`, `rowCountByPaid {paid:0, unpaid:3}`, `totalPaidAmount "240.00"` SAR (bigint hundredths sum, floats-free).
7. `currentStatuses` filter per branch: `["end"]`→stopped row only; `["Absent"]`→telemetry-less row only; `["absent_student"]`→service-driven absence only.
8. Cross-teacher isolation: `teacherId` filter never leaks the second teacher's row in either direction.
9. Permission denial: teacher (`teacher_default`) and parent (no groups) both rejected with `ForbiddenError` / code `FORBIDDEN` / `tErrors.insufficientPermissions` via the real group-membership check — before any read.
10. No-notification guarantee: after `dispatchSpy.mockClear()`, three distinct `getReport` reads → **zero** dispatch calls.
11. Teacher- and student-facing `getClassInstanceDetail` stay payroll-blind after the CALCULATED snapshot lands (serialized payload never contains `calculationStatus`/`teacherPaidAmount`/`teacherPaidCurrency`/`payrollNote`).

Every status assertion is double-pinned through the shared rule: `expectStatusFromMapper` re-derives the status from the **committed row** via `mapToSessionAuditStatus(parseClassExecutionState(...), parseClassOutcome(...), actualStartAt)` and asserts the grid's `currentStatus` equals both the expected literal and the mapper verdict.

## Empirical findings (important for TB.2/TB.3 follow-ups)

1. **`updateStatusAbsent` can never produce the mapper's `Absent` branch.** `SchedulingRepository.markClassAbsent` (`backend/db/repo/scheduling/state-changes.ts:366`) writes `actualStartAt: existing.actualStartAt ?? now`, so every live absent transition lands COMPLETED/ABSENT **with** a start timestamp → mapper yields `absent_student`. The `Absent` branch (COMPLETED/ABSENT + `actual_start_at IS NULL`) is reachable only for rows predating attendance telemetry — the journey uses the payroll cast's existing `unattendedInstance` fixture for it (created committed in the cast helper, mirroring migrated data).
2. **Unfiltered report pages exceed any small limit in practice.** The shared test DB carries enough committed `class_instances` history that an unfiltered `{ limit: 50 }` page does not reliably contain the run's rows (three early failures trace to this). All row lookups are therefore scoped by `teacherId` — which is also the isolation property under test.
3. **`calculationStatus` defaults to `NOT_CALCULATED`, never null**, for rows that have never been calculated; null payroll *amount/duration/note* columns are the graceful-degradation surface.
4. Consolidated per the barrel rules: all journey helpers import from the `@/test/workflows/helpers` barrel (no deep `./permissions` import).

## Verification

- 🧪 `bun run test/scripts/run-test.ts test/workflows/accounting/session-audit-session-lifecycle.test.ts` → **11 pass / 0 fail** (70 assertions). Final log: `logs/2026-09-05T01-49-58/test/workflows/accounting/session-audit-session-lifecycle.test.ts.log`.
- 🔁 `bun run scripts/health/sub-loop.ts test/workflows/accounting/session-audit-session-lifecycle.test.ts --lifecycle codescene` → **exit 0** (tsgo, oxlint, biome, lint:type-aware, codescene; jscpd stage auto-skipped for `test/workflows/**`). Fixes applied during the loop: `Array#sort` → `Set` equality, `as ForbiddenError` → `instanceof` narrowing, `readRawInstance` hoisted to module scope (`consistent-function-scoping`).
- 🖧 `bun run validate:mermaid test/workflows/accounting/DIAGRAMS.md` → **all 6 blocks OK** (5 pre-existing + 1 new).
- ⏸️ `bun run test:workflows` (whole suite) intentionally NOT run — per wave instructions, a later wave owns the full-suite pass.

## Semantic review

- Real services + real DB end-to-end: `ClassSessionService` (lifecycle writes incl. payroll-trigger side effects) and `SessionAuditService.getReport` (reads) — no repo-level shortcuts for the transitions; only fixture inserts and state-verification SELECTs hit Drizzle directly.
- Honest permissions: operator reads resolve through real `academy_admin` membership; denials use actors genuinely lacking `ACCOUNTING_REPORTS_VIEW`; no service mocking beyond the mandated notification-dispatch interception boundary.
- No `runInRollback`, no `expect(...).rejects.toThrow()` (uses `expectJourneyError`), no `console.*`, no `any`, no hardcoded user-facing strings (translated `tErrors` substrings), unique `jrn_saud_<uuid8>` prefix.
- No plan tags (TB.x / REQ-x / .ai/plans) in code comments or JSDoc; comments describe domain behavior.

## Deliberate deviations from the TB.1 task text

1. TB.1's bullet says never-joined absence maps to `Absent`; empirically (finding 1) the live state machine stamps `actual_start_at`, making it `absent_student`. The journey asserts the true mapper/rule behavior: `Absent` is demonstrated on the telemetry-less fixture row, `absent_student` on the service-driven one. This matches the Task 0.2 mapper contract exactly.
2. TB.1 names the denial code `INSUFFICIENT_PERMISSIONS`; per the Task 1.4 outcome the canonical denial is `ForbiddenError`/`FORBIDDEN` (message = `tErrors.insufficientPermissions`). The journey asserts the landed contract.

## CROSS-FILE DEPENDENCY

None.
