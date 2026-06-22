## Section 4: Security Threat Remediation

Story 10 introduces bulk database operations triggered by admin-initiated student status changes. This section documents the specific security threats identified, the exact fixes, and the test requirements that must pass before this story is considered complete.

---

### Threat 1: Unauthorized Status Change Triggering Side-Effects

**Threat ID:** T10-001
**Severity:** Critical
**Attack Vector:** A user without `student.manage_status` permission calls the `changeStudentStatus` GraphQL mutation, which now triggers bulk database operations (`bulkFreezeStudentClasses`, `processClassLeave`) as side effects.

**Current Gap:**
`StudentLifecycleService.changeStudentStatus()` already checks `student.manage_status` at line 93 via `PermissionsService.hasPermission()`. However, Story 10 adds new side-effect services (`SuspendedLockService`, `StudentLeaveProcessingService`) that perform significant database operations. If these services were ever called directly (bypassing `StudentLifecycleService`), or if the permission check were removed from `StudentLifecycleService`, an unauthorized actor could trigger bulk class freezes or leave processing.

**Fix:**
New side-effect services (`SuspendedLockService`, `StudentLeaveProcessingService`) are called ONLY inside `StudentLifecycleService.changeStudentStatus()`, **after** the `PermissionsService.hasPermission()` check at line 93 passes. The side-effect services do NOT re-check permissions themselves — the caller (`StudentLifecycleService`) is solely responsible. This is the "Caller Responsibility Pattern" documented in Section 1.8.

The side-effect services are not exported from any GraphQL resolver file. They are called exclusively through `StudentLifecycleService`.

**Code fix location:**
```typescript
// student-lifecycle.service.ts — changeStudentStatus()
const hasPermission = await PermissionsService.hasPermission(
  actorUserId,
  AppPermission.STUDENT_MANAGE_STATUS
);
if (!hasPermission) {
  const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
  throw new Error(tFunc("insufficientPermissions"));
}
// ... status change committed ...
// Only NOW do we call side-effect services:
if (newStatus === "SUSPENDED") {
  await SuspendedLockService.enforceSuspendedLock(studentId, actorUserId);
}
```

**Test Requirements:**
1. **GraphQL test — unauthorized actor:** An actor with a Teacher role (no `student.manage_status`) calls the `changeStudentStatus` mutation → receives `insufficientPermissions` error. No bulk freeze or leave processing occurs. (Task G)
2. **GraphQL test — authorized actor:** An Academy Admin calls `changeStudentStatus` with `SUSPENDED` → mutation succeeds AND class instances for that student have `isFrozen = true`. (Task G)
3. **Service unit test:** Calling `SuspendedLockService.enforceSuspendedLock()` directly without going through `StudentLifecycleService` is possible only for the system (not user-facing). No external GraphQL entry point reaches this service directly. (Code review + architecture test)

---

### Threat 2: IDOR on Bulk Class Freeze

**Threat ID:** T10-002
**Severity:** High
**Attack Vector:** `bulkFreezeStudentClasses(studentId, fromDate)` updates ALL future class instances for a given `studentId`. If the `studentId` were user-supplied (e.g., directly from a GraphQL argument), a malicious admin could freeze any student's classes, including students from other academies.

**Current Gap:**
The `studentId` passed to `bulkFreezeStudentClasses()` flows through the call chain:
1. GraphQL argument `studentId` (from `changeStudentStatus` mutation, already validated by Story 9)
2. → `StudentLifecycleService.changeStudentStatus(studentId)` (validates student exists via `StudentRepository.findById()`)
3. → `SuspendedLockService.enforceSuspendedLock(studentId)`
4. → `SchedulingRepository.bulkFreezeStudentClasses(studentId)`

The `StudentRepository.findById(studentId)` call at step 2 already confirms the student exists BEFORE any side effects run. However, the repo method itself does not validate that the student belongs to any particular academy — it operates across all students. This is intentional: Academy Admins can only manage their own academy's students via `student.manage_status` scoping (enforced in Story 9).

**Fix:**
`SuspendedLockService.enforceSuspendedLock()` does NOT need to call `StudentRepository.findById()` itself — the caller (`StudentLifecycleService`) already did this. The repo method `bulkFreezeStudentClasses()` uses Drizzle's `eq(classInstances.studentId, studentId)` filter, ensuring only classes for the exact `studentId` are frozen.

For non-existent `studentId` values: `bulkFreezeStudentClasses()` with a non-existent `studentId` will find 0 matching rows and return `0`. It does NOT throw an error. This is the safe failure mode.

**Code fix location:**
```typescript
// scheduling.repository.ts — bulkFreezeStudentClasses()
const result = await t
  .update(classInstances)
  .set({ isFrozen: true, updatedAt: new Date() })
  .where(
    and(
      eq(classInstances.studentId, studentId), // scoped to exact studentId
      isNull(classInstances.deletedAt),
      gte(classInstances.scheduledStartAt, fromDate),
      inArray(classInstances.executionState, ["NOT_ACTIVATED", "ACTIVATED"])
    )
  )
  .returning({ id: classInstances.id });
return result.length; // 0 for non-existent studentId — safe
```

**Test Requirements:**
1. **Repo test — non-existent studentId:** Call `bulkFreezeStudentClasses("non-existent-id", new Date())` → returns `0` (no error thrown). (Task C)
2. **Repo test — correct scoping:** Create 2 students with 2 future classes each. Call `bulkFreezeStudentClasses(studentA.id, ...)` → only studentA's classes are frozen, studentB's classes are unaffected. (Task C)
3. **Repo test — state filter:** Create classes in RUNNING and COMPLETED states for studentA. Call `bulkFreezeStudentClasses(studentA.id, ...)` → RUNNING and COMPLETED classes are NOT frozen. (Task C)

---

### Threat 3: Double-Processing of Leave

**Threat ID:** T10-003
**Severity:** Medium
**Attack Vector:** If `changeStudentStatus()` is called multiple times with `ON_LEAVE` for the same student (e.g., admin changes status twice due to UI glitch, or retry on network error), `StudentLeaveProcessingService.processStudentLeave()` could run multiple times — creating duplicate successor class instances for the same original class, resulting in ghost scheduled classes that consume quota.

**Current Gap:**
`processStudentLeave()` iterates over future `NOT_ACTIVATED` classes and calls `SchedulingRepository.processClassLeave()` for each. If called twice, the same original class is processed twice, potentially creating 2 successor instances.

**Fix — Two-Layer Idempotency:**

**Layer 1 — State filter:** `getStudentFutureClasses()` filters by `executionState IN ["NOT_ACTIVATED", "ACTIVATED"]`. After the first run of `processStudentLeave()`, the original class has `outcome = LEAVE` and `isRescheduled = true`. The class's `executionState` remains `NOT_ACTIVATED` (not changed by processClassLeave). However, the second call's `getStudentFutureClasses()` will still find it (executionState is unchanged).

**Layer 2 — Idempotency key on successor:** The existing `SchedulingRepository.processClassLeave()` (at line 566) uses an idempotency key pattern `leave-reschedule-{classId}-{scheduledStartAt}` with `ON CONFLICT DO NOTHING` when creating the successor class instance. This means a second call for the same original class will NOT create a duplicate successor — the INSERT is a no-op.

**Combined effect:** The first call creates the successor. The second call attempts to insert the same successor but the conflict constraint silently ignores it. The result is always exactly one successor per original class.

**Code fix location:**
```typescript
// student-leave-processing.service.ts — processStudentLeave()
for (const cls of notActivatedClasses) {
  try {
    // processClassLeave() uses ON CONFLICT DO NOTHING on idempotency key
    const result = await SchedulingRepository.processClassLeave(
      cls.id,
      "Student marked as On Leave by administrator",
      actorUserId,
      undefined,
      locale
    );
    successorIds.push(result.successorId);
  } catch (error) {
    logger.error("Failed to process leave for class instance", { ... });
    // Continue processing remaining classes
  }
}
```

**Test Requirements:**
1. **Repo test — idempotency:** Create a student with 2 future NOT_ACTIVATED classes. Call `processStudentLeave()` twice. Verify exactly 2 successor class instances exist (not 4). (Task C)
2. **Repo test — state filter:** After first `processStudentLeave()` run, call it again. The second run finds the same classes (executionState unchanged) but the `ON CONFLICT DO NOTHING` means `successorIds` from the second run are empty or the same IDs (returned from the conflict path). Verify the count of class instances does not increase. (Task C)
3. **GraphQL test — idempotency:** Call `changeStudentStatus` mutation twice with `ON_LEAVE` for the same student → second call's database effect is a no-op for successor creation. (Task G)

