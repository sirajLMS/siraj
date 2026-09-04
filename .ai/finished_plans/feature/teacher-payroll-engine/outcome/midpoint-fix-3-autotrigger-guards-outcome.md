# Mid-point Fix 3 — Auto-trigger guards (log classification + tx-poisoning detector)

**Task ID:** MP-fix-3 (verification subagent, resumed after interrupted dispatch)
**Date:** 2026-08-29
**Verdict:** ✅ COMPLETE — interrupted dispatch's edits verified complete and correct; zero additional code changes required by this dispatch. All gates exit 0, both suites green.

## Resume situation

The prior dispatch was interrupted after editing `backend/services/session/class-session.service.ts` (+88/−9) and `backend/services/scheduling/scheduling-payroll-trigger.test.ts` (+89) but before running gates, tests, and bookkeeping. This dispatch resumed at the verification step: read the full working-tree diff of both files, confirmed the mandate (mid-point review findings F6/F7 + F-D18 note) fully implemented, then ran the quality loop and both test suites fresh, and closed the bookkeeping.

## Files changed (working tree, uncommitted — committer to pick up)

| File | Diff | Change |
| --- | --- | --- |
| `backend/services/session/class-session.service.ts` | +88/−9 | `ROUTINE_CALCULATOR_REJECTIONS` set; `findDatabaseSqlState` cause-chain detector (SQLSTATE pattern + depth cap); three-branch catch classification in `triggerTerminalPayrollCalculation`; updated doc comments; `DatabaseUnavailableError`/`DomainError` imports |
| `backend/services/scheduling/scheduling-payroll-trigger.test.ts` | +89 (−2 context lines rewritten) | 5 new tests + 1 strengthened existing test pinning the log classification contract; imports `DatabaseUnavailableError`, `DomainError`, `ForbiddenError` |

Git scope check: `git status --porcelain` on both paths shows exactly ` M` × 2 — no other files touched by this task.

## F6 — routine permission-rejection demotion to warn: VERIFIED

- `ROUTINE_CALCULATOR_REJECTIONS = new Set(["FORBIDDEN", "PAYROLL_NOT_TERMINAL", "PAYROLL_ALREADY_PAID"])` with a doc comment explaining why each is a routine deferral (teachers/parents close their own sessions without the payroll manage permission; settled row; non-terminal re-read) and that the snapshot stays NOT_CALCULATED for operator reconciliation in all three cases.
- Catch branch 1: `error instanceof DomainError && ROUTINE_CALCULATOR_REJECTIONS.has(error.code)` → `logger.warn("Automatic payroll calculation deferred; session state change preserved", { classInstanceId, actorUserId, reason: error.code, error: error.message })` then `return`. Class hierarchy confirmed against `backend/lib/errors.ts`: `ForbiddenError extends DomainError` with code `"FORBIDDEN"` (line 28-32), so the permission gate rejection lands in the warn branch with `reason: "FORBIDDEN"`.
- Branch ordering is correct: the routine check runs first, so an explicit policy rejection always wins over the heuristic DB-failure detector (a DomainError carrying a code can never also match the SQLSTATE pattern — pattern requires a leading digit — so the ordering is belt-and-braces, not load-bearing).
- Unexpected errors still log at error (branch 3, unchanged message "Automatic payroll calculation failed; session state change preserved").

## F7 — SQLSTATE cause-chain tx-poisoning detector: VERIFIED

- `SQLSTATE_PATTERN = /^\d[0-9A-Z]{4}$/` — five characters starting with a digit ("25P02", "23505"); letter-leading domain error codes ("FORBIDDEN", "PAYROLL_UPDATE_FAILED") can never match.
- `findDatabaseSqlState(error, depth = 0)` walks `error.code` then `error.cause` recursively with `MAX_CAUSE_DEPTH = 5` and a `cause !== error` self-reference guard. The doc comment's claim "mirroring the transient-error classifier" verified accurate: `backend/lib/retry.ts:30-54` uses the identical depth cap and cause-chain walk shape.
- Catch branch 2: `if (sqlState !== null || error instanceof DatabaseUnavailableError)` → `logger.error("Automatic payroll calculation failed at the database level; the transition transaction may be aborted", { classInstanceId, actorUserId, sqlState, error })`. The `instanceof DatabaseUnavailableError` arm is necessary and correct: its code is `"DATABASE_UNAVAILABLE"` (letter-leading, never matches the pattern) but it represents an exhausted-connection failure where the transaction cannot be assumed usable.
- Semantics are honest: the error is still swallowed (the callback completes) but the message explicitly refuses the preservation claim — defense-in-depth logging only, since no savepoint pattern exists in the repo. All three catch branches end in `return` (no fall-through), and every branch is exercised by at least one test (no dead branches).

## F-D18 — isOnDemand call-site note (deferred removal, no action)

Verified the call site still passes `isOnDemand` correctly: `class-session.service.ts:476` computes `isOnDemand: ON_DEMAND_TERMINAL_EXECUTION_STATES.has(parseClassExecutionState(instance.executionState))` — derived from the instance's post-transition execution state, unchanged by this fix (line moved from ~:428 to :476 by the added code). **Coordination note for the D18 owner:** D18 (deferred-items.md line 36) still lists the `isOnDemand` wiring removal as 🔄 In Progress with the class-session.service.ts owner as the assignee. This fix deliberately did NOT remove the wiring — MP-fix-3's mandate was guards only, and D18's one-line wiring deletion + trigger-test pass-through assertion update (the `expectSingleCalculation({ … isOnDemand: … })` assertions at test lines 279/285/292/308/311+) remain to be done together as one atomic change. The guards introduced here are orthogonal to that removal and will not conflict with it.

