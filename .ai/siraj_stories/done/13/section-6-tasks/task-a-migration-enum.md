### Task A — Database Migration & Enum: Verify Existing Permissions

**Objective:** Verify that existing permissions (`teachers.create`, `parents.create`, `staff.create`) are correctly defined in the system permission catalog and AppPermission enum.

**Dependencies:** None — depends only on current project state (existing permission catalog migration and enum definitions).

**Layer-Specific Rules (Database Migrations - Flattened from AGENTS_STORY_PLANNING.md):**
- **NO new permissions are created.** This sprint reuses existing permissions from the migration file.
- The existing permissions already follow the naming convention: `<domain>.<action>` with PascalCase enum values.
- Verify the migration file contains the correct permission definitions and group assignments.
- Run the full sequence: `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`.
- All four commands MUST pass before the task is considered complete.

**Target Files:**
- `backend/db/migration/3-system_permissions_and_groups.sql` — Verify existing permission INSERT statements and group assignments
- `shared/lib/enum.ts` — Verify existing AppPermission enum values

**Detailed Implementation Steps:**

*Step 1: Verify existing permissions in AppPermission enum*

Open `shared/lib/enum.ts` and verify the following enum values exist:

```typescript
export enum AppPermission {
  // ... existing permissions ...
  
  // Teacher Management
  TEACHERS_CREATE = "teachers.create",
  
  // Parent Management
  PARENTS_CREATE = "parents.create",
  
  // Staff/Manager Management
  STAFF_CREATE = "staff.create",
  
  // ... remaining existing permissions ...
}
```

*Step 2: Verify existing permissions in SQL migration*

Open `backend/db/migration/3-system_permissions_and_groups.sql` and verify the following permissions exist in the INSERT block:

```sql
-- teachers.create (around line 295-301)
    (
        gen_random_uuid (),
        'teachers.create',
        'teachers',
        'create',
        'Create teacher accounts',
        'Teachers',
        true
    ),

-- parents.create (around line 331-337)
    (
        gen_random_uuid (),
        'parents.create',
        'parents',
        'create',
        'Create parent accounts',
        'Parents',
        true
    ),

-- staff.create (around line 511-517)
    (
        gen_random_uuid (),
        'staff.create',
        'staff',
        'create',
        'Create staff accounts',
        'Administration',
        true
    ),
```

*Step 3: Verify permission group assignments*

In the same migration file, verify the group_permissions assignments:

**Super Admin group** — Should already include:
- `teachers.create`
- `parents.create`
- `staff.create`

**Admin group** — Should already include:
- `teachers.create`
- `parents.create`
- **NOT** `staff.create` (this is the security boundary)

*Step 4: Run migration sequence*

Execute the following commands in exact order:

```bash
# Step 4a: Clean and regenerate Drizzle schema from database
bun db cleanGenerate

# Step 4b: Drop and recreate database with migration
bun db reset

# Step 4c: Reseed database with permission catalog
bun db seed

# Step 4d: Verify migration and seed data
bun run test:db
```

All four commands MUST pass with zero errors.

*Step 5: Verify enum compilation*

After the migration passes, verify that the TypeScript enum compiles correctly:

```bash
bun tsgo
```

This must pass with zero TypeScript errors. The enum values should be accessible as:
- `AppPermission.TEACHERS_CREATE`
- `AppPermission.PARENTS_CREATE`
- `AppPermission.STAFF_CREATE`

*Step 6: Verify permission seeding*

Connect to the database and verify the permissions are seeded:

```sql
SELECT key, resource, action, category 
FROM permissions 
WHERE key IN (
    'teachers.create',
    'parents.create',
    'staff.create'
);
```

Expected result: 3 rows with correct resource, action, and category values.

Verify group assignments:

```sql
SELECT pg.slug, p.key
FROM permission_groups pg
JOIN group_permissions gp ON gp.group_id = pg.id
JOIN permissions p ON p.id = gp.permission_id
WHERE p.key IN (
    'teachers.create',
    'parents.create',
    'staff.create'
)
ORDER BY pg.slug, p.key;
```

Expected result:
- `super_admin`: `teachers.create`, `parents.create`, `staff.create`
- `academy_admin`: `teachers.create`, `parents.create`
- `academy_admin` should NOT have `staff.create`

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
- [ ] `AppPermission` enum contains `TEACHERS_CREATE`, `PARENTS_CREATE`, `STAFF_CREATE` with correct string mappings
- [ ] SQL migration contains all 3 permission INSERT tuples
- [ ] SQL migration contains correct group_permission assignments for Super Admin and Admin
- [ ] `bun db cleanGenerate` passes with zero errors
- [ ] `bun db reset` passes with zero errors
- [ ] `bun db seed` passes with zero errors
- [ ] `bun run test:db` passes with zero failures
- [ ] `bun tsgo` passes with zero TypeScript errors
- [ ] Database query confirms 3 permissions are seeded
- [ ] Database query confirms correct group assignments
- [ ] `staff.create` is NOT assigned to `academy_admin` group
- [ ] `teachers.create` and `parents.create` are assigned to both `super_admin` and `academy_admin`

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings
