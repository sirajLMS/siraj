## VERIFIED FACTS (do NOT guess or deviate)

### Permissions (from actual file reads):
- `system.enforce_suspended_lock` and `system.process_student_leave` are NOT in `backend/db/migration/3-system_permissions_and_groups.sql` — they must be added
- Migration ends at line 1123, Story 9 permissions end at line 764 (`ON CONFLICT (key) DO UPDATE` block)
- `system_automated` group exists at slug `system_automated` (line 1063), currently has: `system.enforce_time_window`, `system.enforce_leave_limit`, `system.sync_notifications`
- `AppPermission` enum in `shared/lib/enum.ts` ends at line 492 — last entries are `SYSTEM_SYNC_NOTIFICATIONS`, `TEST_SYSTEM_ONLY`, `TEST_CUSTOM_ONLY`
- `SystemPermissionGroupSlug` enum at lines 494–500 has `SUPER_ADMIN`, `ACADEMY_ADMIN`, `TEACHER_DEFAULT`, `PARENT_DEFAULT`, `STAFF_DEFAULT` — no `SYSTEM_AUTOMATED` slug

### Schema (verified from actual file reads):
- `class_instances` table in `backend/db/schema/scheduling.ts` has `isFrozen: boolean` at line 135 (default false)
- `class_instances` has `outcome: classOutcomeEnum` (PENDING, TAKEN, ABSENT, LEAVE) at line 132
- `class_instances` has `executionState: classExecutionStateEnum` (NOT_ACTIVATED, ACTIVATED, RUNNING, COMPLETED) at line 133
- `students` table has `status: studentStatusEnum` with values: REGULAR, ON_LEAVE, SUSPENDED, ON_TRIAL, DEACTIVATED, GRADUATED
- DB trigger `fn_enforce_student_status_transition` in `student_status_transition_trigger.sql` allows REGULAR→SUSPENDED and REGULAR→ON_LEAVE transitions

### Existing Services (verified):
- `StudentLifecycleService` in `backend/services/student/student-lifecycle.service.ts` — has `changeStudentStatus()` (lines 86–148) which calls `StudentRepository.changeStatus()` — NO side-effects for SUSPENDED/ON_LEAVE yet
- `ClassSessionService` in `backend/services/session/class-session.service.ts` — has `activate()` which calls `SystemRulesService.assertActivationTimeWindow()` — this is where the SUSPENDED check should be added
- `SchedulingRepository.processClassLeave()` at line 566 — handles leave for a SINGLE class (teacher-triggered). Different from bulk ON_LEAVE processing

### Existing Repo Methods (verified from actual scheduling.repository.ts reads):
- `SchedulingRepository.getClassInstanceById()` at line 330 — returns single class with student+teacher joined
- `getDailySchedule()` in `scheduling-queries.repository.ts:78` — returns class rows joined with student and teacher
- `getDailyMetrics()` in `scheduling-queries.repository.ts:18` — uses `isFrozen` already at line 35: `suspended: sql<number>\`sum(case when ${classInstances.isFrozen} = true then 1 else 0 end)\`
- `getTeacherFutureClasses()` in `scheduling-queries.repository.ts:372` — returns future classes, filters by NOT_ACTIVATED and ACTIVATED states

### Existing Frontend (verified):
- `StatusTrackingContainer` at `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx` imports from `mockStatusTrackingStore` and `mockRescheduleStore`
- `StatusSessionRow` interface defined in `mockStatusTrackingStore.ts:13–23` has: `id`, `studentName`, `studentInitials`, `studentAvatarUrl?`, `className`, `teacherName`, `schedule`, `status: SessionStatus`, `holdNote?`
- `SessionStatus` type = `"regular" | "suspended_pending" | "on_leave" | "pending_verification"`
- `StatusTrackingDataGrid` and `StatusBadgeAction` both import `StatusSessionRow` from `mockStatusTrackingStore`
- `StatusTrackingView` imports `StatusSessionRow` from `mockStatusTrackingStore` (line 8)
- NO `statusTrackingSchedule` query exists anywhere in `backend/graphql/pothos/` or `frontend/graphql/sharedDocuments/`

### Other:
- `frontend/graphql/sharedDocuments/index.ts` exports all documents — must be updated
- `backend/graphql/pothos/index.ts` already exports `schedule.pothos.ts`
- `DailyScheduleMetrics.suspended` field already exists in pothos (schedule.pothos.ts line 10)

---

## FILES TO CREATE

Create the following files. Each must be thorough, self-contained, and have complete code blocks (no `...` placeholders).

---

### FILE 1: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-0-metadata.md`

