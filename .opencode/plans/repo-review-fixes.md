# Complete Repository Review — Fix Plan

## Subagent Quality Loop (MUST follow for EVERY modified file)

After modifying each file, the subagent MUST run this verification loop:

1. Run `~/.bun/bin/bun tsgo` (typecheck — no args needed, checks whole project)
2. Run `~/.bun/bin/bun biome:check` (format/lint — no args needed, checks whole project)
3. Submit to lint queue server (already running at `http://localhost:4777`):
   ```powershell
   $body = @{ id = "<subagent-id>"; files = @("<file>", "<file2>") } | ConvertTo-Json
   Invoke-RestMethod -Uri http://localhost:4777/lint -Method POST -ContentType 'application/json' -Body $body
   ```
4. If ANY check has errors, fix them in the SAME file, then re-run ALL three checks from step 1.
5. A file is "done" only when a complete round of all 3 checks passes with zero issues.
6. Only then move to the next file.

**CRITICAL RULES:**
- Fix ALL issues in one file before starting another file. Never leave a file with failing checks.
- The quality loop is: tsgo → biome:check → lint-queue → if any fail, fix and restart the loop from tsgo.
- Only move to the next file when a full round (all 3) passes clean.

---

## Group A — Security (CRITICAL + WARNING)

### Subagent A1: Auth guards on GraphQL queries/mutations

**Files to modify:**
1. `backend/graphql/query/student.query.ts`
2. `backend/graphql/query/auth.query.ts`
3. `backend/graphql/mutation/auth.mutation.ts`
4. `backend/graphql/mutation/student.mutation.ts`

**Changes:**

#### File 1: `backend/graphql/query/student.query.ts`
- Add `authScopes: { loggedIn: true }` to both `student` and `students` query fields.
- These fields currently have NO authScopes, making them accessible to unauthenticated callers.

```typescript
// For both 'student' and 'students' fields, add:
authScopes: { loggedIn: true },
```

#### File 2: `backend/graphql/query/auth.query.ts`
- Restrict `user(id)` query: change `authScopes` from `{ loggedIn: true }` to `{ permission: "USER_MANAGE" }` or add a permission check.
- Add a `limit` to `users` query: it currently calls `UserRepository.findAll()` which returns up to 500 rows with password hashes.
- Change `users` query to use `UserRepository.findUsers({ limit: 50, offset: 0 })` instead of `findAll()`.
- Read `backend/graphql/gqlSchemaBuilder.ts` first to check how `authScopes: { permission: "..." }` works — it may use a different key name.

#### File 3: `backend/graphql/mutation/auth.mutation.ts`
- Line 201: Remove `process.env.NEXT_PUBLIC_IS_DEMO` from the demo login gate.
- Change the condition from `process.env.NEXT_PUBLIC_IS_DEMO === "true" || process.env.IS_DEMO === "true"` to only `process.env.IS_DEMO === "true"`.
- `NEXT_PUBLIC_` env vars are embedded in client-side JS and spoofable — only use server-side `IS_DEMO`.

#### File 4: `backend/graphql/mutation/student.mutation.ts`
- `partiallyUpdateStudent` (line 47) bypasses status transition validation. It calls `StudentRepository.partiallyUpdate()` which sets `status` directly without checking `ALLOWED_STATUS_TRANSITIONS`.
- Fix: In `partiallyUpdateStudent`'s resolve, if `input.status` is present, route the status change through `StudentRepository.changeStatus(input.id, input.status)` instead. Remove `status` from the partial update input before calling `partiallyUpdate`.
- Read `backend/db/repo/student.repository.ts` to confirm `changeStatus` signature: `changeStatus(studentId, newStatus, expectedVersion?, tx?, locale?)`.
- The transition-validated status change must happen first, then the remaining fields can be updated via `partiallyUpdate` (with status removed from the input).

---

### Subagent A2: Storage mutations + Rate limiter fail-open

**Files to modify:**
1. `backend/graphql/mutation/storage.mutation.ts`
2. `backend/lib/ratelimit.ts`

**Changes:**

