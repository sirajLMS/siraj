# Outcome — Task TB.4: 4-Tier verification (payroll service + repository files)

- **Status**: ✅ Done
- **Date**: 2026-08-30
- **Agent**: implementation subagent (4-Tier verification)
- **Method**: audited every target file's test suite against the 4-Tier
  definitions in `.agents/skills/write-tests/SKILL.md` +
  `.agents/skills/test-expert/SKILL.md` (Tier 1 branch coverage / Tier 2
  boundaries / Tier 3 chaos-fuzz / Tier 4 abuse & permission), then re-ran
  every audited suite through the mandatory `test/scripts/run-test.ts`
  runner for fresh greenness evidence.

## Path adaptations (known, per prior outcomes)

- Services layer is `backend/services/teacher/` (singular), not the plan's
  `teachers/` (documented since task 1.4).
- Target 5's plan path `backend/services/scheduling/scheduling.service.ts`
  **does not exist** — the auto-trigger wiring lives in
  `backend/services/session/class-session.service.ts` (the "(or whichever
  service owns the state-machine)" clause; documented in the 1.11 outcome).
  Its mandated suite is `backend/services/scheduling/scheduling-payroll-trigger.test.ts`.

## Coverage matrix (8 targets × 4 tiers)

| # | Target | Test file(s) | T1 branches | T2 boundaries | T3 chaos | T4 abuse/permission |
|---|--------|--------------|-------------|---------------|----------|---------------------|
| 1 | `services/teacher/payroll-calculation.service.ts` (all 3 public methods) | `payroll-calculation.service.test.ts` (52) + `payroll-override.service.test.ts` (40) | ✅ full branch table of 1.6–1.8 outcome (terminal snapshots, grace grid, absence rules, pro-rating caps, sticky/PAID guards, rate-failure degradation, idempotency, advisory/row lock ordering) **+ getReport branches (GAP → FILLED this task)** | ✅ grace boundary/threshold semantics, half-cent rounding, 3-decimal rates, 2000-char note, on-demand telemetry variants | ✅ concurrent idempotent double-click collapse (calc + override), chained-tx serialization, malformed instance ids | ✅ `ACCOUNTING_PAYROLL_MANAGE` gate proven FIRST statement for `calculateForInstance` + `applyOverride` (zero reads/writes on deny, localized message) **+ `ACCOUNTING_PAYROLL_VIEW` gate for `getReport` (GAP → FILLED)**; XSS note battery; unknown-instance abuse |
| 2 | `services/teacher/payroll-grace-settings.ts` | `payroll-grace-settings.test.ts` (13) | ✅ every parse/fallback/warn branch (absent, negative short/long, threshold < 1, non-integer, partial-missing, valid, key-set order) | ✅ 0-grace + 1-threshold accepted; defaults-equal-config; negative threshold | ✅ 40-round seeded mulberry32 combination sweep with invariants | **N/A — documented** (no untrusted input: values are DB-sourced via repo; permission gate owned by the calculator caller; no GraphQL exposure) |
| 3 | `services/teacher/payroll-override.idempotency.ts` | `payroll-override.idempotency.test.ts` (23) | ✅ determinism, field sensitivity (all 5 fields), token/content key schemes, null/undefined/empty normalization | ✅ pct 0 vs absent, pct 0/50/100 distinct, force true/false/absent, blank tokens | ✅ 100-input seeded fuzz + single-field mutation sweep; long/unicode/emoji notes | ✅ delimiter-injection impersonation cases ("colon-bearing note cannot impersonate a different force flag", "a token can never impersonate a content-derived key"); permission N/A (pure hash fn, no entry point) |
| 4 | `services/teacher/teacher-due.service.ts` (payroll-amount consumption + status flips) | `teacher-due-payroll-integration.test.ts` (15) + `teacher-due.service.test.ts` (12) | ✅ snapshot-amount consumption (CALCULATED verbatim / PARTIALLY prorated / REFUND "0"), WAITING_PAID + PAID flips, both invariant throws, not-found throws, all flip-guard early returns | ✅ refund zero-amount due in teacher currency, snapshot-without-amount fallback, empty batch | ✅ due-insert + flip + event share ONE tx (sentinel), caller-tx join, double settlement single event, forced-override race precondition | ✅ `markAsPaid` `TEACHER_DUES_MARK_PAID` gate before any write (no transaction opened) + actor persisted on event; `createDueEntry` gate-free N/A **documented** (server-side only; caller `LESSON_REPORTS_APPROVE` gates it) |
| 5 | auto-trigger wiring — `services/session/class-session.service.ts` (plan path adaptation, see above) | `services/scheduling/scheduling-payroll-trigger.test.ts` (20) | ✅ fire matrix (stop / absent / leave-original / on-demand batch ×2), not-fire matrix (start/activate/reset/soft-delete/non-terminal batch), all guard branches (updatedCount, null-actor, per-instance verify, catch) | ✅ zero-flip batch (no re-read), non-flipped instance skip | ✅ same-tx `fakeTx` sentinel proof, per-instance fan-out, midpoint-fix-3 log taxonomy (permission/settled/terminal warnings vs genuine errors vs tx-abort flags) | ✅ calculator permission rejection swallowed-as-warning path exercised; no new permission surface (documented — calculator's internal gate remains authoritative) |
| 6 | `db/repo/scheduling/class-instances.ts` (`getById` forUpdate / `updatePayrollCalculation` / `findPayrollReportRows`) | `db/test/repo/scheduling/payroll-report.repository.test.ts` (25) | ✅ every report filter branch (teacher/student/date-range/statuses/search/soft-delete), SQL absence flags, `getById` bare + forUpdate + null + no-tx rejection, full/partial patch, expected-status precondition both sides | ✅ inclusive date edges, pagination at exact end (totalCount intact), empty status list, blank search | ✅ expected-status-precondition race guard (midpoint-fix-2, D12 follow-up), case-insensitive search variants | ✅ LIKE-wildcard injection escaped (`%PayRpt1%` matches nothing — wildcards are literals); permission N/A at repo layer (documented — service owns the gate) |
| 7 | `db/repo/scheduling/class-status-events.repository.ts` (`findRecentByInstanceAndHash`) | same repo suite (5 dedicated tests) | ✅ most-recent match + all three miss dimensions (hash / window / instance) | ✅ window edges (20 s inside a 30 s window; 40 s outside) | — nothing to fuzz (hash is a server-derived sha256 bound parameter) | **N/A — documented** (bound parameter; no untrusted free text reaches this query) |
| 8 | `lib/sanitize/richTextSanitizer.ts` (`sanitizePlainText`) | `lib/sanitize/richTextSanitizer.test.ts` (77 = 43 sibling-owned + 34 payroll) | ✅ empty input, passthrough, container-strip-with-contents, no-allowlist strip, strip-then-truncate ordering | ✅ exactly-2000 unchanged, 2001 → 1999+ellipsis, custom maxLength, surrogate-pair-safe cut | ✅ nested tags, unterminated-tag escape, only-tags → "", comments/PIs, entity inertness, idempotent fixed point, mid-entity truncation | ✅ 14-case XSS neutralization battery (script/img/svg/iframe/event-handlers/`javascript:`/`data:text/html`/entity-obfuscated) + bare entity-encoded payloads + 300× repeated payload |

## Gap found → filled

**`PayrollCalculationService.getReport` had ZERO service-layer tests.**
Evidence: `grep getReport backend/services/teacher/*.test.ts` → no matches;
the GraphQL suite (`backend/graphql/query/teachers/payroll.query.test.ts`)
**mocks** `getReport` (its own tests cover only the resolver gate); the repo
suite covers only the SQL layer. All of `getReport`'s branches were unproven:
the VIEW permission gate, the page-reuse vs capped re-scan branch, the
null/malformed amount skip, dominant-currency default/tie/update branches,
and the zero-filled status counts.

**Filled** in `backend/services/teacher/payroll-calculation.service.test.ts`
(new `describe("PayrollCalculationService.getReport")`, 9 tests; mock surface
extended with a pagination-honoring `findPayrollReportRows` mock):

| Test | Tier | Branches proven |
|---|---|---|
| computes exact aggregates from the page itself when the filtered set fits on it | 1 | page-reuse shortcut (single read), BigInt-exact sum "180.50", dominant SAR, full zero-filled `rowCountByStatus` |
| re-scans the filtered set at the export ceiling when the page is a slice | 1 | second read `{limit: 10_000, offset: 0}`; aggregates over FULL set ("150.00", not the page's "30.00") |
| re-scans even a small filtered set when the page starts beyond the first row | 1 + 2 | `offset !== 0` leg of the shortcut condition |
| treats a set exactly the page size as fitting, and one row more forces the capped re-scan | 2 | `totalCount === limit` vs `limit + 1` boundary (sequential-reduce pattern) |
| skips null and malformed amounts while summing the filtered set | 1 (+3 defensive) | `teacherPaidAmount == null` continue + `parseAmountToMinorUnits → null` continue |
| picks the most frequent currency, keeps the earliest on ties, and defaults when none is set | 1 + 2 | dominant update branch, strict-`>` tie-keeps-earliest, `DEFAULT_REPORT_CURRENCY` fallback on all-null |
| zero-fills every status key and the money sum for an empty filtered set | 1 + 2 | empty aggregateRows → "0.00" + SAR + all-zero counts (single read) |
| forwards the caller filters and pagination to the report repository | 1 | filter/pagination pass-through contract on both reads |
| rejects an actor without the payroll view permission before reading anything | 4 | VIEW gate is first statement — zero repo reads, `ForbiddenError` (`FORBIDDEN`, localized), gate asserted `ACCOUNTING_PAYROLL_VIEW` |

One test-expectation fix during the run: the filters pass-through test
initially expected a single read, but `offset: 50` correctly takes the
re-scan branch — expectation corrected to 2 reads (the service behavior is
right; the first draft of the test was wrong).

## Suite results (mandatory runner, this wave — all green)

| # | Suite | Pass | Fail | expect() | Note |
|---|---|---|---|---|---|
| 1 | `backend/services/teacher/payroll-calculation.service.test.ts` | **52** | 0 | 356 | **MODIFIED** (43 → 52; +9 getReport) |
| 2 | `backend/services/teacher/payroll-override.service.test.ts` | 40 | 0 | — | audited, matches 8.2 |
| 3 | `backend/services/teacher/payroll-grace-settings.test.ts` | 13 | 0 | — | audited; greenness re-proven (last prior evidence: task 1.4) |
| 4 | `backend/services/teacher/payroll-override.idempotency.test.ts` | 23 | 0 | — | audited; re-proven (last prior: task 1.3) |
| 5 | `backend/services/teacher/teacher-due.service.test.ts` | 12 | 0 | — | audited; re-proven (last prior: 1.12–1.13) |
| 6 | `backend/services/teacher/teacher-due-payroll-integration.test.ts` | 15 | 0 | — | audited; matches 8.2 |
| 7 | `backend/services/scheduling/scheduling-payroll-trigger.test.ts` | 20 | 0 | — | audited; matches 8.2 |
| 8 | `backend/db/test/repo/scheduling/payroll-report.repository.test.ts` | 25 | 0 | 96 | audited; matches TB.1 re-run |
| 9 | `backend/lib/sanitize/richTextSanitizer.test.ts` | 77 | 0 | — | audited; re-proven (last prior: task 1.5) |
| | **TOTAL** | **277** | **0** | | |

## Quality gates

- `bun run scripts/health/sub-loop.ts backend/services/teacher/payroll-calculation.service.test.ts --lifecycle codescene`
  → **exit 0** (tsgo / oxlint / biome:check / lint:type-aware /
  check:duplicates / codescene all green — single run, first try).
- Hygiene greps on the modified file: no `.only`/`.skip`, no `console.*`,
  no `any`, no `oxlint-disable`, no plan-artifact references → 0 matches.
- Git footprint of this task: exactly
  `M backend/services/teacher/payroll-calculation.service.test.ts`
  (+236 lines) + this outcome file + the TB.4 checkbox tick. **No product
  code modified. No sibling-plan files touched. No git operations.**

## Findings

1. **F1 (coverage gap — FILLED)**: `getReport` was untested at the service
   layer (GraphQL tests mock it; repo tests cover only the SQL half). Filled
   with the 9-test describe block above. Not a product bug — the method
   behaved per its 1.6–1.8 contract on every branch once tested.
2. **F2 (documentation)**: plan path `backend/services/scheduling/scheduling.service.ts`
   does not exist (state machine = `session/class-session.service.ts`);
   services dir is `teacher/` singular. Both are pre-documented adaptations —
   TB.5 pentest wave should use the real paths.
3. **F3 (observation)**: the midpoint-fix hardening tests (repo
   expected-status precondition, autotrigger log taxonomy, on-demand
   telemetry variants) are present and green — the D12/D14 follow-up
   residue from earlier waves is fully represented in the current suites.
4. **No product bugs found.** Nothing new deferred (existing ledger D8/D12/D13/D14
   unchanged and already covered by their interim guards).

## Carry-forwards

- TB.5 (pentest wave) should exercise the SEARCH/text filter + CSV query
  string at the GraphQL/HTTP layers (repo-layer wildcard escaping is proven;
  the transport layers are not — TB.3/TB.5 scope), plus `payrollNote` XSS
  through the full mutation path (service-layer battery already green).
- The `getReport` mock added to `payroll-calculation.service.test.ts` honors
  pagination via slice — reusable if later tasks extend the aggregate cap or
  add cursor pagination.