Content:
```markdown
## Section 0: Story Metadata & Context

- **Source story:** `.ai/siraj_stories/10.md` (Part 11 - Permissions & Permission Groups, timestamps 00:00 - 01:57)
- **Security baseline:** `.ai/siraj_stories/9/` (mandatory prerequisite — Invoice Generation & Student Lifecycle sprint must be fully deployed)
- **Story scope:** Implements two system-automated permissions that enforce cascading rules on student status changes to `SUSPENDED` or `ON_LEAVE`. `system.enforce_suspended_lock` backs automated UI control revocation on the teacher's class schedule (class stays visible but action buttons are hidden). `system.process_student_leave` backs the automated future-class protection workflow (upcoming classes marked as excused, queued for rescheduling so no paid classes are lost). Both permissions are system-internal — triggered by the existing `student.manage_status` flow from Story 9. Key deliverables: permission seeds, service-layer enforcement hooks in `StudentLifecycleService.changeStudentStatus()`, new `statusTrackingSchedule` GraphQL query, and migration of `StatusTrackingContainer` from `mockStatusTrackingStore` to real Apollo `useQuery`.
- **Target roles:** System Automated (enforcement permissions). Academy Admin / Super Admin already hold `student.manage_status` (Story 9) which triggers enforcement. Teacher role is read-only observer of the UI lock.
- **Status:** Planning phase — awaiting approval for execution.

---

### 0.1 Business Objectives

1. **Teacher UI Safety via Suspension Lock (`system.enforce_suspended_lock`):** When admin changes student to `SUSPENDED`, the class stays visible on teacher's schedule (so teacher sees the cancellation) but the system sets `isFrozen = true` on the class instance. The frontend renders the class with a `suspended_pending` status badge and all action buttons (Activate, Start, Absent, Leave) are hidden/disabled. Prevents teachers from opening virtual rooms for suspended students.

2. **Financial Quota Protection via Leave Processing (`system.process_student_leave`):** When admin changes student to `ON_LEAVE`, the system evaluates upcoming scheduled classes (`executionState IN ['NOT_ACTIVATED', 'ACTIVATED']`). Each future class is marked as excused (`outcome = LEAVE`, `isRescheduled = true`) and a new successor class instance is created to be rescheduled — ensuring no paid classes are permanently lost.

3. **Separation Between Suspension and Leave:** Suspension is punitive/administrative — freezes class interactivity (`isFrozen = true`). Leave is accommodating — preserves financial investment by rescheduling missed classes. Both are distinct automated rules with distinct permission keys.

4. **Real Data in Status Tracking Dashboard:** `StatusTrackingContainer` currently imports from `mockStatusTrackingStore` (verified: `frontend/stores/mockStatusTrackingStore.ts:115`). This sprint replaces it with a real `statusTrackingSchedule` GraphQL query returning class rows enriched with student status.

---

### 0.2 Scope Boundaries

**In scope:**
- New permission seeds in `backend/db/migration/3-system_permissions_and_groups.sql` for `system.enforce_suspended_lock` and `system.process_student_leave`
- New `AppPermission` enum entries in `shared/lib/enum.ts` (lines 489–492 context)
- New repo method `SchedulingRepository.getStatusTrackingRows()` in `backend/db/repo/scheduling.repository.ts`
- New repo method `SchedulingRepository.bulkFreezeStudentClasses()` in `backend/db/repo/scheduling.repository.ts`
- Extension of `StudentLifecycleService.changeStudentStatus()` in `backend/services/student/student-lifecycle.service.ts` to invoke side-effects
- New service `SuspendedLockService` in `backend/services/student/suspended-lock.service.ts`
- New service `StudentLeaveProcessingService` in `backend/services/student/student-leave-processing.service.ts`
- New Pothos query `statusTrackingSchedule` in `backend/graphql/pothos/schedule.pothos.ts`
- New frontend document `statusTrackingScheduleQueryDocument` in `frontend/graphql/sharedDocuments/schedule.documents.ts`
- Migration of `StatusTrackingContainer` to real `useQuery`
- Repository tests for new repo methods
- GraphQL integration tests for `statusTrackingSchedule` query
- i18n keys for new strings if needed

**Out of scope:**
- New database tables or schema columns (`isFrozen` already exists on `class_instances` at `scheduling.ts:135`)
- Modifying DB trigger `fn_enforce_student_status_transition` (already allows REGULAR→SUSPENDED and REGULAR→ON_LEAVE at `student_status_transition_trigger.sql:18–29`)
- `student.manage_status` permission (already seeded in Story 9 at migration line 748)
- New teacher-facing UI (suspension lock rendered via existing `StatusBadgeAction.tsx` disabled button for `suspended_pending`)
- Automated email/push notifications on status change
- Rescheduling UI for ON_LEAVE classes (reschedule tracking view already exists)
```

---

### FILE 2: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-1-core-principles.md`

Write the full Section 1 based on the template from AGENTS_STORY_PLANNING.md. Include all subsections 1.1 through 1.7 with real task-specific details for Story 10. Use the standard quality gate checklist verbatim. Include the testing requirements for repository tests and GraphQL tests.

---

### FILE 3: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-2-rbac-permissions.md`

Write Section 2 RBAC Permissions with:

**2.1 New Permissions table** (2 rows):
| Permission Key | Category | Group | UI Gate | Backend Service Method | GraphQL Mutation |
| `system.enforce_suspended_lock` | System | System Automated | Not user-facing — triggered when admin sets student to SUSPENDED | `SuspendedLockService.enforceSuspendedLock()` | None (called internally by `StudentLifecycleService.changeStudentStatus()`) |
| `system.process_student_leave` | System | System Automated | Not user-facing — triggered when admin sets student to ON_LEAVE | `StudentLeaveProcessingService.processStudentLeave()` | None (called internally by `StudentLifecycleService.changeStudentStatus()`) |

**2.2 Permission Mapping** — show relationship to `student.manage_status`

**2.3 Group Assignments** — `system_automated` group gets both new permissions

**2.4 Self-Scoping** — system permissions, not user-scoped

**2.5 New AppPermission Enum Entries** (show exact code to add after `SYSTEM_SYNC_NOTIFICATIONS` at line 489 of `shared/lib/enum.ts`):
```typescript
// Story 10: Automated Student Status Enforcement
SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock",
SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave",
```

---

### FILE 4: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-3-state-machine.md`

Write Section 3 with Mermaid state diagrams showing:
1. Student status transitions (based on verified trigger: ON_TRIAL→REGULAR/DEACTIVATED, REGULAR→SUSPENDED/ON_LEAVE/DEACTIVATED/GRADUATED, SUSPENDED→REGULAR/DEACTIVATED, ON_LEAVE→REGULAR/DEACTIVATED)
2. Class instance state after student suspension (isFrozen=true, executionState stays NOT_ACTIVATED, action buttons hidden)
3. Class instance processing when student goes ON_LEAVE (future classes: executionState=NOT_ACTIVATED → outcome=LEAVE, isRescheduled=true, successor created)

---

### FILE 5: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-4-security-threats.md`

Write Section 4 with these specific threats:

**Threat 1: Unauthorized Status Change Triggering Side-Effects**
- Gap: `StudentLifecycleService.changeStudentStatus()` will now trigger bulk DB operations. Must ensure only actors with `student.manage_status` permission can trigger it — already checked by existing `PermissionsService.hasPermission()` call at line 93 of `student-lifecycle.service.ts`.
- Fix: New side-effect services (`SuspendedLockService`, `StudentLeaveProcessingService`) are called ONLY after the permission check passes. They do NOT re-check permissions themselves — the caller (StudentLifecycleService) is responsible.
- Test Requirements: GraphQL test confirming an actor without `student.manage_status` cannot trigger `changeStudentStatus` — and therefore cannot trigger side-effects.

