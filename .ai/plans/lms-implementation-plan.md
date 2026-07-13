# Siraj LMS Implementation Plan — Phase 1 (Backend)

## Architecture Decisions Confirmed

1. **Student login**: Add `userId` FK to `students` table (**required**, not optional — every student gets a login account). `students.userId` = FK → `users.id` (unique, not null)
2. **Credit system**: New `credit_transactions` ledger table (auditable, idempotent)
3. **Lesson reports**: New `lesson_reports` table (linked to `class_instances`, with review workflow)
4. **Teacher dues**: New `teacher_dues` ledger table (linked to `class_instances`, created on approval)
5. **Supervisor role**: Reuse `staff_profiles` + new `supervisor_default` permission group
6. **Credit flow**: Reserve at booking → refund if cancelled/rejected → credit to teacher if approved
7. **Phase split**: Phase 1 = Backend, Phase 2 = Frontend

---

## PHASE 1 BREAKDOWN — Backend (10 Work Streams)

### Work Stream 1: Roles & Auth Foundation

**Goal**: Add `SUPERVISOR` and `STUDENT` to `UserRole`, permission groups, role resolution, onboarding flows, and demo users.

#### Files to Create/Modify:

| # | File | Change |
|---|------|--------|
| 1 | `backend/enum/auth/auth.enum.ts` | Add `SUPERVISOR = "SUPERVISOR"` and `STUDENT = "STUDENT"` to `UserRole` enum |
| 2 | `backend/enum/permissions/permission-group.enum.ts` | Add `SUPERVISOR_DEFAULT = "supervisor_default"` and `STUDENT_DEFAULT = "student_default"` |
| 3 | `shared/constants/permission-group.enum.ts` | Mirror both new slugs |
| 4 | `backend/services/auth/permissions.service.ts:82-93` | Add SUPERVISOR (before STAFF) and STUDENT branches to `resolveRoleFromGroupSlugs` |
| 5 | `backend/services/staff/manager-onboarding.service.ts` | Extend `accountType` union: `"admin" \| "manager" \| "supervisor"`, add mapping `"supervisor" → SUPERVISOR_DEFAULT` |
| 6 | `backend/graphql/pothos/teachers/manager-onboarding.pothos.ts` | Add `supervisor` to `ManagerAccountTypePothosEnum` |
| 7 | `backend/services/system/user-bootstrap.service.ts:8` | Add `"supervisor_default"` to `STAFF_GROUP_SLUGS` set |
| 8 | `shared/demo-users.ts` | Add `_supervisors` array (1 demo supervisor), add `_students` array (1 demo student with `STUDENT_DEFAULT`), update `INTERNAL_DEMO_USERS` |
| 9 | New migration SQL | Insert `supervisor_default` and `student_default` permission groups + link permissions |
| 10 | `backend/enum/permissions/permission.enum.ts` | Add new permissions (see below) |
| 11 | `backend/db/schema/enums.ts` | Register new pgEnum values for any new enums (LessonReportStatus, etc.) |
| 12 | `backend/graphql/pothos/shared/enum.pothos.ts` | Register new Pothos enums + new AppPermission values |
| 13 | `backend/services/student/student-onboarding.service.ts` | Extend to create `users` account when email/password provided, assign `STUDENT_DEFAULT` group, link `userId` to `students` record |
| 14 | `backend/db/schema/students/students.ts` | Add `userId: uuid("user_id").references(() => users.id, { onDelete: "set null" })` (nullable) + unique index |
| 15 | `backend/types/students/student.types.ts` | Extend `StudentOnboardingInput` with optional `email?`, `password?`, `timezone?`; extend `StudentOnboardingResult` with `userId?` |
| 16 | `backend/db/repo/students/student.repository.ts` | Extend `StudentCreateInput` and `create()` to accept and persist `userId` |
| 17 | `backend/services/student/student-profile.service.ts:37-54` | Add `if (student.userId === actorUserId) return true` to `resolveIsAssociatedViewer` |
| 18 | `backend/services/history/student-history.service.ts:9-26` | Same associated-viewer branch for student-login |

#### New Permission Keys (add to `permission.enum.ts`):

```
LESSON_REPORTS_SUBMIT           // Teacher submits lesson report
LESSON_REPORTS_REVIEW           // Supervisor/Admin views pending reports
LESSON_REPORTS_APPROVE          // Supervisor/Admin approves a report
LESSON_REPORTS_REJECT           // Supervisor/Admin rejects a report
SUPERVISOR_VIEW_DASHBOARD       // Supervisor dashboard access
STUDENT_VIEW_OWN_DASHBOARD      // Student views own dashboard/lessons
CREDITS_MANAGE                  // Admin records credit (hours) purchases
TEACHER_DUES_VIEW               // Teacher/Admin views teacher dues ledger
MONTHLY_REPORTS_VIEW            // View end-of-month reports
```

#### Supervisor Permission Group (curated):

**Has (view/review/approve):**
- Auth: `AUTH_LOGIN`, `AUTH_VIEW_OWN_PROFILE`, `AUTH_EDIT_OWN_PROFILE`
- Dashboard: `DASHBOARD_VIEW`, `DASHBOARD_VIEW_METRICS`, `DASHBOARD_SEARCH`
- Teachers: `TEACHERS_LIST`, `TEACHER_VIEW_PROFILE`, `STAFF_VIEW_DIRECTORY`, `TEACHER_VIEW_STUDENTS`
- Schedule: `SCHEDULE_VIEW_LIST`, `SCHEDULE_VIEW_ALL`, `SCHEDULE_VIEW_WEEKLY`, `SESSION_VIEW_DETAILS`
- Reports: `REPORT_GENERATE_CUSTOM`, `LESSON_REPORTS_REVIEW`, `LESSON_REPORTS_APPROVE`, `LESSON_REPORTS_REJECT`, `MONTHLY_REPORTS_VIEW`
- History: `HISTORY_VIEW_CALENDAR`, `HISTORY_VIEW_DETAILS`
- Student view (read-only): `STUDENT_IDENTITY_VIEW_OTHER`, `STUDENT_ACADEMIC_VIEW_OTHER`, `STUDENT_SCHEDULE_VIEW_OTHER`, `STUDENT_HISTORY_VIEW_OTHER`

**Must NOT have:**
- All `BILLING_*`, `INVOICES_*`, `PAYMENT_METHODS_*`, `STUDENT_QUOTA_EDIT_*`, `STUDENTS_OVERRIDE_QUOTA`, `CREDITS_MANAGE`
- `TEACHERS_CREATE`, `TEACHERS_EDIT`, `STAFF_CREATE`, `PERMISSION_GROUPS_MANAGE`
- All `*_EDIT_OTHER` profile/student variants
- `SCHEDULE_CREATE_CLASS`, `SCHEDULE_DELETE_CLASS`

#### Student Permission Group:

- `AUTH_LOGIN`, `AUTH_VIEW_OWN_PROFILE`, `AUTH_EDIT_OWN_PROFILE`
- `STUDENT_VIEW_OWN_DASHBOARD`
- `SCHEDULE_VIEW_ASSIGNED` (view own scheduled lessons)
- `SESSION_VIEW_DETAILS` (view own lesson details)
- `HISTORY_VIEW_CALENDAR`, `HISTORY_VIEW_DETAILS` (own lessons)

---

### Work Stream 2: Credit Transactions Ledger

**Goal**: Create `credit_transactions` table — auditable ledger for admin manual credit purchases + automated deduction/refund entries.

