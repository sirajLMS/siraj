### Task A — Migration & Enum: New Permissions

**Objective:**
The primary objective of this task is to introduce three new system-level permissions required for Story 12: `resources.delete`, `report.generate_custom`, and `report.view_financials`. This task involves two primary components: updating the application's TypeScript enum mapping for type-safe access throughout the codebase, and authoring a robust PostgreSQL migration file (executed via Drizzle) to seed these permissions into the `permissions` table and map them to the `academy_admin` permission group within the `group_permissions` table.

**Dependencies:**
- None — depends solely on the current state of the project, including the existence of `backend/db/migration/3-system_permissions_and_groups.sql` and the core `AppPermission` enum in `shared/lib/enum.ts`.
- The database schema must already define `permissions`, `permission_groups`, and `group_permissions` tables, which is verified in Section 5.

**Layer-Specific Rules (Database Repositories - Flattened from backend/db/repo/AGENTS.md):**
- **Strict Migration Workflow**: System permissions MUST be inserted via a standard SQL migration in `backend/db/migration/`. No seeding scripts bypass the migration workflow for permissions. The `backend/db/seeds` directory is not to be used for the initial provisioning of these permissions, as permissions are integral to the system schema and must be deployed immutably across environments.
- **Idempotency**: All SQL migration statements must be strictly idempotent. When inserting into tables with unique constraints (such as `key` in `permissions`), you MUST use `ON CONFLICT (key) DO NOTHING` or `ON CONFLICT DO UPDATE` depending on the required behavior.
- **Naming Conventions**: Permission keys use dot notation (e.g., `domain.action`). Enum names use uppercase snake case (e.g., `DOMAIN_ACTION`).
- **No Forward Dependencies**: This migration task must execute correctly on the current `main` branch state without requiring any later tasks to run.

**Target Files:**
1. `shared/lib/enum.ts` (Modified)
2. `backend/db/migration/4-story-12-permissions.sql` (New)

---

### Detailed Implementation Steps

#### Step 1: Update Application Enums (`shared/lib/enum.ts`)

Open the `shared/lib/enum.ts` file. Locate the `AppPermission` enum. This enum acts as the single source of truth for permission keys across both the backend (services, resolvers) and frontend (UI components, route guards). We need to add `RESOURCES_DELETE`, `REPORT_GENERATE_CUSTOM`, and `REPORT_VIEW_FINANCIALS` precisely to match the strings we will inject into the database.

**Implementation Rationale:**
We use a centralized enum to avoid magic strings scattered throughout the codebase. The keys defined here must perfectly match the string literals in the database migration, or the `PermissionsService` will evaluate falsely.