**Threat 2: IDOR on Bulk Class Freeze**
- Gap: `bulkFreezeStudentClasses()` will update all future classes for a given studentId. Must ensure the studentId belongs to a real student.
- Fix: `SuspendedLockService.enforceSuspendedLock()` first calls `StudentRepository.findById(studentId)` to confirm existence. The repo method uses the studentId from the authenticated service call — not from user-supplied arbitrary input.
- Test Requirements: Verify `bulkFreezeStudentClasses()` with a non-existent studentId returns 0 rows updated (not an error).

**Threat 3: Double-Processing of Leave**
- Gap: If `changeStudentStatus()` is called multiple times for ON_LEAVE, future classes could be processed twice — creating duplicate successor instances.
- Fix: `StudentLeaveProcessingService.processStudentLeave()` filters future classes by `executionState IN ['NOT_ACTIVATED']` only (not ACTIVATED/RUNNING). Also uses idempotency key pattern `leave-reschedule-{classId}-{scheduledStartAt}` matching the existing `createRescheduledSuccessor()` function (verified at `scheduling.repository.ts:422`) — `ON CONFLICT DO NOTHING` on the idempotency key unique index.
- Test Requirements: Calling processStudentLeave twice for the same student should not create duplicate successor instances.

**Threat 4: isFrozen Not Cleared on SUSPENDED → REGULAR Restoration**
- Gap: When student transitions back from SUSPENDED to REGULAR, the `isFrozen` flag on their class instances is NOT automatically cleared by the DB trigger.
- Fix: `StudentLifecycleService.changeStudentStatus()` must also check if `newStatus === 'REGULAR'` and if `currentStatus === 'SUSPENDED'`, then call `SchedulingRepository.bulkUnfreezeStudentClasses(studentId)` to clear `isFrozen = false` on all future frozen classes.
- Test Requirements: Verify that after SUSPENDED→REGULAR transition, all previously frozen classes have `isFrozen = false`.

---

### FILE 6: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-5-prerequisites.md`

Write Section 5 with verified facts for each prerequisite. Use `✅ (verified — path:line)` format.

Include:
- **5.0 Security Artifact Verification** — student status trigger, Story 9 permissions
- **5.1 Database Schema** — `isFrozen` column, `class_instances` table, `students.status` enum
- **5.2 Migration** — Story 9 permissions already seeded
- **5.3 Test Suite** — `bun run test:db`, `bun run test:graphql`
- **5.4 Existing Code** — `StudentLifecycleService.changeStudentStatus()`, `SchedulingRepository.processClassLeave()`, `StudentRepository.findById()`, `SchedulingRepository.getClassInstanceById()`
- **5.5 Frontend** — `StatusTrackingContainer` imports `mockStatusTrackingStore`, `mockRescheduleStore`

---

### FILE 7: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-6-tasks\task-a-migration-enum.md`

Write Task A — Migration & Enum with FULL code blocks (no placeholders).

Objective: Add `system.enforce_suspended_lock` and `system.process_student_leave` to the permission migration and AppPermission enum.

