# Task A — Migration & Enum: New Permissions

**Objective:** Add 6 new story-8 permissions to the system permissions migration SQL and add 6 new `AppPermission` enum values to `shared/lib/enum.ts`. Run the full database migration sequence and verify all tests pass.

**Dependencies:** None — depends only on current project state.

**Layer-Specific Rules (Database Migration — Flattened from AGENTS.md):**
- New permissions MUST be added to `backend/db/migration/3-system_permissions_and_groups.sql` via `INSERT INTO permissions ... ON CONFLICT (key) DO UPDATE` pattern (matching existing style).
- New permissions must be assigned to `academy_admin` permission group via the group-permissions mapping section.
- After writing the migration, run in exact order: `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`. All four must pass.
- The `AppPermission` enum in `shared/lib/enum.ts` uses `PascalCase_KEY = "domain.action_name"` format.
- Do NOT create a separate seed file. All permission data goes in `3-system_permissions_and_groups.sql`.

**Target Files:**
- `shared/lib/enum.ts` — Add 6 new `AppPermission` enum entries
- `backend/db/migration/3-system_permissions_and_groups.sql` — Add 6 new permission INSERTs + group assignments

---

## Detailed Implementation Steps

### Step 1: Add enum values to `shared/lib/enum.ts`

Open `shared/lib/enum.ts` and locate the `AppPermission` enum. After the line:
```typescript
PARENT_VIEW_DIRECTORY = "parent.view_directory",
```
Add the following 6 new values (before `TEST_SYSTEM_ONLY`):

```typescript
// Story 8 — Parent Profile & Account Lifecycle Management
PARENT_VIEW_PROFILE = "parent.view_profile",
PARENT_MANAGE_STATUS = "parent.manage_status",
STUDENT_VIEW_ASSOCIATED = "student.view_associated",
STUDENT_EDIT_QUOTA = "student.edit_quota",
BILLING_VIEW_HISTORY = "billing.view_history",
DOCUMENT_MANAGE_PARENT_DOCS = "document.manage_parent_docs",
```

Run `bun tsgo` after this file change — must pass with 0 errors.

---

### Step 2: Add permission INSERTs to migration SQL

Open `backend/db/migration/3-system_permissions_and_groups.sql`.

Locate the large `INSERT INTO permissions (...) VALUES ... ON CONFLICT (key) DO UPDATE` block. At the end of the VALUES list, **before** the closing `ON CONFLICT` clause, add 6 new permission tuples. Match the exact style of the existing `parent.view_directory` entry at line 644:

```sql
    -- Story 8: Parent Profile & Account Lifecycle
    (
        gen_random_uuid (),
        'parent.view_profile',
        'parent',
        'view_profile',
        'Access detailed Parent Profile view with PII, social media links, and fee details',
        'Parents',
        true
    ),
    (
        gen_random_uuid (),
        'parent.manage_status',
        'parent',
        'manage_status',
        'Suspend or revoke a parent''s access to the LMS by setting account status to DEACTIVATED',
        'Parents',
        true
    ),
    (
        gen_random_uuid (),
        'student.view_associated',
        'student',
        'view_associated',
        'View the aggregated list of students associated with a specific parent, including teacher and quota data',
        'Students',
        true
    ),
    (
        gen_random_uuid (),
        'student.edit_quota',
        'student',
        'edit_quota',
        'Manually override a student''s classesRemaining integer, directly impacting billing cycle triggers',
        'Students',
        true
    ),
    (
        gen_random_uuid (),
        'billing.view_history',
        'billing',
        'view_history',
        'Access the full invoice ledger for a single parent, including paid and unpaid invoices',
        'Billing',
        true
    ),
    (
        gen_random_uuid (),
        'document.manage_parent_docs',
        'document',
        'manage_parent_docs',
        'Attach and view external files (contracts, ID verification) linked to a specific Parent record',
        'Documents',
        true
    )
```

---

### Step 3: Assign new permissions to academy_admin group

Find the section of `3-system_permissions_and_groups.sql` where permissions are inserted into the `permission_group_permissions` (or equivalent join) table for `academy_admin`. The existing pattern inserts permission keys by slug. Add all 6 new keys to the academy_admin group assignment block:

```sql
-- Add to academy_admin group (find the existing INSERT for academy_admin permissions)
        'parent.view_profile',
        'parent.manage_status',
        'student.view_associated',
        'student.edit_quota',
        'billing.view_history',
        'document.manage_parent_docs',
```

Verify the existing `super_admin` group uses a wildcard or explicit list — if explicit, add the 6 keys there too. Check lines 780-870 of the migration for the existing pattern and match it exactly.

---

### Step 4: Run the full migration sequence

Execute in exact order:

```bash
# Step 4a: Regenerate Drizzle schema from updated DB
bun db cleanGenerate

# Step 4b: Drop and recreate DB with all migrations
bun db reset

# Step 4c: Reseed with updated permission catalog
bun db seed

# Step 4d: Verify migration and seed data are correct
bun test:db
```

All four commands MUST pass with zero failures. If any fails:
- Fix the SQL syntax error in the migration.
- Re-run the full sequence from `bun db cleanGenerate`.
- Do NOT proceed to Task B until all four pass.

---

### Step 5: Verify permissions appear in DB

After successful seed, run a quick sanity check to confirm the 6 new permissions are in the database:

```bash
# Check via test output — bun test:db should cover permission catalog validation
# Additionally verify via: bun run scripts/dbActions.ts list-permissions (if script exists)
# OR confirm through existing permission management repository test
bun run test:coverage backend/db/test/repo/permissions.test.ts
```

---

## Test Execution Requirements

```bash
# Run full DB test suite to confirm no regressions
bun run test:db
```

Expected: All existing tests pass. The 6 new permissions now exist in the DB.

---

## Success Criteria / Check Progress Points

- [ ] `shared/lib/enum.ts` has 6 new `AppPermission` values (`PARENT_VIEW_PROFILE`, `PARENT_MANAGE_STATUS`, `STUDENT_VIEW_ASSOCIATED`, `STUDENT_EDIT_QUOTA`, `BILLING_VIEW_HISTORY`, `DOCUMENT_MANAGE_PARENT_DOCS`).
- [ ] `3-system_permissions_and_groups.sql` contains 6 new permission INSERT rows with correct `key`, `resource`, `action`, `description`, `category`, `is_system=true`.
- [ ] All 6 new permissions are assigned to the `academy_admin` permission group.
- [ ] `bun db cleanGenerate` completes with 0 errors.
- [ ] `bun db reset` completes with 0 errors.
- [ ] `bun db seed` completes with 0 errors.
- [ ] `bun test:db` passes with 0 failures.
- [ ] No new TypeScript errors introduced (run `bun tsgo` after enum change).

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings after modifying `shared/lib/enum.ts`
- [ ] `bun biome:check` passes with 0 errors & 0 warnings after modifying `shared/lib/enum.ts`
- [ ] `bun lint` passes with 0 errors & 0 warnings after modifying `shared/lib/enum.ts`
- [ ] `bun codescene` passes with 0 errors & 0 warnings after modifying `shared/lib/enum.ts`
- [ ] Loop over tsgo, biome:check, lint, codescene until no issues at all

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings after completing all steps
- [ ] `bun biome:check` passes with 0 errors & 0 warnings after completing all steps
- [ ] `bun lint` passes with 0 errors & 0 warnings after completing all steps
- [ ] `bun codescene` passes with 0 errors & 0 warnings after completing all steps
- [ ] Loop over tsgo, biome:check, lint, codescene until no issues at all
