# Complete Repository Review - Fix Plan

Review date: 2026-06-29

This plan is structured for parallel sub-agent execution. Each sub-agent handles a group of files, applies all fixes for those files, then runs a verification loop until all checks pass before moving to the next file.

## Pre-existing Change (already applied, skip)

- `backend/graphql/mutation/student.mutation.ts` — `authScopes: { loggedIn: true }` added to `partiallyUpdateStudent` and `deleteStudent`
- `backend/graphql/query/student.query.ts` — `authScopes: { loggedIn: true }` added to `student` and `students` queries

---

## Sub-Agent Verification Protocol (MUST follow)

After modifying ANY file, the sub-agent MUST run this verification loop before moving to the next file. The loop repeats until a complete round of ALL checks passes with zero issues.

### Per-File Verification Loop

```
while true:
  issues_found = false

  1. Run: bun tsgo
     - This is a project-wide type check (no file-scoping available)
     - If type errors found in YOUR files: fix them, set issues_found = true
     - If type errors found ONLY in other sub-agent files: skip (they'll fix their own)
     - If type errors found in shared files you touched: fix them, set issues_found = true

  2. Run: bunx @biomejs/biome check --write --unsafe <file_path>
     - This CAN be scoped to a single file (pass file path as argument)
     - Example: bunx @biomejs/biome check --write --unsafe backend/graphql/mutation/storage.mutation.ts
     - If issues found: they are auto-fixed with --write, set issues_found = true if exit code != 0
     - Re-run if auto-fix changed the file (biome may need a second pass)

  3. Run lint via queue server (PowerShell):
     $body = @{ id = "<group-id>"; files = @("<file_path>") } | ConvertTo-Json
     Invoke-RestMethod -Uri http://localhost:4777/lint -Method POST -ContentType 'application/json' -Body $body
     - The lint queue server is already running at http://localhost:4777
     - This BLOCKS until the lint run completes
     - Check response: { success: boolean, output: string, exitCode: number }
     - If success is false AND the errors are in YOUR file: fix them, set issues_found = true
     - If errors are only in other files: skip

  if not issues_found:
    break  // All checks pass, move to next file
```

### Important Notes
- Fix ALL issues in one file before moving to the next file
- `bun tsgo` is project-wide — run it once after finishing ALL your files for a final check, and once per file during the loop to catch type errors early
- Biome --write auto-fixes; re-run it if it made changes to ensure a clean second pass
- If the lint queue server returns errors in files you didn't touch, ignore them
- The lint queue server is already running — do NOT start a new one

---

## Phase 1: Critical Security (6 remaining fixes)

### Fix 1: Storage mutations — add authScopes

**File:** `backend/graphql/mutation/storage.mutation.ts`

Add `authScopes: { loggedIn: true }` to every field in the `gqlSchemaBuilder.mutationFields(t => ({...}))`:
- `renameFile` (line 8)
- `deleteFile` (line 22)
- `prepareUpload` (line 33)
- `createFolder` (line 52)
- `moveStorageItems` (line 66)
- `copyStorageItems` (line 80)
- `deleteStorageItems` (line 94)
- `updateDirectoryPermissions` (line 108)
- `setStorageItemProtection` (line 121)

Pattern to apply (same for all fields):
```diff
-  renameFile: t.field({
+  renameFile: t.field({
+    authScopes: { loggedIn: true },
     type: StoragePothos.FileOperationResultPothosObject,
```

### Fix 2: Storage queries — add authScopes

**File:** `backend/graphql/query/storage.query.ts`

Add `authScopes: { loggedIn: true }` to every field:
- `listFiles` (line 7)
- `fileInfo` (line 21)
- `folderInfo` (line 33)
- `searchFiles` (line 44)
- `storageStats` (line 74)
- `directoryChildren` (line 88)
- `fileUsage` (line 103)

Same pattern as Fix 1.

### Fix 3: Users query — add authScopes

**File:** `backend/graphql/query/auth.query.ts`

Add `authScopes: { loggedIn: true }` to the `users` field:

```diff
   users: t.field({
+    authScopes: { loggedIn: true },
     type: [UserPothosObject],
     resolve: async () => await UserRepository.findAll(),
   }),
```

### Fix 4: File serving API — add authentication

**File:** `app/api/storage/files/[[...path]]/route.ts`

Add authentication at the top of the `GET` handler, before any file operations. Import `extractTokenFromHeader` and `verifyToken` from `@/backend/lib/auth/jwt`, and `UserRepository` from `@/backend/db/repo`:

```typescript
import { extractTokenFromHeader, verifyToken } from "@/backend/lib/auth/jwt";
import { UserRepository } from "@/backend/db/repo";
```

Add auth check after the `relativePath` null check (after the line that returns 400 for missing path), before the `getAbsolutePath` call:

```typescript
    const authHeader = request.headers.get("authorization");
    const accessToken = extractTokenFromHeader(authHeader);
    const payload = accessToken ? await verifyToken(accessToken) : null;

    if (!payload || payload.type !== "access") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserRepository.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
```

### Fix 5: Storage cleanup — fail if ADMIN_EMAIL unset

**File:** `app/api/storage/cleanup/route.ts`

Change line 26:

```diff
    const adminEmail = process.env.ADMIN_EMAIL;
-    if (adminEmail && user.email !== adminEmail) {
+    if (!adminEmail || user.email !== adminEmail) {
```

### Fix 6: JWT — remove fallback secret

**File:** `backend/lib/auth/jwt.ts`

Replace lines 3-8:

```diff
-// Validate JWT_SECRET is set in production
-if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
-  throw new Error("JWT_SECRET must be set in production environment");
-}
-
-const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
+if (!process.env.JWT_SECRET) {
+  throw new Error("JWT_SECRET environment variable is required");
+}
+
+const JWT_SECRET = process.env.JWT_SECRET;
```

---

## Phase 2: Business Logic (8 fixes)

### Fix 7: processAutomatedClassLeave — use runStateChange

**File:** `backend/db/repo/scheduling/state-changes.ts`

**IMPORTANT: This fix is the most complex. Read carefully.**

**Step 1:** Update `validateStateTransition` (around line 102-110) to add a new allowed transition:

```diff
   } else if (state.executionState === "COMPLETED") {
     const isValidStandard = existing.executionState === "RUNNING";
     const isValidEarly =
       existing.executionState === "ACTIVATED" && (state.outcome === "ABSENT" || state.outcome === "LEAVE");
+    const isValidAutomatedLeave =
+      existing.executionState === "NOT_ACTIVATED" && state.outcome === "LEAVE";
-    if (!isValidStandard && !isValidEarly) {
+    if (!isValidStandard && !isValidEarly && !isValidAutomatedLeave) {
       const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
       throw new Error(tFunc("invalidTransition"));
     }
   }
```

**Step 2:** Replace the `processAutomatedClassLeave` runner body (lines 586-625). The new implementation should use `runStateChange` with `buildLeaveStateChangePayload`:

```typescript
  const runner = async (t: DBTransaction) => {
    const [existing] = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
    if (!existing) {
      const tFunc = await getBackendTranslations({ locale: undefined, namespace: "errors" });
      throw new Error(tFunc("classInstanceNotFound", { id }));
    }
    const offsetDays = await SystemSettingsRepository.getIntValue("session_leave_reschedule_offset_days", 7, t);
    const successor = await createRescheduledSuccessor(t, existing, offsetDays, "Automated leave reschedule");

    const updated = await runStateChange(id, actorUserId, t, undefined, async () =>
      buildLeaveStateChangePayload(existing, successor.id, reason, undefined)
    );

    const originalId = updated?.id ?? id;

    if (existing.quotaDeducted) {
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
        .where(eq(students.id, existing.studentId));
    }

    const now = new Date();
    await t
      .insert(leaveRequests)
      .values({
        classInstanceId: id,
        requestedByUserId: actorUserId,
        requesterType: "ADMIN",
        reason,
        status: "RESCHEDULED",
        createdAt: now,
        processedAt: now,
        processedByUserId: actorUserId,
      })
      .onConflictDoNothing();

    const [teacherRow] = await t
      .select({ id: teachers.id })
      .from(teachers)
      .where(eq(teachers.id, existing.teacherId))
      .limit(1);
    if (teacherRow) await incrementTeacherLeaveQuotaFn(teacherRow.id, t);

    return { originalId, successorId: successor.id };
  };
```

