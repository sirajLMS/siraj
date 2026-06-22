### Task D — Services: SuspendedLockService, StudentLeaveProcessingService, and Extend StudentLifecycleService

**Objective:** Create two new service files implementing the automated enforcement logic, and extend `StudentLifecycleService.changeStudentStatus()` to dispatch the side-effect services after a successful status change.

**Dependencies:** Depends on Task B — all four new repository methods (`bulkFreezeStudentClasses`, `bulkUnfreezeStudentClasses`, `getStudentFutureClasses`, `processClassLeave`) must be implemented and exported from `SchedulingRepository`. Also depends on Task A — `AppPermission.SYSTEM_ENFORCE_SUSPENDED_LOCK` and `AppPermission.SYSTEM_PROCESS_STUDENT_LEAVE` enum values must be available.

**Layer-Specific Rules (Backend Services — Flattened from backend/services/AGENTS.md):**
- **🚫 Services MUST NOT import from DB/Drizzle** — Services can ONLY depend on the repository layer (`backend/db/repo/`). No imports from `drizzle-orm`, `backend/db/schema`, or `backend/db/index`.
- **Business logic centralization** — All orchestration and permission checks reside in services. `SuspendedLockService` and `StudentLeaveProcessingService` trust the caller (StudentLifecycleService) for permission enforcement. They do NOT re-check permissions.
- **Logger mandatory** — All services use `import { logger } from "@/backend/lib/logger"`. No `console.*` methods.
- **Error isolation in leave processing** — `StudentLeaveProcessingService.processStudentLeave()` wraps each class's processing in try/catch and continues on per-class failure.

**Target Files:**
- `backend/services/student/suspended-lock.service.ts` (Create NEW)
- `backend/services/student/student-leave-processing.service.ts` (Create NEW)
- `backend/services/student/student-lifecycle.service.ts` (Modify — extend `changeStudentStatus()`)

---

**Detailed Implementation Steps:**

### Step 1: Create `suspended-lock.service.ts`

Create the file at `backend/services/student/suspended-lock.service.ts` with the following complete implementation:

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
   * See Section 1.8 "Caller Responsibility Pattern" in the story plan.
   *
   * @param studentId - The ID of the student who was suspended
   * @param actorUserId - The admin who triggered the status change (for audit logging)
   * @returns The count of class instances that were frozen
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

  /**
   * Releases the suspended student lock by setting isFrozen = false on all
   * future frozen class instances for the student.
   *
   * Called internally by StudentLifecycleService.changeStudentStatus() when
   * a student transitions from SUSPENDED back to REGULAR.
   *
   * This is the inverse of enforceSuspendedLock(). It must be called
   * explicitly because the DB trigger fn_enforce_student_status_transition
   * only validates the status transition — it does NOT clear isFrozen.
   *
   * @param studentId - The ID of the student being restored to REGULAR
   * @param actorUserId - The admin who triggered the status change (for audit logging)
   * @returns The count of class instances that were unfrozen
   */
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

**Key design decisions for `SuspendedLockService`:**
- Uses a namespace (not a class) — consistent with other services in the project
- `PERMISSION` constant documents which system permission this service implements (for introspection/audit)
- `enforceSuspendedLock()` and `releaseSuspendedLock()` are intentionally NOT checking `PermissionsService.hasPermission()` — see the "Caller Responsibility Pattern" in Section 1.8
- The `fromDate = new Date()` is captured at the START of the function call, not passed in, to ensure future-only filtering regardless of when the status change committed

### Step 2: Create `student-leave-processing.service.ts`

