# Student & Parent Portal Enhancements — Design

## Overview

Five features that extend the existing student/parent portal. Design reuses existing foundations (quota/credit ledger, leave_requests, lesson_reports, monthly report services) instead of building parallel systems.

### Design Goals

- Reuse over rebuild (leave_requests, quotas, credit_transactions, payments)
- Tenancy & BOLA defense on every new query/mutation
- Mobile/Desktop isolation per `docs/frontend/ui-shared-scaffold-pattern.md`
- i18n via compile-time locale system

---

## F1 — Monthly Appraisals

### Data model (new table)

`backend/db/schema/students/monthly-appraisals.ts` (using `createTable` + `uuidColumn`/`smallint`/`textColumn`/`timestampColumn` helpers from `backend/db/schema/__shared__/dialectAwareBuilder`, per `backend/db/schema/AGENTS.md`):

```
monthly_appraisals
  id (identity PK)
  studentId  FK students
  teacherId  FK teachers (author; editable later by supervisor)
  month      date (first of month, e.g. 2026-08-01)
  behaviorGrade smallint NULL CHECK 1..5, behaviorComment text NULL
  attendanceGrade ..., attendanceComment ...
  punctualityGrade ..., punctualityComment ...
  overallGrade ..., overallComment ...
  learningTargets text NOT NULL
  parentFeedback text NULL (R1.4 append-once; latest wins is acceptable — or feedback jsonb array; DECISION below)
  createdAt / updatedAt timestamps
  UNIQUE (studentId, teacherId, month)
```

**Decision: feedback storage.** Single `parentFeedback` text (append-with-timestamp string, latest submission overwrites after confirming with teacher view) vs `appraisal_feedback` child table. **Chosen: child table `appraisal_feedback(id, appraisalId FK, authorUserId FK, body, createdAt)`** — enables true append loop + multi-reply and matches complaint_responses pattern.

### Backend

- Types: `backend/types/report/monthly-appraisal.types.ts` (subdir **confirmed**: `backend/types/report/` exists with `report.types.ts` + `index.ts`) with `MonthlyAppraisalSelectType`/`InsertType` from `$inferSelect`/`$inferInsert`, single canonical `MonthlyAppraisalReturnType`, `MonthlyAppraisalSubmitInput`, `MonthlyAppraisalFeedbackInput`.
- Repo: `export namespace MonthlyAppraisalRepository` in `backend/db/repo/students/monthly-appraisal.repository.ts` (repo subdirs mirror the **schema** subdirs — `report/` has no repo subdir, `students/` exists; table lives in `schema/students/`). Non-transactional reads MUST use `queryDb(tx)` (Neon HTTP rule); module-level prepared statements only for TCP-mode simple reads, never with `inArray`. Upsert by unique key; feedback insert into child table. Wire into `backend/db/repo/students/index.ts` + top-level repo barrel.
- Service: `backend/services/monthly-appraisal/monthly-appraisal.service.ts` extending service base; permission checks: teacher must teach the student; parent/student tenancy enforced. Resolvers MUST pass `UserPermissionContext` from ctx (serverless cold-start rule) — services must not re-query `PermissionsService.getUserContext`. Errors via `ctx.t("<namespace>")` in resolvers / `getServerTranslations` in services (DomainError subclasses → extensions.code). Grade validation 1–5.
- Pothos: object type `MonthlyAppraisal`, `MonthlyAppraisalFeedback`; queries `myMonthlyAppraisal`, `studentMonthlyAppraisals`, `teacherMonthlyAppraisalStudents`; mutations `submitMonthlyAppraisal` (teacher), `addAppraisalFeedback` (parent/student).
- Relationship to computed monthly report: appraisals appear as a section/link on the existing monthly-reports page; computation service unchanged.

### Frontend

All views follow the Mobile/Desktop isolation architecture: tier-neutral Container + ViewModel + switcher in `frontend/common/views/dashboard/<domain>/`, tier views in `frontend/desktop/views/dashboard/<domain>/` and `frontend/mobile/views/dashboard/<domain>/`. **`frontend/views/` is DEPRECATED — no new files there.**

