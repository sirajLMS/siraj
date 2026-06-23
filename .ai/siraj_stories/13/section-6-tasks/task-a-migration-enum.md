### Task A — Database Migration & Enum: Add User Provisioning Permissions

**Objective:** Add four new permissions to the system permission catalog and AppPermission enum to enable user provisioning workflows and role-scoped authentication validation.

**Dependencies:** None — depends only on current project state (existing permission catalog migration and enum definitions).

**Layer-Specific Rules (Database Migrations - Flattened from AGENTS_STORY_PLANNING.md):**
- New permissions MUST be added to the existing `backend/db/migration/3-system_permissions_and_groups.sql` file, NOT to a separate seed file.
- Permissions must follow the existing naming convention: `<domain>.<action>` with PascalCase enum values.
- After modifying the migration, run the full sequence: `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`.
- All four commands MUST pass before the task is considered complete.
- The `protect_system_permissions` trigger prevents creating new system permissions via INSERT at runtime. New permissions must be added to the migration file's INSERT block.
- Enum values in `shared/lib/enum.ts` must use PascalCase with the format: `DOMAIN_ACTION_NAME = "domain.action_name"`.

**Target Files:**
- `backend/db/migration/3-system_permissions_and_groups.sql` — Add new permission INSERT statements and group assignments
- `shared/lib/enum.ts` — Add new AppPermission enum values

**Detailed Implementation Steps:**

*Step 1: Add new permissions to AppPermission enum*

Open `shared/lib/enum.ts` and add the following four new enum values to the `AppPermission` enum, inserting them in logical groupings with existing permissions:

```typescript
export enum AppPermission {
  // ... existing permissions ...
  
  // Authentication & Access Control
  AUTH_LOGIN = "auth.login",
  AUTH_VIEW_OWN_PROFILE = "auth.view_own_profile",
  AUTH_LOGIN_VALIDATION = "auth.login_validation", // NEW: Role-scoped credential validation
  
  // ... existing dashboard permissions ...
  
  // Teacher Management
  TEACHERS_LIST = "teachers.list",
  TEACHERS_CREATE = "teachers.create",
  TEACHERS_EDIT = "teachers.edit",
  TEACHERS_MANAGE_SCHEDULE = "teachers.manage_schedule",
  STAFF_CREATE_TEACHER = "staff.create_teacher", // NEW: Comprehensive teacher onboarding with salary/banking
  
  // Parent Management
  PARENTS_LIST = "parents.list",
  PARENTS_CREATE = "parents.create",
  PARENTS_EDIT = "parents.edit",
  PARENT_CREATE_ACCOUNT = "parent.create_account", // NEW: Parent onboarding with billing configuration
  
  // Staff/Manager Management
  STAFF_LIST = "staff.list",
  STAFF_CREATE = "staff.create",
  STAFF_EDIT = "staff.edit",
  MANAGER_CREATE_ACCOUNT = "manager.create_account", // NEW: Manager onboarding with RBAC assignment
  
  // ... remaining existing permissions ...
}
```

The exact insertion points:
- `AUTH_LOGIN_VALIDATION` → after `AUTH_VIEW_OWN_PROFILE` (line ~404)
- `STAFF_CREATE_TEACHER` → after `TEACHERS_MANAGE_SCHEDULE` (line ~436)
- `PARENT_CREATE_ACCOUNT` → after `PARENTS_EDIT` (line ~443)
- `MANAGER_CREATE_ACCOUNT` → after `STAFF_EDIT` (line ~465)

*Step 2: Add new permissions to SQL migration*

Open `backend/db/migration/3-system_permissions_and_groups.sql` and add four new INSERT tuples to the permissions INSERT block. Insert them after the existing `auth.view_own_profile` entry and before `dashboard.view`:

```sql
-- After auth.view_own_profile (line ~31), add:
    (
        gen_random_uuid (),
        'auth.login_validation',
        'auth',
        'login_validation',
        'Validate user credentials against role-scoped database tables before session creation',
        'Authentication',
        true
    ),

-- After teachers.manage_schedule (line ~318), add:
    (
        gen_random_uuid (),
        'staff.create_teacher',
        'staff',
        'create_teacher',
        'Create new teacher accounts with comprehensive profiles including personal info, official details, salary, and banking information',
        'Administration',
        true
    ),

-- After parents.edit (line ~345), add:
    (
        gen_random_uuid (),
        'parent.create_account',
        'parent',
        'create_account',
        'Create new parent accounts with billing configuration including invoice type, payment method, and currency',
        'Parents',
        true
    ),

-- After staff.edit (line ~525), add:
    (
        gen_random_uuid (),
        'manager.create_account',
        'manager',
        'create_account',
        'Create new manager/staff accounts with explicit RBAC privilege tier assignment (Admin or Manager)',
        'Administration',
        true
    ),
```

*Step 3: Assign new permissions to permission groups*

In the same migration file, update the group_permissions INSERT blocks to include the new permissions:

**Super Admin group** (after line ~994, add to the IN clause):
```sql
    g.slug = 'super_admin'
    AND p.key IN (
        -- ... all existing permissions ...
        'report.generate_custom',
        'report.view_financials',
        'auth.login_validation',       -- NEW
        'staff.create_teacher',        -- NEW
        'parent.create_account',       -- NEW
        'manager.create_account'       -- NEW
    );
```

**Academy Admin group** (after line ~1052, add to the IN clause):
```sql
    g.slug = 'academy_admin'
    AND p.key IN (
        -- ... all existing permissions ...
        'report.generate_custom',
        'report.view_financials',
        'auth.login_validation',       -- NEW
        'staff.create_teacher',        -- NEW
        'parent.create_account'        -- NEW
        -- NOTE: manager.create_account is NOT assigned to academy_admin
    );
```

**Teacher Default group** (after line ~1074, add to the IN clause):
```sql
    g.slug = 'teacher_default'
    AND p.key IN (
        -- ... all existing permissions ...
        'schedule.view_weekly',
        'schedule.view_workload',
        'auth.login_validation'        -- NEW
    );
```

**Parent Default group** (after line ~1090, add to the IN clause):
```sql
    g.slug = 'parent_default'
    AND p.key IN (
        -- ... all existing permissions ...
        'session.update_status.leave',
        'complaints.list',
        'auth.login_validation'        -- NEW
    );
```

**Staff Default group** (after line ~1109, add to the IN clause):
```sql
    g.slug = 'staff_default'
    AND p.key IN (
        -- ... all existing permissions ...
        'students.list',
        'complaints.list',
        'auth.login_validation'        -- NEW
    );
```

**System Automated group** — Do NOT add `auth.login_validation` to this group. The validation is for unauthenticated users, not system processes.

*Step 4: Run migration sequence*

Execute the following commands in exact order:

```bash
# Step 4a: Clean and regenerate Drizzle schema from database
bun db cleanGenerate

# Step 4b: Drop and recreate database with new migration
bun db reset

# Step 4c: Reseed database with updated permission catalog
bun db seed

# Step 4d: Verify migration and seed data
bun run test:db
```

All four commands MUST pass with zero errors. If any command fails:
1. Fix the migration SQL syntax or constraint violation
2. Re-run the full sequence from Step 4a (do NOT skip steps)

*Step 5: Verify enum compilation*

After the migration passes, verify that the TypeScript enum compiles correctly:

```bash
bun tsgo
```

This must pass with zero TypeScript errors. The new enum values should be accessible as:
- `AppPermission.AUTH_LOGIN_VALIDATION`
- `AppPermission.STAFF_CREATE_TEACHER`
- `AppPermission.PARENT_CREATE_ACCOUNT`
- `AppPermission.MANAGER_CREATE_ACCOUNT`

*Step 6: Verify permission seeding*

Connect to the database and verify the new permissions are seeded:

```sql
SELECT key, resource, action, category 
FROM permissions 
WHERE key IN (
    'auth.login_validation',
    'staff.create_teacher',
    'parent.create_account',
    'manager.create_account'
);
```

Expected result: 4 rows with correct resource, action, and category values.

Verify group assignments:

```sql
SELECT pg.slug, p.key
FROM permission_groups pg
JOIN group_permissions gp ON gp.group_id = pg.id
JOIN permissions p ON p.id = gp.permission_id
WHERE p.key IN (
    'auth.login_validation',
    'staff.create_teacher',
    'parent.create_account',
    'manager.create_account'
)
ORDER BY pg.slug, p.key;
```

Expected result:
- `super_admin`: all 4 permissions
- `academy_admin`: `auth.login_validation`, `staff.create_teacher`, `parent.create_account`
- `teacher_default`: `auth.login_validation`
- `parent_default`: `auth.login_validation`
- `staff_default`: `auth.login_validation`

**Test Execution Requirements:**
- Run the full database test suite:
  ```bash
  bun run test:db
  ```
- Verify TypeScript compilation:
  ```bash
  bun tsgo
  ```
- Verify linting:
  ```bash
  bun lint
  ```

**Success Criteria / Check Progress Points:**
- [ ] `AppPermission` enum contains all 4 new values with correct string mappings
- [ ] SQL migration contains all 4 new permission INSERT tuples
- [ ] SQL migration contains correct group_permission assignments for all groups
- [ ] `bun db cleanGenerate` passes with zero errors
- [ ] `bun db reset` passes with zero errors
- [ ] `bun db seed` passes with zero errors
- [ ] `bun run test:db` passes with zero failures
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] Database query confirms 4 new permissions are seeded
- [ ] Database query confirms correct group assignments
- [ ] `manager.create_account` is NOT assigned to `academy_admin` group
- [ ] `auth.login_validation` is assigned to all user groups (super_admin, academy_admin, teacher_default, parent_default, staff_default)

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