#### File 1: `backend/graphql/mutation/storage.mutation.ts`
- Storage mutations (`deleteFile`, `deleteStorageItems`, `setStorageItemProtection`, `updateDirectoryPermissions`) have no object-level authorization — any logged-in user can act on any file.
- Minimal fix: Add `ctx` parameter to each resolver that currently ignores it.
- For destructive mutations (`deleteFile`, `deleteStorageItems`): In the resolver, after getting the storage service, validate that the user has admin permissions OR owns the target resource.
- Import `PermissionsService` from `@/backend/services/auth/permissions.service`.
- Import `AppPermission` from `@/shared/lib/enum`.
- Add a permission check: `await PermissionsService.hasPermission(ctx.user.id, AppPermission.STORAGE_MANAGE)` — if user lacks, check if the file belongs to them by querying usages. If no match, throw a localized error.
- For `setStorageItemProtection` and `updateDirectoryPermissions`: require `AppPermission.STORAGE_MANAGE` (admin-only).
- Read `backend/graphql/gqlContext.ts` first to understand the `ctx` shape.

#### File 2: `backend/lib/ratelimit.ts`
- Line 161: Change `graphqlRateLimiter` from `failOpen: true` (default) to `failOpen: false`.
- Change: `new RateLimiter("ratelimit:graphql", 100, 60 * 1000)` → `new RateLimiter("ratelimit:graphql", 100, 60 * 1000, false)`.
- This matches `authRateLimiter`'s fail-closed behavior. If Redis/Postgres goes down, rate limiting should block requests, not open the floodgates.
- The `apiRateLimiter` (line 183) can remain fail-open since it's a general throttle.

---

## Group B — Performance (WARNING)

### Subagent B1: N+1 query fixes

**Files to modify:**
1. `backend/db/repo/permission-management.repository.ts`
2. `backend/graphql/pothos/permission-management.pothos.ts`
3. `backend/db/repo/storage.repository.ts`
4. `backend/db/repo/scheduling/scheduling-queries.repository.ts`
5. `backend/graphql/query/teacher-dashboard.query.ts`

**Changes:**

#### File 1: `backend/db/repo/permission-management.repository.ts` (line 50)
- `listAllGroups` fetches two full tables then joins in JavaScript O(N*M).
- Replace with a single SQL query using LEFT JOIN and `sql` template:
  ```typescript
  export async function listAllGroups(tx?: DBTransaction): Promise<GroupWithPermissionIds[]> {
    const client = tx ?? db;
    const rows = await client
      .select({
        id: permissionGroups.id,
        name: permissionGroups.name,
        slug: permissionGroups.slug,
        description: permissionGroups.description,
        isSystem: permissionGroups.isSystem,
        createdByUserId: permissionGroups.createdByUserId,
        createdAt: permissionGroups.createdAt,
        updatedAt: permissionGroups.updatedAt,
        permissionId: groupPermissions.permissionId,
      })
      .from(permissionGroups)
      .leftJoin(groupPermissions, eq(groupPermissions.groupId, permissionGroups.id))
      .orderBy(permissionGroups.name);

    const groupMap = new Map<string, GroupWithPermissionIds>();
    for (const row of rows) {
      if (!groupMap.has(row.id)) {
        groupMap.set(row.id, {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          isSystem: row.isSystem,
          createdByUserId: row.createdByUserId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          permissionIds: [],
        });
      }
      if (row.permissionId) {
        groupMap.get(row.id)!.permissionIds.push(row.permissionId);
      }
    }
    return [...groupMap.values()];
  }
  ```

#### File 2: `backend/graphql/pothos/permission-management.pothos.ts` (line 38)
- The `assignedUsers` field resolver on `PermissionGroupObject` fires a separate DB query per group (N+1).
- Fix: Batch the resolution by pre-fetching in the top-level query resolver.
- Read the file first. In the `permissionGroups` query resolver (or wherever `listAllGroups` is called), also call `PermissionManagementRepository.listUsersInGroup` for all group IDs in a batch.
- Create a new batch method `listAllGroupUsers(tx?)` in the repository that returns `Map<string, UserEntity[]>`.
- In the Pothos field, use a DataLoader pattern or look up from the pre-fetched data stored on the parent object.
- Pragmatic approach: Add `assignedUserIds` to the `GroupWithPermissionIds` return type, fetch them in `listAllGroups` via a single JOIN query, and expose them via a pre-computed field rather than a per-row resolver.

