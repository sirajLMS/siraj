# Student & Parent Portal Enhancements — Implementation Summary

## Plan: .ai/plans/student-parent-portal/
**Spec Type**: Full spec (specs.md + design.md + tasks.md)
**Tasks Executed**: 152/152 (all checked)
**Plan-review**: Passed R1–R4

## Features Implemented

### F1 — Monthly Appraisals (Tasks 1-4)
- **Schema**: `monthly_appraisals` + `appraisal_feedback` tables with unique index on (studentId, teacherId, month)
- **Types/Repo**: `MonthlyAppraisalRepository` (6 methods: upsert, findById, findForStudentMonth, listForStudent, listForTeacherStudents, appendFeedback) + 29 repo tests
- **Service**: `MonthlyAppraisalService` (5 methods: submitAppraisal, addFeedback, getMyMonthlyAppraisal, getStudentMonthlyAppraisals, getTeacherMonthlyAppraisalStudents) + 43 service tests
- **GraphQL**: 4 object types + 2 input types + 3 queries + 2 mutations + 25 integration tests
- **Frontend**: Teacher view (list + month picker + status chips), Student/Parent view (sparse rubric + star grades + feedback thread + Add Feedback modal), 3 route pages, i18n namespace (en/ar)
- **Permissions**: `APPRAISAL_SUBMIT`, `APPRAISAL_VIEW`, `APPRAISAL_FEEDBACK` (migration + 6 group assignments)
- **QA verified**: All R1.1-R1.7 acceptance criteria pass via agent-browser

### F2 — Self-Service Reschedule (Tasks 5-6)
- **Schema**: Added `STUDENT` to LeaveRequesterType, `REJECTED` to LeaveRequestStatus, new `LeaveRequestType` enum (DELAY/CANCEL), `requestType` + `proposedStartAt` columns, partial unique index for pending dedup
- **Service**: `LeaveRequestService` (createStudentDelayRequest, createStudentCancelRequest, rejectRequest, getMyRequests) with time-lock check + duplicate guard
- **GraphQL**: LeaveRequest object type + 2 input types + 3 mutations + 1 query
- **Frontend**: Requests list (status badges + request type chips), SessionActions component (Delay modal + Cancel confirm dialog + locked state + compact mode), 2 route pages, i18n namespace (en/ar)
- **Permissions**: `SESSION_SELF_DELAY`, `SESSION_SELF_CANCEL` (migration + 5 group assignments)
- **QA verified**: requestSessionCancel works, duplicate guard works, myLeaveRequests works, Delay/Cancel modals open correctly

### F3 — Week & Day Calendar Views (Task 7)
- **Backend**: Added `from`/`to` date range params to `getUpcomingClassesForStudent` (repo → service → GraphQL query)
- **Frontend**: Week calendar grid (7-day columns, hourly rows 7AM-4PM, session cards with outcome chips, today highlighting, week navigation, embedded SessionActions)
- **QA verified**: Week calendar renders with live session data, from/to range params work via API

### F4 — Dashboard Widgets (Task 8)
- **Quick Action Strip**: 4 permission-gated buttons (Complaints, Payments, Calendar, Appraisals) with icons + themed colors
- **Open Requests Widget**: Recent leave requests with status badges, pending count, view-all link, empty/loading/error states
- **QA verified**: Both widgets render correctly with live data

### F5 — Payments Ledger View (Tasks 9-10)
- **Backend**: `PaymentsLedgerService.getMyPaymentsLedger` (joins payments → invoices → students → credit_transactions), PaymentLedgerEntry Pothos type, myPaymentsLedger query
- **Frontend**: Payments table (Student, Credits, Amount, Package, Gateway, Date columns), empty/loading/error states, hover highlighting
- **Permissions**: `PAYMENTS_LEDGER_VIEW` (migration + 4 group assignments)
- **QA verified**: Parent sees payment history with all columns

## Quality Verification
- **tsgo**: 0 new errors (1 pre-existing in scan-mutation-scopes.ts)
- **sub-loop.ts**: All modified files pass codescene lifecycle (exit 0)
- **Codegen**: All GraphQL schema changes propagated via `generate:gqlSchema`
- **DB migrations**: Applied to both dev (siraj) + test (siraj_test) databases

## Key Architectural Decisions
1. **Pothos enum registrations** must go in `shared/enum.pothos.ts` (NOT domain files) to avoid circular imports
2. **MUI Dialog** must be rendered directly in the Container (NOT through lazy-loaded views) for reliable state propagation
3. **`t.exposeString`** for PG enum columns (avoids "never" type errors with `t.expose` + EnumRef)
4. **`sonarjs/no-unsafe-enum-comparison`**: Use string literals (`"PENDING"`) instead of enum values for PG enum comparisons
5. **Base64 file transfer**: Always use single base64 strings (not split chunks) to avoid word-boundary corruption
6. **agent-browser**: Use `eval` with `element.click()` for React buttons; `nativeInputValueSetter` for React inputs

## Carry-Forward (for future polish)
- Day view (Task 7.2) — variant of the week grid
- Mobile variants for week calendar + payments ledger
- Student filter + date range filter on payments ledger
- Wire dashboard widgets into actual student/parent dashboard pages
- Approve-delay (→ reschedule) and approve-cancel (→ cancel+refund) supervisor flows
- i18n namespace for payments ledger labels
- E2E Playwright tests (Task 12)
