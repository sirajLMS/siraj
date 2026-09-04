# Mid-Point Fix 1 — Calculation Cluster Outcome

**Task ID:** MP-fix-1 (resumed dispatch)
**Agent:** FIX subagent — calculation cluster
**Date:** 2026-08-29
**Scope:** backend/services/teacher/payroll-calculation.service.ts, backend/db/repo/scheduling/class-instances.ts, backend/services/teacher/payroll-override.idempotency.ts, backend/types/teachers/payroll.types.ts + their tests

---

## Resume situation

An earlier dispatch of this Task ID was interrupted mid-way. Its uncommitted working-tree edits were found exactly as reported: service diff (+68), repo diff (+25), calculation-test diff (+96), idempotency diff (+28), types diff (+8) — plus three additional files the earlier dispatch had already touched but that were not listed in the resume brief: `payroll-override.idempotency.test.ts` (+53), `payroll-override.service.test.ts` (+39), and `payroll-report.repository.test.ts` (new tests). All edits were verified against intent, then completed:

- **Completed now:** LEAVE+null companion test (D10 verdict item 3 was missing), `clientRequestId` type doc made precise (was still the old "absorbs double-clicks" one-liner), two quality-gate violations repaired in the interrupted dispatch's own new tests (`as unknown as DBTransaction` unsafe assertion → repo-standard type-guard helper; `await expect(...)` await-thenable violation → `return expect(...)`), and one dead branch removed in the service (`effectiveStart ?? scheduledStartAt` fallback became unreachable after the D10 flip).
- **Left untouched:** `class-session.service.ts`, `teacher-due.service.ts`, `teacher-due.repository.ts`, `payroll.mutation.ts` (parallel fixer / other owners), sibling plan paths.

---

## Per-finding verdicts

### F1 (HIGH, D10) — ABSENT + null actualStartAt pays zero — ✅ verified-completed

All three required changes verified in place, plus the D10 test companions:

1. **`classifyPayrollBranch`** (payroll-calculation.service.ts): student-absence branch stays first (`outcome = ABSENT && actualStartAt != null` → full scheduled window); the teacher-absence branch is now bare `actualStartAt == null` (zero pay, still CALCULATED) — whatever the outcome says. The indefensible asymmetry ((LEAVE, null) → zero while (ABSENT, null) → full) is gone. The now-unreachable `actualStartAt ?? scheduledStartAt` fallback on the on-time path was removed this dispatch.
2. **`findPayrollReportRows` SQL flags** (class-instances.ts): `isStudentAbsence` = `outcome = ABSENT AND actualStartAt IS NOT NULL`; `isTeacherAbsence` = `actualStartAt IS NULL` (bare). The report flags now mirror the calculator exactly — the task-1.2 "NEITHER absence" mislabel is gone.
3. **Tests flipped/added**:
   - 1.9 test flipped: "still pays the full window when both student and teacher missed the session" → "pays zero when both student and teacher missed the session" (0 min, "0.00", teacher-absent).
   - Added: on-demand absent with no telemetry → zero; on-demand absent with a joined teacher → full window (E14's "unless they actually joined" clause encoded).
   - Added this dispatch: LEAVE+null → zero companion test ("pays zero for a student leave the teacher never joined") — closes the D10 verdict's requested pair.
   - Report repo test added: both-missed row flags as teacher-absent (SQL side of the same rule).

Money-leak path closed: system-missed rows (`markClassMissedBySystem` → COMPLETED+ABSENT, null actualStartAt) and teacher no-shows no longer reconcile to full pay on an operator re-run of "Calculated".

### F2 (MEDIUM) — `isOnDemand` dead field — ✅ verified-completed (decision: defer removal, document as provenance)

The earlier dispatch rewrote the field doc in `payroll.types.ts`: it is now documented as a **provenance marker** ("an ON_DEMAND_* terminal state triggered this calculation. Carries no branch weight — the payable-duration rules key on the row outcome plus attendance telemetry…"). This dispatch ratifies that choice after evaluating all three options:

- **Remove (the review's natural companion):** blocked — removal requires deleting the wiring in `class-session.service.ts:428` and the `scheduling-payroll-trigger.test.ts` assertion that it is passed; both files are owned elsewhere in this gate.
- **Make meaningful as a zero-payforcer:** rejected — forcing zero pay for all `ON_DEMAND_*` terminal states contradicts E14 ("the teacher is not owed pay **unless they actually joined**"): a teacher who joined an on-demand session that resolved NO_CREDITS_ABSENT is owed the window, and `ON_DEMAND_COMPLETED`-style rows with telemetry must pay normally. For rows with no join telemetry (the overwhelming real population — terminal on-demand states close without a live meeting) the D10-fixed branch logic already yields zero, so a flag-forced zero would be behaviorally redundant everywhere it is correct and wrong everywhere it is not.
- **Defer with honest documentation (chosen):** the field now has an accurate contract instead of a misleading one; AC-2.2's behavioral intent (absence semantics resolve correctly for on-demand sessions) is fully delivered by the outcome+telemetry branches, with E14 satisfied and now test-encoded on both sides (joined → full window, not-joined → zero).

**Follow-up for the orchestrator:** schedule the actual removal (one-line in `class-session.service.ts` + the trigger-test assertion) with the class-session owner; it is cheap while the schema/UI is unshipped.

### F3 (MEDIUM) — `clientRequestId` honored in idempotency — ✅ verified-completed

- `deriveOverrideIdempotencyKey`: when a non-blank (trimmed) `clientRequestId` is present, the key = SHA-256 over `"payroll-override-client" + instanceId + token` — a **distinct prefix** so a token can never collide with a content-derived key, whatever characters it carries. Absent/null/blank falls back to the content-derived key (AC-6.10 behavior unchanged for content-only duplicates).
- Flow verified end-to-end without touching the parallel-owned mutation file: `payroll.pothos.ts` exposes `clientRequestId` (optional) → `payroll.mutation.ts` spreads `...args.input` into the service input → `applyOverride` passes the whole input to `deriveOverrideIdempotencyKey` → the idempotency input type structurally carries the token.
- Type doc (payroll.types.ts) rewritten this dispatch to state the exact semantics (token replaces content in the key; same token collapses re-submissions even with edited fields; different token starts a fresh override; blank falls back to content key). The interface doc in the idempotency file no longer claims the client id is excluded.
- Tests: 4 new idempotency unit tests (same-token-equals/different-token-differs even with edited content; null/undefined/blank fallback; token cannot impersonate a content key; tokens scoped per instance); override service tests updated — the old exclusion-encoding test became "applies a new override when only the client request id differs", plus a same-token-different-content collapse test and a content-key collapse test without tokens. Fuzz inputs never generate tokens, so the seeded uniqueness fuzz remains valid.

This resolves the specs E1/NFR-4 ("idempotency via clientRequestId") vs AC-6.10 (content-based) contradiction by supporting both: token when provided, content otherwise.

### F4 (MEDIUM) — Skip advisory lock on caller-tx runs (lock-ordering) — ✅ verified-completed

- `lockInstanceForPayroll` takes `options: { advisoryLock: boolean }`: standalone runs keep the advisory→row order (unlocked pre-read supplies the teacher key, advisory lock, FOR UPDATE re-read); embedded runs (caller tx) skip the advisory entirely and go straight to the FOR UPDATE read. `calculateForInstance` passes `{ advisoryLock: tx == null }`; `applyOverrideWithinTransaction` always locks both (standalone path).
- This removes the ABBA inversion (state-machine tx: row→advisory; standalone run: advisory→row) that produced PG 40P01 deadlocks and spurious "Automatic payroll calculation failed" errors: the embedded path now never waits on the advisory while holding the row, so both paths stay acyclic. Per-instance serialization is preserved by the row lock either way; teacher-level serialization for standalone calculator/override runs is preserved by the advisory lock.
- Tests: "skips the advisory lock when embedded in the caller transaction" (asserts zero advisory locks, no db.transaction, exactly one FOR UPDATE read through the caller executor) and "still takes the advisory lock before the row lock on a standalone run" (two reads: unlocked then FOR UPDATE, one advisory key).

### F5 (LOW) — `getById` forUpdate without tx fail-fast — ✅ verified-completed

- `SchedulingRepository.getById(id, undefined, { forUpdate: true })` now throws `Error("getById with forUpdate requires a transaction: the row lock only exists inside the caller transaction")` before executing any statement, instead of silently running a lock that evaporates at statement end (autocommit). The `GetClassInstanceOptions.forUpdate` doc states the requirement.
- Repo test added: rejects a forUpdate read without a transaction (plain `return expect(...).rejects.toThrow(/forUpdate requires a transaction/)` — no rollback wrapper needed since the guard throws before any statement).
- All current payroll callers pass a tx (verified during review), so this is a misuse trap closed with zero behavior change.

### F6 (LOW) — Demote expected permission-rejection logs to warn — ❌ blocked by file ownership (verified, not done)

The fix location is the auto-trigger catch in `class-session.service.ts:434` (`logger.error("Automatic payroll calculation failed; session state change preserved", …)`), which is owned by another agent in this gate and therefore untouched. Current state verified: still `logger.error` for every rejection, including the expected `ForbiddenError` from `requirePermission(ACCOUNTING_PAYROLL_MANAGE)` when e.g. a teacher marks their own session absent (D14c path). **Handoff:** the class-session owner should branch on `error instanceof DomainError || error instanceof ForbiddenError` (warn) vs everything else (error) — a 3-line change. The D14 deferral remains safe meanwhile (failures are isolated and tested); only alert noise is affected.

### F7 (LOW, analysis only) — PG-level errors poison the auto-trigger transaction

**Analysis note for the orchestrator** (no code change in this cluster — the surface lives in `class-session.service.ts`, owned elsewhere):

- **Mechanism.** `triggerTerminalPayrollCalculation` embeds `calculateForInstance(…, tx)` in the caller's state-machine transaction and catches all JS errors so "the session state change is never rolled back". That guarantee only holds for **app-level** throws. A **PG-level** failure inside the payroll sub-write (CHECK/constraint violation, 40P01 deadlock abort, serialization failure, connection error) puts the server-side transaction into the aborted state (subsequent statements fail 25P02 "current transaction is aborted"). Swallowing the JS error does not heal the PG transaction: the outer commit then fails with an opaque error and **both** the state change and the payroll write roll back — the exact outcome the comment claims is impossible.
- **Realistic surface.** Small but non-zero: patches are constructed to satisfy the payroll CHECKs (REFUND→"0" verified; BigInt minor-unit math verified end-to-end by the review), so a CHECK hit implies a code bug or pathological data (e.g. a numeric(12,2) overflow needs a rate×duration product ≥ 10^10). The most plausible real trigger was a 40P01 deadlock from the advisory/row lock inversion — **F4's fix removes that inversion**, shrinking the poisoning window materially.
- **Recommended fix (fold into the D12/D13 repo-hardening dispatch, same file family):** wrap the embedded payroll sub-write in a SAVEPOINT (`SAVEPOINT payroll_calc` → `RELEASE` on success / `ROLLBACK TO SAVEPOINT` in the catch, via `tx.execute(sql…)`) so the caller's transaction survives a PG-level payroll failure and the "state change is never rolled back" comment becomes true at the PG level too. Alternatively, amend the comment to document the caveat. Interim note: the failure mode is fail-closed (whole tx rolls back — no partial state), so there is no corruption risk, only availability/observability.

---

## Verification

### Quality gates (sub-loop, lifecycle codescene — exit 0 required)

| File | Exit |
|---|---|
| backend/services/teacher/payroll-calculation.service.ts | 0 |
| backend/db/repo/scheduling/class-instances.ts | 0 |
| backend/services/teacher/payroll-override.idempotency.ts | 0 |
| backend/types/teachers/payroll.types.ts | 0 |
| backend/services/teacher/payroll-calculation.service.test.ts | 0 (after fixing the interrupted dispatch's unsafe type assertion) |
| backend/services/teacher/payroll-override.idempotency.test.ts | 0 |
| backend/services/teacher/payroll-override.service.test.ts | 0 |
| backend/db/test/repo/scheduling/payroll-report.repository.test.ts | 0 (after fixing an await-thenable violation) |

### Test suites (mandatory runner `test/scripts/run-test.ts` — exit 0 required)

| Suite | Result |
|---|---|
| backend/services/teacher/payroll-calculation.service.test.ts | 43 pass / 0 fail (311 expect) |
| backend/services/teacher/payroll-override.service.test.ts | 37 pass / 0 fail (262 expect) |
| backend/services/teacher/payroll-override.idempotency.test.ts | 23 pass / 0 fail (257 expect) |
| backend/db/test/repo/scheduling/payroll-report.repository.test.ts | 23 pass / 0 fail (89 expect) |
| backend/services/scheduling/scheduling-payroll-trigger.test.ts (adjacent, safety) | 15 pass / 0 fail |
| app/api/payroll/export/route.test.ts (adjacent, safety) | 12 pass / 0 fail |

### Semantic review

- No dead branches introduced; one pre-existing branch made dead by the D10 flip (`effectiveStart` fallback) removed. The report aggregate double-scan (separate LOW finding) also turned out already fixed in the working tree (reuse `page.rows` when `offset === 0 && totalCount <= limit`).
- No cross-layer imports added (test-only `DBTransaction` type import from `@/backend/types`; GraphQL input already existed).
- Comments carry zero plan-artifact references (grep for AC-/US-/E1x/D1x/specs.md/implementation.md/TB./MP- across all eight files: clean).
- Enum values imported as values where compared (`ClassOutcome`, `ClassExecutionState`, `OnDemandStatus`, `CalculationStatus`); `parseClassOutcome`/`parseClassExecutionState` guards unchanged.
- Money math untouched by the flip: teacher-absence rows flow through the same BigInt minor-unit duration×rate path that produced "0.00" for (TAKEN, null) before; REFUND literal `"0"` and the migration CHECK interplay unchanged; zero-pay asserts as `"0.00"` (CALCULATED path) across all new tests.

---

## Files touched (working tree, uncommitted — handoff to committer)

| File | Δ |
|---|---|
| backend/services/teacher/payroll-calculation.service.ts | +52/−19 |
| backend/db/repo/scheduling/class-instances.ts | +18/−7 |
| backend/services/teacher/payroll-override.idempotency.ts | +23/−5 |
| backend/types/teachers/payroll.types.ts | +14/−3 |
| backend/services/teacher/payroll-calculation.service.test.ts | +103/−21 |
| backend/services/teacher/payroll-override.idempotency.test.ts | +50/−3 |
| backend/services/teacher/payroll-override.service.test.ts | +35/−4 |
| backend/db/test/repo/scheduling/payroll-report.repository.test.ts | +38/−0 |

---

## Handoffs to orchestrator

1. **F6** → class-session.service.ts owner: demote expected `DomainError`/`ForbiddenError` rejections in the auto-trigger catch to `warn` (keep `error` for the rest).
2. **F2 follow-up** → schedule `isOnDemand` removal (class-session.service.ts wiring + scheduling-payroll-trigger.test.ts assertion) with the same owner; doc now honest, behavior test-locked on both sides.
3. **F7** → fold the SAVEPOINT hardening (or comment caveat) into the D12/D13 repo-hardening dispatch; F4 already removed the most plausible PG-abort trigger.
4. **D10 ledger** updated to ✅ Done (this fix); F2/F3 handling noted.