#### Files to Create/Modify:

| # | File | Change |
|---|------|--------|
| 1 | `backend/db/schema/billing/credit-transactions.ts` (new) | `creditTransactions` pgTable: `id`, `studentId` (FK → students), `changeAmount` (int, +N for purchase, -1 for deduction, +1 for refund), `reason` (enum: PURCHASE/DEDUCTION/REFUND/ADJUSTMENT), `sourcePaymentId` (nullable FK → payments), `classInstanceId` (nullable FK → classInstances), `notes` (text), `creditedByUserId` (FK → users), `idempotencyKey` (unique), `createdAt`, `updatedAt` |
| 2 | `backend/db/schema/enums.ts` | Register `creditReasonEnum` pgEnum: `PURCHASE`, `DEDUCTION`, `REFUND`, `ADJUSTMENT` |
| 3 | `backend/enum/billing/credit.enum.ts` (new) | `CreditReason` TS enum |
| 4 | `shared/constants/credit.enum.ts` (new) | Mirror `CreditReason` enum |
| 5 | `backend/db/schema/billing/index.ts` | Re-export `creditTransactions` |
| 6 | `backend/db/drizzleRelations.ts` | Add relations: `creditTransactions ↔ students`, `creditTransactions ↔ classInstances`, `creditTransactions ↔ users` |
| 7 | `backend/types/billing/credit.types.ts` (new) | `CreditTransactionSelectType`, `CreditTransactionInsertType`, `CreditTransactionReturnType`, `CreditTransactionSubmitInput`, `CreditBalanceReturnType` |
| 8 | `backend/types/billing/index.ts` | Re-export credit types |
| 9 | `backend/db/repo/billing/credit.repository.ts` (new) | `CreditRepository` namespace: `getBalance`, `getTransactions`, `createPurchase`, `deductForBooking`, `refundOnCancel`, `findByIdempotencyKeys` — all with advisory locking + idempotency |
| 10 | `backend/db/repo/index.ts` | Re-export `CreditRepository` |
| 11 | `backend/services/billing/credit.service.ts` (new) | `CreditService` namespace: `recordPurchase` (perm: `CREDITS_MANAGE`), `getStudentBalance`, `getStudentTransactions`, `deductForBooking` (internal), `refundOnCancel` (internal) |
| 12 | `backend/services/billing/index.ts` | Re-export `CreditService` |

#### Credit Flow Logic:

- **Admin records purchase**: `CreditService.recordPurchase` → permission check → `CreditRepository.createPurchase` (ledger row `changeAmount = +hours`, `reason = PURCHASE`) → `StudentRepository.addClasses(studentId, hours)` (bump both `classesTotal` + `classesRemaining`) → one transaction
- **Booking (reserve)**: `CreditService.deductForBooking` → check `classesRemaining > 0` → `CreditRepository.deductForBooking` (ledger row `changeAmount = -1`, `reason = DEDUCTION`) → `StudentRepository.deductClasses(studentId, 1)` → set `classInstance.quotaDeducted = true`
- **Cancel/Reject refund**: `CreditService.refundOnCancel` → `CreditRepository.refundOnCancel` (ledger row `changeAmount = +1`, `reason = REFUND`) → `StudentRepository.addClasses(studentId, 1)` → set `classInstance.quotaDeducted = false`

---

### Work Stream 3: Lesson Reports + Review Workflow

**Goal**: Create `lesson_reports` table with formal submission/review/approval/rejection workflow.

#### Files to Create/Modify:

| # | File | Change |
|---|------|--------|
| 1 | `backend/db/schema/classes/lesson-reports.ts` (new) | `lessonReports` pgTable: `id`, `classInstanceId` (FK → classInstances, unique), `studentId` (FK → students), `teacherId` (FK → teachers), `lessonDate` (timestamptz), `durationMinutes` (int), `attendanceEvaluation` (enum: PRESENT/ABSENT/LATE), `teacherNotes` (text), `completionPercentage` (int 0-100), `status` (enum: DRAFT/PENDING_REVIEW/APPROVED/REJECTED), `submittedByUserId` (FK → users), `submittedAt`, `reviewedByUserId` (nullable FK → users), `reviewedAt` (nullable), `rejectionReason` (nullable text), `idempotencyKey` (unique), `createdAt`, `updatedAt` |
| 2 | `backend/db/schema/enums.ts` | Register `lessonReportStatusEnum` + `attendanceEvaluationEnum` |
| 3 | `backend/enum/classes/lesson-report.enum.ts` (new) | `LessonReportStatus` (DRAFT/PENDING_REVIEW/APPROVED/REJECTED), `AttendanceEvaluation` (PRESENT/ABSENT/LATE) |
| 4 | `shared/constants/lesson-report.enum.ts` (new) | Mirror both enums |
| 5 | `backend/db/schema/classes/index.ts` | Re-export `lessonReports` |
| 6 | `backend/db/drizzleRelations.ts` | Add relations: `lessonReports ↔ classInstances`, `lessonReports ↔ students`, `lessonReports ↔ teachers` |
| 7 | `backend/types/classes/lesson-report.types.ts` (new) | `LessonReportSelectType`, `LessonReportInsertType`, `LessonReportReturnType`, `LessonReportSubmitInput`, `LessonReviewInput`, `PendingReviewCountReturnType` |
| 8 | `backend/types/classes/index.ts` | Re-export |
| 9 | `backend/db/repo/classes/lesson-report.repository.ts` (new) | `LessonReportRepository`: `findByClassInstanceId`, `findPendingReviews`, `create`, `updateStatus`, `countPendingReviews`, `findByIdempotencyKeys` |
| 10 | `backend/db/repo/index.ts` | Re-export |
| 11 | `backend/services/classes/lesson-report.service.ts` (new) | `LessonReportService`: `submitReport` (perm: `LESSON_REPORTS_SUBMIT`), `getPendingReviews` (perm: `LESSON_REPORTS_REVIEW`), `approveReport` (perm: `LESSON_REPORTS_APPROVE`), `rejectReport` (perm: `LESSON_REPORTS_REJECT`), `getReportByClassId` |
| 12 | `backend/services/classes/index.ts` | Re-export |

#### Report Workflow State Machine:

```
create() → status: PENDING_REVIEW
approveReport() → status: APPROVED → triggers:
  - CreditService.deductForBooking stays (already deducted at booking)
  - TeacherDuesService.createDueEntry(classInstanceId) → credits teacher
rejectReport() → status: REJECTED → triggers:
  - CreditService.refundOnCancel(studentId, classInstanceId) → returns hour to student
  - No teacher due created
```

---

### Work Stream 4: Teacher Dues Ledger

**Goal**: Create `teacher_dues` table that tracks per-lesson earnings, automatically created on approval.

#### Files to Create/Modify:

