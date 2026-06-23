### Task A — Migration & Enum: New Story 9 Permissions

**Objective:** Add 6 new permission entries to the system permissions migration SQL file and add the corresponding `AppPermission` enum values to `shared/lib/enum.ts`. Run the full migration reset sequence to verify integrity.

**Dependencies:** None — depends only on current project state. See [Section 5](../section-5-prerequisites.md) for all verified prerequisites.

**Layer-Specific Rules (Database Migration — Flattened from `backend/db/repo/AGENTS.md`):**
- New permissions MUST be added to `backend/db/migration/3-system_permissions_and_groups.sql` using `INSERT INTO permissions ... ON CONFLICT (key) DO UPDATE SET` — never create a separate SQL file.
- New permission group assignments MUST be added to the `INSERT INTO group_permissions` blocks within the same file, targeting the correct group slugs.
- After any migration change, run in exact order: `bun db cleanGenerate` → `bun db reset` → `bun db seed` → `bun test:db`. All four must pass.
- Verify `protect_system_permissions` trigger is active — it prevents deletion or mutation of `is_system=true` records.

**Target Files:**
- `shared/lib/enum.ts` — Add 6 new `AppPermission` enum entries
- `backend/db/migration/3-system_permissions_and_groups.sql` — Add 6 new permission inserts + group assignments

---

#### Step 1: Add New `AppPermission` Enum Entries to `shared/lib/enum.ts`

Open `shared/lib/enum.ts`. Locate the last entries of the `AppPermission` enum — currently ending with `DOCUMENT_MANAGE_PARENT_DOCS`, `TEST_SYSTEM_ONLY`, `TEST_CUSTOM_ONLY` (lines ~479–483). Insert the following 6 new entries **between** `DOCUMENT_MANAGE_PARENT_DOCS` and `TEST_SYSTEM_ONLY`:

```typescript
// shared/lib/enum.ts — AppPermission enum (Story 9 additions)
// Insert these lines after DOCUMENT_MANAGE_PARENT_DOCS and before TEST_SYSTEM_ONLY:

  // Story 9: Invoice Generation & Processing (billing domain)
  BILLING_CREATE_INVOICE = "billing.create_invoice",
  BILLING_UPDATE_STATUS_PAID = "billing.update_status_paid",
  BILLING_DELETE_INVOICE = "billing.delete_invoice",
  // Story 9: Student Metadata & Lifecycle Management
  STUDENT_REASSIGN_TEACHER = "student.reassign_teacher",
  STUDENT_MANAGE_STATUS = "student.manage_status",
  // Story 9: Automated System Synchronization
  SYSTEM_SYNC_NOTIFICATIONS = "system.sync_notifications",
```

After the edit, the tail of the `AppPermission` enum should look exactly like this:

```typescript
  // Parent Profile & Account Lifecycle Management (Story 8)
  PARENT_VIEW_PROFILE = "parent.view_profile",
  PARENT_MANAGE_STATUS = "parent.manage_status",
  STUDENT_VIEW_ASSOCIATED = "student.view_associated",
  STUDENT_EDIT_QUOTA = "student.edit_quota",
  BILLING_VIEW_HISTORY = "billing.view_history",
  DOCUMENT_MANAGE_PARENT_DOCS = "document.manage_parent_docs",
  // Story 9: Invoice Generation & Processing
  BILLING_CREATE_INVOICE = "billing.create_invoice",
  BILLING_UPDATE_STATUS_PAID = "billing.update_status_paid",
  BILLING_DELETE_INVOICE = "billing.delete_invoice",
  // Story 9: Student Metadata & Lifecycle Management
  STUDENT_REASSIGN_TEACHER = "student.reassign_teacher",
  STUDENT_MANAGE_STATUS = "student.manage_status",
  // Story 9: Automated System Synchronization
  SYSTEM_SYNC_NOTIFICATIONS = "system.sync_notifications",
  // Test-only (keep at end)
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
}
```

Run quality gate after this file edit:
```bash
bun tsgo
bun biome:check
bun lint
bun codescene
```

---

#### Step 2: Add New Permission Inserts to `backend/db/migration/3-system_permissions_and_groups.sql`

Open `backend/db/migration/3-system_permissions_and_groups.sql`. Locate the large `INSERT INTO permissions (...) VALUES (...)` block. Find the last value entry, which is currently the `document.manage_parent_docs` entry ending at approximately line 706:

