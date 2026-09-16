# Task TB.2 — Payroll-Visibility Journey Test — Outcome

- **Date**: 2026-09-05
- **Status**: ✅ Complete (6 pass / 0 fail)

## File delivered

| File | Change |
|---|---|
| `test/workflows/accounting/session-audit-payroll-visibility.test.ts` | 🆕 6-step journey, 88 assertions. (The task brief mentioned overwriting a placeholder; no placeholder file existed — the file was created fresh.) |
| `test/workflows/accounting/DIAGRAMS.md` | ✏️ Appended-only `## session-audit-payroll-visibility.test.ts` section with a `sequenceDiagram` (existing sibling sections untouched). |

## Journey shape (real services, real DB, no rollback wrapper)

Cast reuses `provisionPayrollJourneyCast` / `cleanupPayrollJourneyCast`
(`test/workflows/helpers/payroll-cast.ts`): academy_admin operator (holds
`ACCOUNTING_REPORTS_VIEW` + `ACCOUNTING_PAYROLL_MANAGE`), teacher at SAR 120/h,
parent, student, three 60-minute instances (on-time, student-absent,
unattended). Prefix `jrn_sapv_<uuid8>`.

1. **Baseline read** — `SessionAuditService.getReport(operator, { teacherId })`:
   3 rows, all `NOT_CALCULATED`, payroll columns + `teacherDuePaymentDate` null,
   aggregates `{ paid: 0, unpaid: 3 }`, `totalPaidAmount "0.00"`.
2. **Auto-calculation** — `ClassSessionService.activate`/`updateStatusStart`/`stop`
   on the on-time instance and `activateOverride`/`updateStatusAbsent` on the
   absent one → both `CALCULATED` at `120.00`; report read shows aggregate
   `"240.00"`.
3. **Operator override** — `PayrollCalculationService.applyOverride` → `PARTIALLY`
   50% with note on the absent instance; report shows amount `60.00`,
   `isPartialPercentage` 50, `payrollNote`, and the aggregate moves
   `240.00 → 180.00` (the post-override aggregate assertion).
   `spyOn(NotificationDispatchHelpers, "dispatchWithPreferences")` cleared before
   the override + 300 ms settle proves **the override emits no notification**
   (grep over `payroll-calculation.service.ts` confirms no dispatch code path).
4. **Approval + settlement** — `LessonReportService.submitReport`/`approveReport`
   → due accrues and the on-time instance flips `WAITING_PAID`;
   `teacher_payments` CASH fixture insert + `TeacherDueService.markAsPaid` →
   `PAID`. Report: `teacherDuePaymentDate` non-null **only** for the PAID row
   (null on the PARTIALLY and NOT_CALCULATED rows); aggregates
   `{ paid: 1, unpaid: 2 }`, total `180.00`.
5. **CSV** — `serializeSessionAuditCsv(page.rows)` (from `@/backend/services`
   barrel) — per-row CSV lines carry post-override values (`PAID`+payment date,
   `PARTIALLY`+note+share, `NOT_CALCULATED` empty payroll cells).
6. **Denials** — teacher/student/parent actors calling `getReport` each throw
   `ForbiddenError` with `code === "FORBIDDEN"` and the translated
   `insufficientPermissions` message (via `expectJourneyError`).

## Verification

- 🧪 `bun run test/scripts/run-test.ts test/workflows/accounting/session-audit-payroll-visibility.test.ts`
  → **6 pass / 0 fail** (88 expect calls, ~2.5 s), first run, no flakiness observed.
- 🧜 `bun run validate:mermaid test/workflows/accounting/DIAGRAMS.md` → all 7 blocks OK.
- 🔁 `bun run scripts/health/sub-loop.ts test/workflows/accounting/session-audit-payroll-visibility.test.ts --lifecycle codescene`
  → **exit 0** (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene).
- 🔁 sub-loop on `DIAGRAMS.md` → **N/A**: oxlint exits "No files found to lint"
  for Markdown, so the loop cannot exit 0 for non-code files by construction
  (tsgo stage passes). Markdown validation is the mermaid validator above —
  same situation applies to every existing DIAGRAMS.md in the repo.

## Environment note (known issue from the brief)

`information_schema` check: `class_instances.carryover_balance_id` **exists**
in the test database (the "unapplied column" drift flagged in the brief is not
currently present). No insert failures occurred; zero retries needed. The
schema was not touched.

## Conventions followed / notes

- No `runInRollback`; committed fixtures in `beforeAll`, FK-safe hard deletes in
  `afterAll`: `teacher_payments` first (ON DELETE RESTRICT on teachers), then
  `audit_logs` sweep under a temporarily disabled `prevent_audit_log_mod_trigger`,
  then `cleanupPayrollJourneyCast` — copied from the sibling payroll journey.
- `expectJourneyError` try/catch helper used for all denial assertions;
  translated messages from `getServerTranslations("en").errorsTranslations`.
- No `console.*`, no `.rejects`, no plan-artifact references in comments.
- Aggregates are page-level (per the 1.4 service contract); assertions pin the
  exact decimal strings (`"240.00" → "180.00"`).