| # | File | Change |
|---|------|--------|
| 1 | `backend/db/schema/teachers/teacher-dues.ts` (new) | `teacherDues` pgTable: `id`, `teacherId` (FK → teachers), `classInstanceId` (FK → classInstances, unique), `studentId` (FK → students), `hours` (numeric), `amount` (numeric 12,2), `currency` (currencyCodeEnum), `status` (enum: PENDING/PAID), `approvedByUserId` (FK → users), `approvedAt` (timestamptz), `teacherPaymentId` (nullable FK → teacherPayments), `createdAt`, `updatedAt` |
| 2 | `backend/db/schema/enums.ts` | Register `teacherDueStatusEnum` (PENDING/PAID) |
| 3 | `backend/enum/teachers/teacher-due.enum.ts` (new) | `TeacherDueStatus` (PENDING/PAID) |
| 4 | `shared/constants/teacher-due.enum.ts` (new) | Mirror |
| 5 | `backend/db/schema/teachers/index.ts` | Re-export |
| 6 | `backend/db/drizzleRelations.ts` | Add relations: `teacherDues ↔ teachers`, `teacherDues ↔ classInstances`, `teacherDues ↔ teacherPayments` |
| 7 | `backend/types/teachers/teacher-due.types.ts` (new) | `TeacherDueSelectType`, `TeacherDueInsertType`, `TeacherDueReturnType`, `TeacherMonthlyReportReturnType` |
| 8 | `backend/types/teachers/index.ts` | Re-export |
| 9 | `backend/db/repo/teachers/teacher-due.repository.ts` (new) | `TeacherDueRepository`: `create`, `findByClassInstanceId`, `findByTeacherAndPeriod`, `getMonthlyReport`, `markAsPaid`, `getPendingDues` |
| 10 | `backend/db/repo/index.ts` | Re-export |
| 11 | `backend/services/teachers/teacher-due.service.ts` (new) | `TeacherDueService`: `createDueEntry` (internal — called by LessonReportService on approval), `getMonthlyReport` (perm: `TEACHER_DUES_VIEW` OR own), `getPendingDues` |
| 12 | `backend/services/teachers/index.ts` | Re-export |

#### Due Computation on Approval:

```
hours = classInstance.durationMinutes / 60
amount = teacher.hourlyRate * hours
→ insert teacher_due with status: PENDING
```

#### Monthly Teacher Report Aggregation:

- `lessonsTaught` = count class_instances where executionState = COMPLETED
- `approvedCount` = count teacher_dues where approvedAt in month
- `cancelledCount` = count class_instances where outcome = LEAVE or report status = REJECTED
- `totalAccruedHours` = sum teacher_dues.hours
- `totalDueAmount` = sum teacher_dues.amount where status = PENDING
- `totalPaidAmount` = sum teacher_dues.amount where status = PAID

---

### Work Stream 5: Wire Credit Flow into Booking/Cancellation

**Goal**: Connect the existing `quotaDeducted` plumbing to the new credit ledger.

#### Files to Modify:

| # | File | Change |
|---|------|--------|
| 1 | `backend/services/schedule/recurring-class.service.ts` | Pass `quotaDeducted: true` to `createRecurringScheduleWithInstances`. Pre-check `student.classesRemaining > 0`. Call `CreditService.deductForBooking` inside transaction. |
| 2 | `backend/services/teacher/teacher-dashboard.service.ts` | Same for `createManualEntry` — pre-check balance, pass `quotaDeducted: true`, call `CreditService.deductForBooking` |
| 3 | `backend/db/repo/scheduling/recurring.ts` | Wire `handleQuotaDeduction` (line 638) to call `CreditRepository.deductForBooking` instead of just `UPDATE students` |
| 4 | `backend/db/repo/scheduling/class-instances.ts:63-126` (`createClassInstance`) | Same — wire quota deduction through `CreditService` |
| 5 | `backend/db/repo/scheduling/state-changes.ts` | In `resetClassInstance` (line 523) and leave/cancel paths: call `CreditService.refundOnCancel` |
| 6 | `backend/db/repo/scheduling/recurring.ts` (`deleteRecurringClass`, `clearWeeklySchedule`) | Wire refunds through `CreditService.refundOnCancel` |

---

### Work Stream 6: GraphQL API Layer

**Goal**: Expose all new entities and operations via Pothos GraphQL queries and mutations.

#### Files to Create/Modify:

| # | File | Change |
|---|------|--------|
| 1 | `backend/graphql/pothos/billing/credit.pothos.ts` (new) | `CreditTransactionPothosObject`, `CreditBalancePothosObject`, `RecordPurchaseInput`, `PurchaseResultRef` |
| 2 | `backend/graphql/pothos/classes/lesson-report.pothos.ts` (new) | `LessonReportPothosObject`, `LessonReportSubmitInput`, `LessonReviewInput`, `PendingReviewsResultRef` |
| 3 | `backend/graphql/pothos/teachers/teacher-due.pothos.ts` (new) | `TeacherDuePothosObject`, `TeacherMonthlyReportPothosObject` |
| 4 | `backend/graphql/pothos/index.ts` | Re-export new pothos files |
| 5 | `backend/graphql/query/billing/credit.query.ts` (new) | `studentCreditBalance(studentId)`, `studentCreditTransactions(studentId, paginationArgs)` |
| 6 | `backend/graphql/query/classes/lesson-report.query.ts` (new) | `lessonReport(classInstanceId)`, `pendingLessonReviews(filters, paginationArgs)`, `lessonReportCount` |
| 7 | `backend/graphql/query/teachers/teacher-due.query.ts` (new) | `teacherMonthlyReport(teacherId, year, month)`, `teacherPendingDues(teacherId)` |
| 8 | `backend/graphql/mutation/billing/credit.mutation.ts` (new) | `recordCreditPurchase(studentId, hours, notes)` → auth: `CREDITS_MANAGE` |
| 9 | `backend/graphql/mutation/classes/lesson-report.mutation.ts` (new) | `submitLessonReport(classInstanceId, input)`, `approveLessonReport(reportId)`, `rejectLessonReport(reportId, rejectionReason)` |
| 10 | `backend/graphql/mutation/shared/onboarding.mutation.ts` | Update `createStudent` for email/password; add `createSupervisor` mutation |
| 11 | `backend/graphql/query/index.ts` | Import new query dirs |
| 12 | `backend/graphql/mutation/index.ts` | Import new mutation dirs |
| 13 | Run `bun run generate:gqlSchema && bun codegen` | Regenerate schema + types |

---

### Work Stream 7: End-of-Month Reports (Backend Services)

**Goal**: Add month-end aggregation queries for both teacher and student reports.

#### Files to Create/Modify:

| # | File | Change |
|---|------|--------|
| 1 | `backend/services/report/teacher-monthly-report.service.ts` (new) | `TeacherMonthlyReportService.getMonthlyReport(actorUserId, teacherId, year, month, locale?)` |
| 2 | `backend/services/report/student-monthly-report.service.ts` (new) | `StudentMonthlyReportService.getMonthlyReport(actorUserId, studentId, year, month, locale?)` |
| 3 | `backend/services/report/index.ts` (new barrel) | Re-export both services |
| 4 | `backend/graphql/query/reports/monthly-report.query.ts` (new) | `teacherMonthlyReport(teacherId, year, month)`, `studentMonthlyReport(studentId, year, month)` → auth: `MONTHLY_REPORTS_VIEW` |
| 5 | `backend/services/report/report.service.ts` | Extend existing `generateAttendanceReport` with lesson_report status dimensions |

---

### Work Stream 8: Backend Tests

**Goal**: Achieve repo test coverage requirements on all new code.

#### Files to Create:

| # | File | Test Scope |
|---|------|------------|
| 1 | `backend/db/test/repo/billing/credit.repository.test.ts` | CRUD, balance computation, idempotency, refund logic, tx propagation |
| 2 | `backend/db/test/repo/classes/lesson-report.repository.test.ts` | Create report, find pending, update status, FK enforcement |
| 3 | `backend/db/test/repo/teachers/teacher-due.repository.test.ts` | Create due, find by period, monthly aggregation, mark paid |
| 4 | `backend/db/test/logic/lms/credit-workflow.test.ts` | Full workflow: purchase → booking → deduct → approve → teacher due → cancel → refund |
| 5 | `backend/db/test/logic/lms/lesson-report-workflow.test.ts` | Submit → pending review → approve (creates due) → reject (refunds credit) |
| 6 | `backend/services/billing/test/credit.service.test.ts` | Permission gating, balance checks, i18n error messages |
| 7 | `backend/services/classes/test/lesson-report.service.test.ts` | Permission gating, state transitions |
| 8 | `backend/services/teachers/test/teacher-due.service.test.ts` | Due computation, monthly aggregation |
| 9 | `frontend/common/graphql/test/lms/` (new dir) | GraphQL integration tests: `credit.test.ts`, `lesson-report.test.ts`, `teacher-due.test.ts`, `monthly-report.test.ts` |
| 10 | `backend/db/test/entity-setup.ts` | Add `createTestLessonReport`, `createTestCreditTransaction`, `createTestTeacherDue` helpers |

---

### Work Stream 9: i18n + Enums (Cross-cutting)

**Goal**: Add all translation keys and enum registrations for new LMS domain.

#### Files to Create/Modify:

| # | File | Change |
|---|------|--------|
| 1 | `shared/messages/types/dashboard/lms/` (new dir) | Type definitions: `credit.ts`, `lessonReports.ts`, `teacherDues.ts`, `monthlyReports.ts` |
| 2 | `shared/messages/types/errors/` (new files) | `lesson-report.ts`, `credit.ts`, `teacher-due.ts` error label types |
| 3 | `shared/messages/types/message.ts` | Add LMS sub-namespace to `MessageSchema` |
| 4 | `shared/messages/ar/dashboard/lms/` (new dir) | Arabic translations for all LMS keys |
| 5 | `shared/messages/en/dashboard/lms/` (new dir) | English translations |
| 6 | `shared/messages/ar/errors/` (new files) | Arabic error messages for LMS |
| 7 | `shared/messages/en/errors/` (new files) | English error messages |
| 8 | `shared/messages/ar/index.ts` + `en/index.ts` | Wire `lms` namespace into assembled translations |

---

### Work Stream 10: Seeds

**Goal**: Add seed data for new entities.

#### Files to Create/Modify:

| # | File | Change |
|---|------|--------|
| 1 | `backend/db/seeds/lms/seed-credit-transactions.ts` (new) | Seed credit purchases for demo students |
| 2 | `backend/db/seeds/lms/seed-lesson-reports.ts` (new) | Seed lesson reports for completed class_instances |
| 3 | `backend/db/seeds/lms/seed-teacher-dues.ts` (new) | Seed teacher dues for approved lesson reports |
| 4 | `backend/db/seeds/lms/index.ts` (new) | Barrel |
| 5 | `backend/db/seeds/index.ts` | Add LMS seed steps in dependency order |
| 6 | `backend/db/seeds/shared/verify-coverage.ts` | Register new tables in `TABLE_COVERAGE` |
| 7 | `backend/db/seeds/auth/seed-lms-permissions.ts` (new) | Link LMS permissions to supervisor_default and student_default groups |

---

## Estimated Scope Summary

| Work Stream | New Files | Modified Files | Effort |
|---|---|---|---|
| 1: Roles & Auth | 2 | 16 | Medium |
| 2: Credit Ledger | 8 | 4 | Medium |
| 3: Lesson Reports | 8 | 3 | Medium-High |
| 4: Teacher Dues | 8 | 3 | Medium |
| 5: Wire Credit Flow | 0 | 6 | Medium |
| 6: GraphQL API | 10 | 4 | Medium |
| 7: Monthly Reports | 5 | 1 | Low-Medium |
| 8: Tests | 10 | 1 | High |
| 9: i18n | ~20 | 4 | Medium |
| 10: Seeds | 5 | 3 | Low |
| **Total** | **~76** | **~45** | **Large** |

---

## Execution Order (Dependencies)

```
Work Stream 1 (Roles & Auth) ──────────────┐
                                           ↓
Work Stream 2 (Credit Ledger) ────────────┐│
Work Stream 3 (Lesson Reports) ───────────┤│
Work Stream 4 (Teacher Dues) ─────────────┤┤
                                          ↓↓
Work Stream 5 (Wire Credit Flow) ──── depends on 2+3+4
                                           ↓
Work Stream 6 (GraphQL API) ────────── depends on 1-5
                                           ↓
Work Stream 7 (Monthly Reports) ────── depends on 3+4
                                           ↓
Work Stream 9 (i18n) ─────────────────── independent, parallel with 1-7
Work Stream 10 (Seeds) ──────────────── depends on 1-5
                                           ↓
Work Stream 8 (Tests) ────────────────── depends on all
```

Work Streams 1, 2, 3, 4 can run in parallel after reading all AGENTS.md files. Work Stream 9 (i18n) can run entirely in parallel.

---

## Verification Commands

After each work stream:

```bash
bun tsgo                          # Type check
bun biome:check                   # Format + lint
# Lint via queue for modified files:
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify","files":["<modified-files>"]}'
bun run generate:gqlSchema && bun codegen  # After enum/schema/GraphQL changes
bun run db push                   # After schema changes
bun run db seed                   # After seed changes
bun run scripts/run-test/run-test.ts <test-path>  # After test changes
bun quality-gate                  # Final verification

---

# PHASE 2 BREAKDOWN — Frontend (8 Work Streams)

## Architecture Decisions Confirmed (Phase 2)

1. **Same URL `/dashboard` for all**: Every role lands at `/dashboard` but sees a completely different dashboard container (no redirect, smart routing via `DashboardContainer.tsx`)
2. **Student dashboard primary**: Upcoming lessons prominently with "Join" button for most recent upcoming lesson, credit balance, lesson history snapshot — calendar-centric, join-focused
3. **Supervisor dashboard**: Own dedicated home showing pending reviews queue, teacher dues summary, monthly reports access — totally different from admin/teacher/parent
4. **Student co-report**: Student can BOTH view teacher's lesson reports AND add their own reflection/feedback notes alongside (co-creation, not submit-only)
5. **Supervisor review queue**: Dedicated `/lesson-reports` page with paginated queue, details panel, approve/reject buttons
6. `DashboardContainer.tsx` extension order: `parent → teacher → student → supervisor → admin` (priority: most-restrictive portal first; admin is fallback)
7. Portal detection: new `isStudentPortalUser` / `isSupervisorPortalUser` helpers mirroring `isTeacherPortalUser` pattern
8. Storybook stories required for all new containers
9. Frontend tests: nav config tests extended for student/supervisor portals, integration tests via existing `test/ui/components/` pattern

---

## PHASE 2 WORK STREAMS — Frontend

### Phase 2 Work Stream 1: Portal Detection + Navigation + Pages

**Goal**: Extend `NavigationConfig.ts`, `DashboardContainer.tsx`, `page-permissions.types.ts`, create new app routes for student/supervisor, plus stub pages for upcoming work streams.

#### Files to Create/Modify:

| # | File | Change |
|---|------|--------|
| 1 | `frontend/common/views/dashboard/config/navigationConfig.ts` | Add `audience: "student" \| "supervisor"` to `NavItem` type; add `shouldShowStudentDashboard` items (today-classes, my-schedule, my-credits, my-lesson-reports-history, my-profile); add `shouldShowSupervisorDashboard` items (pending-reviews, teacher-dues, monthly-reports, supervisor-profile); extend `getNavItemsForPermissions` with student/supervisor branches; add `isStudentPortalUser`, `isSupervisorPortalUser`, `applyStudentNavOverrides`, `applySupervisorNavOverrides` mirroring teacher/parent patterns; update `applyProfileNavOverrides` to hide `own-profile` for student/supervisor portals too |
| 2 | `frontend/common/views/dashboard/config/mockNavigationConfig.ts` | Mirror the same nav items for Storybook |
| 3 | `frontend/common/views/dashboard/dashboard/DashboardContainer.tsx` | Add `shouldShowStudentDashboard` (uses `STUDENT_VIEW_OWN_DASHBOARD` + excludes `DashboardViewMetrics`); add `shouldShowSupervisorDashboard` (uses `SUPERVISOR_VIEW_DASHBOARD` + excludes `DashboardViewMetrics`); insertboth BEFORE the admin fallback in this precedence order: `parent → teacher → student → supervisor → admin` |
| 4 | `frontend/common/types/page-permissions.types.ts` | Add: `studentSelfDashboard: [STUDENT_VIEW_OWN_DASHBOARD]`, `studentCredits: [STUDENT_VIEW_OWN_DASHBOARD]`, `studentOwnHistory: [STUDENT_VIEW_OWN_DASHBOARD]`, `supervisorDashboard: [SUPERVISOR_VIEW_DASHBOARD]`, `lessonReportsReview: [LESSON_REPORTS_REVIEW \|\| LESSON_REPORTS_APPROVE]`, `teacherDuesView: [TEACHER_DUES_VIEW]`, `monthlyReportsView: [MONTHLY_REPORTS_VIEW]`, `studentSelfReflection: [STUDENT_VIEW_OWN_DASHBOARD]` |
| 5 | `frontend/common/types/page-permissions.types.ts` | Aligned permissions tuples for nav filtering |
| 6 | `frontend/common/views/dashboard/config/mockNavigationConfig.ts` | Add corresponding mock student/supervisor nav items (Storybook) |
| 7 | `app/[locale]/(dashboard)/students/me/page.tsx` (new) | Stub — renders `<Suspense><StudentDashboardContainer /></Suspense>` (will be built in WS3) |
| 8 | `app/[locale]/(dashboard)/lesson-reports/page.tsx` (new) | Stub — `<PendingLessonReviewsContainer />` (WS2) |
| 9 | `app/[locale]/(dashboard)/lesson-reports/[id]/page.tsx` (new) | Stub — `<LessonReportDetailContainer />` (WS2) |
| 10 | `app/[locale]/(dashboard)/students/me/credits/page.tsx` (new) | Stub — `<StudentCreditsContainer />` (WS3) |
| 11 | `app/[locale]/(dashboard)/students/me/history/page.tsx` (new) | Stub — reuses existing `StudentHistoryContainer` with student-self pattern |
| 12 | `app/[locale]/(dashboard)/students/me/profile/page.tsx` (new) | Stub — `<StudentSelfProfileContainer />` (WS3) |
| 13 | `app/[locale]/(dashboard)/supervisor/dashboard/page.tsx` (new) | Stub — `<SupervisorDashboardContainer />` (WS4) |
| 14 | `app/[locale]/(dashboard)/supervisor/teacher-dues/page.tsx` (new) | Stub — `<TeacherDuesContainer />` (WS4) |
| 15 | `app/[locale]/(dashboard)/supervisor/monthly-reports/page.tsx` (new) | Stub — `<MonthlyReportsContainer />` (WS4) |
| 16 | `app/[locale]/(dashboard)/supervisor/profile/page.tsx` (new) | Stub — `<SupervisorProfileContainer />` (WS4) |
| 17 | Test: `test/ui/components/studentNavigationConfig.test.ts` (new) | Mirror `parentNavigationConfig.test.ts` pattern with `STUDENT_PERMISSIONS` |
| 18 | Test: `test/ui/components/supervisorNavigationConfig.test.ts` (new) | Mirror with `SUPERVISOR_PERMISSIONS` array |
| 19 | Optional: Refactor portal-detection helpers into a shared `frontend/common/views/dashboard/lib/portalDetection.ts` (consolidate duplicated `shouldShow*Dashboard` from `navigationConfig.ts` + `DashboardContainer.tsx`) | Drop-in single-source-of-truth, no behavior change |

**Navigation items summary**:

Student sidebar (`audience: "student"`):
- `student-today-classes` → `/dashboard` (icon: `CalendarTodayOutlined`) — main entry
- `student-schedule` → `/students/me/history` (icon: `EventRepeatOutlined`)
- `student-credits` → `/students/me/credits` (icon: `AccountBalanceWalletOutlined`)
- `student-lesson-reports` → `/students/me/history` (filter pending approved reports tab)
- `student-profile` → `/students/me/profile` (icon: `PersonOutlineOutlined`)

Supervisor sidebar (`audience: "supervisor"`):
- `supervisor-home` → `/dashboard` (icon: `DashboardOutlined`) — supervisor's home dashboard
- `pending-reviews` → `/lesson-reports` (icon: `RateReviewOutlined`) — reviews queue
- `teacher-dues` → `/supervisor/teacher-dues` (icon: `PaymentsOutlined`)
- `monthly-reports` → `/supervisor/monthly-reports` (icon: `AssessmentOutlined`)
- `supervisor-profile` → `/supervisor/profile` (icon: `PersonOutlineOutlined`)

---

### Phase 2 Work Stream 2: GraphQL Documents for LMS Features

**Goal**: Author GraphQL query/mutation documents for all LMS features.

#### Files to Create:

| # | File | Documents |
|---|------|-----------|
| 1 | `frontend/common/graphql/sharedDocuments/students/student-credits.documents.ts` (new) | `StudentCreditBalanceQueryDocument`, `StudentCreditTransactionsQueryDocument`, `StudentCreditPurchaseMutationDocument` | 
- `StudentCreditBalanceQueryDocument` — `{ studentCreditBalance(studentId) { id, studentId, classesTotal, classesRemaining } }`
- `StudentCreditTransactionsQueryDocument` — `{ studentCreditTransactions(studentId, pagination) { rows { id studentId changeAmount reason sourcePaymentId classInstanceId notes creditedByUserId idempotencyKey createdAt updatedAt } totalCount } }`
- `studentCreditPurchaseMutationDocument` — `recordCreditPurchase` mutation (admin use)
- Always include `id` field on every object type for Apollo cache normalization
- Hook import: `@/apollo/client/react` (not `@/apollo/client`)
| 2 | `frontend/common/graphql/sharedDocuments/classes/lesson-report.documents.ts` (new) | `LessonReportQueryDocument`, `PendingLessonReviewsQueryDocument`, `LessonReportCountQueryDocument`, `SubmitLessonReportMutationDocument`, `ApproveLessonReportMutationDocument`, `RejectLessonReportMutationDocument`, `StudentLessonReportSubmissionMutationDocument` |
- `LessonReportQueryDocument(classInstanceId)` — `{ lessonReport(classInstanceId) { id classInstanceId studentId teacherId lessonDate durationMinutes attendanceEvaluation teacherNotes completionPercentage status submittedByUserId submittedAt reviewedByUserId reviewedAt rejectionReason idempotencyKey createdAt updatedAt } }`
- `PendingLessonReviewsQueryDocument(filters, pagination)` — returns paginated list
- `SubmitLessonReportMutationDocument` — teacher submits, accepts `LessonReportSubmitInput`
- `ApproveLessonReportMutationDocument(reportId)` — returns updated report
- `RejectLessonReportMutationDocument(reportId, rejectionReason)` — returns updated report
- `StudentLessonReportSubmissionMutationDocument(classInstanceId, studentNotes, optional: rating)` — co-report tunnel (WS1 backend should add new mutation if not present — flag for backend sync)
| 3 | `frontend/common/graphql/sharedDocuments/teachers/teacher-dues.documents.ts` (new) | `TeacherPendingDuesQueryDocument`, `TeacherMonthlyReportQueryDocument`, `MarkTeacherDuesPaidMutationDocument` |
- `TeacherPendingDuesQueryDocument(teacherId?)` — `{ teacherPendingDues(teacherId) { id teacherId classInstanceId studentId hours amount currency status approvedByUserId approvedAt teacherPaymentId createdAt updatedAt } }`
- `TeacherMonthlyReportQueryDocument(teacherId, year, month)` — full monthly aggregation
- `MarkTeacherDuesPaidMutationDocument(dueIds, teacherPaymentId)` — optional if backend supports
| 4 | `frontend/common/graphql/sharedDocuments/reports/monthly-reports.documents.ts` (new) | `TeacherMonthlyReportQueryDocument` (if not in #3), `StudentMonthlyReportQueryDocument(studentId, year, month)` |
- `StudentMonthlyReportQueryDocument` — returns `id studentId studentName year month totalLessons completedLessons cancelledLessons presentCount absentCount lateCount totalHours creditsPurchased creditsDeducted creditsRefunded creditsBalance`
| 5 | Run `bun run generate:gqlSchema && bun codegen` | Regenerate types — includes verification of frontend documents matching backend schema |

**Policy**: NO `useLazyQuery` — use stateful `useQuery` exclusively. Import hooks from `"@/apollo/client/react"` not `"@/apollo/client"`. Persist `id` on all object types for Apollo cache normalization.

---

### Phase 2 Work Stream 3: Student Dashboard + Subpages

**Goal**: Build student portal pages — home dashboard with prominent "Join next class" CTA, credits, history, profile.

#### Files to Create:

| # | File | Purpose |
|---|------|---------|
| 1 | `frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer.tsx` | Container: fetches `studentDashboard` (or composes profile + history queries), owns Apollo `useQuery`, exposes handlers. Loads upcoming lessons from `studentProfileQueryDocument(studentViewerSelf)` (existing query; backend should support `studentId: null ⇒ self` — flag for back-end if not). Constructs viewmodel via `useStudentDashboardViewModel` |
| 2 | `frontend/common/views/dashboard/student/dashboard/useStudentDashboardViewModel.ts` | ViewModel hook — flat object with: `userName`, `nextLesson` (single class instance with `joinUrl` if meeting ready), `upcomingLessons` (today + next 7 days), `creditBalance` (`{ classesRemaining, classesTotal }`), `recentLessonReports` (teacher's latest approved reports), `pendingTeacherReflections` (lesson reports awaiting student co-report), `labels`, `loading`, `pageCount`, handlers: `onJoinLesson(id)`, `onViewHistory()`, `onViewCredits()`, `onAddReflection(lessonReportId)`, `onEditProfile()` |
| 3 | `frontend/common/views/dashboard/student/dashboard/studentDashboardView.tsx` | Switcher using `createLazyView` + `ResponsiveViewSwitch` for mobile/desktop lazy load |
| 4 | `frontend/common/views/dashboard/student/dashboard/types/studentDashboardTypes.ts` | `StudentDashboardMetrics`, `UpcomingLessonRow`, `CreditBalanceSummary`, `RecentLessonReportRow` |
| 5 | `frontend/common/views/dashboard/student/dashboard/types/studentDashboardLabels.ts` | Label interface + import from `@/shared/messages/types/dashboard/lms/` |
| 6 | `frontend/mobile/views/dashboard/student/dashboard/studentDashboard.mobile.tsx` | Mobile-specific render — Hero card with "Next Class: <datetime> [Join]" CTA prominent, then compact sections (Today's classes, Credit balance, Recent reports) |
| 7 | `frontend/desktop/views/dashboard/student/dashboard/studentDashboard.desktop.tsx` | Desktop: 3-column grid layout — left: Next class banner + upcoming today's lessons; middle: Credit balance + history snapshot; right: Recent lesson reports with reflection button |
| 8 | `frontend/common/views/dashboard/student/dashboard/components/NextClassJoinCard.tsx` | Reusable shared component — prominent join button countdown timer + video room deep link |
| 9 | `frontend/common/views/dashboard/student/credits/StudentCreditsContainer.tsx` | Container for `student-credits` route — fetches `StudentCreditBalanceQueryDocument` + `StudentCreditTransactionsQueryDocument`, renders balance + transaction history data grid |
| 10 | `frontend/common/views/dashboard/student/credits/useStudentCreditsViewModel.ts` | ViewModel |
| 11 | `frontend/common/views/dashboard/student/credits/studentCreditsView.tsx` | Switcher |
| 12 | `frontend/common/views/dashboard/student/credits/types/...` | types |
| 13 | Mobile + desktop tier views for credits | Same .mobile/.desktop pattern |
| 14 | `frontend/common/views/dashboard/student/profile/StudentSelfProfileContainer.tsx` | Self-profile edit (name, avatar, timezone, language) |
| 15 | `frontend/common/views/dashboard/student/history/StudentHistoryContainer.tsx` | Wraps existing history components but uses student-self scope (`studentClassHistoryQueryDocument` with studentId from `useUserStore`) — really thin wrapper reusing `studentHistoryStore` |
| 16 | `frontend/common/views/dashboard/student/lesson-report-reflection/StudentReportReflectionDialog.tsx` | Modal used in dashboard to add student reflection/notes alongside teacher's report |
| 17 | `frontend/common/stores/studentDashboardStore.ts` (new) | UI state: `filterDate`, `upcomingLessonsPage`, `upcomingDialog`, `reflectionDialogOpen`, `selectedReportId` |
| 18 | `frontend/common/stores/studentDashboardTypes.ts` (new) | Types for student dashboard store |
| 19 | Storybook stories for: `StudentDashboardContainer.stories.tsx`, `StudentCreditsContainer.stories.tsx` | Mirror `TeacherDashboardContainer.stories.tsx` pattern |
| 20 | `frontend/common/views/dashboard/student/dashboard/utils/studentDashboardMappers.ts` | mapExecutionStateToLiveClassStatus, resolveMeetingJoinUrl (kill duplication with teacher/parent — refactor into shared util) |

**CRITICAL pattern notes**:
- Container owns `useQuery` + `useMutation` + `useEffect`; ViewModel derives; View renders
- No `useMediaQuery` outside switcher — tier-paired mobile/desktop lazily loaded via `ResponsiveViewSwitch`
- All colors from theme palette — NO hex
- All text via `useTranslations` from `next-intl`; label types from `@/shared/messages/types/dashboard/lms/`
- `PageContainer` for outer wrapper (no extra padding)

**Backend sync dependency** (flag for back-end): 
- `studentClassHistoryQueryDocument` currently requires `studentId` arg — change to optional `studentId`, defaults to viewer's own student record when null
- New backend mutation `submitStudentLessonReportReflection(classInstanceId, studentNotes, optional: rating)` — appends to `lesson_reports.studentNotes` field OR creates a new `student_lesson_reflections` table. DECISION NEEDED — simplest path is to add a nullable `studentNotes` column to existing `lesson_reports` table (Phase 1 backend should add this).

---

### Phase 2 Work Stream 4: Supervisor Dashboard + Subpages

**Goal**: Build supervisor portal pages — dashboard home + dedicated reviews queue + teacher dues + monthly reports.

#### Files to Create:

| # | File | Purpose |
|---|------|---------|
| 1 | `frontend/common/views/dashboard/supervisor/dashboard/SupervisorDashboardContainer.tsx` | Container — fetches `pendingLessonReviewCountQueryDocument` (new small query) + `teacherPendingDuesSummary` (new: count + total amount) + `monthlyReportSnapshot`. Renders hero "X pending reviews need your attention" |
| 2 | `frontend/common/views/dashboard/supervisor/dashboard/useSupervisorDashboardViewModel.ts` | ViewModel: `pendingReviewCount`, `pendingDuesSummary`, `recentApprovals` (last 5), `monthlySnapshot` (this month summary), `userName`, labels, handlers: `onGoToReviews()`, `onGoToDues()`, `onGoToMonthlyReports()`, `onViewRecentApproval(id)` |
| 3 | `frontend/common/views/dashboard/supervisor/dashboard/supervisorDashboardView.tsx` | Switcher |
| 4 | `frontend/common/views/dashboard/supervisor/dashboard/types/...` | types |
| 5 | Mobile + desktop tier views | Same .mobile/.desktop pattern |
| 6 | `frontend/common/views/dashboard/supervisor/lesson-reviews/PendingReviewsContainer.tsx` | Paginated queue — fetches `PendingLessonReviewsQueryDocument(filters, pagination)`; data grid columns: lesson date, student name, teacher name, attendance eval, completion %, submitted at, [Review] button click → opens detail panel |
| 7 | `frontend/common/views/dashboard/supervisor/lesson-reviews/usePendingReviewsViewModel.ts` | ViewModel with filters (teacher, student, date range) |
| 8 | `frontend/common/views/dashboard/supervisor/lesson-reviews/pendingReviewsView.tsx` | Switcher |
| 9 | `frontend/common/views/dashboard/supervisor/lesson-reviews/components/LessonReportDetailPanel.tsx` | Side panel showing full report — teacher notes, attendance eval, completion %, approve/reject buttons with rejection reason modal |
| 10 | `frontend/common/views/dashboard/supervisor/lesson-reviews/components/RejectReportDialog.tsx` | Rejection reason modal — `BaseDialog` pattern |
| 11 | Mobile + desktop tier views | Mobile uses card list; desktop uses data grid |
| 12 | `frontend/common/views/dashboard/supervisor/teacher-dues/TeacherDuesContainer.tsx` | Fetches `TeacherPendingDuesQueryDocument`; ag-grid with columns: teacher name, class date, student, hours, amount, currency, status, approved date, [Mark as paid] action |
| 13 | `frontend/common/views/dashboard/supervisor/teacher-dues/useTeacherDuesViewModel.ts` | ViewModel |
| 14 | Mobile + desktop tier views + components | Mark as paid action (via `MarkTeacherDuesPaidMutationDocument` — may need backend support) |
| 15 | `frontend/common/views/dashboard/supervisor/monthly-reports/MonthlyReportsContainer.tsx` | Month/year picker + teacherId filter → calls `TeacherMonthlyReportQueryDocument` + `StudentMonthlyReportQueryDocument` based on toggle |
| 16 | `frontend/common/views/dashboard/supervisor/monthly-reports/useMonthlyReportsViewModel.ts` | ViewModel with `reportType: 'teacher' \| 'student'` toggle |
| 17 | Mobile + desktop tier views | Tabbed view teacher/student + date navigate |
| 18 | `frontend/common/views/dashboard/supervisor/profile/SupervisorProfileContainer.tsx` | Edit self profile (reuse staff profile pattern from `frontend/common/views/dashboard/managers/`) |
| 19 | `frontend/common/stores/supervisorDashboardStore.ts` (new) | UI state: `pendingReviewsFilters`, `pendingReviewsPage`, `selectedReviewId`, `duesFilters`, `monthlyReportFilter` |
| 20 | `frontend/common/stores/supervisorDashboardTypes.ts` (new) | Types |
| 21 | `frontend/common/stores/pendingLessonReviewsStore.ts` (new) | Dedicated pending reviews state + filters + pagination + selected review |
| 22 | `frontend/common/stores/teacherDuesStore.ts` (new) | Dues state |
| 23 | Reuse existing `reportsStore` extended with `monthlyReportType: 'teacher' \| 'student'` | Avoid new store; extends existing |
| 24 | Storybook stories for all containers | Mirror existing pattern |
| 25 | `frontend/common/views/dashboard/supervisor/dashboard/components/PendingReviewsHeroCard.tsx` | Reusable hero card — shows count + CTA |
| 26 | `frontend/common/views/dashboard/supervisor/dashboard/components/DuesSummaryCard.tsx` | Summary card with totals |

---

### Phase 2 Work Stream 5: Teacher Lesson Report Submission

**Goal**: Add UI flow for teachers to submit lesson reports when they complete a class. Extends existing teacher dashboard.

#### Files to Create/Modify:

| # | File | Purpose |
|---|------|---------|
| 1 | `frontend/common/views/dashboard/teachers/dashboard/components/MarkClassCompletedButton.tsx` | New action button on teacher's class card — opens lesson report submission dialog |
| 2 | `frontend/common/views/dashboard/teachers/dashboard/components/LessonReportSubmitDialog.tsx` | Form: attendance evaluation dropdown, duration minutes, completion % slider, teacher notes textarea, submit button → `SubmitLessonReportMutationDocument` |
| 3 | Modify `frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer.tsx` | Pass new `onMarkClassCompleted(classInstanceId)` handler to view model after class is in `TAKEN` state (currently only "absent"/"leave" actions) |
| 4 | `frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes.ts` | Form types |
| 5 | `frontend/common/views/dashboard/teachers/dashboard/schemas/lessonReportFormSchema.ts` | Zod schema for validation |
| 6 | Optional: New `app/[locale]/(dashboard)/teachers/me/lesson-reports/page.tsx` | History page — list of teacher's submitted lesson reports with status badges (PENDING/APPROVED/REJECTED) and reject reason displayed |
| 7 | Storybook story | `LessonReportSubmitDialog.stories.tsx` |

---

### Phase 2 Work Stream 6: i18n Labels for Frontend (Cross-cutting)

**Goal**: Frontend translation keys for all new pages (uses Phase 1 WS9 type definitions as source of truth).

#### Files to Create:

| # | File | Purpose |
|---|------|---------|
| 1 | `shared/messages/types/dashboard/studentPortal/` (new dir) | `creditHistory.ts`, `lessonReportDetail.ts`, `upcomingLessons.ts`, `nextClassHero.ts`, `supervisorDashboard.ts`, `pendingReviews.ts`, `teacherDuesView.ts`, `monthlyReports.ts` — interfaces with i18n keys |
| 2 | `shared/messages/ar/dashboard/studentPortal/` + `supervisorPortal/` (new dirs) | All Arabic translations mirroring WS9 + WS3/4 |
| 3 | `shared/messages/en/dashboard/studentPortal/` + `supervisorPortal/` (new dirs) | All English translations |
| 4 | `shared/messages/types/auth/index.ts` | Add: `switchToStudentRole`, `switchToSupervisorRole` (for admin role-switcher group simulation labels) |
| 5 | `shared/messages/ar/auth/`, `shared/messages/en/auth/` | Mirror strings |
| 6 | Update existing `shared/messages/types/dashboard/nav.ts` and ar/en mirrors | Add nav label keys for new sidebar items: `studentTodayClasses`, `studentSchedule`, `studentCredits`, `studentLessonReports`, `studentProfile`, `supervisorHome`, `pendingReviews`, `teacherDues`, `monthlyReports`, `supervisorProfile` |
| 7 | Update `mockNavigationConfig.ts` | Wire new label keys for tests |

---

### Phase 2 Work Stream 7: Admin Role-Switcher Menu Updates

**Goal**: Add student/supervisor options to admin's "Switch role to…" menu.

#### Files to Modify:

| # | File | Change |
|---|------|--------|
| 1 | `backend/services/auth/permission-group-simulation.service.ts` | (Backend follow-up — Phase 1 already added, but verify `listSimulatableGroups` returns `supervisor_default` and `student_default` for super admin actors. Should already work since they're in the permission group table) |
| 2 | Verify `simulatablePermissionGroupsQueryDocument` | Returns populated list — no frontend change needed (already fetches from backend) |
| 3 | `frontend/common/views/dashboard/components/navbar/UserMenuButton.tsx` | No code change needed — already iterates over `simulatableGroups` returned from GraphQL. Labels come from group's `name` field (already Arabic/English translated via backend) |
| 4 | Verify backend `seed-lms-permissions.ts` inserts `supervisor_default` and `student_default` permission groups with proper name displayName translations | Flag if missing |

---

### Phase 2 Work Stream 8: Frontend Tests

**Goal**: Component + integration tests for new frontend features.

#### Files to Create:

| # | File | Test scope |
|---|------|------------|
| 1 | `test/ui/components/studentNavigationConfig.test.ts` | Verifies student nav items visible/invisible based on `STUDENT_PERMISSIONS` array |
| 2 | `test/ui/components/supervisorNavigationConfig.test.ts` | Same for supervisor with `SUPERVISOR_PERMISSIONS` |
| 3 | `test/ui/components/dashboardContainer.test.tsx` | Tests `DashboardContainer` correctly renders `StudentDashboardContainer` for student perms, `SupervisorDashboardContainer` for supervisor perms, etc. — mock `useQuery` + `useUserStore` |
| 4 | `test/ui/components/lessonReportSubmitDialog.test.tsx` | Teacher submits lesson report — form validation + mutation |
| 5 | `test/ui/components/pendingReviewsContainer.test.tsx` | Mock Apollo query → assert queue renders + approve/reject buttons |
| 6 | `test/ui/components/studentDashboard.test.tsx` | Mock `studentProfileQueryDocument` → assert next class + recent reports render |
| 7 | `test/ui/e2e/student_portal.e2e.ts` (new) | Login as demo student → assert dashboard loads + sidebar items + nav to credits |
| 8 | `test/ui/e2e/supervisor_portal.e2e.ts` (new) | Login as demo supervisor → assert pending reviews page + teacher dues |
| 9 | `test/ui/e2e/teacher_lesson_report.e2e.ts` (new) | Login as demo teacher → mark class completed → fill lesson report → submit → logout → login as supervisor → approve report |

---

## Phase 2 Execution Order (Dependencies)

```
WS1 (Portal Detection + Nav + Stubs) ─────┐
                                          ↓