Create the file at `backend/services/student/student-leave-processing.service.ts` with the following complete implementation:

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
   * - Creates a successor class instance (idempotency key prevents duplicates)
   *
   * Uses the system setting 'session_leave_reschedule_offset_days' (default: 7 days)
   * to determine the scheduling offset for successor classes.
   *
   * Does NOT require a separate permission check — the caller
   * (StudentLifecycleService) has already verified student.manage_status.
   * See Section 1.8 "Caller Responsibility Pattern" in the story plan.
   *
   * Error isolation: a failure on one class does NOT stop processing of
   * remaining classes. All errors are logged and the method continues.
   *
   * @param studentId - The ID of the student going on leave
   * @param actorUserId - The admin who triggered the status change (for audit logging)
   * @param locale - Optional locale for i18n error messages
   * @returns Number of successfully processed classes and their successor IDs
   */
  export const PERMISSION = AppPermission.SYSTEM_PROCESS_STUDENT_LEAVE;

  export async function processStudentLeave(
    studentId: string,
    actorUserId: string,
    locale?: string
  ): Promise<LeaveProcessingResult> {
    const fromDate = new Date();

    // Fetch only NOT_ACTIVATED future classes
    // ACTIVATED classes are intentionally excluded — they have been confirmed
    // by the activation time window check and should not be auto-processed.
    // RUNNING/COMPLETED classes are past the point of no return.
    const futureClasses = await SchedulingRepository.getStudentFutureClasses(
      studentId,
      fromDate
    );

    const notActivatedClasses = futureClasses.filter(
      c => c.executionState === "NOT_ACTIVATED"
    );

    if (notActivatedClasses.length === 0) {
      logger.info("No future NOT_ACTIVATED classes to process for ON_LEAVE student", {
        studentId,
        actorUserId,
        totalFutureClasses: futureClasses.length,
      });
      return { processedCount: 0, successorIds: [] };
    }

    // Fetch system setting for reschedule offset (default: 7 days)
    const offsetDays = await SystemSettingsRepository.getIntValue(
      "session_leave_reschedule_offset_days",
      7
    );

    const successorIds: string[] = [];

    for (const cls of notActivatedClasses) {
      try {
        // processClassLeave() handles:
        // 1. Marking original class with outcome = LEAVE, isRescheduled = true
        // 2. Creating a successor class instance offset by offsetDays
        // 3. Using ON CONFLICT DO NOTHING on idempotency key to prevent duplicates
        const result = await SchedulingRepository.processClassLeave(
          cls.id,
          "Student marked as On Leave by administrator",
          actorUserId,
          undefined, // no custom reschedule date — uses system setting offset
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
        // The admin can retry individual class leave processing if needed
      }
    }

    logger.info("Student leave processing completed", {
      studentId,
      actorUserId,
      processedCount: successorIds.length,
      totalFutureClasses: futureClasses.length,
      notActivatedCount: notActivatedClasses.length,
      offsetDays,
    });

    return { processedCount: successorIds.length, successorIds };
  }
}
```

**Key design decisions for `StudentLeaveProcessingService`:**
- `LeaveProcessingResult` is a separate exported interface for type safety in callers
- Uses `getStudentFutureClasses()` to fetch future classes, then filters to `NOT_ACTIVATED` in TypeScript (belt-and-suspenders approach — `getStudentFutureClasses()` already filters but explicit filter documents intent)
- `SystemSettingsRepository.getIntValue()` is called ONCE before the loop — not per-class
- Per-class `try/catch` with `continue` semantics — error isolation
- The `result.successorId` is the ID of the new successor class instance created by `processClassLeave()` — collected for the audit log
- `PERMISSION` constant documents the system permission for introspection

### Step 3: Extend `student-lifecycle.service.ts`

Modify `backend/services/student/student-lifecycle.service.ts` to:
1. Add imports for both new services
2. Add three new conditional branches in `changeStudentStatus()` after the status change commits

**Add at the top of the file, after the existing imports:**
```typescript
import { SuspendedLockService } from "./suspended-lock.service";
import { StudentLeaveProcessingService } from "./student-leave-processing.service";
```

**Extend `changeStudentStatus()` — replace the existing function body (lines 86–148) with the following:**

```typescript
export async function changeStudentStatus(
  actorUserId: string,
  studentId: string,
  newStatus: string,
  expectedVersion?: number,
  locale?: string
): Promise<ChangeStudentStatusResult> {
  // Permission check — must be the FIRST operation
  const hasPermission = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.STUDENT_MANAGE_STATUS
  );
  if (!hasPermission) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("insufficientPermissions"));
  }

  // Fetch student — validates existence AND captures currentStatus for side-effect dispatch
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
    // Commit the status change to DB (DB trigger validates the transition at DB level too)
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

    // ─── Side-Effect: Enforce Suspended Lock ────────────────────────────────
    // When student becomes SUSPENDED:
    // - Sets isFrozen = true on all future NOT_ACTIVATED/ACTIVATED class instances
    // - Teacher sees the class with "suspended_pending" badge, all action buttons hidden
    // - Implements: system.enforce_suspended_lock permission behavior
    if (newStatus === "SUSPENDED") {
      await SuspendedLockService.enforceSuspendedLock(studentId, actorUserId);
    }

    // ─── Side-Effect: Release Suspended Lock ────────────────────────────────
    // When student returns from SUSPENDED to REGULAR:
    // - Clears isFrozen = false on all future frozen class instances
    // - DB trigger does NOT clear isFrozen — must be done explicitly
    // - Only triggers on SUSPENDED→REGULAR, NOT on ON_LEAVE→REGULAR
    if (currentStatus === "SUSPENDED" && newStatus === "REGULAR") {
      await SuspendedLockService.releaseSuspendedLock(studentId, actorUserId);
    }

    // ─── Side-Effect: Process Student Leave ─────────────────────────────────
    // When student becomes ON_LEAVE:
    // - Marks all future NOT_ACTIVATED classes with outcome = LEAVE, isRescheduled = true
    // - Creates successor class instances for rescheduling (no paid classes lost)
    // - Implements: system.process_student_leave permission behavior
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
    logger.error("Failed to change student status or dispatch side-effects", {
      actorUserId,
      studentId,
      newStatus,
      currentStatus,
      error,
    });
    throw error;
  }
}
```

**Important notes on the extension:**
- `currentStatus` is captured BEFORE the status change commits, so the `SUSPENDED→REGULAR` check uses the old status value (correct)
- The error logger now includes `currentStatus` for better debugging of failed side-effect dispatches
- If `SuspendedLockService.enforceSuspendedLock()` throws, the catch re-throws, so the caller gets an error. The status change IS committed by this point — this is acceptable. The admin can retry.
- The three conditional branches are EXCLUSIVE for the primary trigger (SUSPENDED freeze vs. ON_LEAVE processing), but the release branch (`SUSPENDED→REGULAR`) can coexist with other branches

### Step 4: Verify No DB/Drizzle Imports in New Services

After creating both files, run:

```bash
rg "from ['\"]drizzle-orm|from ['\"]backend/db/schema|from ['\"]backend/db/index" \
  backend/services/student/suspended-lock.service.ts \
  backend/services/student/student-leave-processing.service.ts
