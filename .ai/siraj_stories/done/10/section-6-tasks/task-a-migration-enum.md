### Task A — Migration & Enum: Add `system.enforce_suspended_lock` and `system.process_student_leave`

**Objective:** Add two new system-automated permission rows to the permission migration SQL and add corresponding `AppPermission` enum entries to the shared enum file. This is the foundational task — all subsequent tasks depend on these enum values being available.

**Dependencies:** None — depends only on current project state (existing migration file and enum file).

**Layer-Specific Rules (Database / Seeds — Flattened from backend/db/seeds/AGENTS.md and migration conventions):**
- New permissions MUST be added to `backend/db/migration/3-system_permissions_and_groups.sql`, NOT to a separate seed file.
- New enum entries MUST follow the `DOMAIN_ACTION_NAME = "domain.action_name"` naming convention.
- The migration must be re-run after changes using the exact 4-command protocol.
- `AppPermission` enum values for system permissions use the `SYSTEM_` prefix.
- Test system permissions (`TEST_SYSTEM_ONLY`, `TEST_CUSTOM_ONLY`) must remain at the end of the `AppPermission` enum section.

**Target Files:**
- `backend/db/migration/3-system_permissions_and_groups.sql` (Modify)
- `shared/lib/enum.ts` (Modify)

---

**Detailed Implementation Steps:**

### Step 1: Understand the Migration Structure

The migration file `backend/db/migration/3-system_permissions_and_groups.sql` is a long SQL file that:
1. Seeds permission rows in an INSERT block (lines 1–763)
2. Uses `ON CONFLICT (key) DO UPDATE SET ...` at line 764 to handle re-seeding
3. Creates permission groups (lines ~800–900)
4. Assigns permissions to groups via INSERT SELECT blocks (lines ~900–1123)

The `system_automated` group assignment block (near line 1063) uses an `AND p.key IN (...)` filter to select which permissions to assign.

### Step 2: Add New Permission Rows to the INSERT Block

In `backend/db/migration/3-system_permissions_and_groups.sql`, locate the VALUES block for the permissions INSERT statement. The last Story 9 permission entry is at approximately line 762 (before the `ON CONFLICT (key) DO UPDATE` block at line 764).

**Insert the following SQL immediately before the `ON CONFLICT (key) DO UPDATE` line at line 764:**

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

**Important:** The trailing comma after each row is required because the `ON CONFLICT` block follows. Check the exact context carefully:

```sql
-- EXISTING (last Story 9 row, approximately line 759–763):
    (
        gen_random_uuid (),
        'system.sync_notifications',
        'system',
        'sync_notifications',
        'Synchronizes notification state across all recipients for a given event',
        'System',
        true
    ),
-- NEW (Story 10 additions — insert here, before ON CONFLICT):
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
    )
-- EXISTING (ON CONFLICT block — note NO trailing comma on last row above):
ON CONFLICT (key) DO UPDATE SET
    domain      = EXCLUDED.domain,
    action      = EXCLUDED.action,
    description = EXCLUDED.description,
    category    = EXCLUDED.category,
    is_system   = EXCLUDED.is_system;
```

**Critical:** Remove the trailing comma from the last new row (`system.process_student_leave`) before the `ON CONFLICT` block — SQL VALUES lists do not allow a trailing comma before the conflict clause.

### Step 3: Update the `system_automated` Group Assignment Block

Locate the `system_automated` group assignment block at approximately lines 1063–1068. This block uses:

```sql
AND p.key IN (
    'system.enforce_time_window',
    'system.enforce_leave_limit',
    'system.sync_notifications'
);
```

**Replace it with:**

```sql
AND p.key IN (
    'system.enforce_time_window',
    'system.enforce_leave_limit',
    'system.sync_notifications',
    'system.enforce_suspended_lock',
    'system.process_student_leave'
);
```

The full context of the `system_automated` block (for reference) should look like:

```sql
-- Assign permissions to system_automated group
INSERT INTO permission_group_permissions (permission_group_id, permission_id)
SELECT
    pg.id,
    p.id
FROM
    permission_groups pg
    JOIN permissions p ON true
WHERE
    pg.slug = 'system_automated'
    AND p.key IN (
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'system.sync_notifications',
        'system.enforce_suspended_lock',
        'system.process_student_leave'
    )
ON CONFLICT DO NOTHING;
```

### Step 4: Add AppPermission Enum Entries

**File:** `shared/lib/enum.ts`
**Context (lines 487–492, verified):**