## Gates (sub-loop `--lifecycle codescene`, exit 0 required)

| File | tsgo | oxlint | biome:check | lint:type-aware | check:duplicates | codescene | Exit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `backend/services/session/class-session.service.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **0** |
| `backend/services/scheduling/scheduling-payroll-trigger.test.ts` | ✅ | ✅ | ✅ | ✅ | ✅ (skipped: outside jscpd scope) | ✅ | **0** |

Raw logs on station: `/tmp/work-mpf3-subloop-service.log`, `/tmp/work-mpf3-subloop-test.log` (each ends "✅ All checks for lifecycle 'codescene' passed").

## Test results (mandatory runner `bun run test/scripts/run-test.ts`, exit 0 required)

| Suite | Pass | Fail | expect() | Exit | Runner log |
| --- | --- | --- | --- | --- | --- |
| `backend/services/scheduling/scheduling-payroll-trigger.test.ts` | **20** | 0 | 78 | **0** | `logs/2026-08-29T22-03-56/…/scheduling-payroll-trigger.test.ts.log` |
| `backend/services/session/test/class-session.service.test.ts` (regression) | **1** | 0 | 5 | **0** | `logs/2026-08-29T22-04-04/…/class-session.service.test.ts.log` |

### New/changed test matrix (5 new + 1 strengthened)

| Test | Pins |
| --- | --- |
| logs routine permission rejections as warnings (NEW) | `ForbiddenError` → warn ×1 with `reason: "FORBIDDEN"`, error ×0, state change preserved (`id` + `COMPLETED`) |
| logs the settled-pay and terminal-state guard rejections as warnings too (NEW) | `PAYROLL_ALREADY_PAID` + `PAYROLL_NOT_TERMINAL` → warn ×2 with matching reasons, error ×0 |
| keeps genuine calculator failures at error level (NEW) | non-routine `DomainError("PAYROLL_UPDATE_FAILED")` → error ×1 (preservation message), warn ×0 |
| flags database-level calculator failures that may abort the transition transaction (NEW) | driver `Error` with `code: "25P02"` nested in `cause` → error ×1 with the transaction-abort message + `sqlState: "25P02"`, warn ×0 |
| flags connection-level calculator failures with the transaction-abort warning (NEW) | `DatabaseUnavailableError` (no SQLSTATE code) → error ×1 with the transaction-abort message, warn ×0 |
| preserves the state change and logs an error when the calculator throws unexpectedly (STRENGTHENED) | plain `Error` → error ×1, warn ×0, `COMPLETED` preserved — message fixture changed from the ambiguous "insufficient permissions" to "calculation crashed" so it no longer overlaps the now-routine FORBIDDEN path |

Mandated coverage confirmed present: routine rejection → warn ✅; non-routine → error ✅; SQLSTATE poisoning detected + logged distinctly ✅ (plus the connection-level arm beyond the mandate). The `beforeEach` clears `loggerWarn`/`loggerError` alongside the calculator mock, so the new assertions are isolated per test.

## Semantic review

- **No dead branches:** every catch branch (routine warn / DB-level error / generic error) has at least one green test; `findDatabaseSqlState`'s depth cap, self-reference guard, and non-object early return are all defensive-only (consistent with the retry.ts classifier precedent).
- **Clean comments:** plan-artifact grep (plan / trackable / outcome / deferred / MP-fix / mid-point / F-numbers / D-items / US- / AC-) over both files returns only natural-language false positives ("payroll calculation deferred" log strings, pre-existing "deferred to an operator reconciliation" doc text, `outcome: "PENDING"` domain field). ZERO plan-artifact references.
- **Failure isolation preserved:** the transition never breaks due to payroll — every rejection path (routine, genuine, DB-level) still swallows and `return`s, and the tests assert the stopped instance comes back with `id: "inst-1"` (+ `COMPLETED` where asserted). The DB-level branch merely changes the log message to honestly warn the transaction may abort server-side; it does not rethrow.
- **Log contract:** `reason: error.code` on warn lines gives alerting a stable key; `sqlState` on DB-level error lines distinguishes driver failures at a glance.
- **No scope creep:** exactly the two mandated files modified; no console.*, no lint suppressions, no `.skip/.only` (sub-loop oxlint/biome green implies these).

## Evidence paths (station)

- Sub-loop logs: `/tmp/work-mpf3-subloop-service.log`, `/tmp/work-mpf3-subloop-test.log`
- Runner logs: `/tmp/work-mpf3-runtest-trigger.log`, `/tmp/work-mpf3-runtest-service.log` (+ archived `logs/2026-08-29T22-03-56/`, `logs/2026-08-29T22-04-04/`)

## Carry-forwards

- The three-branch catch contract in `triggerTerminalPayrollCalculation` is now pinned by tests — any future change to the routine set or the DB-level detection must update `scheduling-payroll-trigger.test.ts` in the same change.
- D18 (`isOnDemand` wiring removal) remains open and is now unblocked-by-nobody: this fix finished without touching that wiring; the D18 owner deletes the `:476` `isOnDemand` line + the trigger-test `isOnDemand` assertions together.
- No new deferred items filed by this dispatch.