```sql
    (\n        gen_random_uuid (),\n        'document.manage_parent_docs',\n        'document',\n        'manage_parent_docs',\n        'Attach and view external files (contracts, ID verification) linked to a specific Parent record',\n        'Documents',\n        true\n    ) ON CONFLICT (key) DO
```

Change the `) ON CONFLICT` for `document.manage_parent_docs` to a `,` and add the 6 new entries followed by the `ON CONFLICT` clause:

```sql
    (
        gen_random_uuid (),
        'document.manage_parent_docs',
        'document',
        'manage_parent_docs',
        'Attach and view external files (contracts, ID verification) linked to a specific Parent record',
        'Documents',
        true
    ),
    -- Story 9: Invoice Generation & Processing (billing domain)
    (
        gen_random_uuid (),
        'billing.create_invoice',
        'billing',
        'create_invoice',
        'Manually generate a custom invoice outside the automated package renewal cycle',
        'Billing',
        true
    ),
    (
        gen_random_uuid (),
        'billing.update_status_paid',
        'billing',
        'update_status_paid',
        'Manually verify and log the settlement of an outstanding invoice by marking it as Paid',
        'Billing',
        true
    ),
    (
        gen_random_uuid (),
        'billing.delete_invoice',
        'billing',
        'delete_invoice',
        'Destructively remove a financial record from the parent billing ledger',
        'Billing',
        true
    ),
    -- Story 9: Student Metadata & Lifecycle Management
    (
        gen_random_uuid (),
        'student.reassign_teacher',
        'student',
        'reassign_teacher',
        'Dynamically change a student assigned instructor from the parent profile view',
        'Students',
        true
    ),
    (
        gen_random_uuid (),
        'student.manage_status',
        'student',
        'manage_status',
        'Alter a student global enrollment state (Regular, On Leave, Suspended) from parent profile',
        'Students',
        true
    ),
    -- Story 9: Automated System Synchronization
    (
        gen_random_uuid (),
        'system.sync_notifications',
        'system',
        'sync_notifications',
        'Internal rule that forces the global notification tray to reflect real-time billing changes',
        'System',
        true
    ) ON CONFLICT (key) DO
UPDATE
SET
    resource = EXCLUDED.resource,
    action = EXCLUDED.action,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_system = EXCLUDED.is_system;
```

Run quality gate after this file edit:
```bash
bun tsgo
bun biome:check
bun lint
```

---

#### Step 3: Add Group Permission Assignments

Locate the three `INSERT INTO group_permissions` blocks in the same migration file.

**3a. Super Admin block** — append 6 new permission keys inside the `p.key IN (...)` list (after `'document.manage_parent_docs'`):

```sql
INSERT INTO
    group_permissions (group_id, permission_id)
SELECT g.id, p.id
FROM
    permission_groups g,
    permissions p
WHERE
    g.slug = 'super_admin'
    AND p.key IN (
        'auth.login',
        'auth.view_own_profile',
        'dashboard.view',
        'dashboard.view_metrics',
        'dashboard.filter_metrics',
        'dashboard.metrics.view_all',
        'dashboard.search',
        'schedule.view_list',
        'schedule.filter_advanced',
        'schedule.view_all',
        'schedule.view_assigned',
        'schedule.view_family',
        'schedule.search_availability',
        'schedule.manage_recurring',
        'schedule.dst_migrate',
        'schedule.view_timezones',
        'session.view_details',
        'session.activate_class',
        'session.activate_override',
        'session.update_status.start',
        'session.update_status.absent',
        'session.update_status.leave',
        'session.reschedule',
        'session.reset',
        'session.override_actions',
        'history.view_calendar',
        'history.view_details',
        'teacher.view_dashboard',
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'teachers.list',
        'teachers.create',
        'teachers.edit',
        'teachers.manage_schedule',
        'parents.list',
        'parents.create',
        'parents.edit',
        'students.list',
        'students.edit',
        'students.change_teacher',
        'students.change_status',
        'students.override_quota',
        'invoices.list',
        'invoices.delete',
        'invoices.create',
        'invoices.mark_paid',
        'invoices.edit',
        'resources.list',
        'resources.delete',
        'resources.upload',
        'reports.generate',
        'complaints.list',
        'complaints.delete',
        'complaints.respond',
        'staff.list',
        'staff.create',
        'staff.edit',
        'permission_groups.manage',
        'permission_groups.assign',
        'notification.view_alerts',
        'billing.view_unpaid_invoices',
        'user.view_profile',
        'staff.view_directory',
        'schedule.view_weekly',
        'schedule.view_workload',
        'schedule.create_class',
        'schedule.delete_class',
        'schedule.clear_weekly',
        'staff.edit_profile',
        'system.bulk_update_dst',
        'parent.view_directory',
        'parent.view_profile',
        'parent.manage_status',
        'student.view_associated',
        'student.edit_quota',
        'billing.view_history',
        'document.manage_parent_docs',
        'billing.create_invoice',
        'billing.update_status_paid',
        'billing.delete_invoice',
        'student.reassign_teacher',
        'student.manage_status',
        'system.sync_notifications'
    );
```

