# Mid-Point Review Gate — Re-Review R1 (Gate Outcome)

**Task ID:** MP-rereview
**Agent:** Re-review subagent (mid-point gate, independent verification)
**Date:** 2026-08-29
**Method:** Full independent read of the current code (not the fix outcomes' claims), full fix-wave diff review (baseline `df27720943` → working tree, 1,312 diff lines across 16 files), fresh runs of the mandatory test runner on the CURRENT working tree. No code was modified by this review.

---

## Gate summary

3 reviewer agents (backend / types / config) → **13 findings** (2 HIGH / 3 MEDIUM / 6 LOW backend; 2 LOW types — both forward-looking; 2 LOW config — both informational) → **3 fix clusters** (MP-fix-1 calculation cluster, MP-fix-2 settlement cluster, MP-fix-3 auto-trigger guards) → this re-review. Every actionable finding was re-verified in the working tree with file:line evidence and a green test run.

**Working-tree vs HEAD state (verified, load-bearing for this verdict):**
- HEAD `c575531103` contains fix clusters 1+2 in their final tested state **except** `payroll.mutation.ts`, which the committer snapshotted in the weak intermediate form (`{ permission, notImpersonating: true }` ungrouped — probe-proven to authorize on ANY single scope entry).
- The working tree holds the rest of the fix wave: `payroll.mutation.ts` ($all correction), `class-session.service.ts` (fix-3 guards), `scheduling-payroll-trigger.test.ts` (fix-3 tests); plus 2 untracked outcome files (fix-2, fix-3).
- **The green state verified by this gate is the WORKING TREE.** The committer must land the three pending files (see Required actions) — HEAD alone fails its own committed `payroll.mutation.test.ts` (3 scope-rejection failures) and misses the fix-3 guards.

---

## Per-finding closure table

| # | Finding (sev) | Fixed by | Verified | Evidence (current working tree) |
|---|---|---|---|---|
| 1 | **D10** (HIGH): (ABSENT ∧ null actualStartAt) paid full window | MP-fix-1 | ✅ YES | `payroll-calculation.service.ts:170-193` — student-absence branch first (`ABSENT && actualStartAt != null` → full window), teacher-absence branch bare `actualStartAt == null` → zero pay, whatever the outcome; dead `effectiveStart ?? scheduledStartAt` fallback removed (:196). SQL flags mirrored: `class-instances.ts:649-653` (`isStudentAbsence` = ABSENT ∧ telemetry present; `isTeacherAbsence` = bare `actualStartAt IS NULL`). Tests: 1.9 test flipped "pays zero when both student and teacher missed the session" (`payroll-calculation.service.test.ts:725-737`), LEAVE+null companion (:748-760), on-demand unjoined→zero (:512, :530), on-demand joined→full window — E14 encoded (:551), report-repo SQL-flag test (`payroll-report.repository.test.ts:256`). Suite 43/43 green. |
| 2 | **D12** (HIGH): settlement stomp TOCTOU | MP-fix-2 | ✅ YES | `class-instances.ts:537-574` — `updatePayrollCalculation(tx, id, patch, { expectedStatus })` preconditioned UPDATE; zero matching rows → returns `null`. `teacher-due.service.ts:321-337` — settlement flip passes `{ expectedStatus: WAITING_PAID }`; `null` → skip (info log, NO event, committed state stands); empty `eventRows` early return (:351). All other `updatePayrollCalculation` call sites verified row-locked (accrual `teacher-due.service.ts:266` under FOR UPDATE + throw-on-miss still locked by `teacher-due-payroll-integration.test.ts:514`; calculator `payroll-calculation.service.ts:677`; override `:751`). Tests: race-skip (`teacher-due.service.test.ts:396`), repo match/mismatch pair (`payroll-report.repository.test.ts:545`, `:568` — REFUND stands after preconditioned PAID flip returns null). |
| 3 | **ABBA deadlock** (MEDIUM): row→advisory vs advisory→row | MP-fix-1 | ✅ YES | `payroll-calculation.service.ts:617-636` — `lockInstanceForPayroll(..., { advisoryLock })`; `calculateForInstance` passes `{ advisoryLock: tx == null }` (:813) so embedded runs skip the advisory; `applyOverrideWithinTransaction` keeps `{ advisoryLock: true }` (standalone, :728). All 5 auto-trigger call sites in `class-session.service.ts` (:545, :603, :699, :738 → `triggerTerminalPayrollCalculation` :472-479) pass the caller tx — **no remaining path takes the advisory after the row lock**. Tests: `payroll-calculation.service.test.ts:957-997` (embedded run: zero advisory locks, exactly one FOR UPDATE read through the caller executor; standalone run: advisory then row). |
| 4 | **isOnDemand** dead field (MEDIUM) | MP-fix-1 (defer removal + honest doc) | ✅ YES (ratified deferral) | `payroll.types.ts:8-15` — documented as provenance marker, "carries no branch weight"; absence semantics test-encoded on both sides (joined→full, unjoined→zero, see row 1). **D18 row exists**: `deferred-items.md:36` (🔄 In Progress, owner: class-session.service.ts owner; wiring at `class-session.service.ts:476` + trigger-test assertions to be deleted atomically). |
| 5 | **clientRequestId** dead surface + contradicting doc (MEDIUM) | MP-fix-1 | ✅ YES | `payroll-override.idempotency.ts:31-46` — non-blank token → key = SHA-256(`payroll-override-client:instanceId:token`) (distinct prefix ⇒ token can never collide with a content key); absent/null/blank → content key (AC-6.10 unchanged). Resolves E1/NFR-4 vs AC-6.10 by supporting both. Type doc precise (`payroll.types.ts:50-57`). Tests: 4 unit tests (`payroll-override.idempotency.test.ts:183-231` — same-token-equals/different-token-differs, blank fallback, impersonation-impossible, per-instance scope) + 3 service tests (`payroll-override.service.test.ts:687-729`). |
| 6 | **D13** (MEDIUM): markAsPaid no PENDING filter | MP-fix-2 | ✅ YES | `teacher-due.repository.ts:213` — WHERE `id IN (...) AND status = PENDING`; RETURNING settles only pending rows (log count corrected to `updated.length` :215). Tests: double-submit keeps first payment's exclusive link (`teacher-due.repository.test.ts:248`), mixed batch settles only pending (:273), service-level no-second-event (`teacher-due.service.test.ts:417`). |
| 7 | **D16** (MEDIUM): impersonation attribution on applyPayrollOverride | MP-fix-2 | ✅ YES — **working tree** | `payroll.mutation.ts` working tree carries `$all: { permission: ACCOUNTING_PAYROLL_MANAGE, notImpersonating: true }` with a load-bearing comment (verified via `git diff HEAD`; HEAD still holds the weak ungrouped form — probe-proven authorizable by a single scope entry). Test: "rejects impersonating actors with a FORBIDDEN GraphQL error and never invokes the service" (`payroll.mutation.test.ts:301-311`), green against the working tree (15/15). **D19 row does NOT exist** — see Remaining open items. |
| 8 | **F6/F7** (LOW): routine rejections at error level; PG-level poisoning undetected | MP-fix-3 | ✅ YES | `class-session.service.ts:70` `ROUTINE_CALCULATOR_REJECTIONS` = {FORBIDDEN, PAYROLL_NOT_TERMINAL, PAYROLL_ALREADY_PAID}; 3-branch catch (:481-515): routine → `logger.warn` with `reason` key; `findDatabaseSqlState` SQLSTATE detector (:423-443, pattern `^\d[0-9A-Z]{4}$`, cause-chain depth 5, self-ref guard) or `DatabaseUnavailableError` → error with honest transaction-abort message + `sqlState`; generic → error with preservation message. Tests: 5 new + 1 strengthened (`scheduling-payroll-trigger.test.ts:443-524`), 20/20 green. |
| 9 | **F5** (LOW): getById forUpdate without tx = silent no-op lock | MP-fix-1 | ✅ YES | `class-instances.ts:525-529` throws before any statement. Test: `payroll-report.repository.test.ts:477-483`. |
| 10 | **Log demotion** (LOW): expected permission rejections at error | MP-fix-3 | ✅ YES | Same as row 8 — FORBIDDEN (the D14c teacher-marks-own-session-absent path) now warns with `reason: "FORBIDDEN"`; error alerts stay actionable. D14's ratification condition (1) is met. |
| 11 | Report aggregate double-scan (LOW) | pre-existing in tree, verified by MP-fix-1 | ✅ YES | `payroll-calculation.service.ts:850-860` — reuses `page.rows` when `offset === 0 && totalCount <= limit`; no second 10k scan for the export call. |
| 12 | E15 truncation warning + sanitizer text-loss doc (LOW ×2) | not in fix wave | ⚪ non-blocking, untracked | Both were "no user-visible gap" defense-in-depth notes; neither blocks. Listed under Remaining open items (micro-polish) so they are not silently dropped. |
| 13 | Types findings (LOW ×2) + Config findings (LOW ×2) | n/a | ✅ ratified | Types: forward-looking only (`Record<CalculationStatus, string>` preference if namespace reopened; `rowCountByStatus` JSON→unknown already a 4.1 carry-forward). Config: informational only (non-CONCURRENT index builds at trivial scale; single-schema pg_type guard = repo-established pattern). |

---

## New-issue sweep

**0 new defects found.** Full fix-wave diff read (source: 995 lines, tests: 317 lines; baseline `df27720943` → working tree):

- **No dead code** — the wave removed one branch the D10 flip made unreachable (`effectiveStart` fallback) and fix-2 removed the orphaned `markInstancePaidIfAwaiting` helper; every new branch (routine/DB-level/generic catch; expectedStatus match/mismatch; token/content key; advisoryLock on/off) is exercised by at least one green test.
- **No type unsafety added** — the test-side `asCallerTx` helper uses the repo-standard type-guard pattern (billing carryover-handoff precedent); `SQL`/`and`/`type CalculationStatus` imports verified present (`class-instances.ts:1`, `:10`).
- **No broken contracts** — `updatePayrollCalculation`'s new `options` param is optional; all pre-existing 3-arg callers type-compatible (both fix-1 suites re-run green). `markAsPaid` log count corrected from requested to actually-settled.
- **No plan-artifact references introduced** — grep over all 8 fix-wave source files: the only hits are two pre-existing `specs.md §5.x` comments in the notification helper of `class-session.service.ts` (present verbatim at baseline `df27720943:155/:161`; unrelated to payroll). Zero `.skip/.only/.todo` across all 9 touched test files.

---

## Test sweep (mandatory runner `bun run test/scripts/run-test.ts`, CURRENT working tree)

| Suite | Pass | Fail | expect() | Exit |
|---|---|---|---|---|
| backend/services/teacher/payroll-calculation.service.test.ts | 43 | 0 | 311 | **0** |
| backend/services/teacher/payroll-override.service.test.ts | 37 | 0 | 262 | **0** |
| backend/services/teacher/teacher-due-payroll-integration.test.ts | 15 | 0 | 59 | **0** |
| backend/services/teacher/teacher-due.service.test.ts | 12 | 0 | 55 | **0** |
| backend/graphql/mutation/teachers/payroll.mutation.test.ts | 15 | 0 | 77 | **0** |
| backend/services/scheduling/scheduling-payroll-trigger.test.ts | 20 | 0 | 78 | **0** |
| backend/db/test/repo/scheduling/payroll-report.repository.test.ts | 25 | 0 | 96 | **0** |
| *(adjacent)* backend/services/teacher/payroll-override.idempotency.test.ts | 23 | 0 | 257 | **0** |
| *(adjacent)* backend/db/test/repo/teachers/teacher-due.repository.test.ts | 17 | 0 | 58 | **0** |

All 7 mandated suites (+2 adjacent) exit 0 against the working tree, including `payroll.mutation.test.ts` — which **fails at HEAD** (3 scope-rejection failures against the committed weak authScopes form) and passes only with the working-tree `$all` correction.

---

## Remaining open items (ratified deferrals — none blocks the gate)

| Item | Owner | Timing |
|---|---|---|
| **D8** grace-settings negative-value constraint | Final hardening gate | pre-TB.3 pentest (calculation path already protected by `resolveGraceSettings` fallback) |
| **D11** `payroll.noteRequired` errors-locale key | 5.x override dialog task | bundle with the dialog (types + en + ar + snapshot) |
| **D14** ratified no-system-actor policy | Phase-2 hardening | condition (1) log demotion — **DONE by fix-3**; verify NOT_CALCULATED reconciliation runbook documented before TB |
| **D18** `isOnDemand` wiring removal | class-session.service.ts owner | now unblocked (fix-3 finished without touching it): delete `:476` wiring + trigger-test pass-through assertions atomically; cheap while schema/UI unshipped |
| **D19** repo-wide Pothos authScopes ANY-semantics hole | **orchestrator — LEDGER ROW MISSING** (see below) | per-site `$all` wrap or builder-wide `defaultStrategy: "all"` (audit intentional `$any` maps first); service-layer `requirePermission` re-checks are the interim backstop |
| D16 sibling: `markTeacherDuesPaid` impersonation gap (`teacher-due.mutation.ts`) | teacher-due mutation owner | same one-line `$all` fix when the file is next touched (outside this plan's scope) |
| Micro-polish (non-blocking): E15 truncation warning on the override note path; `sanitizePlainText` text-loss doc note; `Record<CalculationStatus, string>` if locale namespace reopened; `rowCountByStatus` typed-surface gap (4.1 carry-forward) | respective file owners | opportunistic |

---

## Required committer/orchestrator actions (gate-closing conditions, non-code verdict impact)

1. **Commit the pending working-tree files**: `payroll.mutation.ts` (the `$all` correction is load-bearing — HEAD's committed form fails its own committed 15-test suite and does not enforce either scope), `class-session.service.ts`, `scheduling-payroll-trigger.test.ts`, plus the 2 untracked fix outcome files. This re-review verified the working tree green; HEAD alone is red + under-enforcing.
2. **Ledger hygiene** (fix-2's bookkeeping claims were NOT applied — caught by this re-review): add the **D19 row** to `deferred-items.md` (it is documented only inside the fix-2 outcome file), and flip **D12 / D13 / D16** rows to ✅ Done with the outcome file as verification reference. Only D10 was updated.

---

## VERDICT

**GATE PASSED** — zero unresolved feature-specific findings.

All 2 HIGH + 3 MEDIUM backend findings are fixed and independently re-verified in the working tree with file:line evidence and green tests; the 6 LOW backend findings are fixed or ratified non-blocking; types/config findings were forward-looking/informational. New-issue sweep: clean. Test sweep: 9/9 suites exit 0. The two gaps found are bookkeeping, not code: the unlanded working-tree commit (payroll.mutation.ts above all) and the missing D19 ledger row — both listed as required actions above and neither changes the code-level verdict.

*The gate closes on this verdict once the two required actions land.*
