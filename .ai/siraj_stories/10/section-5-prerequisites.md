## Section 5: Prerequisites Verification (BLOCKING)

All items in this section must be verified **before executing any task in Story 10**. If any item is not verified, the corresponding prerequisite must be established before proceeding. Story 10 builds directly on Story 9's student lifecycle infrastructure.

---

### 5.0 Security Artifact Verification (Story 9 Baseline)

Story 10's automated enforcement logic depends entirely on Story 9's student status management foundation. The following Story 9 artifacts must be fully deployed:

| **Artifact** | **Path** | **Verification** | **Success Criteria** |
|---|---|---|---|
| Student status DB trigger | `backend/db/migration/student_status_transition_trigger.sql` | `bun test:db` | Trigger `fn_enforce_student_status_transition` exists and validates transitions ✅ |
| `student.manage_status` permission | `backend/db/migration/3-system_permissions_and_groups.sql` line 748 | `grep "manage_status"` | Permission key seeded in DB ✅ |
| `StudentLifecycleService.changeStudentStatus()` | `backend/services/student/student-lifecycle.service.ts:86–148` | Code review | Method exists, checks `student.manage_status`, calls `StudentRepository.changeStatus()` ✅ |
| Story 9 GraphQL mutation `changeStudentStatus` | `backend/graphql/pothos/student.pothos.ts` | `bun codegen` | Mutation registered in schema ✅ |
| Story 9 test suite | `backend/db/test/repo/student.repository.test.ts` | `bun run test:db` | All Story 9 tests pass with 0 failures ✅ |

**If any Story 9 artifact is missing or failing, Story 10 is BLOCKING until Story 9 is fully deployed.**

---

### 5.1 Database Schema Verification

All schema columns used by Story 10 already exist — no new migrations are needed beyond the permission seed entries.

#### `class_instances` table (`backend/db/schema/scheduling.ts`):

- [ ] `isFrozen: boolean` column exists at line 135 with default `false`
  - ✅ (verified — `backend/db/schema/scheduling.ts:135`)
  - Drizzle column definition: `isFrozen: boolean("is_frozen").default(false).notNull()`

- [ ] `outcome: classOutcomeEnum` column exists at line 132 with values `(PENDING, TAKEN, ABSENT, LEAVE)`
  - ✅ (verified — `backend/db/schema/scheduling.ts:132`)

- [ ] `executionState: classExecutionStateEnum` column exists at line 133 with values `(NOT_ACTIVATED, ACTIVATED, RUNNING, COMPLETED)`
  - ✅ (verified — `backend/db/schema/scheduling.ts:133`)

- [ ] `studentId` foreign key exists on `class_instances` linking to `students.id`
  - ✅ (verified — `backend/db/schema/scheduling.ts` — join used in `getDailySchedule()`)

- [ ] `teacherId` foreign key exists on `class_instances` linking to `teachers.id`
  - ✅ (verified — `backend/db/schema/scheduling.ts` — join used in `getDailySchedule()`)

- [ ] `scheduledStartAt` and `scheduledEndAt` timestamp columns exist
  - ✅ (verified — `backend/db/schema/scheduling.ts` — used in `getDailySchedule()`)

- [ ] `durationMinutes` integer column exists
  - ✅ (verified — `backend/db/schema/scheduling.ts` — referenced in `getDailySchedule()`)

- [ ] `deletedAt` timestamp column exists (for soft-delete filtering)
  - ✅ (verified — `backend/db/schema/scheduling.ts` — used in `isNull(classInstances.deletedAt)` pattern)

#### `students` table:

- [ ] `status: studentStatusEnum` column exists with values `(REGULAR, ON_LEAVE, SUSPENDED, ON_TRIAL, DEACTIVATED, GRADUATED)`
  - ✅ (verified — `backend/db/schema/` — referenced in `changeStudentStatus()`)

- [ ] `name` column exists on `students` table
  - ✅ (verified — used in `getDailySchedule()` student join)

#### `teachers` and `users` tables:

- [ ] `teachers.userId` foreign key exists linking to `users.id`
  - ✅ (verified — used in `getDailySchedule()` join pattern)

- [ ] `users.name` column exists
  - ✅ (verified — used in `getDailySchedule()` to get teacher name)

---