#### File 3: `backend/db/repo/storage.repository.ts` (line 204)
- `fetchAllUsages` fires 10 parallel SELECT queries against 10 junction tables for every single file.
- Replace with a UNION ALL approach for `isFileInUse` (which only needs existence):
  ```typescript
  async function isFileInUseOptimized(fId: string): Promise<boolean> {
    const result = await db.execute(sql`
      SELECT 1 FROM (
        SELECT id FROM user_files WHERE file_id = ${fId} LIMIT 1
        UNION ALL SELECT id FROM teacher_files WHERE file_id = ${fId} LIMIT 1
        UNION ALL SELECT id FROM student_files WHERE file_id = ${fId} LIMIT 1
        UNION ALL SELECT id FROM parent_files WHERE file_id = ${fId} LIMIT 1
        UNION ALL SELECT id FROM invoice_files WHERE file_id = ${fId} LIMIT 1
        UNION ALL SELECT id FROM complaint_files WHERE file_id = ${fId} LIMIT 1
        UNION ALL SELECT id FROM learning_resource_files WHERE file_id = ${fId} LIMIT 1
        UNION ALL SELECT id FROM staff_profile_files WHERE file_id = ${fId} LIMIT 1
        UNION ALL SELECT id FROM recurring_schedule_files WHERE file_id = ${fId} LIMIT 1
        UNION ALL SELECT id FROM class_instance_files WHERE file_id = ${fId} LIMIT 1
      ) sub LIMIT 1
    `);
    return result.length > 0;
  }
  ```
- Keep `fetchAllUsages` for `getFileUsages` which needs full usage details, but add `.limit(1)` to each sub-query's columns to minimize data transfer (just `SELECT id` instead of `SELECT *`).

#### File 3 (also): `backend/db/repo/storage.repository.ts` (line 97)
- `directoriesByParentPath` with no `parentPath` returns entire table with no LIMIT.
- Add `.limit(500)` as a defensive cap when `parentPath` is undefined.

#### File 4: `backend/db/repo/scheduling/scheduling-queries.repository.ts` (line 137-188)
- Dashboard fetches up to 2000 rows then filters/paginates in JavaScript.
- This is a complex change. Minimal safe fix: reduce `.limit(2000)` to `.limit(500)`.
- Add a comment explaining the architecture: `// TODO: Push metricFilter and pagination into SQL for production scale. Current approach loads a bounded set and filters in JS.`
- Reducing the limit from 2000 to 500 is a safe interim improvement that reduces memory and CPU overhead.

#### File 5: `backend/graphql/query/teacher-dashboard.query.ts` (line 16-83)
- Two queries (`teacherDashboard` and `teacherActiveDashboard`) duplicate identical 20+ line resolve blocks with only the mode string differing.
- Extract a shared resolve helper:
  ```typescript
  async function resolveTeacherDashboard(ctx: BaseContext, args: { date: string; pagination?: ... }, mode: "teacher" | "teacher-active") {
    if (!ctx.user) { /* throw */ }
    const pagination = args.pagination ? new PaginationArgs(args.pagination) : null;
    const result = await TeacherDashboardService.getDashboard(ctx.user.id, args.date, mode, ctx.locale, pagination);
    return {
      ...result,
      scheduleRows: result.scheduleRows.map(r => ({
        id: r.id,
        studentId: r.studentId,
        studentName: r.student?.name || "Unknown",
        scheduledStartAt: r.scheduledStartAt,
        durationMinutes: r.durationMinutes,
        executionState: r.executionState,
        outcome: r.outcome ?? null,
        zoomMeetingUrl: r.zoomMeetingUrl ?? null,
        yourTimeFormatted: r.yourTimeFormatted ?? null,
      })),
    };
  }
  ```
- Then both query fields call `resolveTeacherDashboard(ctx, args, "teacher")` and `resolveTeacherDashboard(ctx, args, "teacher-active")`.

---

### Subagent B2: Unbounded queries + correlated subqueries

**Files to modify:**
1. `backend/db/repo/user.repository.ts`
2. `backend/db/repo/parent.repository.ts`
3. `backend/db/repo/dst-migration.repository.ts`
4. `backend/db/repo/student.repository.ts`