```typescript
  SYSTEM_ENFORCE_TIME_WINDOW = "system.enforce_time_window",
  SYSTEM_ENFORCE_LEAVE_LIMIT = "system.enforce_leave_limit",
  SYSTEM_SYNC_NOTIFICATIONS = "system.sync_notifications",
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
```

**Target state (add Story 10 entries between `SYSTEM_SYNC_NOTIFICATIONS` and `TEST_SYSTEM_ONLY`):**

```typescript
  SYSTEM_ENFORCE_TIME_WINDOW = "system.enforce_time_window",
  SYSTEM_ENFORCE_LEAVE_LIMIT = "system.enforce_leave_limit",
  SYSTEM_SYNC_NOTIFICATIONS = "system.sync_notifications",
  // Story 10: Automated Student Status Enforcement
  SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock",
  SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave",
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
```

**Exact entries to add:**
```typescript
  // Story 10: Automated Student Status Enforcement
  SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock",
  SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave",
```

These entries are placed after `SYSTEM_SYNC_NOTIFICATIONS` and before the test-only entries. The test-only entries (`TEST_SYSTEM_ONLY`, `TEST_CUSTOM_ONLY`) MUST remain at the end of the system permission group.

### Step 5: Run the Migration Protocol

After modifying both files, run the following commands **in exact order**:

```bash
# Step 5.1: Regenerate Drizzle schema from updated database
bun db cleanGenerate

# Step 5.2: Drop and recreate the database with the new migration
bun db reset

# Step 5.3: Reseed the database with updated permission catalog
bun db seed

# Step 5.4: Verify migration and seed data are correct
bun test:db
```

**All four commands MUST pass before Task A is complete.** If any command fails:
- If `bun db cleanGenerate` fails → check for SQL syntax errors in the migration file
- If `bun db reset` fails → check for constraint violations or transaction errors
- If `bun db seed` fails → check for data integrity issues (duplicate keys, etc.)
- If `bun test:db` fails → check that existing tests still pass with new permissions seeded

### Step 6: Verify the Changes

After migration protocol completes successfully, run these verification commands:

```bash
# Verify AppPermission enum values exist in shared/lib/enum.ts
grep -n "SYSTEM_ENFORCE_SUSPENDED_LOCK\|SYSTEM_PROCESS_STUDENT_LEAVE" shared/lib/enum.ts

# Verify permission rows in migration SQL
grep -n "enforce_suspended_lock\|process_student_leave" backend/db/migration/3-system_permissions_and_groups.sql

# Verify system_automated group IN clause is updated
grep -A 15 "system_automated" backend/db/migration/3-system_permissions_and_groups.sql | grep -E "enforce_suspended|process_student"

# Verify TypeScript compilation still passes
bun tsgo
```

**Expected results:**
- First command: 2 lines found, at the correct position between `SYSTEM_SYNC_NOTIFICATIONS` and `TEST_SYSTEM_ONLY`
- Second command: 4+ lines found (2 in VALUES block, 2 in group assignment IN clause)
- Third command: Both new permission keys found in the `system_automated` group assignment
- Fourth command: 0 TypeScript errors

---

**Test Execution Requirements:**

Run the complete database test suite to verify no regressions:

```bash
bun run test:db
```

**Expected output:** 0 failures. All existing tests from Story 9 and earlier still pass.

---

**Success Criteria / Check Progress Points:**

- [ ] `system.enforce_suspended_lock` permission row added to migration VALUES block (before `ON CONFLICT`)
- [ ] `system.process_student_leave` permission row added to migration VALUES block (before `ON CONFLICT`)
- [ ] No trailing comma syntax error — last new row before `ON CONFLICT` does NOT have a trailing comma
- [ ] `system_automated` group assignment block updated to include both new permission keys
- [ ] `AppPermission.SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock"` added to `shared/lib/enum.ts`
- [ ] `AppPermission.SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave"` added to `shared/lib/enum.ts`
- [ ] Test entries (`TEST_SYSTEM_ONLY`, `TEST_CUSTOM_ONLY`) remain at the end of the enum block — not displaced
- [ ] `bun db cleanGenerate` exits with code 0
- [ ] `bun db reset` exits with code 0
- [ ] `bun db seed` exits with code 0
- [ ] `bun test:db` exits with code 0, all tests pass
- [ ] `bun tsgo` exits with code 0, no TypeScript errors related to new enum entries

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