---

### Threat 4: isFrozen Not Cleared on SUSPENDED → REGULAR Restoration

**Threat ID:** T10-004
**Severity:** High
**Attack Vector:** When a student transitions from `SUSPENDED` back to `REGULAR`, the DB trigger `fn_enforce_student_status_transition` only validates the transition — it does NOT clear the `isFrozen` flag on class instances. Without explicit cleanup, a restored student's future classes remain frozen on the teacher's UI indefinitely, blocking teachers from activating, starting, or marking sessions even though the student is now in good standing.

**Current Gap:**
The DB trigger only changes the student's `status` column. The `isFrozen` flag on `class_instances` is a separate field that must be cleared explicitly. The current `StudentLifecycleService.changeStudentStatus()` (Story 9) does not perform this cleanup.

**Fix:**
Story 10 extends `StudentLifecycleService.changeStudentStatus()` with a new conditional branch:

```typescript
// Side-effect: release suspended lock when student returns from SUSPENDED to REGULAR
if (currentStatus === "SUSPENDED" && newStatus === "REGULAR") {
  await SuspendedLockService.releaseSuspendedLock(studentId, actorUserId);
}
```

`SuspendedLockService.releaseSuspendedLock()` calls `SchedulingRepository.bulkUnfreezeStudentClasses(studentId, fromDate)` which sets `isFrozen = false` on all future classes where `isFrozen = true`.

**Important:** The condition checks BOTH `currentStatus === "SUSPENDED"` AND `newStatus === "REGULAR"`. The `currentStatus` value is fetched from `StudentRepository.findById(studentId)` early in `changeStudentStatus()`. If the current status is `ON_LEAVE` and the new status is `REGULAR`, `releaseSuspendedLock()` is NOT called (there are no frozen classes for ON_LEAVE students — freezing only happens on SUSPENDED transition).

**Code fix location:**
```typescript
// student-lifecycle.service.ts — changeStudentStatus()
const currentStatus = student.status;
// ...
const updated = await StudentRepository.changeStatus(...);
// ...
if (newStatus === "SUSPENDED") {
  await SuspendedLockService.enforceSuspendedLock(studentId, actorUserId);
}
// NEW: release lock when restoring from SUSPENDED to REGULAR
if (currentStatus === "SUSPENDED" && newStatus === "REGULAR") {
  await SuspendedLockService.releaseSuspendedLock(studentId, actorUserId);
}
```

**Test Requirements:**
1. **Repo test — freeze then unfreeze:** Create a student with 3 future NOT_ACTIVATED classes. Call `bulkFreezeStudentClasses()` → all 3 have `isFrozen = true`. Call `bulkUnfreezeStudentClasses()` → all 3 have `isFrozen = false`. (Task C)
2. **Repo test — unfreeze is scoped:** Create studentA (3 frozen classes) and studentB (2 frozen classes). Call `bulkUnfreezeStudentClasses(studentA.id, ...)` → only studentA's classes are unfrozen, studentB's remain frozen. (Task C)
3. **GraphQL test — full cycle:** Admin changes studentX to SUSPENDED → classes frozen. Admin changes studentX back to REGULAR → classes unfrozen. Verify via `statusTrackingSchedule` query that `isFrozen = false` for all of studentX's classes. (Task G)
4. **Edge case test:** Call `bulkUnfreezeStudentClasses()` when no classes are frozen → returns `0` (no error). (Task C)

---

### Threat Summary Table

| **ID** | **Threat** | **Severity** | **Fix Layer** | **Test Task** |
|---|---|---|---|---|
| T10-001 | Unauthorized side-effect trigger | Critical | Service (permission check at StudentLifecycleService) | Task G |
| T10-002 | IDOR on bulk class freeze | High | Repository (studentId filter) | Task C |
| T10-003 | Double-processing of ON_LEAVE | Medium | Repository (idempotency key ON CONFLICT DO NOTHING) | Task C, Task G |
| T10-004 | isFrozen not cleared on SUSPENDED→REGULAR | High | Service (releaseSuspendedLock call in changeStudentStatus) | Task C, Task G |