Target Files:
- `backend/db/migration/3-system_permissions_and_groups.sql` (Modify — insert two new permission rows before line 764's `ON CONFLICT` block AND add to `system_automated` group assignment at line 1063–1068)
- `shared/lib/enum.ts` (Modify — add 2 entries after `SYSTEM_SYNC_NOTIFICATIONS = "system.sync_notifications"` at line 489)

For the migration SQL, show exact SQL to INSERT the two new permissions into the existing INSERT block before the `ON CONFLICT (key) DO UPDATE` at line 764. Also show the exact update to the `system_automated` group assignment block at lines 1063–1068.

Complete code blocks showing:
1. Exact SQL fragment to add (two new permission rows in the VALUES block before `ON CONFLICT`):
```sql
    -- Story 10: Automated Student Status Enforcement
    (
        gen_random_uuid (),
        'system.enforce_suspended_lock',
        'system',
        'enforce_suspended_lock',
        'Automated rule that locks UI controls on teacher schedule when student is Suspended',
        'System',
        true
    ),
    (
        gen_random_uuid (),
        'system.process_student_leave',
        'system',
        'process_student_leave',
        'Automated workflow that marks future classes as excused and queues rescheduling when student is On Leave',
        'System',
        true
    ),
```

2. Update to `system_automated` group block — change from:
```sql
    AND p.key IN (
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'system.sync_notifications'
    );
```
To:
```sql
    AND p.key IN (
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'system.sync_notifications',
        'system.enforce_suspended_lock',
        'system.process_student_leave'
    );
```

3. Exact enum entries to add in `shared/lib/enum.ts` after line 489:
```typescript
  // Story 10: Automated Student Status Enforcement
  SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock",
  SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave",
```

Migration protocol commands:
```bash
bun db cleanGenerate
bun db reset
bun db seed
bun test:db
```

Success Criteria + Quality Gate (verbatim from AGENTS_STORY_PLANNING.md).

---

### FILE 8: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-6-tasks\task-b-repositories.md`

Write Task B — Repositories with FULL code blocks.

Objective: Add three new repository methods:
1. `SchedulingRepository.getStatusTrackingRows()` — returns class instances joined with student status for admin status tracking (used by new GraphQL query)
2. `SchedulingRepository.bulkFreezeStudentClasses()` — sets `isFrozen = true` on all future NOT_ACTIVATED classes for a student
3. `SchedulingRepository.bulkUnfreezeStudentClasses()` — clears `isFrozen = false` on future frozen classes for a student (needed for SUSPENDED→REGULAR restoration)

Target File: `backend/db/repo/scheduling.repository.ts`

Full implementation for `getStatusTrackingRows()`:
```typescript
export type StatusTrackingRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  studentStatus: string;
  teacherId: string;
  teacherName: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: string;
  outcome: string;
  isFrozen: boolean;
};

export const getStatusTrackingRows = async (
  date: Date,
  options?: { search?: string; viewerTimezone?: string },
  tx?: DBTransaction
): Promise<StatusTrackingRow[]> => {
  const runner = async (t: DBTransaction): Promise<StatusTrackingRow[]> => {
    const { getDayBoundaries } = await import("@/backend/lib/timezone");
    const viewerTimezone = options?.viewerTimezone ?? "UTC";
    const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, viewerTimezone);
    const search = options?.search;

    const rows = await t
      .select({
        id: classInstances.id,
        studentId: students.id,
        studentName: students.name,
        studentStatus: students.status,
        teacherId: classInstances.teacherId,
        scheduledStartAt: classInstances.scheduledStartAt,
        scheduledEndAt: classInstances.scheduledEndAt,
        durationMinutes: classInstances.durationMinutes,
        executionState: classInstances.executionState,
        outcome: classInstances.outcome,
        isFrozen: classInstances.isFrozen,
        teacherUserName: users.name,
      })
      .from(classInstances)
      .innerJoin(students, eq(classInstances.studentId, students.id))
      .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(
        and(
          isNull(classInstances.deletedAt),
          gte(classInstances.scheduledStartAt, startOfDayUtc),
          lt(classInstances.scheduledStartAt, endOfDayUtc)
        )
      )
      .orderBy(classInstances.scheduledStartAt);

    let results = rows.map(r => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.studentName,
      studentInitials: r.studentName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase() ?? "")
        .join(""),
      studentStatus: r.studentStatus,
      teacherId: r.teacherId,
      teacherName: r.teacherUserName,
      scheduledStartAt: r.scheduledStartAt,
      scheduledEndAt: r.scheduledEndAt,
      durationMinutes: r.durationMinutes,
      executionState: r.executionState,
      outcome: r.outcome,
      isFrozen: r.isFrozen,
    }));

    if (search) {
      const lower = search.toLowerCase();
      results = results.filter(
        r =>
          r.studentName.toLowerCase().includes(lower) ||
          r.teacherName.toLowerCase().includes(lower)
      );
    }

    return results;
  };

  return tx ? runner(tx) : db.transaction((t: DBTransaction) => runner(t));
};
```

Full implementation for `bulkFreezeStudentClasses()`:
```typescript
export const bulkFreezeStudentClasses = async (
  studentId: string,
  fromDate: Date,
  tx?: DBTransaction
): Promise<number> => {
  const runner = async (t: DBTransaction): Promise<number> => {
    const result = await t
      .update(classInstances)
      .set({ isFrozen: true, updatedAt: new Date() })
      .where(
        and(
          eq(classInstances.studentId, studentId),
          isNull(classInstances.deletedAt),
          gte(classInstances.scheduledStartAt, fromDate),
          inArray(classInstances.executionState, ["NOT_ACTIVATED", "ACTIVATED"])
        )
      )
      .returning({ id: classInstances.id });
    return result.length;
  };
  return tx ? runner(tx) : db.transaction((t: DBTransaction) => runner(t));
};
```

Full implementation for `bulkUnfreezeStudentClasses()`:
```typescript
export const bulkUnfreezeStudentClasses = async (
  studentId: string,
  fromDate: Date,
  tx?: DBTransaction
): Promise<number> => {
  const runner = async (t: DBTransaction): Promise<number> => {
    const result = await t
      .update(classInstances)
      .set({ isFrozen: false, updatedAt: new Date() })
      .where(
        and(
          eq(classInstances.studentId, studentId),
          isNull(classInstances.deletedAt),
          gte(classInstances.scheduledStartAt, fromDate),
          eq(classInstances.isFrozen, true)
        )
      )
      .returning({ id: classInstances.id });
    return result.length;
  };
  return tx ? runner(tx) : db.transaction((t: DBTransaction) => runner(t));
};
```

Also add `StatusTrackingRow`, `getStatusTrackingRows`, `bulkFreezeStudentClasses`, `bulkUnfreezeStudentClasses` exports to the `SchedulingRepository` namespace.

Note: The imports needed at top of `scheduling.repository.ts` already include `gte`, `lt`, `and`, `eq`, `isNull`, `inArray` — verified from file read at line 1.

Success Criteria + Quality Gate verbatim.

---

### FILE 9: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-6-tasks\task-c-repo-tests.md`

Write Task C — Repository Tests with FULL test code blocks.

Objective: Test all three new repository methods.

Target File: `backend/db/test/repo/scheduling.repository.test.ts` (Modify — add new describe blocks)

Test cases for `getStatusTrackingRows`:
- Returns class rows for a given date with correct student status
- Filters by search term on student name
- Filters by search term on teacher name
- Returns `isFrozen: true` for classes with frozen flag
- Returns empty array when no classes scheduled on the date

Test cases for `bulkFreezeStudentClasses`:
- Sets `isFrozen = true` on all NOT_ACTIVATED future classes for student
- Does NOT freeze COMPLETED or RUNNING classes
- Returns count of frozen rows
- Returns 0 for non-existent studentId (no error)

Test cases for `bulkUnfreezeStudentClasses`:
- Sets `isFrozen = false` on all frozen future classes for student
- Does NOT modify non-frozen classes
- Returns count of unfrozen rows

Test execution:
```bash
bun run test:db
bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
```

---

### FILE 10: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-6-tasks\task-d-services.md`

Write Task D — Services with FULL code blocks.

Objective: Create two new services and extend `StudentLifecycleService.changeStudentStatus()`.

Dependencies: Depends on Task B (new repo methods).

Target Files:
- `backend/services/student/suspended-lock.service.ts` (Create NEW)
- `backend/services/student/student-leave-processing.service.ts` (Create NEW)
- `backend/services/student/student-lifecycle.service.ts` (Modify — extend `changeStudentStatus()`)

**Complete code for `suspended-lock.service.ts`:**
```typescript
import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { logger } from "@/backend/lib/logger";
import { AppPermission } from "@/shared/lib/enum";

export namespace SuspendedLockService {
  /**
   * Enforces the suspended student lock by setting isFrozen = true on all
   * future NOT_ACTIVATED or ACTIVATED class instances for the student.
   *
   * This implements the system.enforce_suspended_lock permission behavior.
   * Called internally by StudentLifecycleService.changeStudentStatus() after
   * a REGULAR -> SUSPENDED transition.
   *
   * Does NOT require a separate permission check — the caller
   * (StudentLifecycleService) has already verified student.manage_status.
   */
  export const PERMISSION = AppPermission.SYSTEM_ENFORCE_SUSPENDED_LOCK;

  export async function enforceSuspendedLock(
    studentId: string,
    actorUserId: string
  ): Promise<{ frozenCount: number }> {
    const fromDate = new Date();
    const frozenCount = await SchedulingRepository.bulkFreezeStudentClasses(
      studentId,
      fromDate
    );

    logger.info("Suspended lock enforced: classes frozen", {
      studentId,
      actorUserId,
      frozenCount,
      fromDate: fromDate.toISOString(),
    });

    return { frozenCount };
  }

  export async function releaseSuspendedLock(
    studentId: string,
    actorUserId: string
  ): Promise<{ unfrozenCount: number }> {
    const fromDate = new Date();
    const unfrozenCount = await SchedulingRepository.bulkUnfreezeStudentClasses(
      studentId,
      fromDate
    );

    logger.info("Suspended lock released: classes unfrozen", {
      studentId,
      actorUserId,
      unfrozenCount,
      fromDate: fromDate.toISOString(),
    });

    return { unfrozenCount };
  }
}
```

**Complete code for `student-leave-processing.service.ts`:**
```typescript
import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { logger } from "@/backend/lib/logger";
import { SystemSettingsRepository } from "@/backend/db/repo/system-settings.repository";
import { AppPermission } from "@/shared/lib/enum";

export interface LeaveProcessingResult {
  readonly processedCount: number;
  readonly successorIds: string[];
}

export namespace StudentLeaveProcessingService {
  /**
   * Processes future classes when a student transitions to ON_LEAVE.
   *
   * This implements the system.process_student_leave permission behavior.
   * Called internally by StudentLifecycleService.changeStudentStatus() after
   * a REGULAR -> ON_LEAVE transition.
   *
   * For each future NOT_ACTIVATED class:
   * - Marks original as LEAVE outcome (isRescheduled = true)
   * - Creates a successor class instance offset by system setting
   *   'session_leave_reschedule_offset_days' (default: 7 days)
   *
   * Does NOT require a separate permission check — the caller
   * (StudentLifecycleService) has already verified student.manage_status.
   */
  export const PERMISSION = AppPermission.SYSTEM_PROCESS_STUDENT_LEAVE;

  export async function processStudentLeave(
    studentId: string,
    actorUserId: string,
    locale?: string
  ): Promise<LeaveProcessingResult> {
    const fromDate = new Date();

    // Fetch only NOT_ACTIVATED future classes (safe to process without activation check)
    const futureClasses = await SchedulingRepository.getStudentFutureClasses(
      studentId,
      fromDate
    );

    const notActivatedClasses = futureClasses.filter(
      c => c.executionState === "NOT_ACTIVATED"
    );

    if (notActivatedClasses.length === 0) {
      logger.info("No future classes to process for ON_LEAVE student", {
        studentId,
        actorUserId,
      });
      return { processedCount: 0, successorIds: [] };
    }

    const offsetDays = await SystemSettingsRepository.getIntValue(
      "session_leave_reschedule_offset_days",
      7
    );

    const successorIds: string[] = [];

    for (const cls of notActivatedClasses) {
      try {
        const result = await SchedulingRepository.processClassLeave(
          cls.id,
          "Student marked as On Leave by administrator",
          actorUserId,
          undefined,
          locale
        );
        successorIds.push(result.successorId);
      } catch (error) {
        logger.error("Failed to process leave for class instance", {
          classInstanceId: cls.id,
          studentId,
          actorUserId,
          error,
        });
        // Continue processing remaining classes — one failure should not block others
      }
    }

    logger.info("Student leave processing completed", {
      studentId,
      actorUserId,
      processedCount: successorIds.length,
      offsetDays,
    });

    return { processedCount: successorIds.length, successorIds };
  }
}
```

**Extension to `student-lifecycle.service.ts` — `changeStudentStatus()` updated function:**

Add imports at top:
```typescript
import { SuspendedLockService } from "./suspended-lock.service";
import { StudentLeaveProcessingService } from "./student-leave-processing.service";
```

Replace the existing `changeStudentStatus` body after the `StudentRepository.changeStatus()` call to add side-effect dispatch:
```typescript
  export async function changeStudentStatus(
    actorUserId: string,
    studentId: string,
    newStatus: string,
    expectedVersion?: number,
    locale?: string
  ): Promise<ChangeStudentStatusResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENT_MANAGE_STATUS);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("studentNotFound", { id: studentId }));
    }

    const currentStatus = student.status;
    const allowedTargets = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTargets.includes(newStatus)) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(
        tFunc("invalidStatusTransition", {
          currentStatus,
          newStatus,
        })
      );
    }

    try {
      const updated = await StudentRepository.changeStatus(
        studentId,
        newStatus as StudentStatus,
        expectedVersion,
        undefined,
        locale
      );

      logger.info("Student status changed", {
        actorUserId,
        studentId,
        previousStatus: currentStatus,
        newStatus: updated.status,
      });

      // Side-effect: enforce suspended lock when student becomes SUSPENDED
      if (newStatus === "SUSPENDED") {
        await SuspendedLockService.enforceSuspendedLock(studentId, actorUserId);
      }

      // Side-effect: release suspended lock when student returns from SUSPENDED to REGULAR
      if (currentStatus === "SUSPENDED" && newStatus === "REGULAR") {
        await SuspendedLockService.releaseSuspendedLock(studentId, actorUserId);
      }

      // Side-effect: process future leave classes when student becomes ON_LEAVE
      if (newStatus === "ON_LEAVE") {
        await StudentLeaveProcessingService.processStudentLeave(
          studentId,
          actorUserId,
          locale
        );
      }

      return {
        id: updated.id,
        status: updated.status,
        version: updated.version,
      };
    } catch (error) {
      logger.error("Failed to change student status", {
        actorUserId,
        studentId,
        newStatus,
        error,
      });
      throw error;
    }
  }
```

Note: `SchedulingRepository.getStudentFutureClasses()` needs to be added to scheduling.repository.ts as well (in Task B). Add it to the target files list:
```typescript
export const getStudentFutureClasses = async (
  studentId: string,
  fromDate: Date,
  tx?: DBTransaction
): Promise<{ id: string; executionState: string; scheduledStartAt: Date }[]> => {
  const queryDb = tx ?? db;
  const rows = await queryDb
    .select({
      id: classInstances.id,
      executionState: classInstances.executionState,
      scheduledStartAt: classInstances.scheduledStartAt,
    })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.studentId, studentId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, fromDate),
        inArray(classInstances.executionState, ["NOT_ACTIVATED", "ACTIVATED"])
      )
    )
    .orderBy(classInstances.scheduledStartAt);
  return rows;
};
```

Success Criteria + Quality Gate verbatim.

---

### FILE 11: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-6-tasks\task-e-graphql-pothos.md`

Write Task E — Backend GraphQL Pothos with FULL code blocks.

Dependencies: Depends on Task D.

Target File: `backend/graphql/pothos/schedule.pothos.ts` (Modify — add new `StatusTrackingScheduleRow` type and `statusTrackingSchedule` query)

The file already has `DailyScheduleMetrics`, `DailyScheduleList`, `RescheduleTrackingRow`, `RescheduleTrackingMetrics`, `RescheduleTrackingInput` types (verified from actual file read).

Add at end of `schedule.pothos.ts`:

```typescript
// ─── Status Tracking Schedule Row ─────────────────────────────────────────────

export type StatusTrackingScheduleRowDefinition = {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  studentStatus: string;
  teacherId: string;
  teacherName: string;
  scheduledStartAt: Date | string;
  scheduledEndAt: Date | string;
  durationMinutes: number;
  executionState: string;
  outcome: string;
  isFrozen: boolean;
};

const StatusTrackingScheduleRowRef =
  gqlSchemaBuilder.objectRef<StatusTrackingScheduleRowDefinition>("StatusTrackingScheduleRow");

export const StatusTrackingScheduleRowPothosObject = StatusTrackingScheduleRowRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    studentId: t.exposeString("studentId"),
    studentName: t.exposeString("studentName"),
    studentInitials: t.exposeString("studentInitials"),
    studentStatus: t.exposeString("studentStatus"),
    teacherId: t.exposeString("teacherId"),
    teacherName: t.exposeString("teacherName"),
    scheduledStartAt: t.expose("scheduledStartAt", { type: "DateTime" }),
    scheduledEndAt: t.expose("scheduledEndAt", { type: "DateTime" }),
    durationMinutes: t.exposeInt("durationMinutes"),
    executionState: t.exposeString("executionState"),
    outcome: t.exposeString("outcome"),
    isFrozen: t.exposeBoolean("isFrozen"),
  }),
});
```

And add the query field (in a separate gqlSchemaBuilder.queryField call, importing ScheduleService or calling SchedulingRepository via a service):

Also add import to the new schedule service.

Note: since there's no `ScheduleService` wrapper for this query yet, create a thin `ScheduleQueryService` in `backend/services/schedule/` and show the full code.

Create `backend/services/schedule/schedule-query.service.ts`:
```typescript
import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { getBackendTranslations } from "@/backend/lib/intl";
import { AppPermission } from "@/shared/lib/enum";

export namespace ScheduleQueryService {
  export async function getStatusTrackingSchedule(
    actorUserId: string,
    date: Date,
    options?: { search?: string; viewerTimezone?: string },
    locale?: string
  ) {
    const hasPermission = await PermissionsService.hasAnyPermission(actorUserId, [
      AppPermission.SCHEDULE_VIEW_ALL,
      AppPermission.DASHBOARD_VIEW_METRICS,
    ]);
    if (!hasPermission) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }
    return SchedulingRepository.getStatusTrackingRows(date, options);
  }
}
```

Then add the query field in `schedule.pothos.ts`:
```typescript
gqlSchemaBuilder.queryField("statusTrackingSchedule", t =>
  t.field({
    type: [StatusTrackingScheduleRowRef],
    args: {
      date: t.arg.string({ required: true }),
      search: t.arg.string({ required: false }),
      viewerTimezone: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const date = new Date(args.date);
      return ScheduleQueryService.getStatusTrackingSchedule(
        ctx.user?.id ?? "",
        date,
        {
          search: args.search ?? undefined,
          viewerTimezone: args.viewerTimezone ?? undefined,
        },
        ctx.locale
      );
    },
  })
);
```

After implementation:
```bash
bun run generate:gqlSchema
bun codegen
```

Success Criteria + Quality Gate verbatim.

---

### FILE 12: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-6-tasks\task-f-frontend-documents.md`

Write Task F — Frontend GraphQL Documents with FULL code blocks.

Dependencies: Depends on Task E (backend schema generated and codegen run).

Target Files:
- `frontend/graphql/sharedDocuments/schedule.documents.ts` (Modify — add new document)
- `frontend/graphql/sharedDocuments/index.ts` (already exports schedule.documents.ts — no change needed)

Add to end of `schedule.documents.ts`:
```typescript
export const statusTrackingScheduleQueryDocument: TypedDocumentNode<
  Operations.StatusTrackingScheduleQuery,
  Types.QueryStatusTrackingScheduleArgs
> = gql`
  query statusTrackingSchedule($date: String!, $search: String, $viewerTimezone: String) {
    statusTrackingSchedule(date: $date, search: $search, viewerTimezone: $viewerTimezone) {
      id
      studentId
      studentName
      studentInitials
      studentStatus
      teacherId
      teacherName
      scheduledStartAt
      scheduledEndAt
      durationMinutes
      executionState
      outcome
      isFrozen
    }
  }
`;
```

Verify after codegen that `Operations.StatusTrackingScheduleQuery` and `Types.QueryStatusTrackingScheduleArgs` are generated correctly.

Run:
```bash
bun run generate:gqlSchema
bun codegen
```

Success Criteria + Quality Gate verbatim.

---

### FILE 13: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-6-tasks\task-g-graphql-tests.md`

Write Task G — GraphQL Tests with FULL test code blocks.

Dependencies: Depends on Task F.

Target File: `frontend/graphql/test/` (add new test file for `statusTrackingSchedule`)

Test cases:
- Authorized admin can fetch statusTrackingSchedule for a date
- Teacher (no SCHEDULE_VIEW_ALL permission) gets unauthorized error
- Result includes `isFrozen: true` for suspended students' classes
- Result includes `studentStatus: 'SUSPENDED'` for frozen classes
- Search filter narrows results by student name

Run:
```bash
bun run test:graphql
```

Success Criteria + Quality Gate verbatim.

---

### FILE 14: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-6-tasks\task-h-frontend-views.md`

Write Task H — Frontend Views migration with FULL code blocks.

Dependencies: Depends on Task F.

Objective: Replace mock store imports in `StatusTrackingContainer` with real Apollo `useQuery`.

Key challenge: The existing `StatusSessionRow` interface (in `mockStatusTrackingStore.ts`) uses `status: SessionStatus` where `SessionStatus = "regular" | "suspended_pending" | "on_leave" | "pending_verification"`. The new GraphQL data returns `studentStatus: string` (e.g., `SUSPENDED`, `ON_LEAVE`, `REGULAR`) and `isFrozen: boolean`. A mapping function is needed.

Mapping logic (show complete function):
```typescript
function mapToSessionStatus(
  studentStatus: string,
  isFrozen: boolean,
  executionState: string
): SessionStatus {
  if (isFrozen || studentStatus === "SUSPENDED") {
    return "suspended_pending";
  }
  if (studentStatus === "ON_LEAVE") {
    return "on_leave";
  }
  if (executionState === "NOT_ACTIVATED") {
    return "pending_verification";
  }
  return "regular";
}
```

Target File: `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx` (Modify)

Full new implementation:
```typescript
"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { useRescheduleStore } from "@/frontend/stores/mockRescheduleStore";
import { statusTrackingScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments/schedule.documents";
import type { StatusSessionRow, SessionStatus } from "@/frontend/stores/mockStatusTrackingStore";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import {
  BlockOutlined,
  CheckCircleOutlineOutlined,
  EventAvailableOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import { useRouter } from "@/shared/i18n/routing";
import { StatusTrackingView } from "./StatusTrackingView";

function mapToSessionStatus(
  studentStatus: string,
  isFrozen: boolean,
  executionState: string
): SessionStatus {
  if (isFrozen || studentStatus === "SUSPENDED") {
    return "suspended_pending";
  }
  if (studentStatus === "ON_LEAVE") {
    return "on_leave";
  }
  if (executionState === "NOT_ACTIVATED") {
    return "pending_verification";
  }
  return "regular";
}

function formatSchedule(start: string | Date, end: string | Date): string {
  const fmt = (d: string | Date) =>
    new Date(d).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return `${fmt(start)} - ${fmt(end)}`;
}

export function StatusTrackingContainer() {
  const t = useTranslations("dashboard.statusTracking");
  const router = useRouter();
  const setRescheduleSession = useRescheduleStore(state => state.setSession);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const { data, loading: _loading } = useQuery(statusTrackingScheduleQueryDocument, {
    variables: { date: today },
    fetchPolicy: "cache-and-network",
  });

  const rawRows = data?.statusTrackingSchedule ?? [];

  const rows: readonly StatusSessionRow[] = rawRows.map(r => ({
    id: r.id,
    studentName: r.studentName,
    studentInitials: r.studentInitials,
    className: r.teacherName, // using teacher name as class label until course name added
    teacherName: r.teacherName,
    schedule: formatSchedule(r.scheduledStartAt, r.scheduledEndAt),
    status: mapToSessionStatus(r.studentStatus, r.isFrozen, r.executionState),
  }));

  const suspendedCount = rows.filter(r => r.status === "suspended_pending").length;
  const totalSessions = rawRows.length;

  const metricCounts = useMemo(() => {
    const counts = { regular: 0, pending: 0, suspended: 0, on_leave: 0 };
    for (const row of rows) {
      if (row.status === "regular") counts.regular += 1;
      else if (row.status === "pending_verification") counts.pending += 1;
      else if (row.status === "suspended_pending") counts.suspended += 1;
      else if (row.status === "on_leave") counts.on_leave += 1;
    }
    return counts;
  }, [rows]);

  const subLabelMap: Record<string, string> = {
    regular: t("subLabels.regular"),
    pending: t("subLabels.pending"),
    suspended: t("subLabels.suspended"),
    on_leave: t("subLabels.onLeave"),
  };

  const rawMetrics: readonly { key: string; count: number; labelKey: string; icon: unknown; variant?: string }[] = [
    {
      key: "regular",
      count: metricCounts.regular,
      labelKey: "dashboard.statusTracking.metrics.regular",
      icon: CheckCircleOutlineOutlined,
    },
    {
      key: "pending",
      count: metricCounts.pending,
      labelKey: "dashboard.statusTracking.metrics.pending",
      icon: PendingActionsOutlined,
    },
    {
      key: "suspended",
      count: metricCounts.suspended,
      labelKey: "dashboard.statusTracking.metrics.suspended",
      icon: BlockOutlined,
      variant: "error",
    },
    {
      key: "on_leave",
      count: metricCounts.on_leave,
      labelKey: "dashboard.statusTracking.metrics.onLeave",
      icon: EventAvailableOutlined,
    },
  ];

  const metrics: readonly MetricItem[] = rawMetrics.map(m => ({
    ...m,
    subLabel: subLabelMap[m.key],
  }));

  const labels = {
    pageTitle: t("pageTitle"),
    pageSubtitle: t("pageSubtitle"),
    filters: t("filters"),
    newReport: t("newReport"),
    todaysClassSchedule: t("todaysClassSchedule"),
    totalSessions: t.raw("totalSessions") as string,
    studentClass: t("table.studentClass"),
    teacher: t("table.teacher"),
    schedule: t("table.schedule"),
    status: t("table.status"),
    actions: t("table.actions"),
    showingOf: t.raw("showingOf") as string,
    previous: t("previous"),
    next: t("next"),
    joinSession: t("actions.joinSession"),
    activate: t("actions.activate"),
    reschedule: t("actions.reschedule"),
    verifyDocuments: t("actions.verifyDocuments"),
    sessionLocked: t("actions.sessionLocked"),
    administrativeHold: t("administrativeHold"),
    holdDescription: t("holdDescription"),
    seeAll: t("seeAll"),
    todaysSchedule: t("todaysSchedule"),
    regular: t("status.regular"),
    suspendedPending: t("status.suspendedPending"),
    onLeave: t("status.onLeave"),
    pendingVerification: t("status.pendingVerification"),
    regularSubLabel: t("subLabels.regular"),
    pendingSubLabel: t("subLabels.pending"),
    suspendedSubLabel: t("subLabels.suspended"),
    onLeaveSubLabel: t("subLabels.onLeave"),
    suspensionAnalytics: t("analytics.title"),
    analyticsNote: t("analytics.note"),
    urgentTask: t("analytics.urgentTask"),
    accountsLocked: t.raw("analytics.accountsLocked") as string,
    auditDescription: t("analytics.auditDescription"),
    openAuditLogs: t("analytics.openAuditLogs"),
    noEntries: t("noEntries"),
    days: [
      t("days.mon"),
      t("days.tue"),
      t("days.wed"),
      t("days.thu"),
      t("days.fri"),
      t("days.sat"),
      t("days.sun"),
    ] as const,
  };

  const handleNewReport = () => {
    // Navigate or open modal in future
  };

  const handleActivate = (_id: string) => {
    // Admin-only action — triggers status change mutation in future
  };

  const handleReschedule = (id: string) => {
    const row = rows.find(session => session.id === id);
    if (row) {
      setRescheduleSession({
        sessionId: id,
        teacherName: row.teacherName,
        studentName: row.studentName,
        teacherTimezone: "Africa/Cairo",
      });
    }
    router.push("/reschedule");
  };

  const handleVerify = (_id: string) => {
    // Verify documents action — future sprint
  };

  return (
    <StatusTrackingView
      metrics={metrics}
      rows={rows}
      totalSessions={totalSessions}
      suspendedCount={suspendedCount}
      labels={labels}
      onActivate={handleActivate}
      onReschedule={handleReschedule}
      onVerify={handleVerify}
      onNewReport={handleNewReport}
    />
  );
}
```

Note: `StatusTrackingDataGrid`, `StatusBadgeAction`, `StatusTrackingCardList`, and `StatusTrackingView` still import `StatusSessionRow` from `mockStatusTrackingStore` — do NOT change those imports. Only `StatusTrackingContainer` switches to real data. The type `StatusSessionRow` remains in `mockStatusTrackingStore.ts` as the shared interface (Storybook stories must keep using it).

Note: `StatusTrackingContainer.stories.tsx` already exists (`sizeBytes: 490`) — verify it continues to use mock store after this change (it doesn't import from the container directly).

Run:
```bash
bun run test:ui:components
bun run test:graphql
```

Success Criteria + Quality Gate verbatim.

---

### FILE 15: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\section-7-final-verification.md`

Write the full Section 7 Final Verification & Integrity Protocol with all commands.

---

### FILE 16: `C:\Users\PC\Projects\siraj\.ai\siraj_stories\10\appendix.md`

Write the appendix with:

**Appendix A: File Creation Summary table** — ALL files created/modified:
| File | Action | Task |
|------|--------|------|
| `shared/lib/enum.ts` | Modify | A |
| `backend/db/migration/3-system_permissions_and_groups.sql` | Modify | A |
| `backend/db/repo/scheduling.repository.ts` | Modify | B |
| `backend/services/student/suspended-lock.service.ts` | Create | D |
| `backend/services/student/student-leave-processing.service.ts` | Create | D |
| `backend/services/student/student-lifecycle.service.ts` | Modify | D |
| `backend/services/schedule/schedule-query.service.ts` | Create | E |
| `backend/graphql/pothos/schedule.pothos.ts` | Modify | E |
| `frontend/graphql/sharedDocuments/schedule.documents.ts` | Modify | F |
| `frontend/graphql/test/status-tracking.test.ts` | Create | G |
| `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx` | Modify | H |

**Appendix B: Dependency Graph**
```
Task A (Migration + Enum)
  └──► Task B (Repository — new methods)
         └──► Task C (Repo Tests)
                └──► Task D (Services — SuspendedLockService, StudentLeaveProcessingService, extend StudentLifecycleService)
                       └──► Task E (GraphQL Pothos — statusTrackingSchedule query)
                              └──► Task F (Frontend Documents — statusTrackingScheduleQueryDocument)
                                     └──► Task G (GraphQL Tests)
                                            └──► Task H (Frontend Views — StatusTrackingContainer migration)
                                                   └──► Section 7 (Final Verification)
```

---

## IMPORTANT CONSTRAINTS

1. Every file must start with its correct section/task heading
2. Every task file must have 300+ lines
3. No placeholder code (no `...` inside code blocks)
4. Every task's Success Criteria must include the VERBATIM Quality Gate checklist from AGENTS_STORY_PLANNING.md:
```
**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
```
5. Use `write_to_file` with `Overwrite: false` — do NOT use ArtifactMetadata
6. After all files are written, report the final directory tree to the user

Begin writing all 16 files now. Write them sequentially (not in parallel) to avoid any issues.