- Teacher: domain `monthly-appraisals/teacher` — list (students, month filter) + form dialog (5 rubric pairs, sparse optional, learning targets required, RHF 3-generic pattern). Keep tier files <150 lines (CodeScene) by extracting sub-components.
- Student/Parent: domain `monthly-appraisals/` — AppDataGrid list (desktop) / MobileCardList (mobile) with required `paginationOptions`, detail view rendering only populated rubric fields (sparse display) + Add Feedback modal. Status uses shared `StatusBadge`; no inline chips. No hardcoded colors — theme callback sx only.
- Documents: `frontend/common/graphql/sharedDocuments/reports/monthly-appraisal.documents.ts` — TypedDocumentNode naming `{entity}QueryDocument` / `{entity}MutationDocument`, always include `id`; hooks from `@apollo/client/react`; no `useLazyQuery`.
- Pages: permission-gated via `requirePermissionForPage` in `page.tsx` (server guard); `<RequirePermission>` only for fine-grained UI affordances.

---

## F2 — Self-Service Reschedule

### Data model changes

- `LeaveRequesterType` canonical enum is **backend-only** at `backend/enum/scheduling/scheduling.enum.ts` (current members: TEACHER, PARENT, ADMIN). Add `STUDENT` there. The Drizzle enum value in `backend/db/schema/enums.ts` is generated via `createPgEnumFromEnum("leave_requester_type", LeaveRequesterType)`, so `bun run db push` propagates the new value automatically. Register once in `backend/graphql/pothos/shared/enum.pothos.ts` if exposed via Pothos (frontend consumes the codegen enum, never a shared/constants copy); run `bun run generate:gqlSchema && bun codegen`.
- `LeaveRequestStatus` currently has **PENDING / APPROVED / RESCHEDULED / CANCELLED — no REJECTED**. Spec R2.7/R4.2 require a rejected state. **DECISION: add `REJECTED` to `LeaveRequestStatus`** (cleaner than overloading CANCELLED; CANCELLED means requester withdran/cancelled request).
- `leave_requests` table (`backend/db/schema/classes/scheduling.ts` line ~321) currently has: classInstanceId, requestedByUserId, requesterType, reason, status, createdAt, processedAt, processedByUserId. **Missing for delay requests:** no request-type discriminator and no proposed datetime. Add: `requestType` (new `LeaveRequestType` enum DELAY/CANCEL, registered via `createPgEnumFromEnum` in `backend/db/schema/enums.ts`) and `proposedStartAt timestamp NULL`. Add partial unique index `uniqueIndex(...).on(table.classInstanceId).where(eq/status='PENDING')` to prevent duplicate PENDING requests (idempotency). Use the dialect-aware helper columns (`uuidColumn`, `timestampColumn`, etc. from `backend/db/schema/__shared__/dialectAwareBuilder`), not raw pgTable columns.
- **Quota interplay resolved (R3)**: the trigger blocks a row write only when `used_count + 1` exceeds `student_max_leaves` (from `system_settings`, default 2 in `backend/db/seeds/shared/system-settings.ts`). The existing teacher-leave flow (`updateStatusLeave` in `class-session.service.ts`) asserts permission `SESSION_UPDATE_STATUS_LEAVE` + `SystemRulesService.assertLeaveQuotaAvailable(teacherId)` and writes usage via `SchedulingRepository.processClassLeave` + `leave-quota-usage.repository.ts`. **DECISION: self-service Cancel requests do NOT consume student leave quota** — the quota exists for teacher-initiated leaves and admin-overridden absences; a parent/student cancelling their own upcoming session is a refund-policy event (credit/quota refund inside the existing cancel path), not a leave. The approve-cancel path MUST therefore NOT call `assertLeaveQuotaAvailable(studentId)` nor insert into `leave_quota_usage`; approve-delay reschedules without quota involvement. The trigger risk is thus eliminated by policy, not by schema change.
- **Cancel reuse note**: the existing cancel/leave flow (`refundCreditIfDeducted` / `releaseQuotaIfDeducted` in `class-session.service.ts` around `updateStatusLeave`) already handles the "existing quota-refund policy" of spec R2.6 — approve-cancel calls this flow (skipping its `SESSION_UPDATE_STATUS_LEAVE` assert — supervisor approval is the authorization) with `requestType = CANCEL`.
- New policy time-lock config: env-config key `SELF_SERVICE_RESCHEDULE_LOCK_HOURS` (default 12). **DECISION: hours-based window**, default 12h, replaces "same calendar day" spec default.