**Changes:**

#### File 1: `backend/db/repo/user.repository.ts` (line 89)
- `findAll` returns up to 500 user rows including password hashes.
- Change `findAll` to select only safe fields: `id, name, email, isActive, createdAt`.
- Use explicit column selection instead of `db.select().from(users)`:
  ```typescript
  export const findAll = async (): Promise<Pick<UserEntity, "id" | "name" | "email" | "isActive" | "createdAt">[]> => {
    return await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users).limit(500);
  };
  ```
- Check all callers of `findAll` — if they need password hash, redirect them to `findByEmail` or `findById`.

#### File 2: `backend/db/repo/parent.repository.ts` (line 165-168)
- `getParentDirectory` uses a correlated subquery for `unpaidInvoices` count per parent row.
- Replace with a LEFT JOIN on a pre-aggregated subquery:
  ```typescript
  // Add to the query builder:
  .leftJoin(
    sql`(SELECT parent_id, COUNT(*)::int as cnt FROM ${invoices} WHERE ${invoices.status} = 'UNPAID' GROUP BY parent_id)`,
    sql`unpaid_inv`,
    sql`unpaid_inv.parent_id = ${parents.id}`
  )
  ```
  Then use `sql<number>`COALESCE(unpaid_inv.cnt, 0)`` instead of the correlated subquery.
- Read the full function first to understand the query builder structure before modifying.

#### File 3: `backend/db/repo/dst-migration.repository.ts` (line 111)
- `updateRecurringScheduleTimesBatch` issues N individual UPDATE statements in a for-loop.
- Replace with a batched UPDATE using VALUES list:
  ```typescript
  export const updateRecurringScheduleTimesBatch = async (
    updates: Array<{ scheduleId: string; newStartTime: string; newOffset: number }>,
    tx?: DBTransaction
  ) => {
    const queryDb = tx ?? db;
    if (updates.length === 0) return;
    const now = new Date();
    const values = sql.join(
      updates.map(u => sql`(${u.scheduleId}, ${u.newStartTime}, ${u.newOffset})`),
      sql`, `
    );
    await queryDb.execute(sql`
      UPDATE recurring_schedules rs
      SET default_start_time = data.new_start,
          utc_offset_snapshot = data.new_offset,
          updated_at = ${now}
      FROM (VALUES ${values}) AS data(id, new_start, new_offset)
      WHERE rs.id = data.id::uuid
    `);
  };
  ```
- Read the file first to check column names and types.

#### File 4: `backend/db/repo/student.repository.ts` (line 163)
- `deleteById` performs hard delete outside a transaction.
- Wrap in `db.transaction()`:
  ```typescript
  export const deleteById = async (id: string, locale?: string): Promise<Types.StudentEntity> => {
    const existingStudent = await findById(id);
    if (!existingStudent) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("studentNotFound", { id }));
    }
    await db.transaction(async (tx) => {
      await tx.delete(students).where(eq(students.id, id));
    });
    return existingStudent;
  };
  ```
- Also: `createList` (line 119-131) inserts students one at a time via `Promise.all(input.map(item => create(...)))`. Replace with a bulk INSERT:
  ```typescript
  export const createList = async (
    input: Types.StudentCreateInput[],
    locale?: string
  ): Promise<Types.StudentEntity[]> => {
    if (input.length === 0) return [];
    try {
      // Validate names first
      for (const item of input) {
        const nameErr = await StudentUtils.validateName(item.name, locale);
        if (nameErr) throw new Error(nameErr);
      }
      const values = input.map(item => ({
        ...item,
        idempotencyKey: item.idempotencyKey ?? randomUUID(),
      }));
      return await db.insert(students).values(values).returning();
    } catch (error) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("studentCreateError", { message: error instanceof Error ? error.message : "Unknown error" }), {
        cause: error,
      });
    }
  };
  ```

---

## Group C — Deploy Safety (WARNING)

### Subagent C1: Migration safety improvements

**Files to modify:**
1. `backend/drizzle/20260629101653_class_categories_and_subjects_seed/migration.sql`
2. `backend/db/migration/hours_per_week_recalculation.sql`
3. `backend/db/migration/timezone_dst_logic.sql`
4. `backend/db/migration/3-system_permissions_and_groups.sql`

