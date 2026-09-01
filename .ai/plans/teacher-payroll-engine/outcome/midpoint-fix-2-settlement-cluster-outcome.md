# Mid-Point Fix 2 — Settlement Cluster Outcome

**Task ID:** MP-fix-2
**Agent:** FIX subagent — settlement cluster (mid-point gate)
**Date:** 2026-08-29
**Scope:** `backend/services/teacher/teacher-due.service.ts`, `backend/db/repo/teachers/teacher-due.repository.ts`, `backend/graphql/mutation/teachers/payroll.mutation.ts`, `backend/db/repo/scheduling/class-instances.ts` (settlement flip surface only) + their tests

---

## Resume situation

An interrupted dispatch of this Task ID had already landed two repo edits before this dispatch started: the `PENDING` filter in `TeacherDueRepository.markAsPaid` (F2, correct as written) and an orphaned `markInstancePaidIfAwaiting(instanceId, tx)` helper in the same file — a status-preconditioned flip living in the teacher-due repo, referenced by nothing. This dispatch kept the F2 filter, **removed the orphan** (dead code; the preconditioned flip belongs to the scheduling repo's `updatePayrollCalculation` per the fix mandate, and a second writer of `class_instances` payroll columns in the teacher-due repo would duplicate the scheduling repo's owned surface), and implemented everything else.

**Committer note (important):** the station committer landed commit `c575531103` mid-dispatch, sweeping in this cluster's work. Everything except `payroll.mutation.ts` was committed in its final tested state. `payroll.mutation.ts` was snapshotted in the **weak intermediate form** (`{ permission, notImpersonating: true }` ungrouped — see the F3 discovery below: that form does NOT enforce both scopes). The working tree holds the required correction (`$all` wrapper, all suites green against it). **The committer must include the pending `backend/graphql/mutation/teachers/payroll.mutation.ts` working-tree change** — the committed `payroll.mutation.test.ts` (15 tests) fails against HEAD's mutation file (3 scope-rejection failures) and passes with the working-tree fix.

---

## Per-finding verdicts

### F1 (HIGH, D12) — settlement stomp race — ✅ fixed

- **Repo (`class-instances.ts`):** `updatePayrollCalculation(tx, id, patch, options?)` gained an optional `UpdatePayrollCalculationOptions.expectedStatus` precondition. When supplied, the UPDATE carries `AND calculation_status = <expected>`; a row that no longer matches yields **zero affected rows → the method returns `null`**, indistinguishable-from-and-equivalent-to "already transitioned" for every current caller. The existing 3-arg contract is unchanged (fix-1's `payroll-calculation.service.ts` call sites — both under the FOR UPDATE row lock — are untouched and type-compatible; both fix-1 suites re-run green). The statement is dialect-agnostic drizzle (`eq` + `.returning()`, the repo's established cross-dialect update pattern used by `updateInstanceState` etc.), so it runs unchanged on PostgreSQL and SQLite.
- **Service (`teacher-due.service.ts` `markLinkedInstancesPaid`):** the settlement flip now passes `{ expectedStatus: CalculationStatus.WAITING_PAID }`. A `null` return is treated as "a concurrent writer already transitioned the instance": the instance is **skipped** (its committed state stands — no stomp), **no transition event is emitted** for it (no stale `fromState`, no duplicate), and the skip logs at `info` (F4) as a normal race outcome. When every awaiting instance skips, the (now empty) event insert is skipped via an early return.
- **Accrual path deliberately unchanged:** `markInstanceWaitingPaid` keeps the unconditional form + throw-on-miss invariant — it holds the `FOR UPDATE` row lock from `getById(id, tx, { forUpdate: true })`, so no read→write window exists there; the integration suite still locks the throw-on-miss behavior.
- **Tests:** repo-level (real DB) — "flips the row when the expected status still matches" and "returns null and leaves the row untouched when the status no longer matches" (the stomp encoded as sequential ops: REFUND committed → preconditioned PAID flip → null + REFUND stands); service-level — the settlement flip's options asserted as `{ expectedStatus: WAITING_PAID }`, and "skips cleanly when a forced override raced the settlement (precondition matched no row)" (override WAITING_PAID→REFUND wins; settlement completes, no event, one `info` log, cache invalidation still runs).

