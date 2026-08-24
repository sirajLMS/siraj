# Student & Parent Portal Enhancements — Requirements

Derived from `ai/todo/teacher.md` (Tiba Alarabya LMS analysis), gap-checked against the current codebase.

## In Scope

| # | Feature | Audiences |
|---|---------|-----------|
| R1 | Monthly Appraisals (persisted rubric + feedback loop) | Teacher writes; Student/Parent view + reply |
| R2 | Self-service reschedule (student/parent delay & cancel requests with approval + time-lock) | Student, Parent request; Supervisor/Admin approve |
| R3 | Student calendar Week & Day views | Student, Parent |
| R4 | Dashboard widgets (Quick Action strip + Open Requests summary) | Student, Parent |
| R5 | Payments ledger view (parent-facing, package name, balance) | Parent |

## Explicitly Out of Scope

- Assignments/homework module (media embeds, submissions) — deferred, requires file storage design
- Teacher PM two-tier messaging — deferred, requires new chat/messaging infrastructure

---

## R1 — Monthly Appraisals

**User Story:** As a teacher, I want to fill a standardized monthly evaluation per student so parents see consistent quantitative + qualitative feedback.

**User Story:** As a parent/student, I want to view monthly appraisal reports and append feedback, so I can respond to the teacher.

**Acceptance Criteria (EARS):**

1. WHEN a teacher opens a student's monthly appraisal for month M THEN the system SHALL display a rubric with nullable 1–5 grade + comment fields for: Behavior, Attendance, Punctuality, Overall Appraisal, plus a required Learning Targets text field.
2. WHEN the teacher saves an appraisal THEN the system SHALL persist it keyed by (studentId, teacherId, month) with an idempotency-safe upsert.
3. IF a rubric field is null THEN the system SHALL omit that field from the student/parent-facing report card (sparse-field display).
4. WHEN a parent or student submits feedback text on a published appraisal THEN the system SHALL append the feedback permanently to the report and display it to the teacher.
5. WHEN a parent/student requests the appraisal list THEN the system SHALL return only appraisals for their own students (tenancy enforced).
6. IF an appraisal does not exist for month M for a student THEN the student/parent UI SHALL show an empty state, not an error.
7. Grades SHALL be validated as integers 1–5 inclusive (server + Zod schema on client).

## R2 — Self-Service Reschedule (Delay & Cancel)

**User Story:** As a student/parent, I want to request a delay or cancel for an upcoming session directly from the calendar, so I don't need staff intervention.

**Acceptance Criteria (EARS):**

1. WHEN a student/parent views an upcoming session card THEN the system SHALL show "Delay" and "Cancel" actions gated by their tenancy (own students only).
2. IF the session start time is within a configurable time-lock window (default: same calendar day) OR the session is past/in-progress THEN the system SHALL disable Delay/Cancel actions.
3. WHEN a student/parent submits a Delay request THEN the system SHALL create a `leave_requests` row (requester = STUDENT or PARENT) with status PENDING and prevent duplicate pending requests for the same session.
4. WHEN a student/parent submits a Cancel request THEN the system SHALL create a PENDING cancellation request, NOT directly cancel the session.
5. WHEN a supervisor/admin approves a Delay request THEN the system SHALL reschedule the session using the existing `ClassSessionService.reschedule()` flow (meeting URL regenerated).
6. WHEN a supervisor/admin approves a Cancel request THEN the system SHALL cancel the session and apply the existing quota-refund policy.
7. WHEN a request is approved or rejected THEN the requester SHALL see the updated status in their requests list; THE student requesting SHALL be a new `STUDENT` member added to `LeaveRequesterType`.
8. IF a duplicate pending request exists for the same class instance THEN the mutation SHALL return a domain error (no duplicate rows).

## R3 — Week & Day Calendar Views (Student)

**User Story:** As a student, I want week and day views of my sessions so I can plan my schedule.

**Acceptance Criteria (EARS):**

1. WHEN the student opens the sessions calendar THEN the system SHALL offer Month / Week / Day view switchers; Month view SHALL remain unchanged.
2. WHEN Week view is active THEN the system SHALL render an hourly time-slot grid (start-of-day to end-of-day window) with session cards showing time, teacher, and color-coded outcome status.
3. WHEN Day view is active THEN the system SHALL render a single-day hourly grid with session cards; Delay/Cancel actions SHALL appear per R2 rules.
4. WHEN the student navigates prev/next THEN the system SHALL page by week (Week view) or day (Day view), consistent with existing month navigation.
5. Week and Day views SHALL have desktop and mobile variants per the Mobile/Desktop isolation architecture.

## R4 — Dashboard Widgets

**User Story:** As a student/parent, I want quick action links and a summary of my open requests on the dashboard.

**Acceptance Criteria (EARS):**

1. WHEN the student/parent dashboard loads THEN the system SHALL render a Quick Action strip with permission-gated links: New Complaint, Payments History, and (if in scope) calendar.
2. WHEN the dashboard loads THEN the system SHALL render an "Open Requests" widget listing pending/approved/rejected leave requests with status tags.
3. IF there are no open requests THEN the widget SHALL render an empty state.
4. Widgets SHALL reuse existing dashboard store/ViewModel patterns and respect role differences (parent sees aggregate across children; student sees own).

## R5 — Payments Ledger View (Parent)

**User Story:** As a parent, I want a payments history table showing purchased credit hours/classes, amount, currency, package, gateway, and date.

**Acceptance Criteria (EARS):**

1. WHEN a parent opens the payments ledger THEN the system SHALL list their payments with columns: student, credits purchased, amount, currency, package name, payment gateway, payment date.
2. Tenancy: parents SHALL only see payments for their own students.
3. WHEN a payment is linked to a quota/package purchase THEN the system SHALL display the package/quota kind name; ELSE show a placeholder ("—").
4. The page SHALL display the current computed balance (remaining credits/classes) per student.
5. The list SHALL be paginated and filterable by student and date range.

---

## Cross-Cutting Requirements

- **i18n**: All UI strings via compile-time locale system (`shared/locale/`), new namespaces per domain; Arabic RTL supported.
- **Permissions**: New `AppPermission` entries per feature; tenant scoping on every query/mutation (BOLA defense).
- **Types**: All types in `backend/types/<domain>.types.ts`; no local Pothos types; canonical GraphQL object type per entity with `id`.
- **DB rules**: Drizzle schema via `bun run db push`; repo tests in `runInRollback` with `tx` propagation; no seed-data queries in tests.
- **Quality**: every file passes `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`; semantic review checklist per subtask.

## Outcome Knowledge Base (mandatory)

- Before executing ANY task, read ALL files in `.ai/plans/student-parent-portal/outcome/`.
- After each task, write `.ai/plans/student-parent-portal/outcome/<task-id>-outcome.md`.
- Update task checkboxes `[ ]` → `[x]` in `tasks.md`.