### Backend

- New `backend/services/leave-request/leave-request.service.ts`: `createStudentDelayRequest`, `createStudentCancelRequest`, existing `updateStatusLeave` reused for approve/reject; time-lock validation; duplicate-pending guard (atomic: check within transaction + unique index).
- Mutations: `requestSessionDelay`, `requestSessionCancel`, plus existing approval mutation surfacing to supervisor/admin UI (exists in reschedule/tracking, staff-gated by `AppPermission.SESSION_RESCHEDULE`).
- On approve-delay → call `reschedule()` in `backend/services/session/class-session.service.ts` (directory is `session/`, not `classes/`). It already: asserts `SESSION_RESCHEDULE`, validates via `validateRescheduleState` (`backend/services/scheduling/state-change-validation.service.ts`), and writes idempotency key `manual-reschedule-${classInstanceId}-${isoStart}` — the service call must reuse this path so meeting URL regen happens automatically. On approve-cancel → existing cancel flow with quota refund policy (subject to the `leave_quota_usage` trigger risk above).

### Frontend

- Existing staff UI to reuse/extend: `frontend/common/views/dashboard/reschedule/tracking/` (Container + ViewModel + `tracking.types.ts/helpers`, `rescheduleTrackingStore.ts`, desktop `rescheduleTrackingView.desktop.tsx` + `rescheduleTrackingDataGrid.desktop.tsx`, mobile `rescheduleTrackingView.mobile.tsx` + `rescheduleTrackingCardList.mobile.tsx`), documents in `frontend/common/graphql/sharedDocuments/scheduling/schedule.documents.ts`. This UI is **staff-gated** (`SESSION_RESCHEDULE`); the student/parent **requester view is new surface area** (own requests list), not a permission re-gate of the staff page.
- Student calendar session cards (month & new week/day views): Delay/Cancel buttons, disabled states with tooltip when locked.
- Request modal: for Delay — datetime picker; for Cancel — confirm dialog with reason text.
- Requests status list: reused on dashboard widget (F4) and a `requests` strip in calendar page; statuses rendered from `LeaveRequestStatus` incl. new `REJECTED`.
- Documents: `frontend/common/graphql/sharedDocuments/scheduling/leave-request.documents.ts`.

---

## F3 — Week & Day Calendar Views

- Extend the student sessions/history page (existing tier-neutral Container + ViewModel confirmed at `frontend/common/views/dashboard/students/history/` — `StudentHistoryContainer.tsx`, `useStudentHistoryViewModel.ts`, with desktop/mobile tier views): add view-switcher state to the ViewModel; Week view: hourly grid (07:00–22:00 configurable) using theme palette status colors; Day view: single-day column.
- Mobile: Day view as primary compact list; Week view reuses/extends `mobileWeeklyScroller.mobile.tsx`.
- Backend: extend the existing student sessions query with explicit range params. The student sessions list helpers filter with only `gte(classInstances.scheduledStartAt, now)` (`...helpers.ts:209`) — there is no arbitrary-window support (the `scheduling-queries.repository.findUpcoming.ts:52` helper is a `withinHours` cron-reminder path with its own `lte` window — not the student sessions query). Add `from`/`to` parameters on the student sessions query (repo + service + Pothos args), enforced to a max window of 42 days to keep week/day paging cheap. No new entities.

---

## F4 — Dashboard Widgets