**Code to Implement (Full File Excerpt):**
```typescript
// shared/lib/enum.ts

export enum AppLanguage {
  ar = "ar",
  en = "en",
}

export enum Calendar {
  Gregorian,
  Hijri,
}

// ... existing enums ...

/**
 * AppPermission
 * 
 * Defines all system permissions across the application.
 * Values MUST perfectly match the "key" column in the "permissions" database table.
 * Changes to this enum MUST be accompanied by a corresponding SQL migration.
 */
export enum AppPermission {
  AUTH_LOGIN = "auth.login",
  AUTH_VIEW_OWN_PROFILE = "auth.view_own_profile",
  DASHBOARD_VIEW = "dashboard.view",
  DASHBOARD_VIEW_METRICS = "dashboard.view_metrics",
  DASHBOARD_FILTER_METRICS = "dashboard.filter_metrics",
  DASHBOARD_METRICS_VIEW_ALL = "dashboard.metrics.view_all",
  SCHEDULE_VIEW_LIST = "schedule.view_list",
  SCHEDULE_FILTER_ADVANCED = "schedule.filter_advanced",
  SCHEDULE_VIEW_ALL = "schedule.view_all",
  SCHEDULE_VIEW_ASSIGNED = "schedule.view_assigned",
  SCHEDULE_VIEW_FAMILY = "schedule.view_family",
  SCHEDULE_SEARCH_AVAILABILITY = "schedule.search_availability",
  SCHEDULE_MANAGE_RECURRING = "schedule.manage_recurring",
  SCHEDULE_DST_MIGRATE = "schedule.dst_migrate",
  SESSION_VIEW_DETAILS = "session.view_details",
  SESSION_ACTIVATE_CLASS = "session.activate_class",
  SESSION_ACTIVATE_OVERRIDE = "session.activate_override",
  SESSION_UPDATE_STATUS_START = "session.update_status.start",
  SESSION_UPDATE_STATUS_ABSENT = "session.update_status.absent",
  SESSION_UPDATE_STATUS_LEAVE = "session.update_status.leave",
  SESSION_RESCHEDULE = "session.reschedule",
  SESSION_RESET = "session.reset",
  SESSION_OVERRIDE_ACTIONS = "session.override_actions",
  DASHBOARD_SEARCH = "dashboard.search",
  SCHEDULE_VIEW_TIMEZONES = "schedule.view_timezones",
  HISTORY_VIEW_CALENDAR = "history.view_calendar",
  HISTORY_VIEW_DETAILS = "history.view_details",
  TEACHER_VIEW_DASHBOARD = "teacher.view_dashboard",
  SYSTEM_ENFORCE_TIME_WINDOW = "system.enforce_time_window",
  SYSTEM_ENFORCE_LEAVE_LIMIT = "system.enforce_leave_limit",
  TEACHERS_LIST = "teachers.list",
  TEACHERS_CREATE = "teachers.create",
  TEACHERS_EDIT = "teachers.edit",
  TEACHERS_MANAGE_SCHEDULE = "teachers.manage_schedule",
  STAFF_VIEW_DIRECTORY = "staff.view_directory",
  SCHEDULE_VIEW_WEEKLY = "schedule.view_weekly",
  SCHEDULE_VIEW_WORKLOAD = "schedule.view_workload",
  SCHEDULE_CREATE_CLASS = "schedule.create_class",
  PARENTS_LIST = "parents.list",
  PARENTS_CREATE = "parents.create",
  PARENTS_EDIT = "parents.edit",
  STUDENTS_LIST = "students.list",
  STUDENTS_EDIT = "students.edit",
  STUDENTS_CHANGE_TEACHER = "students.change_teacher",
  STUDENTS_CHANGE_STATUS = "students.change_status",
  STUDENTS_OVERRIDE_QUOTA = "students.override_quota",
  INVOICES_LIST = "invoices.list",
  INVOICES_DELETE = "invoices.delete",
  INVOICES_CREATE = "invoices.create",
  INVOICES_MARK_PAID = "invoices.mark_paid",
  INVOICES_EDIT = "invoices.edit",
  RESOURCES_LIST = "resources.list",
  RESOURCES_DELETE = "resources.delete", // NEW: Hard delete learning resources
  RESOURCES_UPLOAD = "resources.upload",
  REPORTS_GENERATE = "reports.generate", // Existing generic reporting
  REPORT_GENERATE_CUSTOM = "report.generate_custom", // NEW: Dynamic aggregation query engine
  REPORT_VIEW_FINANCIALS = "report.view_financials", // NEW: Gates highly sensitive payroll calculations
  COMPLAINTS_LIST = "complaints.list",
  COMPLAINTS_DELETE = "complaints.delete",
  COMPLAINTS_RESPOND = "complaints.respond",
  STAFF_LIST = "staff.list",
  STAFF_CREATE = "staff.create",
  STAFF_EDIT = "staff.edit",
  PERMISSION_GROUPS_MANAGE = "permission_groups.manage",
  PERMISSION_GROUPS_ASSIGN = "permission_groups.assign",
  NOTIFICATION_VIEW_ALERTS = "notification.view_alerts",
  BILLING_VIEW_UNPAID_INVOICES = "billing.view_unpaid_invoices",
  USER_VIEW_PROFILE = "user.view_profile",
  SCHEDULE_DELETE_CLASS = "schedule.delete_class",
  SCHEDULE_CLEAR_WEEKLY = "schedule.clear_weekly",
  STAFF_EDIT_PROFILE = "staff.edit_profile",
  SYSTEM_BULK_UPDATE_DST = "system.bulk_update_dst",
  PARENT_VIEW_DIRECTORY = "parent.view_directory",
  PARENT_VIEW_PROFILE = "parent.view_profile",
  PARENT_MANAGE_STATUS = "parent.manage_status",
  STUDENT_VIEW_ASSOCIATED = "student.view_associated",
  STUDENT_EDIT_QUOTA = "student.edit_quota",
  BILLING_VIEW_HISTORY = "billing.view_history",
  DOCUMENT_MANAGE_PARENT_DOCS = "document.manage_parent_docs",
  BILLING_CREATE_INVOICE = "billing.create_invoice",
  BILLING_UPDATE_STATUS_PAID = "billing.update_status_paid",
  BILLING_DELETE_INVOICE = "billing.delete_invoice",
  STUDENT_REASSIGN_TEACHER = "student.reassign_teacher",
  STUDENT_MANAGE_STATUS = "student.manage_status",
  SYSTEM_SYNC_NOTIFICATIONS = "system.sync_notifications",
  SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock",
  SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave",
  SYSTEM_RESTRICT_RESOURCE_ACCESS = "system.restrict_resource_access",
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
}

// ... existing code below ...
```