### F2 (MEDIUM, D13) — `TeacherDueRepository.markAsPaid` PENDING filter — ✅ fixed (verified + kept from the interrupted dispatch)

`markAsPaid` now updates `WHERE id IN (...) AND status = 'PENDING'` and returns only the rows it actually settled (`RETURNING`), so a double-submit re-links nothing: settled dues keep their original `teacherPaymentId`. Tests (real DB): "keeps settled dues linked to their original payment on a double submit" (second payment settles zero rows; the due still points at the first payment) and "settles only the pending dues of a mixed batch". Service-level companion: "returns no settled dues on a double submit, so no second event can be emitted" (empty settled-rows return → the instance pass never runs).

### F3 (MEDIUM, D16) — `notImpersonating` on `applyPayrollOverride` — ✅ fixed, with a material discovery

- **Discovery (probe-verified):** the repo's `authScopes` multi-key convention is **broken**. The builder never sets `scopeAuth.defaultStrategy`, and @pothos/plugin-scope-auth **4.1.7 defaults to `'any'`**: an ungrouped scope map `{ permission: X, notImpersonating: true }` is satisfied by **any single passing entry** — a logged-in, non-impersonating user without the permission satisfies `notImpersonating: true` alone and is authorized. Empirical probe (real builder + real ScopeAuth stack): `{ permission: MANAGE, notImpersonating: true }` with an impersonating-but-permissioned context returned **NO ERRORS** (granted), and with a view-only context was granted via the notImpersonating entry. The literal repo convention would therefore have *weakened* the existing permission gate instead of adding the impersonation guard.
- **Fix:** the mutation now uses the `$all` wrapper — both the `ACCOUNTING_PAYROLL_MANAGE` permission AND a non-impersonated session are required. Probe confirms the `$all` form rejects view-only (FORBIDDEN), impersonating (FORBIDDEN), and logged-out (UNAUTHENTICATED via the `loggedIn`-failure mapping that the builder's `hasLoggedInFailure` already handles for `AllAuthScopes` failures). The service is never invoked on a rejected request.
- **Test:** "rejects impersonating actors with a FORBIDDEN GraphQL error and never invokes the service" (context `isImpersonating: true` + `realUserId` set → `insufficientPermissions` / FORBIDDEN envelope, `applyOverride` never called), mirroring the scope-rejection test convention.
- **Out of scope but filed:** the same ANY-semantics hole affects every other multi-key `authScopes` site in the repo (billing money mutations, settings mutations, schedule deletion, onboarding, admin-password…). Filed as **D19** for the orchestrator — those files are outside this cluster's ownership. Service-layer `requirePermission` re-checks are the current backstop wherever they exist.

### F4 (LOW) — expected precondition-skips log at info — ✅ fixed

The settlement skip logs `logger.info("Skipped the payroll settlement flip: the instance status changed after the batch read", { classInstanceId, teacherPaymentId })` — info level (not error), matching the settlement path's existing info-level operational logging; asserted by name in the race test.

### F5 (from fix-1's F7 SAVEPOINT analysis) — analyzed, deliberately NOT applied here

- `grep` for savepoint usage across `backend/db` finds **no production pattern** — the only savepoint code is the test utility `expectSavepointError` (`backend/db/test/test-utils.ts`), so there is no established repo savepoint pattern to reuse.
- The settlement path **cannot hit the 25P02 poisoning pattern**: `TeacherDueService.markAsPaid` owns its `db.transaction` and has no swallow-and-continue catch around the payroll writes — any failure (JS- or PG-level) rolls back the **entire settlement** atomically, which is exactly AC-9.5's "flip in the same transaction" guarantee. A SAVEPOINT around the flip would be actively wrong here: it would let the due-status write commit while the instance flip rolls back, producing the partial settlement the same-transaction design forbids.
- The accrual path joins a caller's transaction (lesson-report approval), but that caller awaits the side effect with no catch (`lesson-report.service.ts` `await sideEffect(tx, report)` inside the transition transaction) — failures fail closed with a whole-transaction rollback; no poisoned-continue surface.
- The one real F7 surface (the auto-trigger catch in `class-session.service.ts`) remains owned by the parallel class-session fixer and is untouched here.

---

## Race-interleaving analysis — the stomp is closed

Pre-fix stomp (reviewer's scenario): payment tx P reads instance I unlocked (sees `WAITING_PAID`) → override tx O takes the advisory + FOR UPDATE row lock, passes the WAITING_PAID+force gate, writes `REFUND`/`"0"` + event, commits → P's unguarded `UPDATE … WHERE id = I` flips the REFUND row to `PAID` (amount `"0"`), silently stomping the operator's refund while the settlement event records a stale `WAITING_PAID` fromState.

Post-fix, every interleaving resolves without a stomp:

1. **O commits before P's UPDATE.** P's `UPDATE … WHERE id = I AND calculation_status = 'WAITING_PAID'` matches **zero rows** (the row is `REFUND`) → repo returns `null` → P skips the event and logs info. The refund stands; nothing is overwritten; no event with a stale fromState is emitted (the pre-fix stale-event problem is eliminated, not patched).
2. **P's UPDATE fires first.** The UPDATE matches (row is `WAITING_PAID`) and holds the row lock until P commits. O's locked re-read (`FOR UPDATE`) blocks, then sees `PAID` → the override gate rejects with `PAYROLL_ALREADY_PAID` (AC-6.7). Settlement is final; correct per spec.
3. **O holds the row lock while P's UPDATE waits.** P's UPDATE blocks on the row lock; after O commits `REFUND`, the UPDATE's WHERE re-evaluates against the committed row version (READ COMMITTED) → status mismatch → zero rows → `null` → skip. Same outcome as (1).
4. **Concurrent duplicate settlements (double-submit).** P1's `teacher_dues` UPDATE takes the due-row locks; P2 blocks on the same rows, then re-evaluates: the **PENDING filter** (F2) excludes the settled dues → P2 settles zero rows for the re-submitted ids (they stay linked to P1's payment) and the instance pass never runs. If P2 carried distinct due ids sharing an instance, its preconditioned flip matches zero rows after P1's commit → skip, no duplicate event.
5. **Event accuracy when the flip succeeds.** The amount columns of a `WAITING_PAID` row are immutable under every writer (the accrual flip refuses `WAITING_PAID` rows; the calculator rejects non-terminal rows; an override changes the status away on write), so the earlier-read snapshot used for `fromState`/`toState` is still accurate at the moment a successful preconditioned UPDATE proves the row was `WAITING_PAID` all along.

The advisory lock is irrelevant on this path by design (settlement never takes it); the row-level precondition is the serializer that closes the window.

---

## Verification

### Quality gates (sub-loop `--lifecycle codescene` — exit 0 required)

| File | Exit |
|---|---|
| backend/db/repo/scheduling/class-instances.ts | 0 |
| backend/services/teacher/teacher-due.service.ts | 0 (re-run after the final edit) |
| backend/db/repo/teachers/teacher-due.repository.ts | 0 |
| backend/graphql/mutation/teachers/payroll.mutation.ts | 0 (re-run after the `$all` correction) |
| backend/services/teacher/teacher-due.service.test.ts | 0 |
| backend/graphql/mutation/teachers/payroll.mutation.test.ts | 0 |
| backend/db/test/repo/scheduling/payroll-report.repository.test.ts | 0 |
| backend/db/test/repo/teachers/teacher-due.repository.test.ts | 0 |

### Test suites (mandatory runner `test/scripts/run-test.ts` — exit 0 required)

| Suite | Before | After |
|---|---|---|
| backend/services/teacher/teacher-due.service.test.ts | 11 pass | **12 pass / 0 fail** (55 expect; 1 test re-semantics: flip-miss invariant → race-skip; +1 double-submit) |
| backend/services/teacher/teacher-due-payroll-integration.test.ts | 15 pass | **15 pass / 0 fail** (59 expect; untouched, re-run green against the changed service) |
| backend/graphql/mutation/teachers/payroll.mutation.test.ts | 14 pass | **15 pass / 0 fail** (77 expect; +1 impersonation rejection) |
| backend/db/test/repo/scheduling/payroll-report.repository.test.ts | 23 pass | **25 pass / 0 fail** (96 expect; +2 preconditioned-update tests) |
| backend/db/test/repo/teachers/teacher-due.repository.test.ts | 15 pass | **17 pass / 0 fail** (58 expect; +2 double-submit/mixed-batch tests) |
| backend/services/teacher/payroll-calculation.service.test.ts (adjacent, fix-1's suite — signature compat) | 43 pass | **43 pass / 0 fail** |
| backend/services/teacher/payroll-override.service.test.ts (adjacent, fix-1's suite — signature compat) | 37 pass | **37 pass / 0 fail** |

### Semantic review

- **No dead branches:** the orphaned `markInstancePaidIfAwaiting` was removed; the new `expectedStatus` branch is exercised on both sides (match + mismatch) by real-DB repo tests; the new empty-`eventRows` early return is exercised by the all-instances-skipped race test; the accrual path's unconditional form stays test-locked (throw-on-miss).
- **Clean comments:** `rg -in "AC-[0-9]|US-[0-9]|E1[0-9]|D1[0-9]|specs[.]md|implementation[.]md|trackable|TB[.]|MP-"` over all eight files → no genuine plan-artifact references (three case-insensitive `tB.` false positives inside `instB.id` identifiers only).
- **Enum value imports:** `CalculationStatus` is imported as a value from `@/backend/enum` in `class-instances.ts` (used in the options contract) and was already a value import in the service; `TeacherDueStatus.PENDING`/`.PAID` compared as enum members in the repo filter.
- **No cross-layer additions:** the service passes a plain options object to the existing repo method; the repo owns all SQL; the mutation stays a thin resolver. No GraphQL/frontend imports in service/repo; no repo→service edges.
- **Money safety unchanged:** settlement flips still never touch money columns; the skip path emits no event at all rather than an event with stale amounts.

---

## Files touched

All landed in commit `c575531103` **except** `payroll.mutation.ts`, whose final `$all` form is the pending working-tree change the committer must pick up:

| File | Δ |
|---|---|
| backend/db/repo/scheduling/class-instances.ts | +28/−5 (options interface + preconditioned WHERE + doc) |
| backend/services/teacher/teacher-due.service.ts | +22/−6 (preconditioned flip, info-level skip, empty-events early return, doc) |
| backend/db/repo/teachers/teacher-due.repository.ts | +9/−2 net (kept interrupted dispatch's PENDING filter + doc; removed its orphaned helper) |
| backend/graphql/mutation/teachers/payroll.mutation.ts | +10/−1 ($all-wrapped permission + notImpersonating) — **working tree only** |
| backend/services/teacher/teacher-due.service.test.ts | +40/−8 |
| backend/graphql/mutation/teachers/payroll.mutation.test.ts | +13/−0 |
| backend/db/test/repo/scheduling/payroll-report.repository.test.ts | +46/−0 |
| backend/db/test/repo/teachers/teacher-due.repository.test.ts | +54/−0 |

---

## Handoffs to orchestrator

1. **Committer:** take the pending `backend/graphql/mutation/teachers/payroll.mutation.ts` working-tree change (HEAD's ungrouped form fails the committed impersonation suite and — per the ANY-semantics discovery — does not enforce either scope).
2. **D19 (new ledger row):** repo-wide Pothos scope-map ANY semantics — every multi-key `authScopes` object outside this cluster (billing-management, currency, currency-hedge, fx-ingestion, payment-method, billing-payments, environment-config, general-settings, meeting-integrations, session-config, site-appearance, site-content, schedule-deletion, onboarding, admin-password, general-user-create, test-helper mutations) is satisfiable by its weakest single entry. Fix per site (`$all` wrap) or builder-wide (`defaultStrategy: "all"` — needs an audit of intentional `$any`-style maps first); service-layer permission re-checks are the interim backstop.
3. **D16 follow-up (already noted by the review):** `markTeacherDuesPaid` carries the same impersonation-attribution gap as `applyPayrollOverride` did — same one-line `$all` fix in `teacher-due.mutation.ts` when its owner touches it (outside this cluster's file list).
4. Ledger updates: D12 → ✅ Done, D13 → ✅ Done, D16 → ✅ Done (this outcome is the verification reference); D19 added.