### Fix 8: executeProcessClassLeave — move teacher quota increment after runStateChange

**File:** `backend/db/repo/scheduling/state-changes.ts` (SAME FILE AS FIX 7 — apply both together)

In `executeProcessClassLeave`, remove the teacher quota increment at lines 249-256 and move it to after the quota restore (after line 284). The final order should be:

1. Read existing class instance
2. Check state change auth
3. Validate execution state (ACTIVATED/RUNNING)
4. Create rescheduled successor
5. Call `runStateChange`
6. Restore student quota if `quotaDeducted`
7. Insert leave request record
8. Increment teacher leave quota (MOVED HERE, was at step 3 before)

### Fix 9: Idempotency checkAndMark — atomic insert

**File:** `backend/services/idempotency.service.ts`

Replace with atomic implementation:

```typescript
import { CacheDbRepository } from "../db/repo/cache.repository";

export namespace IdempotencyService {
  export const checkAndMark = async (key: string, userId: string): Promise<boolean> => {
    const cacheKey = `idempotency:${userId}:${key}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const wasInserted = await CacheDbRepository.insertIfNotExists(cacheKey, "used", expiresAt);

    return wasInserted;
  };

  export const release = async (key: string, userId: string): Promise<void> => {
    const cacheKey = `idempotency:${userId}:${key}`;
    await CacheDbRepository.del(cacheKey);
  };
}
```

This requires adding `insertIfNotExists` to `CacheDbRepository` in `backend/db/repo/cache.repository.ts`:

```typescript
  export const insertIfNotExists = async (key: string, value: string, expiresAt: Date): Promise<boolean> => {
    try {
      const table = getTable(key);
      const result = await db
        .insert(table)
        .values({ key, value, expiresAt })
        .onConflictDoNothing({ target: table.key })
        .returning({ id: table.key });

      return result.length > 0;
    } catch (error) {
      logger.error(`Failed to insert cache entry for key ${key}:`, error);
      return false;
    }
  };
```

### Fix 10: Cache incr — atomic SQL

**File:** `backend/db/repo/cache.repository.ts` (SAME FILE AS FIX 9 — apply both together)

Replace `incr` with atomic SQL implementation. Note: the cache tables do NOT have an `updatedAt` column, so remove that from the `.set()` call:

```typescript
  export const incr = async (key: string): Promise<number> => {
    try {
      const table = getTable(key);
      const now = new Date();
      const defaultExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);

      const updated = await db
        .update(table)
        .set({ value: sql`(${table.value}::int + 1)::text` })
        .where(and(eq(table.key, key), gt(table.expiresAt, now)))
        .returning({ value: table.value });

      if (updated.length > 0) {
        return Number.parseInt(updated[0].value, 10);
      }

      const inserted = await db
        .insert(table)
        .values({ key, value: "1", expiresAt: defaultExpiresAt })
        .onConflictDoUpdate({
          target: table.key,
          set: { value: sql`(${table.value}::int + 1)::text`, expiresAt: defaultExpiresAt },
        })
        .returning({ value: table.value });

      return Number.parseInt(inserted[0]?.value ?? "1", 10);
    } catch (error) {
      logger.error(`Failed to increment cache value for key ${key}:`, error);
      throw error;
    }
  };