- Quick Action strip: links to complaints form, payments ledger (F5), calendar; permission-gated (each link checks its AppPermission).
- Open Requests widget: query `leave_requests` where requester = current user (or parent's students), status in (PENDING) + recent decisions; status badges via existing StatusBadge categories.
- Wire into `useStudentDashboardViewModel` + a parent equivalent; Zustand store extension.

---

## F5 — Payments Ledger View

- Backend: query `payments` joined through `invoices` (payments.invoiceId → invoices; invoices carries parentId, studentId, invoiceType, status — verified) filtered to caller's students. Credits purchased come from `credit_transactions` (PURCHASE reason). **Package name derivation is still open**: there is no invoice-line-items table (only `invoiceCoverageMonths`), and `payments` has no package column - Task 0.2 must confirm whether package/quota-kind name is derivable (via invoiceType + credit_transactions/quota linkage) or whether the deferred fallback ("—" placeholder; see deferred-items.md) applies. **`InvoiceType` enum at `backend/enum/billing/billing.enum.ts`** (member list to confirm in 0.2) is the only package-kind signal on invoices; if ambiguous per payment, default to the fallback. Gateway display from `paymentMethodType` + `paymentMethodSnapshot` jsonb. Balance per student from the quotas cached columns (`remaining`, per `docs/billing/quota-system.md`) rather than re-aggregating credit_transactions.
- New Pothos query `myPaymentsLedger(page, filters)` returning `PaymentLedgerEntry` object type (name per spec) — tenant-scoped to caller.
- Frontend: `frontend/common/views/dashboard/parent/payments/` (Container + ViewModel) with tier views in `frontend/desktop|mobile/views/dashboard/parent/payments/`; AppDataGrid (paginated, student + date-range filters); balance via `DesktopMetricCardGrid` / `MobileMetricCardGrid` (never a bare MetricCard in a view). Sidebar entry under parent group.

---

## UX / Navigation Specification

| Route | Purpose | Roles | Sidebar group |
|---|---|---|---|
| `/teacher/monthly-appraisals` | Teacher appraisal list + form | TEACHER, SUPERVISOR | Teacher > Appraisals |
| `/student/monthly-appraisals` | Student appraisal list + detail | STUDENT | Student > Reports |
| `/parent/monthly-appraisals` | Parent view of children appraisals | PARENT | Parent > Reports |
| `/parent/payments` | Payments ledger | PARENT | Parent > Payments |
| `/student/sessions` (existing) | Adds Week/Day views + Delay/Cancel actions | STUDENT | Student |
| `/parent/requests` (new or reuse reschedule/tracking) | Requests list | PARENT, STUDENT | Parent/Student |

New permissions (to be added to permission seed + context): `APPRAISAL_SUBMIT`, `APPRAISAL_VIEW`, `APPRAISAL_FEEDBACK`, `SESSION_SELF_DELAY`, `SESSION_SELF_CANCEL`, `PAYMENTS_LEDGER_VIEW`.

### Per-audience rendering
- Appraisal detail: student/parent see sparse rendered rubric + feedback loop; teacher sees editable form + feedback list.
- Payments: parent only (multi-student aggregate via filter).

### Mobile vs Desktop
- Week view: desktop hourly grid; mobile compact daily list w/ weekly scroller.
- Appraisal form: desktop dialog; mobile full-screen drawer.

## Testing Strategy

- Repo tests (runInRollback): appraisal upsert/unique, feedback append, leave-request duplicate guard, tenant scoping.
- Service tests: grade validation, time-lock boundary (exactly at window edge), approve-delay → reschedule integration (mocked meeting provider).
- GraphQL integration: tenancy probes (student A cannot read student B appraisal/payments; BFLA: student cannot call approve mutation).
- UI component tests: sparse-rubric rendering, widget empty states, locked/unlocked action buttons.
- E2E (per existing patterns): teacher fills appraisal → parent sees & replies; student requests delay → admin approves → session rescheduled.

### Permissions & seeds

New permissions (`APPRAISAL_SUBMIT`, `APPRAISAL_VIEW`, `APPRAISAL_FEEDBACK`, `SESSION_SELF_DELAY`, `SESSION_SELF_CANCEL`, `PAYMENTS_LEDGER_VIEW`) go in `backend/enum/permissions/permission.enum.ts`. Seed mechanics (verified R3): permission-group membership lives in `backend/db/schema/permissions/permissions.ts`; per-user overrides are seeded in `backend/db/seeds/auth/seed-user-permission-overrides.ts`. Task 0.2 must identify which groups (parent/student/teacher/supervisor/admin) receive each new permission via the AppPermission → group mapping seed, so permissions land in groups rather than ad-hoc per-user overrides.

## Security

- Strict DTO mapping (no input spread), LIKE-escape on any search, idempotency keys on mutations creating rows.
- New env-config keys registered in `env-config-keys.ts`.

## Outcome & Knowledge Transfer Protocol

- Read all `.ai/plans/student-parent-portal/outcome/*` before any task.
- Write `<task-id>-outcome.md` after each task; check off tasks in `tasks.md`.