#### Step 2: Author the Database Migration File

Create a new file at `backend/db/migration/4-story-12-permissions.sql`.

**Implementation Rationale:**
Drizzle migrations execute sequentially. This raw SQL handles the insertion of new permissions and gracefully skips if they already exist, ensuring idempotency. Additionally, a dynamic DO block looks up the UUID of the `academy_admin` group and creates the junction relationships in `group_permissions`. Using an anonymous DO block prevents hardcoding UUIDs, making the migration safe to run across any environment (development, staging, production) where the generated UUIDs for the `academy_admin` group might differ.

**Code to Implement:**
```sql
-- backend/db/migration/4-story-12-permissions.sql

-- ============================================================================
-- Story 12 Migration: Resources Deletion and Custom Reporting
-- ============================================================================
-- This migration introduces destructive resource management capabilities
-- and the custom reporting query engine with financial data masking.
-- ============================================================================

-- 1. Insert new system permissions into the catalog
-- Using ON CONFLICT DO UPDATE to ensure idempotency and allow description updates
INSERT INTO permissions (key, display_name, description, created_at, updated_at)
VALUES
  (
    'resources.delete', 
    'Delete Learning Resource', 
    'Grants authority to permanently drop curriculum files from server storage and remove the relational database records.', 
    NOW(), 
    NOW()
  ),
  (
    'report.generate_custom', 
    'Generate Custom Reports', 
    'Authorizes access to the overarching Reports interface and the dynamic aggregation query engine to evaluate operational parameters.', 
    NOW(), 
    NOW()
  ),
  (
    'report.view_financials', 
    'View Financial Metrics', 
    'Authorizes the query engine to calculate and render highly sensitive payroll and financial metrics within generated reports.', 
    NOW(), 
    NOW()
  )
ON CONFLICT (key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  updated_at = EXCLUDED.updated_at;

-- 2. Map the new permissions to the Academy Admin group
DO $$
DECLARE
  v_academy_admin_id uuid;
  v_perm_resource_delete_id uuid;
  v_perm_report_gen_id uuid;
  v_perm_report_fin_id uuid;
BEGIN
  -- Retrieve the unique ID for the academy_admin group dynamically
  SELECT id INTO v_academy_admin_id FROM permission_groups WHERE slug = 'academy_admin';
  
  -- If the group exists, proceed with linking the permissions
  IF v_academy_admin_id IS NOT NULL THEN
    -- Retrieve the unique IDs for the newly inserted permissions
    SELECT id INTO v_perm_resource_delete_id FROM permissions WHERE key = 'resources.delete';
    SELECT id INTO v_perm_report_gen_id FROM permissions WHERE key = 'report.generate_custom';
    SELECT id INTO v_perm_report_fin_id FROM permissions WHERE key = 'report.view_financials';
    
    -- Map resources.delete
    IF v_perm_resource_delete_id IS NOT NULL THEN
      INSERT INTO group_permissions (group_id, permission_id, created_at)
      VALUES (v_academy_admin_id, v_perm_resource_delete_id, NOW())
      ON CONFLICT DO NOTHING;
    END IF;

    -- Map report.generate_custom
    IF v_perm_report_gen_id IS NOT NULL THEN
      INSERT INTO group_permissions (group_id, permission_id, created_at)
      VALUES (v_academy_admin_id, v_perm_report_gen_id, NOW())
      ON CONFLICT DO NOTHING;
    END IF;

    -- Map report.view_financials
    IF v_perm_report_fin_id IS NOT NULL THEN
      INSERT INTO group_permissions (group_id, permission_id, created_at)
      VALUES (v_academy_admin_id, v_perm_report_fin_id, NOW())
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Log success
    RAISE NOTICE 'Successfully mapped Story 12 permissions to academy_admin group.';
  ELSE
    -- Log warning if group is missing (unexpected state)
    RAISE WARNING 'Group academy_admin not found. Permissions were created but not mapped.';
  END IF;
END $$;
```