```

Required import additions: `and`, `gt` from `drizzle-orm` (check if already imported — `eq` and `lt` are already imported, need to add `and` and `gt`).

### Fix 11: deleteRecurringClass — restore student quota

**File:** `backend/db/repo/scheduling/recurring.ts`

Add quota restoration before the soft-delete, matching the pattern in `class-instances.ts:164`:

```typescript
export async function deleteRecurringClass(classInstanceId: string, tx?: DBTransaction): Promise<boolean> {
  const runner = async (t: DBTransaction) => {
    const now = new Date();

    const [existing] = await t
      .select({
        id: classInstances.id,
        quotaDeducted: classInstances.quotaDeducted,
        deletedAt: classInstances.deletedAt,
        studentId: classInstances.studentId,
      })
      .from(classInstances)
      .where(eq(classInstances.id, classInstanceId))
      .limit(1);

    if (existing?.quotaDeducted && existing.deletedAt === null) {
      await t
        .update(students)
        .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
        .where(eq(students.id, existing.studentId));
    }

    const [deleted] = await t
      .update(classInstances)
      .set({
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(classInstances.id, classInstanceId))
      .returning({ id: classInstances.id });

    return !!deleted;
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
}
```

Required imports to add: `sql` from `drizzle-orm`, `students` from schema, `classInstances` from schema. Check existing imports and add any missing ones.

### Fix 12: clearWeeklySchedule — handle orphaned class instances and quota

**File:** `backend/db/repo/scheduling/recurring.ts` (SAME FILE AS FIX 11 — apply both together)

After soft-deleting the recurring schedules (after the `recurringSchedules` update), add this block before `return true`:

```typescript
    const orphanedInstances = await t
      .select({
        id: classInstances.id,
        quotaDeducted: classInstances.quotaDeducted,
        studentId: classInstances.studentId,
      })
      .from(classInstances)
      .where(
        and(
          inArray(classInstances.recurringScheduleId, scheduleIds),
          isNull(classInstances.deletedAt),
          gte(classInstances.scheduledStartAt, now)
        )
      );

    for (const instance of orphanedInstances) {
      if (instance.quotaDeducted) {
        await t
          .update(students)
          .set({ classesRemaining: sql`${students.classesRemaining} + 1` })
          .where(eq(students.id, instance.studentId));
      }
    }

    if (orphanedInstances.length > 0) {
      await t
        .update(classInstances)
        .set({ deletedAt: now, updatedAt: now })
        .where(inArray(classInstances.id, orphanedInstances.map(i => i.id)));
    }
```

**PREREQUISITE:** Verify that `classInstances` has a `recurringScheduleId` column by checking `backend/db/schema/scheduling.ts` before applying. If the column has a different name, adjust accordingly.

Required imports: `gte` from `drizzle-orm`, plus `classInstances` and `students` from schema.

### Fix 13: student-lifecycle TOCTOU — move validation inside transaction

**Files:** `backend/services/student/student-lifecycle.service.ts` AND `backend/db/repo/student.repository.ts`

In `student-lifecycle.service.ts`, remove the stale `findById` + `allowedTargets` validation block (lines 83-99). The `changeStatus` method should just:

1. Check permission
2. Call `StudentRepository.changeStatus` (which now validates inside the transaction)

In `student.repository.ts`, modify the `changeStatus` function to add transition validation inside the `adjustClassesQuota` callback, after `current` is available. The `ALLOWED_STATUS_TRANSITIONS` map must be defined or imported. Check what the current allowed transitions are by reading the student-lifecycle service file — they should be moved here.

The `changeStatus` function's `adjustClassesQuota` callback should look like:

```typescript
adjustClassesQuota(
  t,
  studentId,
  async (current) => {
    const allowedTargets = ALLOWED_STATUS_TRANSITIONS[current.status] ?? [];
    if (!allowedTargets.includes(newStatus)) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(
        tFunc("invalidStatusTransition", {
          currentStatus: current.status,
          newStatus,
        })
      );
    }
    return { status: newStatus };
  },
  expectedVersion,
  locale
)
```

### Fix 14: DST migration conflict detection — use Map<string, string[]>

**File:** `backend/services/system/dst-migration.service.ts`

**Step 1:** Change `finalTimeMap` construction (lines 81-89):

```diff
-  const finalTimeMap = new Map<string, string>();
+  const finalTimeMap = new Map<string, string[]>();
   for (const schedule of schedules) {
     if (schedule.utcOffsetSnapshot === null) {
-      finalTimeMap.set(`${schedule.teacherId}:${schedule.defaultStartTime}`, schedule.id);
+      const key = `${schedule.teacherId}:${schedule.defaultStartTime}`;
+      const existing = finalTimeMap.get(key) ?? [];
+      existing.push(schedule.id);
+      finalTimeMap.set(key, existing);
     } else {
       const newTime = plannedTimes.get(schedule.id) ?? schedule.defaultStartTime;
-      finalTimeMap.set(`${schedule.teacherId}:${newTime}`, schedule.id);
+      const key = `${schedule.teacherId}:${newTime}`;
+      const existing = finalTimeMap.get(key) ?? [];
+      existing.push(schedule.id);
+      finalTimeMap.set(key, existing);
     }
   }
```

**Step 2:** Update the conflict detection loop (around lines 108-154):

```diff
   const mapKey = `${schedule.teacherId}:${newStartTime}`;
-  const existingScheduleId = finalTimeMap.get(mapKey);
-
-  if (existingScheduleId && existingScheduleId !== schedule.id) {
+  const schedulesAtTime = finalTimeMap.get(mapKey) ?? [];
+  const isConflict = schedulesAtTime.length > 1 && schedulesAtTime.includes(schedule.id);
+
+  if (isConflict) {
     conflictCount++;
-    const conflictDetail = `Conflict with schedule ${existingScheduleId} at ${newStartTime}`;
+    const conflictDetail = `Conflict: ${schedulesAtTime.length} schedules at ${newStartTime} for same teacher`;
```

---

## Phase 3: Auth Hardening (1 fix)

### Fix 15: Refresh token rotation — use JTI to invalidate old tokens

**Files:** `backend/lib/auth/jwt.ts` AND `backend/graphql/mutation/auth.mutation.ts`

NOTE: `jwt.ts` is also touched by Fix 6. If assigned to a different sub-agent group, Fix 6 and Fix 15 must be in the SAME group (they share `jwt.ts`).

**Step 1:** In `jwt.ts`, add `randomUUID` import and `jti` claim to refresh tokens:

```typescript
import { randomUUID } from "node:crypto";
```

Update `generateRefreshToken`:
```typescript
export async function generateRefreshToken(userId: string, email: string): Promise<string> {
  const jti = randomUUID();
  const token = await new SignJWT({
    userId,
    email,
    type: "refresh" as const,
    jti,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_REFRESH_TOKEN_EXPIRY)
    .sign(secret);

  return token;
}
```

Update `CustomJWTPayload`:
```diff
 export interface CustomJWTPayload extends JoseJWTPayload {
   userId: string;
   email: string;
   type: "access" | "refresh";
+  jti?: string;
 }
```

**Step 2:** In `auth.mutation.ts`, update the `refreshToken` mutation resolver:
- Add `authScopes: { loggedIn: true }`
- After resolving user/session, verify the refresh token's JTI matches the session's stored JTI
- Generate new tokens
- Store the new refresh token's JTI in the session payload
- Set new cookies

The updated resolver should add JTI validation before generating new tokens:

```typescript
      if (refreshToken) {
        const refreshPayload = await verifyToken(refreshToken);
        if (refreshPayload?.jti && session?.payload) {
          try {
            const sessionData = JSON.parse(session.payload);
            if (sessionData.refreshTokenJti && sessionData.refreshTokenJti !== refreshPayload.jti) {
              return null;
            }
          } catch { /* ignore parse error */ }
        }
      }
```

And after generating new tokens, store the new JTI:

```typescript
      const newPayload = await verifyToken(newRefreshToken);
      const newJti = newPayload?.jti;

      const sessionPayload = session.payload ? JSON.parse(session.payload) : {};
      sessionPayload.refreshTokenJti = newJti;

      const newSession = await SessionRepository.update({
        ...session,
        payload: JSON.stringify(sessionPayload),
      });
```

---

## Phase 4: Deploy Safety / Performance (6 fixes)

### Fix 16: setStudentClassesFrozenState — add batch processing

**File:** `backend/db/repo/scheduling/scheduling-queries.repository.ts`

Replace the single unbounded UPDATE with a batched approach. Since Drizzle may not support `.limit()` on UPDATE, use a SELECT-then-UPDATE pattern:

```typescript
async function setStudentClassesFrozenState(
  studentId: string,
  fromDate: Date,
  isFrozen: boolean,
  extraPredicate: ReturnType<typeof eq> | undefined,
  tx?: DBTransaction
): Promise<number> {
  const runner = async (t: DBTransaction): Promise<number> => {
    const BATCH_SIZE = 500;
    let totalUpdated = 0;

    const conditions = and(
      eq(classInstances.studentId, studentId),
      isNull(classInstances.deletedAt),
      gte(classInstances.scheduledStartAt, fromDate),
      extraPredicate
    );

    while (true) {
      const batch = await t
        .select({ id: classInstances.id })
        .from(classInstances)
        .where(conditions)
        .limit(BATCH_SIZE)
        .for("update");

      if (batch.length === 0) break;

      await t
        .update(classInstances)
        .set({ isFrozen, updatedAt: new Date() })
        .where(inArray(classInstances.id, batch.map(b => b.id)));

      totalUpdated += batch.length;

      if (batch.length < BATCH_SIZE) break;
    }

    return totalUpdated;
  };
  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
}
```

### Fix 17: getUnpaidInvoicesSummary — add LIMIT

**File:** `backend/db/repo/billing.repository.ts`

Add `.limit(500)` to the unpaid invoices query (after the `.orderBy(invoices.dueDate)` line).

### Fix 18: getAdminDashboardSchedule — add hard cap

**File:** `backend/db/repo/scheduling/scheduling-queries.repository.ts` (SAME FILE AS FIX 16 — apply both together)

Find the `fetchDailyScheduleBaseRows` function and add `.limit(2000)` to its final query to prevent unbounded results.

### Fix 19: searchCrossStaffAvailability — add LIMIT

**File:** `backend/db/repo/teacher-availability.repository.ts`

Add `.limit(100)` to the `allTeachers` query.

### Fix 20: getStudentsWithCreditStatus — add LIMIT

**File:** `backend/db/repo/billing.repository.ts` (SAME FILE AS FIX 17 — apply both together)

Add `.limit(200)` to the query (after the `.orderBy(students.classesRemaining)` line).

### Fix 21: Dedup permission resolution — use PermissionsService in gqlContext

**Files:** `backend/graphql/gqlContext.ts` AND `backend/lib/auth/permissions.ts`

In `gqlContext.ts`:
- Replace `import { resolveUserPermissions } from "@/backend/lib/auth/permissions"` with `import { PermissionsService } from "@/backend/services/auth/permissions.service"`
- Replace `await resolveUserPermissions(userId)` with `await PermissionsService.getUserContext(userId)`
- Add `role: string` to the `BaseContext` type
- Add `role: "Guest"` to the null-user return
- Add `role: permissionContext.role` to the authenticated-user return

In `backend/lib/auth/permissions.ts`:
- Remove the dead `userHasPermission` function (lines 66-69)

---

## Parallelization Groups (Sub-Agent Assignments)

Each group is a self-contained unit that can be assigned to one sub-agent. No two groups share files.

### Group A — `backend/db/repo/scheduling/state-changes.ts`
**Fixes:** 7 + 8
**Files to modify:** `backend/db/repo/scheduling/state-changes.ts`
**Verification:** After all edits, run verification loop on this file.

### Group B — `backend/db/repo/cache.repository.ts` + `backend/services/idempotency.service.ts`
**Fixes:** 9 + 10
**Files to modify:** `backend/db/repo/cache.repository.ts`, `backend/services/idempotency.service.ts`
**Verification:** Run verification loop on each file as you finish it.

### Group C — `backend/db/repo/scheduling/recurring.ts`
**Fixes:** 11 + 12
**Files to modify:** `backend/db/repo/scheduling/recurring.ts`
**PREREQUISITE:** Read `backend/db/schema/scheduling.ts` and verify `classInstances` has a `recurringScheduleId` column before applying Fix 12.
**Verification:** Run verification loop on this file.

### Group D — `backend/services/student/student-lifecycle.service.ts` + `backend/db/repo/student.repository.ts`
**Fixes:** 13
**Files to modify:** `backend/services/student/student-lifecycle.service.ts`, `backend/db/repo/student.repository.ts`
**Verification:** Run verification loop on each file as you finish it.

### Group E — `backend/services/system/dst-migration.service.ts`
**Fixes:** 14
**Files to modify:** `backend/services/system/dst-migration.service.ts`
**Verification:** Run verification loop on this file.

### Group F — `backend/lib/auth/jwt.ts` + `backend/graphql/mutation/auth.mutation.ts`
**Fixes:** 6 + 15
**Files to modify:** `backend/lib/auth/jwt.ts`, `backend/graphql/mutation/auth.mutation.ts`
**Verification:** Run verification loop on each file as you finish it.

### Group G — `backend/graphql/gqlContext.ts` + `backend/lib/auth/permissions.ts`
**Fixes:** 21
**Files to modify:** `backend/graphql/gqlContext.ts`, `backend/lib/auth/permissions.ts`
**Verification:** Run verification loop on each file as you finish it.

### Group H — `backend/db/repo/scheduling/scheduling-queries.repository.ts`
**Fixes:** 16 + 18
**Files to modify:** `backend/db/repo/scheduling/scheduling-queries.repository.ts`
**Verification:** Run verification loop on this file.

### Group I — `backend/db/repo/billing.repository.ts`
**Fixes:** 17 + 20
**Files to modify:** `backend/db/repo/billing.repository.ts`
**Verification:** Run verification loop on this file.

### Group J — `backend/db/repo/teacher-availability.repository.ts`
**Fixes:** 19
**Files to modify:** `backend/db/repo/teacher-availability.repository.ts`
**Verification:** Run verification loop on this file.

### Group K — GraphQL auth files
**Fixes:** 1 + 2 + 3
**Files to modify:** `backend/graphql/mutation/storage.mutation.ts`, `backend/graphql/query/storage.query.ts`, `backend/graphql/query/auth.query.ts`
**Verification:** Run verification loop on each file as you finish it.

### Group L — Storage API route files
**Fixes:** 4 + 5
**Files to modify:** `app/api/storage/files/[[...path]]/route.ts`, `app/api/storage/cleanup/route.ts`
**Verification:** Run verification loop on each file as you finish it.

---

## Sub-Agent Prompt Template

Each sub-agent should be given a prompt following this structure:

```
You are assigned to Group <X> of a repository fix plan.

## Your Fixes
<list the fixes from the plan above, with full code snippets>

## Files You Must Modify
<list files>

## Verification Protocol (MUST follow after each file)
After modifying each file, run this verification loop until a complete round has no issues:

1. Run: bun tsgo
   - Project-wide type check. If errors in YOUR files, fix them.
   - If errors ONLY in other files, ignore (other agents will fix them).

2. Run: bunx @biomejs/biome check --write --unsafe <file_path>
   - Scoped to the file you just edited. Auto-fixes issues.
   - If exit code != 0 after auto-fix, re-run to check.

3. Run lint via queue (PowerShell):
   $body = @{ id = "group-<X>"; files = @("<file_path>") } | ConvertTo-Json
   Invoke-RestMethod -Uri http://localhost:4777/lint -Method POST -ContentType 'application/json' -Body $body
   - Check success field. If false AND errors are in your file, fix them.

Repeat until ALL three checks pass for the current file, then move to the next file.

After finishing ALL your files, run `bun tsgo` one final time.

## Important Rules
- Fix ALL issues in one file before moving to the next
- If biome auto-fixes formatting changes, re-run biome to confirm clean
- Do NOT modify files outside your assigned group
- Do NOT start a lint queue server — one is already running at http://localhost:4777
- Report back: list each file modified, and the final status of all checks
```
