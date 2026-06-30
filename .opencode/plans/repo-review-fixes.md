# Complete Repository Review — Fix Plan

## Subagent Quality Loop (MUST follow for EVERY modified file)

After modifying each file, the subagent MUST run this verification loop:
1. Run `~/.bun/bin/bun run tsgo -- <file>` (typecheck)
2. Run `~/.bun/bin/bun run biome:check -- <file>` (format/lint)
3. Submit to lint queue:
   ```powershell
   $body = @{ id = "<subagent-id>"; files = @("<file>") } | ConvertTo-Json
   Invoke-RestMethod -Uri http://localhost:4777/lint -Method POST -ContentType 'application/json' -Body $body
   ```
4. If ANY check has errors, fix them in the SAME file, then re-run ALL three checks.
5. A file is "done" only when a complete round of all 3 checks passes with zero issues.
6. Only then move to the next file.

**CRITICAL**: Fix ALL issues in one file before starting another file. Never leave a file with failing checks.

---

## Group A — Security: Unauthenticated Mutations & RLS

### Subagent A1: Auth guards on mutations

**Files to modify:**
1. `backend/graphql/mutation/student.mutation.ts`
2. `backend/graphql/mutation/onboarding.mutation.ts`
3. `backend/graphql/mutation/test-helper.mutation.ts`

**Changes:**

#### File 1: `backend/graphql/mutation/student.mutation.ts`
- Add `authScopes: { loggedIn: true }` to both `partiallyUpdateStudent` and `deleteStudent` fields.
- Change `(args)` in resolve to `(_query, args, ctx)` to access the context.
- Add a null guard: replace the inline resolve with a check that `ctx.user` exists; if not, throw an error.
- For `partiallyUpdateStudent`: pass `ctx.user.id` as `actorUserId` and add permission check via `PermissionsService.hasPermission(ctx.user.id, AppPermission.STUDENT_MANAGE_STATUS)` before calling the repo.
- For `deleteStudent`: similarly require auth and `AppPermission.STUDENT_MANAGE_STATUS`.
- Import `PermissionsService` from `@/backend/services/auth/permissions.service` and `AppPermission` from `@/shared/lib/enum`.
- Import `getBackendTranslations` from `@/backend/lib/intl` for localized error messages.
- Do NOT call repository directly — delegate to a service method or add permission check at minimum.

#### File 2: `backend/graphql/mutation/onboarding.mutation.ts`
- Add `authScopes: { loggedIn: true }` to `createTeacher`, `createParent`, and `createManager` fields.
- Replace `ctx.user?.id || ""` with a proper null guard: check `ctx.user?.id` and throw a localized "insufficientPermissions" error if undefined.
- Import `getBackendTranslations` from `@/backend/lib/intl`.

#### File 3: `backend/graphql/mutation/test-helper.mutation.ts`
- Add `authScopes: { loggedIn: true }` to all four test mutations (`createTestEntities`, `cleanupTestEntities`, `createTestGroupClass`, `cleanupTestGroupClass`) that are inside the `if (process.env.NODE_ENV !== "production")` block.
- This means the entire `gqlSchemaBuilder.mutationFields` call needs `authScopes` on each field.

---

### Subagent A2: File serving authorization + Rate limiter fail-open

**Files to modify:**
1. `app/api/storage/files/[[...path]]/route.ts`
2. `backend/lib/ratelimit.ts`

**Changes:**

#### File 1: `app/api/storage/files/[[...path]]/route.ts`
After the user is authenticated (after line 125), add file ownership verification:
- Import `StorageDbRepository` from `@/backend/db/repo/storage.repository`.
- Import `TeacherRepository` from `@/backend/db/repo/teacher.repository`.
- Import `ParentRepository` from `@/backend/db/repo/parent.repository`.
- Call `StorageDbRepository.getFileUsages(relativePath)` to get the list of entities that reference this file.
- If `usages.length > 0`, check if the authenticated user has access to at least one of the referenced entities:
  - For `users` usages: allow if `usage.referenceId === payload.userId`
  - For `teachers` usages: allow if the user is a teacher with that `teacherId` (check via `TeacherRepository`), or the user is an admin/superadmin (check via `ctx.isSuperAdmin` or permissions)
  - For `parents` usages: allow if the user is the parent with that `parentId`, or is admin
  - For `invoices`, `complaints`, `students`, `learning_resources`, `staff_profiles`, `recurring_schedules`, `class_instances` usages: allow if the user is a superAdmin or has relevant admin permissions
  - If the user has no matching entity access, return 403 Forbidden.