### 5.2 Migration Verification

- [ ] `backend/db/migration/3-system_permissions_and_groups.sql` is the current permissions migration file (not a separate seed file)
  - ✅ (verified — line 1 of migration file, used by `bun db seed`)

- [ ] Story 9 permissions are present in the migration (lines ~748–764):
  - `billing.create_invoice` ✅
  - `billing.update_status_paid` ✅
  - `billing.delete_invoice` ✅
  - `student.reassign_teacher` ✅
  - `student.manage_status` ✅
  - `system.sync_notifications` ✅

- [ ] `system_automated` group exists in the migration at slug `system_automated` (line 1063)
  - ✅ (verified — `backend/db/migration/3-system_permissions_and_groups.sql:1063`)
  - Currently assigned: `system.enforce_time_window`, `system.enforce_leave_limit`, `system.sync_notifications`

- [ ] Story 10 permissions are NOT yet in the migration (need to be added by Task A):
  - `system.enforce_suspended_lock` — ❌ (not verified — missing, needs creation in Task A)
  - `system.process_student_leave` — ❌ (not verified — missing, needs creation in Task A)

- [ ] Migration ends at line 1123 with valid SQL (no truncation or syntax errors)
  - ✅ (verified — `backend/db/migration/3-system_permissions_and_groups.sql:1123`)

---

### 5.3 Test Suite Verification

Run before starting Task A to establish baseline:

```bash
# 1. Verify all database tests pass
bun run test:db

# 2. Verify all GraphQL tests pass
bun run test:graphql

# 3. Verify TypeScript compiles without errors
bun tsgo

# 4. Verify linting passes
bun biome:check
bun lint
```

**Expected output:** 0 failures, 0 errors, 0 warnings across all commands. If any command fails, fix the pre-existing issue before proceeding. Story 10 tasks must not introduce regressions.

---

### 5.4 Existing Code Verification

#### Backend Services:

- [ ] `StudentLifecycleService.changeStudentStatus()` exists at lines 86–148
  - ✅ (verified — `backend/services/student/student-lifecycle.service.ts:86–148`)
  - Has `PermissionsService.hasPermission()` call at line 93
  - Calls `StudentRepository.findById(studentId)` at line ~105
  - Calls `StudentRepository.changeStatus()` at line ~120
  - **No side-effects for SUSPENDED/ON_LEAVE yet** — this is Story 10's addition

- [ ] `PermissionsService.hasPermission()` and `PermissionsService.hasAnyPermission()` exist
  - ✅ (verified — `backend/services/auth/permissions.service.ts`)
  - Both methods are used in Story 9 services

- [ ] `getBackendTranslations()` is available
  - ✅ (verified — `backend/lib/intl.ts`)

#### Backend Repositories:

- [ ] `SchedulingRepository.processClassLeave()` exists at line 566
  - ✅ (verified — `backend/db/repo/scheduling.repository.ts:566`)
  - Handles leave for a SINGLE class (teacher-triggered)
  - Creates a successor class instance with idempotency key
  - This is the method `StudentLeaveProcessingService` will reuse for each future class

- [ ] `SchedulingRepository.getClassInstanceById()` exists at line 330
  - ✅ (verified — `backend/db/repo/scheduling.repository.ts:330`)
  - Returns single class with student+teacher joined

- [ ] `StudentRepository.findById()` exists and returns student with `status` field
  - ✅ (verified — `backend/db/repo/student.repository.ts` — used in `StudentLifecycleService`)

- [ ] `SystemSettingsRepository.getIntValue()` exists
  - ✅ (verified — used in existing leave processing — needed by `StudentLeaveProcessingService` for `session_leave_reschedule_offset_days`)

- [ ] `getDailySchedule()` exists in `scheduling-queries.repository.ts:78`
  - ✅ (verified — `backend/db/repo/scheduling-queries.repository.ts:78`)
  - Used as reference pattern for the new `getStatusTrackingRows()` implementation

- [ ] `getDailyMetrics()` uses `isFrozen` at line 35
  - ✅ (verified — `backend/db/repo/scheduling-queries.repository.ts:35`)
  - Confirms `isFrozen` is already a known, importable field from schema

