### Task A — Migration & Enum: Add System Resource Access Restriction Permission + Group Assignment Updates

**Objective:** Add the new `system.restrict_resource_access` permission to the database migration and `AppPermission` enum. Update permission group assignments so `academy_admin` gains `students.list` and `resources.upload`, and `system_automated` gains `system.restrict_resource_access`.

**Dependencies:** None — depends only on current project state.

**Layer-Specific Rules (Database Migration — Flattened from AGENTS_STORY_PLANNING.md):**
- New permissions MUST be added to `backend/db/migration/3-system_permissions_and_groups.sql`.
- After writing the migration, run the full sequence: `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`. All four must pass before the task is complete.
- The `protect_system_permissions` trigger prevents runtime INSERT of `is_system = true` rows — permissions MUST be in the migration file.

**Target Files:**
- `backend/db/migration/3-system_permissions_and_groups.sql` — MODIFY (add permission row + update group assignments)
- `shared/lib/enum.ts` — MODIFY (add new AppPermission enum entry)

---

**Detailed Implementation Steps:**

*Step 1: Add `system.restrict_resource_access` permission row to migration SQL*

Open `backend/db/migration/3-system_permissions_and_groups.sql`. Locate the last permission value tuple in the `INSERT INTO permissions` VALUES list (currently `system.process_student_leave` around line 775–782). Add a new tuple after it with a trailing comma on the previous row:
```sql
    -- Existing last row (add trailing comma):
    (
        gen_random_uuid (),
        'system.process_student_leave',
        'system',
        'process_student_leave',
        'Process student leave status and reschedule future classes',
        'System',
        true
    ),
    -- NEW: Story 11 — System-Level Resource Access Restriction
    (
        gen_random_uuid (),
        'system.restrict_resource_access',
        'system',
        'restrict_resource_access',
        'Enforce isolation of learning resources storage from unauthorized external access',
        'System',
        true
    )
```

The `ON CONFLICT (key) DO UPDATE` clause remains unchanged at the end.

**Permission field mapping:**
| Field | Value |
|---|---|
| `key` | `'system.restrict_resource_access'` |
| `resource` | `'system'` |
| `action` | `'restrict_resource_access'` |
| `description` | `'Enforce isolation of learning resources storage from unauthorized external access'` |
| `category` | `'System'` |
| `is_system` | `true` |

---

*Step 2: Update `academy_admin` group assignment to include `students.list` and `resources.upload`*

Locate the `academy_admin` group assignment block in the migration file (around lines 966–1016). This block uses the pattern:

```sql
INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'academy_admin'
    AND p.key IN (
        'dashboard.view',
        ...existing keys...
    );
```

Add `'students.list'` and `'resources.upload'` to the `IN` clause. The exact position within the IN list does not matter (SQL is unordered), but place them near related permissions for readability:

**Before:**
```sql
    AND p.key IN (
        'dashboard.view',
        'parents.list',
        'parents.create',
        'parents.edit',
        'students.list',
        'students.edit',
        'students.change_teacher',
        'students.change_status',
        'students.override_quota',
        'teachers.list',
        'teachers.create',
        'teachers.edit',
        'teachers.manage_schedule',
        'staff.view_directory',
        'staff.list',
        'staff.create',
        'staff.edit',
        'staff.edit_profile',
        'schedule.view_weekly',
        'schedule.view_workload',
        'schedule.create_class',
        'schedule.delete_class',
        'schedule.clear_weekly',
        'session.view_details',
        'session.activate_class',
        'session.update_status.start',
        'session.update_status.absent',
        'session.update_status.leave',
        'session.override_actions',
        'invoices.list',
        'invoices.create',
        'invoices.edit',
        'invoices.delete',
        'invoices.mark_paid',
        'billing.view_history',
        'billing.create_invoice',
        'billing.update_status_paid',
        'billing.delete_invoice',
        'reports.generate',
        'complaints.list',
        'complaints.respond',
        'complaints.delete',
        'student.view_associated',
        'student.edit_quota',
        'student.manage_status',
        'student.reassign_teacher'
    );
```