**Changes:**

#### File 1: `backend/drizzle/20260629101653_class_categories_and_subjects_seed/migration.sql`
- Lines 79 and 84: Non-concurrent `CREATE INDEX` on `recurring_schedules` and `class_instances` will lock these tables for writes.
- The migration already has a comment noting this (lines 75-78). Strengthen it by adding a deployment instruction block:
  ```sql
  -- ============================================================
  -- DEPLOY SAFETY: These CREATE INDEX statements will lock recurring_schedules
  -- and class_instances for writes during index build. For production deployments
  -- with existing data, run these indexes manually BEFORE applying this migration:
  --   CREATE INDEX CONCURRENTLY recurring_schedules_subject_id_idx ON recurring_schedules (subject_id);
  --   CREATE INDEX CONCURRENTLY class_instances_subject_id_idx ON class_instances (subject_id);
  -- Then change the statements below to IF NOT EXISTS (they will be no-ops since indexes already exist).
  -- ============================================================
  ```

#### File 2: `backend/db/migration/hours_per_week_recalculation.sql`
- Line 85: Full-table backfill UPDATE on `students` without batching.
- Add a comment block before the UPDATE:
  ```sql
  -- DEPLOY SAFETY: This one-time backfill UPDATE runs across ALL students in a single statement.
  -- For production deployments with large student tables (1000+ rows), consider splitting into
  -- batched updates of 500 rows at a time:
  --   UPDATE students s SET hours_per_week = ...
  --   WHERE s.id IN (SELECT id FROM students ORDER BY id LIMIT 500 OFFSET 0);
  -- Repeat with increasing OFFSET until no rows remain.
  ```

#### File 3: `backend/db/migration/timezone_dst_logic.sql`
- Line 57: `auto_adjust_dst_bookings()` UPDATEs all future class instances in a single statement.
- Add a comment block inside the function body (before the CTE):
  ```sql
  -- DEPLOY SAFETY: This UPDATE touches all future class instances with DST drift in a single
  -- statement, holding row locks for the duration. For databases with many future class instances,
  -- consider refactoring to process in batches of 500 using a cursor loop:
  --   LOOP
  --     UPDATE class_instances ... WHERE id IN (SELECT id FROM affected_classes LIMIT 500) RETURNING 1;
  --     EXIT WHEN NOT FOUND;
  --   END LOOP;
  ```

#### File 4: `backend/db/migration/3-system_permissions_and_groups.sql`
- Line 987: Destructive `DELETE FROM group_permissions` for all system groups.
- This wipes custom permission assignments on re-deploy. The migration should be more targeted.
- Change the DELETE to only affect the specific permission keys this migration manages.
- Read the INSERT INTO group_permissions blocks after the DELETE (lines 996+) to extract the list of permission keys.
- Modify to:
  ```sql
  DELETE FROM group_permissions
  WHERE group_id IN (SELECT id FROM permission_groups WHERE is_system = true)
  AND permission_id IN (
    SELECT id FROM permissions WHERE key IN (
      'auth.login',
      'auth.view_own_profile',
      -- ... include ALL permission keys from the subsequent INSERT blocks
    )
  );
  ```
- **Important**: Read the full file to get the complete list of permission keys from the INSERT blocks.

---

## Group D — Duplication & Dead Code

### Subagent D1: RequireAuth deduplication + dead code

**Files to modify:**
1. Create `backend/graphql/utils/requireAuth.ts` (new shared utility)
2. `backend/graphql/mutation/student.mutation.ts`
3. `backend/graphql/mutation/onboarding.mutation.ts`
4. All other mutation files that duplicate `requireAuth` (grep for the pattern)
5. `backend/services/student/suspended-lock.service.ts` (delete)
6. `backend/services/student/student-leave-processing.service.ts` (delete)
7. `backend/services/student/index.ts` (remove exports)

**Changes:**

#### File 1: Create `backend/graphql/utils/requireAuth.ts`
- Create a shared utility:
  ```typescript
  import { getBackendTranslations } from "@/backend/lib/intl";
  import type { BaseContext } from "../gqlContext";

  export async function requireAuth(ctx: BaseContext): Promise<string> {
    if (!ctx.user?.id) {
      const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
      throw new Error(tFunc("unauthorized"));
    }
    return ctx.user.id;
  }
  ```