- [ ] `getTeacherFutureClasses()` exists in `scheduling-queries.repository.ts:372`
  - ✅ (verified — `backend/db/repo/scheduling-queries.repository.ts:372`)
  - Used as reference pattern for the new `getStudentFutureClasses()` implementation

#### Drizzle Imports:

- [ ] `gte`, `lt`, `and`, `eq`, `isNull`, `inArray` are already imported in `scheduling.repository.ts`
  - ✅ (verified — `backend/db/repo/scheduling.repository.ts:1` — top-level imports)
  - No new Drizzle imports needed for the new repo methods

---

### 5.5 Frontend Verification

- [ ] `StatusTrackingContainer` imports from `mockStatusTrackingStore` and `mockRescheduleStore`
  - ✅ (verified — `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx`)
  - Task H will replace `mockStatusTrackingStore` import with real Apollo `useQuery`
  - `mockRescheduleStore` import is KEPT (still needed for `setRescheduleSession` in `handleReschedule`)

- [ ] `StatusSessionRow` interface is defined in `mockStatusTrackingStore.ts:13–23`
  - ✅ (verified — `frontend/stores/mockStatusTrackingStore.ts:13–23`)
  - Has fields: `id`, `studentName`, `studentInitials`, `studentAvatarUrl?`, `className`, `teacherName`, `schedule`, `status: SessionStatus`, `holdNote?`
  - Type `SessionStatus = "regular" | "suspended_pending" | "on_leave" | "pending_verification"`
  - This type is NOT moved or modified in Story 10

- [ ] `StatusTrackingDataGrid` and `StatusBadgeAction` import `StatusSessionRow` from `mockStatusTrackingStore`
  - ✅ (verified — these components continue to import from `mockStatusTrackingStore` after Task H)
  - Task H only modifies `StatusTrackingContainer.tsx`, not these child components

- [ ] `StatusTrackingView` imports `StatusSessionRow` from `mockStatusTrackingStore` at line 8
  - ✅ (verified — `frontend/views/dashboard/classes/status/tracking/StatusTrackingView.tsx:8`)
  - This import is NOT changed in Task H

- [ ] NO `statusTrackingSchedule` query exists in `backend/graphql/pothos/`
  - ✅ (verified — grep returns no results)
  - Task E will create this query

- [ ] NO `statusTrackingSchedule` document exists in `frontend/graphql/sharedDocuments/`
  - ✅ (verified — grep returns no results)
  - Task F will create this document

- [ ] `frontend/graphql/sharedDocuments/index.ts` already exports `schedule.documents.ts`
  - ✅ (verified — `frontend/graphql/sharedDocuments/index.ts`)
  - No change needed to `index.ts` in Task F

- [ ] `backend/graphql/pothos/index.ts` already exports `schedule.pothos.ts`
  - ✅ (verified — `backend/graphql/pothos/index.ts`)
  - No change needed to `index.ts` in Task E

- [ ] `DailyScheduleMetrics.suspended` field already exists in `schedule.pothos.ts` at line 10
  - ✅ (verified — `backend/graphql/pothos/schedule.pothos.ts:10`)
  - Uses `isFrozen` already in a Pothos object — confirms the import pattern for the new type

- [ ] `StatusTrackingContainer.stories.tsx` exists with `sizeBytes: 490`
  - ✅ (verified — small file, uses mock store for Storybook — must not be broken by Task H)

---

### 5.6 Pre-Execution Checklist

Before executing Task A, confirm all of the following:

- [ ] `bun run test:db` passes with 0 failures ✅
- [ ] `bun run test:graphql` passes with 0 failures ✅
- [ ] `bun tsgo` passes with 0 errors ✅
- [ ] `bun biome:check` passes with 0 issues ✅
- [ ] `bun lint` passes with 0 issues ✅
- [ ] `system.enforce_suspended_lock` is absent from migration (not yet seeded — correct pre-condition) ✅
- [ ] `system.process_student_leave` is absent from migration (not yet seeded — correct pre-condition) ✅
- [ ] `isFrozen` column confirmed on `class_instances` table ✅
- [ ] `StudentLifecycleService.changeStudentStatus()` has no side-effect logic for SUSPENDED/ON_LEAVE (correct baseline) ✅

**If all items are confirmed, proceed to [Task A](./section-6-tasks/task-a-migration-enum.md).**