**Note:** Verify whether `students.list` is already in the `academy_admin` block before adding it. If it IS already present (check the actual file content), do NOT add a duplicate — only add `resources.upload`. The plan must be validated against the actual file content during execution.

**After (add `resources.upload` — and `students.list` only if not already present):**
```sql
        'student.reassign_teacher',
        'students.list',        -- Story 11: Academy Admin gains student directory access
        'resources.upload'      -- Story 11: Academy Admin gains resource upload capability
    );
```

---

*Step 3: Update `system_automated` group assignment to include `system.restrict_resource_access`*

Locate the `system_automated` group assignment block (around lines 1075–1089). Add the new permission key:

**Before:**
```sql
INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'system_automated'
    AND p.key IN (
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'system.sync_notifications',
        'system.enforce_suspended_lock',
        'system.process_student_leave'
    );
```

**After:**
```sql
INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'system_automated'
    AND p.key IN (
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'system.sync_notifications',
        'system.enforce_suspended_lock',
        'system.process_student_leave',
        'system.restrict_resource_access'
    );
```

---

*Step 4: Add `SYSTEM_RESTRICT_RESOURCE_ACCESS` to `AppPermission` enum*

Open `shared/lib/enum.ts`. Locate the `AppPermission` enum. Find the Story 10 entries around lines 490–492:

```typescript
  // Story 10: Automated Student Status Enforcement
  SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock",
  SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave",
  TEST_SYSTEM_ONLY = "test.system_only",
```

Add the new entry between `SYSTEM_PROCESS_STUDENT_LEAVE` and `TEST_SYSTEM_ONLY`:

```typescript
  // Story 10: Automated Student Status Enforcement
  SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock",
  SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave",
  // Story 11: System-Level Resource Access Restriction
  SYSTEM_RESTRICT_RESOURCE_ACCESS = "system.restrict_resource_access",
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
```

**Naming convention:** `SYSTEM_RESTRICT_RESOURCE_ACCESS = "system.restrict_resource_access"` follows the PascalCase pattern: `DOMAIN_ACTION_NAME = "domain.action_name"`.

---

*Step 5: Run migration sequence*

After both files are saved, run the following commands in **exact order**:

```bash
bun db cleanGenerate
```
This regenerates the Drizzle schema from the updated database. Verify: 0 errors.

```bash
bun db reset
```
This drops and recreates the database with the new migration. Verify: 0 errors, all migrations applied successfully.

```bash
bun db seed
```
This reseeds the database with updated permission catalog. Verify: 0 errors, all permissions inserted.

```bash
bun test:db
```
This verifies the migration and seed data are correct. Verify: 0 failures.

If any command fails, fix the migration and re-run the full sequence from step 1.

---

*Step 6: Verify migration results*

Run these verification queries/commands:

```bash
# Verify new permission exists in database
rg "restrict_resource_access" backend/db/migration/3-system_permissions_and_groups.sql

# Verify academy_admin group includes new assignments
rg -A 60 "g.slug = 'academy_admin'" backend/db/migration/3-system_permissions_and_groups.sql

# Verify system_automated group includes new permission
rg -A 10 "g.slug = 'system_automated'" backend/db/migration/3-system_permissions_and_groups.sql

# Verify enum entry
rg "SYSTEM_RESTRICT_RESOURCE_ACCESS" shared/lib/enum.ts
```

**Test Execution Requirements:**
- **Run the whole test suite:** Run `bun run test:db` across the database folder to make sure no existing tests are broken.
  ```bash
  bun run test:db
  ```

**Success Criteria / Check Progress Points:**
- [ ] `system.restrict_resource_access` permission row added to migration SQL with correct fields.
- [ ] `academy_admin` group IN clause includes `students.list` and `resources.upload`.
- [ ] `system_automated` group IN clause includes `system.restrict_resource_access`.
- [ ] `SYSTEM_RESTRICT_RESOURCE_ACCESS` enum entry added to `shared/lib/enum.ts` in correct position.
- [ ] `bun db cleanGenerate` passes with 0 errors.
- [ ] `bun db reset` passes with 0 errors.
- [ ] `bun db seed` passes with 0 errors.
- [ ] `bun run test:db` passes with 0 failures.

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