```

**Expected output:** Empty (no matches). Both services must only import from `backend/db/repo/`.

### Step 5: TypeScript Compilation

```bash
bun tsgo
```

Pay attention to:
- `StudentStatus` type cast `newStatus as StudentStatus` — must match the enum values in the schema
- `ALLOWED_STATUS_TRANSITIONS` object — must already be defined in `student-lifecycle.service.ts` (from Story 9) and not need modification
- `LeaveProcessingResult` interface — properly exported for use in callers
- The `result.successorId` — verify that `SchedulingRepository.processClassLeave()` returns `{ successorId: string }` shape (from the existing implementation at line 566)

---

**Test Execution Requirements:**

```bash
# Verify no DB imports in services
rg "from ['\"]drizzle-orm|from ['\"]backend/db/schema" backend/services/

# Run full database test suite
bun run test:db

# TypeScript compilation
bun tsgo

# Linting
bun biome:check
bun lint
```

---

**Success Criteria / Check Progress Points:**

- [ ] `SuspendedLockService` namespace exported from `suspended-lock.service.ts`
- [ ] `SuspendedLockService.PERMISSION = AppPermission.SYSTEM_ENFORCE_SUSPENDED_LOCK` (documents which permission)
- [ ] `SuspendedLockService.enforceSuspendedLock()` calls `SchedulingRepository.bulkFreezeStudentClasses()` and logs `frozenCount`
- [ ] `SuspendedLockService.releaseSuspendedLock()` calls `SchedulingRepository.bulkUnfreezeStudentClasses()` and logs `unfrozenCount`
- [ ] Neither method calls `PermissionsService.hasPermission()` (caller responsibility pattern)
- [ ] `StudentLeaveProcessingService` namespace exported from `student-leave-processing.service.ts`
- [ ] `LeaveProcessingResult` interface exported for type safety
- [ ] `StudentLeaveProcessingService.processStudentLeave()` filters to `NOT_ACTIVATED` only
- [ ] `processStudentLeave()` uses try/catch per-class (error isolation)
- [ ] `processStudentLeave()` uses `SystemSettingsRepository.getIntValue()` for offset days
- [ ] `student-lifecycle.service.ts` imports `SuspendedLockService` and `StudentLeaveProcessingService`
- [ ] `changeStudentStatus()` calls `enforceSuspendedLock()` when `newStatus === "SUSPENDED"`
- [ ] `changeStudentStatus()` calls `releaseSuspendedLock()` when `currentStatus === "SUSPENDED" && newStatus === "REGULAR"`
- [ ] `changeStudentStatus()` calls `processStudentLeave()` when `newStatus === "ON_LEAVE"`
- [ ] No `console.*` calls in either new service file
- [ ] No Drizzle/DB schema imports in either new service file
- [ ] `bun run test:db` passes with 0 failures (existing tests not broken)
- [ ] `bun tsgo` passes with 0 TypeScript errors

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