**3b. Academy Admin block** — append 5 operational permissions (excludes `system.sync_notifications`):

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
        'auth.login',
        'auth.view_own_profile',
        'dashboard.view_metrics',
        'dashboard.filter_metrics',
        'dashboard.search',
        'schedule.view_list',
        'schedule.filter_advanced',
        'schedule.view_timezones',
        'history.view_calendar',
        'history.view_details',
        'session.override_actions',
        'session.view_details',
        'session.activate_override',
        'session.reschedule',
        'session.reset',
        'session.update_status.start',
        'session.update_status.absent',
        'session.update_status.leave',
        'notification.view_alerts',
        'billing.view_unpaid_invoices',
        'user.view_profile',
        'schedule.search_availability',
        'staff.view_directory',
        'schedule.view_weekly',
        'schedule.view_workload',
        'schedule.create_class',
        'schedule.delete_class',
        'schedule.clear_weekly',
        'staff.edit_profile',
        'parent.view_directory',
        'parent.view_profile',
        'parent.manage_status',
        'student.view_associated',
        'student.edit_quota',
        'billing.view_history',
        'document.manage_parent_docs',
        'billing.create_invoice',
        'billing.update_status_paid',
        'billing.delete_invoice',
        'student.reassign_teacher',
        'student.manage_status'
    );
```

**3c. System Automated block** — append `system.sync_notifications`:

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
        'system.sync_notifications'
    );
```

---

#### Step 4: Run Full Migration Sequence

```bash
# Regenerate Drizzle schema from updated database
bun db cleanGenerate

# Drop and recreate the database with new migration applied
bun db reset

# Reseed the database with the updated permission catalog
bun db seed

# Verify migration and seed data are correct
bun test:db
```

All four commands MUST pass before Task A is complete. If any fail:
- Double-check SQL syntax (trailing commas, correct single-quote strings)
- Verify no duplicate permission key already exists
- Re-run full sequence from `bun db cleanGenerate`

---

#### Step 5: Run Codegen to Propagate Enum to Generated Types

```bash
bun run generate:gqlSchema
bun codegen
```

Open `frontend/graphql/generated/gql/graphql-types.ts` and verify it now contains:
```typescript
export enum AppPermission {
  // ... existing values ...
  BillingCreateInvoice = 'billing.create_invoice',
  BillingUpdateStatusPaid = 'billing.update_status_paid',
  BillingDeleteInvoice = 'billing.delete_invoice',
  StudentReassignTeacher = 'student.reassign_teacher',
  StudentManageStatus = 'student.manage_status',
  SystemSyncNotifications = 'system.sync_notifications',
  // ...
}
```

---

**Test Execution Requirements:**
```bash
bun run test:db
```
All database tests must pass with 0 failures.

---

**Success Criteria / Check Progress Points:**
- [ ] `shared/lib/enum.ts` contains all 6 new `AppPermission` entries with correct PascalCase key names and string values
- [ ] `backend/db/migration/3-system_permissions_and_groups.sql` contains all 6 new `INSERT INTO permissions` entries with `is_system = true`
- [ ] Super Admin group receives all 6 new permissions in `group_permissions` assignment
- [ ] Academy Admin group receives 5 new operational permissions (excludes `system.sync_notifications`)
- [ ] System Automated group receives `system.sync_notifications`
- [ ] Teacher Default, Parent Default, Staff Default groups receive NONE of the new permissions
- [ ] `bun db cleanGenerate` passes with 0 errors
- [ ] `bun db reset` passes with 0 errors
- [ ] `bun db seed` passes with 0 errors
- [ ] `bun test:db` passes with 0 failures
- [ ] `bun run generate:gqlSchema` passes with 0 errors
- [ ] `bun codegen` passes with 0 errors
- [ ] Generated `AppPermission` enum includes all 6 new values

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
