# Post-Implementation Review — R1 (teacher-payroll-engine)

**Task ID:** W4-REVIEW
**Agent:** reviewer subagent (post-implementation review wave)
**Date:** 2026-08-30
**Method:** read-only semantic review. Full local worklog (933 lines) + all 44 outcome files + deferred-items.md + trackable-tasks.md absorbed; core payroll sources downloaded and read end-to-end (`payroll-calculation.service.ts` 952 LoC, `class-session.service.ts` payroll surface, CSV route, query/mutation/pothos, repo `class-instances.ts` payroll region, `payroll-override.idempotency.ts`, `teacher-due.service.ts` + repository, `payroll-backfill.ts`); committed scope = merge-base `afb9601518` (master) → `feat/teacher-payroll-engine` across the 11 payroll commits (`127b893db4` → `aa098c1aa3`); uncommitted payroll delta audited hunk-by-hunk. No suites/builds/e2e run (orchestrator's 8.3 gate owns them); no file modified except this outcome.

---

## Overall verdict

## **APPROVED-WITH-FIXES**

Zero code defects found on the payroll surface in this wave. Every checklist item that concerns **code** passes with file:line evidence. All findings are **plan-artifact / ledger-hygiene** items that the closure wave already owns — none require touching product code except the D8 disposition decision. This matches the midpoint R1 precedent: strict on bookkeeping integrity, no invented severity.

**Findings: 0 Critical / 0 High / 2 Medium / 2 Low** (+2 ratified observations). MUST-FIX = 3 (all ledger/closure artifacts). NICE-TO-FIX = 5.

---

## Per-item verdicts

| # | Checklist item | Verdict |
|---|---|---|
| 1 | Dead branches / unreachable code / unused exports | **PASS** |
| 2 | Cross-layer imports | **PASS** |
| 3 | Plan-artifact references in code comments | **PASS** |
| 4 | Error handling: DomainError hierarchy + tErrors keys EN/AR | **PASS** |
| 5 | Money math (BigInt, REFUND "0", PARTIALLY proration) | **PASS** |
| 6 | Permission symmetry VIEW vs MANAGE at every entry | **PASS** |
| 7 | Idempotency (override key, calc content-key, backfill keying) | **PASS** |
| 8 | Transaction discipline (advisory ordering, tx propagation, in-tx events, audit outside tx) | **PASS** |
| 9 | Soft-delete + filter hygiene | **PASS** (1 accepted observation) |
| 10 | i18n (typed leaves, snapshots, no hardcoded strings) | **PASS** |
| 11 | A11y (aria/labels per 7.x) | **PASS** |
| 12 | Test quality (real services/DB journeys, Tier-4, TB.4 matrix) | **PASS** |
| 13 | GraphQL (additive, D6 enum import, notImpersonating) | **PASS** |
| 14 | CSV route (RFC 4180, tab/CR neutralization, truncation, 400-vs-500) | **PASS** |
| 15 | Events surface (TB.5 D22 fix correctness + perf) | **PASS** |
| 16 | Deferred-items integrity (D1–D24) | **FINDING — 2× Medium, 2× Low** |
| 17 | Docs vs code reality (spot-checks) | **PASS** (7/7 claims true) |
| 18 | Security: TB.5 matrix verdicts vs code | **PASS** |
| 19 | Data integrity: 8.4 FK anomaly, payroll-side gaps | **PASS** |
| 20 | Scope hygiene | **PASS** |

---

## Evidence per item

### 1. Dead code — PASS
`payroll-calculation.service.ts`: every module constant (`OPERATOR_SELECTABLE_STATUSES` :65 → `validateOverrideInput` :510; `STICKY_STATUSES` :76 → :715; `TERMINAL_EXECUTION_STATES` :83 → :319; `REPORT_AGGREGATE_ROW_CAP` :59 → :936) and helper is consumed; the midpoint re-review already confirmed the fix wave removed the two dead branches (`effectiveStart` fallback, `markInstancePaidIfAwaiting`) — still absent in the current tree. Barrel exports (`backend/services/teacher/index.ts`: payroll-calculation/grace-settings/override-idempotency) all have consumers. VM exports `buildPayrollExportCsvUrl` + `isRowCountByStatus` consumed (VM + Container/DataGrid tests). The one known dead input (`isOnDemand`) is honestly documented as a provenance marker and tracked as **D18 (🔄, accurate)**.

### 2. Cross-layer imports — PASS
Payroll UI imports only `@/frontend/*` (generated graphql, own views) + `@/shared/*`; the app route imports `@/backend/lib` + `@/backend/services` + `@/shared/locale` only; backend payroll files import `@/backend/*` + `@/shared/*`. The pre-existing service→graphql import in `class-session.service.ts` (`buildClassInstanceDetail`) predates the payroll commit (verified by MP-backend via `git show 86d902df59^`) — baseline-filtered.

### 3. Plan-artifact comments — PASS
Grep for task/phase/TB./plan/spec/outcome/AC-/deferred wording across all payroll source + UI files: **0 real matches**. Only hits are domain language ("absent outcome" = the `ClassOutcome` column) in the calculator + its tests. The two pre-existing `specs.md §5.x` comments in the notification helper of `class-session.service.ts` are baseline-era and non-payroll (MP-rereview evidence).

### 4. Error handling — PASS
Every throw site in the payroll service uses the DomainError hierarchy: `DomainError("PAYROLL_NOT_TERMINAL"/"PAYROLL_ALREADY_PAID"/"PAYROLL_AWAITING_SETTLEMENT"/"PAYROLL_UPDATE_FAILED"/"PAYROLL_EVENT_INSERT_FAILED")`, `NotFoundError("CLASS_INSTANCE")`, `ValidationError` (`payroll-calculation.service.ts:320/710/794/797/740/815/388/688/694/497/504/511`). Every tErrors key used exists in types + EN + AR: `payroll.{notTerminal,alreadyPaid,awaitingSettlement,invalidTargetStatus,partialRequiresPercentage}` (EN :82-88 / AR :104-110 / types :362-368), plus `invalidInput`, `internalServerError`, `insufficientPermissions`, `unauthorized`, `scheduling.classInstanceNotFound({id})` — all verified present in both locales. **D11** (missing `payroll.noteRequired` key; server throws generic `tErrors.invalidInput` for note-required) — ledger status 🔄 accurate; midpoint already ratified as user-safe.

### 5. Money math — PASS
Minor-unit BigInt end-to-end: `parseAmountToMinorUnits`/`formatMinorUnits`/`divideRoundHalfUp` (:105-133), rate×duration via BigInt (:282), percentage via `PERCENT_SCALE` BigInt (:594), report sums exact (`sumPaidAmounts` :628-638, comment "no floating point anywhere" honored). REFUND writes the exact CHECK-contract string `"0"` (`REFUND_PAID_AMOUNT` :56 → patch :571). PARTIALLY proration applies the percentage to the **current row amount** (`resolvePartialBaseMinorUnits` :533-550 uses `instance.teacherPaidAmount` first, fresh calc only as fallback) — matches AC-6.6, pinned by override tests, re-validated by TB.5 P5. (Pre-existing `Number.parseFloat` in `teacher-due.service.ts` monthly-report legacy path predates the plan — baseline-filtered at midpoint; payroll snapshot path passes the string verbatim.)

### 6. Permission symmetry — PASS
VIEW gates: GraphQL `payrollReport` (authScopes, payroll.query.ts:16), CSV route (`requirePermission` before any data read, route.ts:169), `getReport` service gate first-statement (:925), nav item + page guard (`PAGE_PERMISSIONS.accountingPayrollView`, `withPageAuth([VIEW])` — 3.7 tests pin it), detail strip + events filter (`class-session.service.ts:376/391`). MANAGE gates: `applyPayrollOverride` mutation ($all wrapper + notImpersonating), `calculateForInstance` (:879) + `applyOverride` (:901) first-statement, backfill fail-fast (`payroll-backfill.ts:168`). TB.3 journey proves all denials are pre-read/pre-write with byte-identical state afterwards; TB.4 Tier-4 covers the getReport VIEW gate; view-only auditor positive control proves denials non-vacuous.

### 7. Idempotency — PASS
Override key: content scheme `sha256("payroll-override:instance:status:pct:note:force")` with client-token variant under **distinct prefix** `payroll-override-client:instanceId:token` (collision-impossible by prefix, `payroll-override.idempotency.ts:36-52`); 30 s window lookup `findRecentByInstanceAndHash` before write, event + update in one tx. Calculation content-key `payroll-calculation:{instanceId}:{status}:{duration}:{amount}` (:341-351). Accrual/settlement keys use their own prefixes (`payroll-accrual:` / `payroll-settlement:` — teacher-due.service.ts:73/78). Backfill candidates keyed `calculationStatus = NOT_CALCULATED AND payrollCalculatedAt IS NULL` (+ terminal + `isNull(deletedAt)`) — 8.4's run-4 "0 candidates" is the no-regression proof; rate-degraded and operator-parked rows keep timestamps so they are never reprocessed.

### 8. Transaction discipline — PASS
ABBA fix intact: `calculateForInstance` passes `{ advisoryLock: tx == null }` (:884) so embedded state-machine runs never wait advisory-after-row; `applyOverrideWithinTransaction` always `{ advisoryLock: true }` (:790). D12 fix intact: settlement flip passes `{ expectedStatus: WAITING_PAID }` (teacher-due.service.ts:325) against the preconditioned UPDATE (class-instances.ts:558-574, null ⇒ skip + info log); accrual reads FOR UPDATE (:227). Payroll events insert inside the tx via `createMany([row], tx)` (:386). Audit-log emit is post-commit, best-effort, never-throws (applyOverride :904-909 → emitOverrideAuditLog try/catch :474-484). Auto-trigger guards (routine→warn / SQLSTATE→honest abort message / generic→error, class-session.service.ts:500-551) unchanged since fix-3.

### 9. Soft-delete hygiene — PASS (+1 accepted observation)
`isNull(classInstances.deletedAt)` is the first condition of `buildPayrollReportConditions` (class-instances.ts:593) — every report read (GraphQL + CSV) excludes deleted rows; backfill excludes them (payroll-backfill.ts:100); 8.4 verified the 118 soft-deleted terminal rows untouched end-to-end. **Observation (accepted, non-defect):** the write-path lock read `getById` (:517-534) intentionally does NOT filter soft-deleted rows (legacy semantics, documented since task 1-g); deleted rows are unreachable from the UI/CSV (report filters them), so the exposure is a direct-API call with a known deleted instanceId — writes payroll fields on a deleted row, no cross-row corruption. Ratified as designed; no action.

### 10. i18n — PASS
Typed namespace complete: `dashboard.billing.payroll` EN/AR leaf parity **51/51, diff ∅** (fresh programmatic check this review; growth 37→47 (D9 closure) →51 (5.x/7.x additions) is additive and snapshot-regenerated — both snapshots committed). Zero hardcoded JSX text strings in payroll UI components (grep 0). Errors namespace + `dashboard.core.nav.accountingPayroll` EN/AR present. Compile-enforced parity (typed leaves) held through every regen.

### 11. A11y — PASS
`PayrollReportsFilterBar`: search `aria-label` + `maxLength=200` (D20 closure verified at :58/:196), labelled autocompletes + status select + date-range trigger + labelled clear button. `CalculationStatusChip`: aria-label = full status text. `OverrideDialog`: labelled RadioGroup/percentage/note. axe-core sweeps present (Container test ×1, OverrideDialog ×4 assertions); 4 AR/RTL tests in OverrideDialog (21/21). 7.1-7.3's heading-order exclusion is shared-component-owned (see Finding F3b).

### 12. Test quality — PASS
Journeys run real services + real test DB (TB.1 8 / TB.2 11 / TB.3 5 tests = 24 workflow tests; full `test:workflows` 74/0); TB.3 denials assert on real permission rows with a view-only-auditor positive control — no assertions-on-mocks-only. Resolver-layer suites (query 9 / mutation 15) mock the service **by documented design** — the service itself now has dedicated coverage because TB.4 filled the `getReport` gap (+9 tests, uncommitted +236 lines verified present). TB.4's 8-target × 4-tier matrix is complete with Tier-4 (or documented N/A) in every row; XSS battery (14 cases), wildcard-injection, and permission-first proofs all green as of 8.2/TB.4 evidence.

### 13. GraphQL — PASS
`git diff master...HEAD -- schema.graphql` contains **zero removals** — payroll SDL is purely additive (6 payroll types + 7 ClassInstanceDetail fields + 2 root fields); current uncommitted generated deltas are the sibling credit-plan's `internalNotes` (not payroll). D6 honored: `payroll.pothos.ts` has **0 `enumType` calls** (enum imported from `shared/enum.pothos`). `applyPayrollOverride` uses `$all: { permission: ACCOUNTING_PAYROLL_MANAGE, notImpersonating: true }` with the load-bearing comment (payroll.mutation.ts:15-24); TB.5 G4 proves impersonation denial.

### 14. CSV route — PASS
RFC 4180 (CRLF join + trailing CRLF + quote doubling, route.ts:129-138); formula neutralization covers `= + - @ \t \r` (TB.5 C4 fix verified in code :13 and in the +22-line pending test "neutralizes tab- and CR-led formula cells"); `X-Export-Truncated` honest (`totalCount > 10_000`); discipline: 401 unauthenticated → 403 ForbiddenError → 400 ValidationError (malformed dates/enums/oversized search; service never called) → 500 generic + logger; permission gate precedes ALL data access.

### 15. Events surface (D22 fix) — PASS
`getClassStatusEvents` (class-session.service.ts:380-393) filters on **event TYPE prefix** (`event.eventType.startsWith("PAYROLL_")`) gated by `PermissionsService.hasPermission(userId, ACCOUNTING_PAYROLL_VIEW)` — exactly the two required dimensions; operator audit trail untouched. **Performance:** the filter is an in-memory pass over one instance's already-fetched events (bounded per-instance set, `SchedulingRepository.getClassStatusEvents(classInstanceId)` — no new query shape, no LIKE on eventType, no index need). Journeys updated: TB.1 step 7 (+14 lines, teacher/student blindness + operator retains trail); TB.2 step 9 audit assertions green with the filter in (74/0 workflows).

### 16. Deferred-items integrity — FINDINGS (the core of this review)

**F1 [MEDIUM] — glyph gate not met: `grep -c "❌\|⚠️"` = 19 (must reach 0).** Exactly these lines still carry glyphs:
`deferred-items.md` **:20** (template row D2 ❌), **:21** (template row D3 ⚠️), and the ledger's own documentation/legend/template sections: **:49, :50** (status legend), **:67** (`D<next-id>` row template ❌), **:74** ("To ⚠️ Partial"), **:93, :96, :99** (the gate command + exit-criteria text — they literally contain the glyphs they grep for), **:107, :112, :122** (DX example rows), **:134–:138** (❌ "Don't…" bullets), **:150** (whatsapp example row), **:164** (example grep command). Fix: delete template rows D1-D3 + the example/legend/instruction sections (or reword without the glyphs) so the file's own gate can pass. The 21 real rows D4–D24 carry **no** ❌/⚠️ statuses (13 ✅ Done / 8 🔄 In Progress) — real-row hygiene is fine.

**F2 [MEDIUM] — D8 disposition unresolved past its target gate.** Row D8 (system_settings CHECK / upsert validation rejecting negative payroll grace values) is 🔄 In Progress with target "Final hardening gate (pre-TB.3)". TB.3 and TB.5 both shipped without implementing it and without flipping the row. The ledger's own note says "…before plan completion". The plan cannot close with this open: either implement (MP-config guidance: dialect-aware `checkConstraint` scoped to the three `payroll.grace_*` keys via `db generate`, or service-layer validation at the settings upsert — either closes D8) or record an explicit orchestrator ratification that re-scopes it to a named future wave. Calculation-path safety is not in question (`resolveGraceSettings` fallback protects every calculation), so this is gate-hygiene, not a code defect.

**F3a [LOW] — D21 status ✅ Done contradicts its own item text.** Item = "E2E payroll spec execution", target = "future execution wave", yet status ✅ Done with a note admitting "execution intentionally skipped per explicit user instruction". Done refers to the *spec authoring*; the *execution* the row names has not happened. Reword the item ("E2E payroll spec authoring; execution deferred — run `bun run test:ui:e2e`") or flip to 🔄 so the closure wave's DoD cannot mistake e2e as proven.

**F3b [LOW] — 7.1-7.3 outcome references a deferred row that does not exist.** `7.1-7.3-i18n-a11y-rtl-outcome.md` logs the axe `heading-order` exclusion "as deferred item D21 for the shared-components owner", but the ledger's D21 is 8.1's e2e waiver (number collision — 8.1 claimed D21 the same day) and **no heading-order row exists** (grep "heading"/"axe" in deferred-items.md = 0). Add it as D25 (shared-components owner, outside payroll scope) so the a11y exclusion is tracked, and fix the outcome's cross-reference.

**F4 [LOW] — D19 row text corruption.** "…payroll mutation now uses the  wrapper" — the `$all` token was swallowed (markdown `$` interpolation). Restore "`$all`" so the row is self-explanatory.

Statuses otherwise accurate: D4/D5/D6/D7/D9/D10/D12/D13/D14/D15/D16/D20/D22 ✅ Done all verified true in code this review; D11/D17/D18/D19/D23/D24 🔄 all still factually open.

### 17. Docs vs code — PASS (7 claims spot-verified)
1. TB.5 "CSV_FORMULA_PREFIXES += \t,\r" → route.ts:13 ✓ (+ pending test) 2. TB.5/D22 "getClassStatusEvents filters PAYROLL_* for non-VIEW actors" → class-session.service.ts:391-392 ✓ (this is the only uncommitted delta in that file, +6/-1 — exactly the fix) 3. D20 "SEARCH_INPUT_MAX_LENGTH wired via slotProps.htmlInput.maxLength (FilterBar:58,196)" ✓ 4. D12/D13 "expectedStatus precondition + PENDING filter" → class-instances.ts:565 / teacher-due.repository.ts:213 ✓ 5. D4 "SDL :195-196 + graphql.ts :91-92 enum members" ✓ (exact lines still hold) 6. TB.4 "+236 lines getReport describe" → uncommitted diff stat = 236 ✓ 7. 8.4 "no payroll object impact from FK-validation failures" → payroll's single FK (`payroll_calculated_by` → users, ON DELETE SET NULL, migration line 14) is inside the columns unit and restored/validated on staging; the 20 orphaned-FK statements across 14 tables name no payroll constraint ✓.

### 18. Security (TB.5 matrix vs code) — PASS
Both in-plan fixes land in code exactly as the outcome claims (C4 tab/CR; D22 events filter — see items 14/15). The 17 SECURE verdicts are backed by committed journeys/route tests re-run green in 8.2/TB waves; P3 wildcard escaping (`escapeLikeWildcards` + parameterized `caseInsensitiveLike`) verified in repo source (class-instances.ts:612-614). D24 (NUL byte → SQLSTATE 22021 → 500-class) rationale is sound: MANAGE-privileged-only on the payroll leg, transaction rolls back, state-intact proof captured; deferring to an app-wide text-input hardening wave (shared-sanitizer blast radius) is the right scope call. Accept.

### 19. Data integrity (8.4) — PASS
Orphan-FK anomaly was a two-phase-dump restore artifact on **staging only**, affecting 14 sibling tables; zero payroll constraints involved; the rehearsal's post-migration parity check restored all payroll objects (8 cols incl. NOT NULL DEFAULT, 4 indexes, FK SET NULL, 2 CHECKs, enum, 3 settings) and later sibling migrations (38, easy_black_widow) verified payroll-free. No payroll-side FK gaps: the only payroll FK is deliberately nullable + SET NULL (audit attribution survives user deletion), and `class_status_events` FK discipline was already hardened by TB.1's journey-cast cleanup fix. Dev DB read-only invariants held (ci=2645, journal=104).

### 20. Scope hygiene — PASS
Uncommitted payroll delta maps 1:1 to owned waves: route.ts + route.test.ts (TB.5 C4), class-session.service.ts (TB.5 D22), payroll-calculation.service.test.ts (TB.4), TB.1 journey +14 (D22 assertions), DIAGRAMS.md (TB.3), PayrollReportsDataGrid.test.tsx (+3/−2 type-safety polish), deferred/trackable bookkeeping, + untracked payroll tests (TB.3 journey, 3.7 sidebar + guard tests) + 5 untracked payroll outcomes. Every other dirty/untracked file (credit-adjustment ×10, scripts/translate-locale-ar.ts, CreditAdjustForm.stories.tsx, generated graphql.ts/schema.graphql `internalNotes` delta, sibling x1/x2 outcomes) belongs to the concurrently-running credit-adjustment agents — no payroll agent touched a sibling path (cross-referenced against the sibling outcomes' footprints). Note: the committed payroll branch necessarily contains sibling-plan commits (shared branch, single committer) — pre-existing, orchestrator-owned, documented since setup.

---

## MUST-FIX (blocking plan closure — all ledger/closure artifacts, zero product code)

1. **Ledger glyph cleanup to gate count 0** (F1): remove template rows D2/D3 + scrub the legend/instructions/example sections — lines 20, 21, 49, 50, 67, 74, 93, 96, 99, 107, 112, 122, 134, 135, 136, 137, 138, 150, 164.
2. **D8 disposition** (F2): implement the grace-settings CHECK/upsert validation, or replace the row's "before plan completion" demand with an explicit ratified re-scope naming the owning wave.
3. **Ledger integrity pair** (F3a+F3b): correct D21's status/text mismatch and add the missing heading-order deferred row (as D25, shared-components owner; fix the 7.1-7.3 outcome's stale "D21" reference).

## NICE-TO-FIX (defer to ledger / committer)

4. **D19 row**: restore the swallowed `$all` token (F4).
5. **D18**: delete the `isOnDemand` wiring (class-session.service.ts:511) + its trigger-test assertions atomically while the schema is unshipped.
6. **D11**: add `payroll.noteRequired` (types + EN + AR + snapshot regen) for even field-level error mapping in the dialog.
7. **Committer**: land the uncommitted payroll files (D22 + C4 fixes, TB.4 tests, TB.3 journey, 3.7 tests, DataGrid test polish, plan artifacts) — the D22/C4 security fixes are load-bearing and currently exist only in the working tree, exactly like the midpoint's `payroll.mutation.ts` situation.
8. **Execution wave**: run `bun run test:ui:e2e` (D21-real) when scheduling permits; the spec's data prerequisite (≥1 CALCULATED row) should be verified first.

## Ratifications by this review (review-gate items addressed to us)

- **D23 — RATIFY the VIEW-only nav+page contract.** Self-consistent (nav visibility == page guard), identical to the sibling-credits precedent, bootstrap grants always pair VIEW+MANAGE, and MANAGE-only is a hypothetical custom group. Keep `PAGE_PERMISSIONS.accountingPayrollView = [View]`; flip D23 to ✅ Done (ratified by post-implementation review R1) or fold the rationale into the row.
- **PARTIALLY proration base — RATIFY as intended.** Percentage applies to the CURRENT row amount (AC-6.6 reading), pinned by tests, TB.5-re-validated; operators see the base amount in the row before overriding. No change.
- **`getById` soft-delete non-filtering on the payroll write path — RATIFY** (documented legacy semantics; all read surfaces exclude deleted rows).

## Carry-forwards for the closure wave

- 8.3 Full quality gate is the only unticked task header (in flight by the orchestrator in parallel with this review) — its result should be appended to the DoD checklist before final commit.
- 5 untracked payroll outcome files + 3 untracked payroll test files + the working-tree fixes must be staged in the final payroll commit (only payroll paths; never `git add .`).
- The e2e spec's explicit 180 s timeout and the CALCULATED-row prerequisite are documented in 8.1's outcome — cite them in the execution wave's dispatch.
- Snapshot count is now 51 keys (not 47 as in D9's note) — harmless, but the closure wave's DoD wording should reference "current parity 51/51" rather than a stale count.