#### Files 2-4: Replace all local `requireAuth` functions
- Grep for `async function requireAuth(ctx: BaseContext)` across all mutation files.
- In each file that defines its own `requireAuth`, delete the local function and import from `@/backend/graphql/utils/requireAuth`.
- The onboarding mutation currently uses `tFunc("insufficientPermissions")` — standardize to `"unauthorized"` (same as all others).
- Also replace any inline `if (!ctx.user?.id)` checks that could use the shared utility.

#### Files 5-6: Delete dead code files
- Delete `backend/services/student/suspended-lock.service.ts`
- Delete `backend/services/student/student-leave-processing.service.ts`

#### File 7: Remove exports
- In `backend/services/student/index.ts`, remove:
  - `export * from "./suspended-lock.service";`
  - `export * from "./student-leave-processing.service";`
- Also verify with grep that no other file imports from these before deleting.

---

### Subagent D2: Dead code in test + DBTransaction type deduplication

**Files to modify:**
1. `backend/db/test/logic/class_quota_race.test.ts`
2. All files that locally redefine `DBTransaction` type (grep for the pattern)

**Changes:**

#### File 1: `backend/db/test/logic/class_quota_race.test.ts` (line 104-105)
- Fix SQL injection pattern in test code: replace `sql.raw()` with string interpolation to Drizzle's parameterized `sql` template tag.
- Change:
  ```typescript
  // FROM:
  await db.execute(sql.raw(`UPDATE class_instances SET deleted_at = NOW() WHERE student_id = '${data.studentId}'`));
  await db.execute(sql.raw(`DELETE FROM class_instances WHERE student_id = '${data.studentId}'`));
  // TO:
  await db.execute(sql`UPDATE class_instances SET deleted_at = NOW() WHERE student_id = ${data.studentId}`);
  await db.execute(sql`DELETE FROM class_instances WHERE student_id = ${data.studentId}`);
  ```

#### File 2+: DBTransaction type deduplication
- Grep for `type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]` across all files.
- Read `backend/db/db.types.ts` to confirm it exports `DBTransaction`.
- In each file that locally redefines `DBTransaction`, delete the local definition and import from `@/backend/db/db.types`.
- Files likely affected (verify with grep):
  - `backend/services/teacher/teacher-onboarding.service.ts`
  - `backend/services/parent/parent-onboarding.service.ts`
  - `backend/services/staff/manager-onboarding.service.ts`
  - `backend/db/repo/storage.repository.ts`
  - `backend/db/repo/scheduling/scheduling-queries.repository.ts`
  - Test files that redefine it

---

## Execution Order for Parallel Subagents

These subagents can run in parallel since they modify different files:

**Batch 1** (all can run in parallel):
- **A1**: student.query.ts, auth.query.ts, auth.mutation.ts, student.mutation.ts
- **A2**: storage.mutation.ts, ratelimit.ts
- **B1**: permission-management.repository.ts, permission-management.pothos.ts, storage.repository.ts, scheduling-queries.repository.ts, teacher-dashboard.query.ts
- **B2**: user.repository.ts, parent.repository.ts, dst-migration.repository.ts, student.repository.ts
- **C1**: Drizzle migration SQL, hours_per_week SQL, timezone_dst SQL, 3-system_permissions SQL
- **D1**: Create requireAuth.ts, update mutation files, delete dead services, update index.ts
- **D2**: class_quota_race.test.ts, DBTransaction dedup files

**Conflict avoidance:**
- B1 touches `storage.repository.ts` and B2 does NOT → OK
- B2 touches `student.repository.ts` and A1 touches `student.mutation.ts` → different files, OK
- B2 touches `parent.repository.ts` and B1 does NOT → OK
- D1 creates a new file `backend/graphql/utils/requireAuth.ts` → no conflict
- D2 may touch test files → no overlap with other subagents

---

## Post-verification

After ALL subagents complete:
1. Run `~/.bun/bin/bun tsgo` (full typecheck)
2. Run `~/.bun/bin/bun biome:check` (full check)
3. Submit lint queue request for ALL modified files at once
4. Fix any remaining issues