- If `usages.length === 0` (file not associated with any entity yet), allow access for any authenticated user (it's likely newly uploaded).
- Simplified approach: Import `PermissionsService` from `@/backend/services/auth/permissions.service`. If the user is a superAdmin, allow. Otherwise, check if the user's role (from DB lookup) has a matching entity relationship. A pragmatic minimal fix: check if file usages exist and the user is superAdmin OR one of the usage referenceIds matches the user's own entity IDs (teacher/parent/user), otherwise deny with 403.

#### File 2: `backend/lib/ratelimit.ts`
- Add a `failOpen` constructor parameter (default `true` for backward compatibility).
- In the `limit()` catch block (line 63): return `success: false` if `!this.failOpen`.
- In the `limitSimple()` catch block (line 140): return `success: false` if `!this.failOpen`.
- In `checkRateLimit()` catch block (line 212): check if the limiter is fail-open; if not, return `success: false`.
- Make `authRateLimiter` (line 168) use `failOpen: false` — change `new RateLimiter("ratelimit:auth", 10, ...)` to pass `false` as 4th arg.
  - Constructor signature becomes: `constructor(prefix, maxRequests, windowMs, failOpen = true)`
- Keep `graphqlRateLimiter` and `apiRateLimiter` as fail-open (current behavior).

---

## Group B — Business Logic: Billing & State Machine

### Subagent B1: Billing idempotency + paid invoice deletion guard

**Files to modify:**
1. `backend/services/billing/billing-management.service.ts`

**Changes:**

#### File 1: `backend/services/billing/billing-management.service.ts`

**Fix 1 — Idempotency key (line 103):**
- Add an optional `idempotencyKey` parameter to `CreateManualInvoiceInput` interface.
- In `createManualInvoice`, use `input.idempotencyKey ?? deriveIdempotencyKey(input)` instead of `randomUUID()`.
- Add a helper function `deriveIdempotencyKey` that creates a deterministic key from `parentId`, `studentId`, `amount`, `currency`, `invoiceType` (use `crypto.createHash("sha256").update(parts.join(":")).digest("hex")` — import `createHash` from `node:crypto`).
- This makes duplicate submissions produce the same key, enabling the existing idempotency check in `BillingRepository.createInvoice` to actually prevent duplicates.

**Fix 2 — Paid invoice deletion guard (line 198):**
- In `deleteInvoice`, after the permission check, add a status guard:
  - Fetch the invoice using `BillingRepository.getInvoiceById(invoiceId, undefined, locale)`.
  - If `invoice.status === "PAID"`, throw a localized error ("cannotDeletePaidInvoice" or similar — add to error namespace).
  - Only then proceed to `BillingRepository.deleteInvoice(...)`.

---

### Subagent B2: State transition trigger fix

**Files to modify:**
1. `backend/db/migration/class_instances_state_transition_trigger.sql`

**Changes:**

#### File 1: `backend/db/migration/class_instances_state_transition_trigger.sql`
Replace the trigger function body to add two missing guards:

```sql
CREATE OR REPLACE FUNCTION fn_enforce_class_instance_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.execution_state IS DISTINCT FROM NEW.execution_state THEN
        -- COMPLETED can only transition to NOT_ACTIVATED (revert) or remain COMPLETED
        IF OLD.execution_state = 'COMPLETED' AND NEW.execution_state IN ('ACTIVATED', 'RUNNING') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot reactivate a COMPLETED class instance.';
        END IF;

        -- COMPLETED+TAKEN cannot be reset to NOT_ACTIVATED (financial integrity)
        IF OLD.execution_state = 'COMPLETED' AND NEW.execution_state = 'NOT_ACTIVATED' AND OLD.outcome = 'TAKEN' THEN
            RAISE EXCEPTION 'Invalid transition: Cannot reset a COMPLETED instance with TAKEN outcome.';
        END IF;

        -- RUNNING cannot transition to ACTIVATED
        IF OLD.execution_state = 'RUNNING' AND NEW.execution_state = 'ACTIVATED' THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move a RUNNING class instance back to ACTIVATED.';
        END IF;

        -- ACTIVATED can only transition to COMPLETED if outcome is ABSENT or LEAVE
        IF OLD.execution_state = 'ACTIVATED' AND NEW.execution_state = 'COMPLETED' AND NEW.outcome NOT IN ('ABSENT', 'LEAVE') THEN
            RAISE EXCEPTION 'Invalid transition: ACTIVATED instance can only complete with ABSENT or LEAVE outcome.';
        END IF;

        -- NOT_ACTIVATED can only transition to COMPLETED with LEAVE outcome
        IF OLD.execution_state = 'NOT_ACTIVATED' AND NEW.execution_state = 'COMPLETED' AND NEW.outcome NOT IN ('LEAVE') THEN
            RAISE EXCEPTION 'Invalid transition: NOT_ACTIVATED instance can only complete with LEAVE outcome.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;
```

Note: Also update the Drizzle migration copy at `backend/drizzle/20260629035852_combined_custom_logic/migration.sql` — find the same trigger function definition and apply the same changes there. Search for `fn_enforce_class_instance_transition` in that file.

---

## Group C — Performance: N+1 Queries & Unbounded Results

### Subagent C1: N+1 query fixes (parent directory + complaint service)

**Files to modify:**
1. `backend/services/parent/parent-directory.service.ts`
2. `backend/services/communication/complaint.service.ts`

**Changes:**

#### File 1: `backend/services/parent/parent-directory.service.ts`
- Replace the loop (line 63-79) that calls `getStudentsForParent(row.id)` per parent with a batch query.
- After getting `rawRows`, extract all parent IDs: `const parentIds = rawRows.map(r => r.id)`.
- Add a new batch method `ParentRepository.getStudentsForParents(parentIds: string[])` that returns a `Map<string, StudentRow[]>`:
  - In `backend/db/repo/parent.repository.ts`, add this method: query `students` table where `parentId IN (parentIds)`, group results by `parentId`.
- In the service, call the batch method once, then look up each parent's students from the Map.
- Loop becomes: for each `row` in `rawRows`, get `studentsMap.get(row.id) ?? []`.

**Also modify:** `backend/db/repo/parent.repository.ts` — add `getStudentsForParents` method.

#### File 2: `backend/services/communication/complaint.service.ts`
- In the parent complaints method (line 130-155), replace the per-complaint loop with the existing batch method.
- After getting `result.complaints`, extract `complaintIds = result.complaints.map(c => c.id)`.
- Call `ComplaintResponseRepository.getResponsesByComplaints(complaintIds)` (the batch method already used by the admin path at line 266-267).
- Build a `Map<string, ComplaintResponse[]>` from the batch result.
- Replace the loop body to look up responses from the map instead of making individual calls.

---

### Subagent C2: Repository unbounded queries + duplicate timezone fetch

**Files to modify:**
1. `backend/db/repo/learning-resource.repository.ts`
2. `backend/db/repo/book.repository.ts`
3. `backend/db/repo/user.repository.ts`
4. `backend/db/repo/parent.repository.ts`
5. `backend/db/repo/billing.repository.ts`
6. `backend/db/repo/dst-migration.repository.ts`

**Changes:**

#### File 1: `backend/db/repo/learning-resource.repository.ts`
- Change `listResources` signature to accept `pagination?: PaginationArgs | null`.
- Add `PaginationArgs` import from `@/backend/types`.
- When pagination is provided, add `.limit(perPage).offset(offset)` to the rows query (same pattern as billing repo).
- When pagination is null, add a default `.limit(200)` to prevent unbounded results.
- Add count query that already exists — keep it but ensure it's consistent.

#### File 2: `backend/db/repo/book.repository.ts`
- Add pagination parameter: `findMany(pagination?: PaginationArgs, tx?)`.
- Add `PaginationArgs` import.
- When pagination provided, apply `.limit().offset()`.
- When null, add default `.limit(200)`.
- Check all callers of `findMany` and update them if needed.

#### File 3: `backend/db/repo/user.repository.ts`
- Add `@deprecated` JSDoc comment to `findAll` recommending `findUsersPaginated`.
- Add a default `.limit(500)` to `findAll` to prevent truly unbounded results.
- Alternatively, make `findAll` private or remove it if no callers exist (check with grep first).

#### File 4: `backend/db/repo/parent.repository.ts`
- In `getParentDashboardSchedule` (around lines 534-545):
  - Fetch `timezoneForFormatting` once using `fetchParentTimezone(t, parentId)` before the conditional.
  - Use the same variable for both the date filter condition (line 534) and the formatting (line 545).
  - Remove the second call at line 545.

#### File 5: `backend/db/repo/billing.repository.ts`
- In `getInvoicesForParent` (line 407): when no pagination, add `.limit(200)` default.
- In `getAllInvoices` (line 476): when no pagination, add `.limit(200)` default.
- These default limits prevent unbounded queries while preserving backward compatibility.

#### File 6: `backend/db/repo/dst-migration.repository.ts`
- In `getActiveRecurringSchedules` (line 62): add an optional `limit` parameter (default 500).
- Add `.limit(limit)` to the query.
- Also add a date filter for `effective_until IS NULL OR effective_until > NOW()`:
  - Import `gte` and `sql` from drizzle-orm if not already imported.
  - Add condition `.where(and(isNull(recurringSchedules.deletedAt), or(isNull(recurringSchedules.effectiveUntil), gte(recurringSchedules.effectiveUntil, sql`NOW()`))))`

---

## Group D — Deploy Safety: Migration & Script Guards

### Subagent D1: Script production guards + migration fixes

**Files to modify:**
1. `backend/db/scripts/drizzleSeed.ts`
2. `backend/db/scripts/resetDb.ts`
3. `backend/drizzle/20260629035851_colossal_living_mummy/migration.sql`
4. `backend/drizzle/20260629035852_combined_custom_logic/migration.sql`

**Changes:**

#### File 1: `backend/db/scripts/drizzleSeed.ts`
- Add at the top of `runSeed()` (before any other logic):
  ```typescript
  if (process.env.NODE_ENV === "production") {
    logger.error("Seeding is not allowed in production environment");
    process.exit(1);
  }
  ```

#### File 2: `backend/db/scripts/resetDb.ts`
- Add at the top of `resetDatabase()` (after the DATABASE_URL check, before any DB operations):
  ```typescript
  if (process.env.NODE_ENV === "production") {
    logger.error("Database reset is not allowed in production environment");
    process.exit(1);
  }
  ```

#### File 3: `backend/drizzle/20260629035851_colossal_living_mummy/migration.sql`
- On lines 973-974, change `CREATE INDEX CONCURRENTLY` to `CREATE INDEX` (remove `CONCURRENTLY`).
  - The comment `--> statement-breakpoint` must remain as Drizzle uses it.
  - `CREATE INDEX CONCURRENTLY` cannot run inside a transaction, and Drizzle runs migrations in transactions.
  - The manual migration counterpart (`2-functions.sql` etc.) handles this correctly for production.

#### File 4: `backend/drizzle/20260629035852_combined_custom_logic/migration.sql`
- On line 1000, replace the destructive `DELETE FROM group_permissions WHERE group_id IN (SELECT id FROM permission_groups WHERE is_system = true)` with a more targeted approach.
- Change to:
  ```sql
  DELETE FROM group_permissions
  WHERE group_id IN (
      SELECT id FROM permission_groups WHERE is_system = true
  )
  AND permission_id IN (
      SELECT id FROM permissions
      WHERE key IN (
          -- List only the specific permission keys that this migration manages
          'auth.login',
          'auth.view_own_profile',
          -- ... include ALL the permission keys from the subsequent INSERT block
      )
  );
  ```
  - Extract the complete list of permission keys from the INSERT INTO group_permissions blocks that follow (lines 1009+). This ensures only the permissions this migration manages are deleted, preserving any custom admin assignments.

---

## Group E — Duplication & Dead Code

### Subagent E1: Pothos type duplication fixes

**Files to modify:**
1. `backend/types/schedule.types.ts` (or create metric type there)
2. `backend/graphql/pothos/schedule.pothos.ts`
3. `backend/graphql/pothos/teacher-dashboard.pothos.ts`
4. `backend/graphql/pothos/staff-directory.pothos.ts`

**Changes:**

#### File 1: `backend/types/schedule.types.ts` (add shared metrics type)
- Add a new exported type:
  ```typescript
  export type ClassSessionMetrics = {
    id?: string;
    total: number;
    regular: number;
    trial: number;
    advance: number;
    rescheduled: number;
    suspended: number;
    taken: number;
    pending: number;
    activated: number;
    running: number;
    absent: number;
    leave: number;
  };
  ```
  Note: `id` is optional because `TeacherDashboardMetricsDefinition` does not have it but `DailyScheduleMetricsDefinition` does.

#### File 2: `backend/graphql/pothos/schedule.pothos.ts`
- Remove the local `DailyScheduleMetricsDefinition` type (lines 13-26).
- Import `ClassSessionMetrics` from `@/backend/types`.
- Change: `export type DailyScheduleMetricsDefinition = { ... }` → use `ClassSessionMetrics` as the objectRef type.
- Update `gqlSchemaBuilder.objectRef<ClassSessionMetrics>("DailyScheduleMetrics")`.
- Ensure the `id` field is still exposed if present in the data.

#### File 3: `backend/graphql/pothos/teacher-dashboard.pothos.ts`
- Remove the local `TeacherDashboardMetricsDefinition` type (lines 51-64).
- Import `ClassSessionMetrics` from `@/backend/types`.
- Change ref to: `gqlSchemaBuilder.objectRef<ClassSessionMetrics>("TeacherDashboardMetrics")`.
- Update field implementations to match.

#### File 4: `backend/graphql/pothos/staff-directory.pothos.ts`
- Remove the local `TeacherDirectoryRowDefinition` type (lines 9-17).
- Import `TeacherDirectoryRow` from `@/backend/types`.
- Use `TeacherDirectoryRow` as the objectRef type but add `index` as a computed field.
- Change `avatarUrl: t.exposeString("avatarUrl")` to `avatarUrl: t.exposeString("avatarUrl", { nullable: true })` to match the canonical type's nullability.

---

### Subagent E2: Dead code removal

**Files to delete:**
1. `frontend/stores/classAuditStore.ts`
2. `frontend/stores/classDetailsStore.ts`
3. `frontend/stores/studentStatusStore.ts`
4. `shared/lib/simpleLogger.ts`
5. `shared/lib/middleware.ts`
6. `shared/utils/auth.ts`
7. `backend/utils/types.utils.ts`

**Files to modify:**
1. `shared/lib/enum.ts` (remove `Calendar` enum — lines 6-9)
2. `shared/demo-users.ts` (remove unused exports: `superAdmins`, `staff`, `ALL_DEMO_USERS` — lines 65, 69, 71, verify lines)
3. `frontend/stores/classDetailsStore.ts` — actually just delete the file
4. `scratch/get-issue.ts` — delete
5. `scratch/query-db.ts` — delete

**Important**: Before deleting each file, verify no imports exist with grep. If an import is found, do not delete — instead note it as blocked.

**Changes for `shared/lib/enum.ts`:**
- Remove the `Calendar` enum (lines 6-9). It uses numeric values (0, 1) and is never imported by any consumer.

**Changes for `shared/demo-users.ts`:**
- Remove the `superAdmins`, `staff`, and `ALL_DEMO_USERS` exports. Keep `INTERNAL_DEMO_USERS`, `academyAdmins`, `teachers`, `parents`.
- Remove any variables only used by those exports.

---

## Execution Order for Parallel Subagents

These groups can run in parallel:
- **A1** + **A2**: Security (no file overlap)
- **B1** + **B2**: Business logic (no file overlap)
- **C1** + **C2**: Performance (no file overlap between C1 and C2)
- **D1**: Deploy safety
- **E1** + **E2**: Duplication & dead code (no file overlap)

Recommended parallel batch:
- Batch 1: A1, A2, B1, B2, C1, C2, D1, E1, E2 (all can run in parallel since they modify different files)

**Note on C1**: C1 modifies both `parent-directory.service.ts` AND `parent.repository.ts`. C2 also modifies `parent.repository.ts`. To avoid conflicts, C2 should skip the parent.repository.ts change OR C1 and C2 should be merged. **Decision**: C2 should NOT touch parent.repository.ts for the timezone fix — let C1 handle that file. Move the timezone fix in parent.repository.ts to C1's file list.

**Updated C2 file list** (remove parent.repository.ts, add to C1):
- C1 files: `parent-directory.service.ts`, `complaint.service.ts`, `parent.repository.ts` (for both getStudentsForParents batch method + timezone fix)
- C2 files: `learning-resource.repository.ts`, `book.repository.ts`, `user.repository.ts`, `billing.repository.ts`, `dst-migration.repository.ts`

---

## Post-verification

After ALL subagents complete:
1. Run `~/.bun/bin/bun run tsgo` (full typecheck — no single file)
2. Run `~/.bun/bin/bun run biome:check` (full check)
3. Submit lint queue request for ALL modified files at once
4. Fix any remaining issues