---

### Pre-Flight Quality Assurance

Before advancing to the test execution, ensure the following syntax and logical rules hold true:
1. `AppPermission` correctly uses the string `'resources.delete'` (matching the `key` column).
2. The `backend/db/migration` directory contains no syntactic conflicts with Drizzle's auto-generation.

---

### Test Execution Requirements

Because this task introduces modifications to the foundational schema/seed states, you MUST execute the complete database reset lifecycle. This proves that the migration files are valid SQL, that they execute sequentially without constraints violations, and that Drizzle can generate accurate types off the newly modified schema.

Execute the following commands strictly in order:

```bash
bun db cleanGenerate
bun db reset
bun db seed
bun test:db
```

**Verification Details:**
- `cleanGenerate`: Validates that the schema files (even those untouched here) successfully compile into Drizzle JSON snapshots.
- `reset`: Drops all tables, recreates them from schema, and runs all migrations sequentially, including `4-story-12-permissions.sql`.
- `seed`: Runs the application seeders to populate mock users, ensuring no foreign key violations occur due to the new permissions.
- `test:db`: Runs the entire backend repository test suite. If any existing tests rely on hardcoded permissions, this ensures they haven't broken.

---

### Success Criteria / Check Progress Points

- [ ] **Code Modification Complete:** `shared/lib/enum.ts` successfully includes `RESOURCES_DELETE`, `REPORT_GENERATE_CUSTOM`, and `REPORT_VIEW_FINANCIALS` within `AppPermission`.
- [ ] **Migration Created:** `backend/db/migration/4-story-12-permissions.sql` exists and contains valid, idempotent PostgreSQL syntax utilizing a `DO $$` block for safe foreign key mappings.
- [ ] **Execution - Generate:** `bun db cleanGenerate` completes successfully, yielding 0 syntax or generation errors.
- [ ] **Execution - Reset:** `bun db reset` completes successfully, proving the SQL migration runs without constraints or syntax errors.
- [ ] **Execution - Seed:** `bun db seed` completes successfully.
- [ ] **Execution - Test:** `bun test:db` passes with 0 failures, ensuring the database state is consistent across all repositories.

---

### Quality Gate — Per-File Validation:
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

### Quality Gate — Task Completion Validation:
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