WS2 (GraphQL Documents) ──────────────────┤
                                          ↓
WS3 (Student Dashboard) ─────────┐        │
WS4 (Supervisor Dashboard) ──────┤        │
WS5 (Teacher Submit Report) ─────┤────────┤
                                 ↓        ↓
WS6 (i18n Labels) ─────────── independent, parallel with 1-5
WS7 (Admin Role-Switcher) ─── independent, parallel with 1-5
                                          ↓
WS8 (Tests) ──────────────────── depends on all
```

Parallelizable waves:
- **Wave 1 (parallel after stubs)**: WS1 alone (foundation for everything)
- **Wave 2 (parallel)**: WS2 (GraphQL) + WS6 (i18n types) + WS7 (role-switcher verify — backend-only check)
- **Wave 3 (parallel)**: WS3 (student), WS4 (supervisor), WS5 (teacher submit) — concurrent development of three independent portal features
- **Wave 4 (parallel)**: WS8 (tests) — for each finished portal

## Backend Follow-up Required

These items need Phase 1 backend changes before WS3/WS4/WS5 can fully work:

1. `studentClassHistoryQueryDocument` — backend must accept optional `studentId` (null = self) OR add a new `studentSelfClassHistory` query that resolves student by caller's `userId`
2. `studentProfileQueryDocument` — same — null `studentId` → self (the `isAssociatedViewer: true` flag already exists)
3. New backend mutation: `submitStudentLessonReportReflection(classInstanceId, studentNotes, optional: rating)` — persists student co-report. Either:
   - Option A: Add `studentNotes: text` column to `lesson_reports` (simplest)
   - Option B: Add new `student_lesson_reflections` table (more flexible, supports future student rating, images)
4. New backend query: `pendingLessonReviewCountQueryDocument` — returns just count for supervisor dashboard hero
5. New backend query: `teacherPendingDuesSummaryQueryDocument` — returns `{ totalCount, totalAmount, currency }` for supervisor dashboard summary
6. Verify `listSimulatableGroups` in `permission-group-simulation.service.ts` returns `supervisor_default` and `student_default` (it already does — they're seeded by WS10)
7. New backend mutation `markTeacherDuesPaid(dueIds: [String!], teacherPaymentId: String!)` — batch mark paid. (Phase 1 might already have this via `TeacherDueRepository.markAsPaid` — verify GraphQL mutation exists)

## Verification

Run after each Phase 2 work stream:

```bash
~/.bun/bin/bun tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"<ws-id>","files":["<files>"]}'
~/.bun/bin/bun run generate:gqlSchema && ~/.bun/bin/bun codegen  # After WS2
# After all WS:
~/.bun/bin/bun run test:ui:components
~/.bun/bin/bun run test:ui:e2e
~/.bun/bin/bun quality-gate
```

## Estimated Scope Summary

| Work Stream | New Files | Modified Files | Effort |
|---|---|---|---|
| 1: Nav + Pages + Stubs | ~15 | 4 | Medium |
| 2: GraphQL Documents | 4 | 0 | Low-Medium |
| 3: Student Dashboard | ~25 | 1 | High |
| 4: Supervisor Dashboard | ~30 | 1 | High |
| 5: Teacher Report Submit | ~6 | 1 | Medium |
| 6: i18n Labels | ~20 | 6 | Medium |
| 7: Role-Switcher | 0 | 0-2 | Low (verify only) |
| 8: Tests | ~9 | 0 | Medium-High |
| Backend Follow-up | ~5 | 2-3 | Low |
| **Total** | **~114** | **~14** | **Large** |

## Final Verification (Phase 2 Complete)

- Demo user `student@siraj.local` logs in → lands at `/dashboard` → sees student dashboard with prominent "Next class: ... [Join]" CTA + credit balance + recent lesson reports
- Demo user `supervisor@siraj.local` logs in → lands at `/dashboard` → sees supervisor dashboard with pending reviews hero + dues summary + monthly reports shortcut
- Admin "Switch role to…" menu shows both `student_default` and `supervisor_default` options
- Mobile + desktop tier views for all new pages load without errors
- All tsgo + biome + lint + component tests + e2e tests pass
```