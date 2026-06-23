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

---

### Extended Architecture & Security Deep Dive

#### 1. Security Audit & Threat Modeling
To satisfy the stringent security requirements established in Section 4, this task implementation undergoes a rigorous threat modeling review:
- **Threat Vector: IDOR (Insecure Direct Object Reference)**
  - *Risk:* A malicious user manually modifies API request parameters to delete or view records belonging to another user.
  - *Mitigation strategy applied:* The Service layer enforces RBAC using `PermissionsService.hasPermission`. Only users with explicit grants (such as Academy Admins) can bypass ownership checks. Lower-level users are physically gated from executing the repository command.
- **Threat Vector: Memory Exhaustion / DoS**
  - *Risk:* Queries fetching thousands of Class Instances could overload the Node.js V8 engine memory limits.
  - *Mitigation strategy applied:* Drizzle ORM is utilized strictly for database-level `SUM()` and `GROUP BY` aggregations. The resulting network payload from Postgres to Node.js is reduced from potentially 10,000+ rows down to a maximum of 365 rows (when grouped by Date).
- **Threat Vector: SQL Injection (SQLi)**
  - *Risk:* Dynamic grouping clauses open vulnerabilities to malicious string interpolation.
  - *Mitigation strategy applied:* The `groupBy` variable is strictly typed using a TypeScript `enum` (`ReportGroupingMode`). Drizzle's `sql\...\`` parameterized queries are utilized exclusively, completely eliminating raw string interpolation vectors.

#### 2. Detailed Execution Output Expectations
When executing the tests and compilation commands listed in the execution requirements, the system operator must observe the following exact terminal outputs:

**Expected Output for `bun tsgo`:**
```text
$ bun tsgo
[1/2] Compiling TypeScript...
[2/2] Emitting declarations...
✨ Built successfully.
0 errors found.
```
*Troubleshooting:* If `tsgo` reports `TS2322: Type 'X' is not assignable to type 'Y'`, review the Interface definitions. Ensure that all Drizzle schemas correspond 1:1 with the Pothos GraphQL object types.

**Expected Output for `bun run test:db`:**
```text
$ bun run test:db
bun test v1.1.x
...
✓ Repository Tests (10/10 pass)
✓ Service Tests (5/5 pass)
================================================================================
Test Summary: 15 passed, 0 failed.
```
*Troubleshooting:* If the test suite fails with a `relation "learning_resources" does not exist` error, the test database is out of sync. Rerun `bun db reset` followed by `bun db seed`.

#### 3. Error Handling & Edge Cases
The logic implemented in this task anticipates and natively handles the following edge cases:
1. **Network Timeout / AWS S3 Outage:** If the `StorageRepository` fails to delete the physical file, an Error is caught and rethrown. Because this occurs *prior* to the `LearningResourceRepository.deleteResource` invocation, database integrity is maintained. The file record remains in the database, preventing orphaned files.
2. **Missing Granular Permissions:** When a user with operational access (`report.generate_custom`) but without financial access (`report.view_financials`) requests a report, the `ReportService` intercepts the raw results and explicitly maps all financial properties to `0`. This is preferable to mapping to `null`, as `0` guarantees GraphQL type conformity and prevents frontend `NaN` rendering errors.
3. **Double Deletion Clicks:** The frontend `<Dialog>` component binds the `loading` state from Apollo's `useMutation` hook to the `disabled` property of the confirmation button. This guarantees that rapidly clicking "Delete" does not result in parallel GraphQL requests that could crash the service layer.

#### 4. Post-Deployment Verification Steps
Upon completing this task and merging into the mainline branch, the following manual QA steps must be executed on the staging environment:
1. Log in as a standard Teacher. Attempt to delete a learning resource. Verify the UI button is hidden.
2. Execute the GraphQL mutation directly via the Apollo Sandbox using the Teacher's authorization token. Verify the backend explicitly returns `"unauthorized"`.
3. Log in as an Academy Admin. Delete a learning resource. Verify the UI updates optimistically or via refetch.
4. Access the AWS S3 (or local) storage bucket. Verify the physical file was actively destroyed alongside the database row.

#### 5. Additional Compliance & Logging Standards
- **Compliance:** All deletion events must be recorded by the system logger to fulfill compliance requirements for data destruction verification. The `logger.info` methods implemented in the service layer satisfy this requirement by logging both the `actorUserId` and the `resourceId`.
- **Traceability:** The use of `logger.error` captures full stack traces and bubbles them up to the APM (Application Performance Monitoring) tool without leaking sensitive database internals to the GraphQL client. GraphQL natively strips these internal stack traces, returning only the safe "unauthorized" or "Internal Server Error" strings to the frontend.


---

### Extended Standards & CI/CD Implications

#### 1. Coding Standards & Conventions
This task adheres strictly to the project's coding standards to ensure maintainability and readability across the full stack:
- **Naming Conventions:** All variables and functions utilize `camelCase`. Types, Interfaces, and Enums utilize `PascalCase`. Database schema columns utilize `camelCase` in TypeScript and map to `snake_case` natively in PostgreSQL via Drizzle ORM mapping.
- **Export Strategies:** Default exports are strictly banned across all layers with the sole exception of Storybook `*.stories.tsx` files which require a default export for the `Meta` configuration to be parsed by the Storybook Webpack loader. All other files must use named exports to enable IDE refactoring and explicit dependency tracing.
- **Nullability and Optionals:** The backend strictly prefers returning an empty array `[]` over `null` for list queries, and explicitly returning `0` over `undefined` for zero-value financial metrics. This drastically reduces the need for optional chaining `?.` and nullish coalescing `??` in the frontend UI components.

#### 2. Apollo Client Caching Strategy
A robust caching strategy is critical to reducing unnecessary database overhead.
- **Cache Normalization:** Apollo Client normalizes cached data using a combination of the `__typename` and `id` fields. For this reason, all GraphQL object types defined in Pothos MUST expose an `id` field.
- **Ephemeral IDs:** For reports that are generated dynamically on the fly and do not map to a distinct UUID in the database, the backend synthesizes a deterministic `id` by aliasing the grouping key (e.g., `id: row.groupKey`). This allows Apollo to cache and update individual report rows without throwing caching warnings in the console.
- **Cache Eviction:** When executing destructive mutations (e.g., deleting a learning resource), the frontend must either execute a cache update manually via the `update` function in `useMutation`, or explicitly notify the parent list component to trigger `refetch()`. In this story, we utilize a parent callback (`onDeleted`) to handle the re-render.

#### 3. Localization & Internationalization (i18n)
All text rendered to the browser MUST be processed through the localization dictionary (`en.ts` and `ar.ts`).
- **Hook Usage:** Components must import and invoke `const t = useTranslations("Namespace");`.
- **Interpolation:** If dynamic data needs to be injected into a localized string, utilize the `{variable}` syntax inside the dictionary and pass the variables in the hook: `t("deleteConfirmation", { resourceName: displayName })`.
- **Error Messages:** Backend errors are thrown with a static string key (e.g., `"unauthorized"`, `"Resource not found"`). The frontend Apollo error link or the local component intercepts this string and maps it to a localized human-readable string before rendering.

#### 4. CI/CD Pipeline & Quality Gates
This code will be evaluated automatically by the Continuous Integration (CI) pipeline upon PR creation. The following checks must pass:
1. **Pre-commit Hooks:** Husky will execute `biome format`, `biome lint`, and `eslint` on all staged files. Ensure you have run `bun biome:check` locally to prevent the commit from being rejected.
2. **Type Checking:** The pipeline will execute `bun tsgo` globally. A single TypeScript compiler error (`TSxxxx`) will fail the build.
3. **Automated Testing:** GitHub Actions will run `bun run test:db` (which spins up an ephemeral PostgreSQL instance via Docker) and `bun run test:graphql`. If the coverage threshold drops below 100% for the modified methods, the PR will be automatically blocked from merging.
4. **Code Quality Metrics:** SonarQube / CodeScene will analyze the PR for duplicated logic, excessive cyclomatic complexity, and security hotspots. Extract complex logic into reusable private helper functions if the cyclomatic complexity of a single method exceeds 10.

#### 5. Rollback Procedures
If a catastrophic failure occurs post-deployment (e.g., the deletion mutation begins wiping the wrong records due to a malformed ID), the rollback procedure is as follows:
1. Revert the PR in GitHub.
2. The CI/CD pipeline will automatically build the previous stable image.
3. If database migrations were involved, the database admin must manually execute the `DOWN` migration to revert the schema changes. However, for this specific sprint, we only seeded permissions, so a schema rollback is not strictly required. Data integrity is prioritized.


---

### Extended Implementation Guidelines & Quality Assurance Protocols

#### 1. UI Error State Handling & Recovery Strategies
The application requires robust error handling at the presentation layer to ensure users are never left with a white screen or a frozen interface following an unhandled exception.
- **Graceful Degradation:** When an API request fails, the component MUST degrade gracefully. For tabular data, render an Empty State component or an Alert banner indicating the failure, while keeping the structural layout intact so the user can navigate away.
- **Retry Mechanisms:** For idempotent operations (like GET queries for reports), implement a local "Retry" button that invokes the Apollo `refetch()` function. For non-idempotent operations (like DELETE), do not automatically retry; instead, instruct the user to verify their network connection and manually try again.
- **Input Validation States:** For form components (like `ReportForm.tsx`), all inputs must display validation errors locally before attempting to submit the network request. Ensure the "From Date" is chronologically before or equal to the "To Date". If an invalid combination is selected, highlight the `TextField` with `error={true}` and disable the Submit button.

#### 2. Logging Formatting Standards
To ensure logs are properly indexed by the centralized logging pipeline (e.g., Datadog, ELK stack), all logging statements must adhere to strict formatting rules:
- **Prefix Format:** Every log message MUST begin with its namespace bracketed. Format: `[ClassName.methodName] Log message here.` This guarantees that developers can immediately locate the source of an error by grep searching the exact string.
- **Variable Interpolation:** Do not concatenate strings using `+`. Use standard JavaScript template literals. When logging complex objects or full error stacks, pass them as the secondary argument to the logger, rather than stringifying them inside the message.
  - *Correct:* `logger.error(\`[Service.method] Failed to process \${id}:\`, error);`
  - *Incorrect:* `logger.error("[Service.method] Failed to process " + id + ": " + JSON.stringify(error));`
- **PII Scrubbing:** Never log Personally Identifiable Information (PII) such as unencrypted emails, passwords, or full credit card numbers. Log internal UUIDs exclusively.

#### 3. Code Review & PR Merge Criteria
Prior to marking this task as complete and opening a Pull Request, you must verify the following criteria. The reviewer will reject the PR if any of these conditions are unmet:
- **Zero Placeholder Tolerance:** The submitted code must be complete. No `// TODO: Implement later` comments are permitted. If a feature is scoped out, it should be removed entirely rather than left as a dead stub.
- **Test File Colocation:** Test files must reside directly alongside or in a designated `__tests__` or `test/` directory near the file they are testing. For backend services, verify `test/` folders correctly import the parent module.
- **Mock Cleanup:** If this task involved migrating away from a Zustand mock store, ensure that the mock store file is still functioning properly for Storybook, but is completely disconnected from the production React component tree. Use the search command to verify: `grep -rn "mock.*Store" frontend/views` should yield zero results in non-story files.
- **Component Prop Interface:** Every React component must define an explicit `interface ComponentNameProps`. Do not use inline prop typing.
- **Function Returns:** Every exported function in the repository and service layers MUST explicitly define its return type signature (e.g., `Promise<boolean>`, `Promise<AttendanceReportRow[]>`). Implicit `any` returns are strictly banned.

#### 4. Post-Merge Observability
Once the feature hits the production environment, the observability platform monitors it closely for:
- **GraphQL Resolver Latency:** Reports must generate within a p95 latency of 800ms. If the database aggregation query takes longer, consider adding compound indices to the `class_instances` table covering `scheduled_start_at` and `teacher_id`.
- **Error Rates:** The `<ErrorBoundary>` component will catch uncaught React exceptions. The threshold for uncaught errors is 0%. Any spike in frontend error reports directly correlated with this component's release will trigger an immediate automated rollback.

#### 5. Documentation Updates
In addition to the code changes, ensure the following project-level documentation is aligned:
- **GraphQL Schema Documentation:** The Pothos definitions automatically generate standard GraphQL descriptions. Ensure every `t.field()` and `t.arg()` possesses a clear, human-readable `description` property. This serves as the primary API documentation for frontend engineers.
- **Repository Signatures:** Use TSDoc format `/** ... */` above all repository methods. Explicitly document the SQL translation of complex aggregations so future maintainers understand the Drizzle ORM generation targets without needing to dive into the raw query planner.


---

### Final Implementation Checklist (Core Principles Alignment)
To ensure absolute alignment with the project's Core Principles, the following checks must be individually verified by the executing agent:

- [ ] **NO monolithic services:** The logic is strictly scoped to domain-driven services (`ReportService`, `LearningResourceService`).
- [ ] **Business logic centralization:** Orchestration, validation, and permission checks reside in services, NOT repositories or resolvers.
- [ ] **🚫 Services MUST NOT import from DB/Drizzle:** Services depend ONLY on the repository layer (`backend/db/repo/`). Importing from `drizzle-orm`, `backend/db/schema`, or `backend/db/index` is verified to be absent.
- [ ] **🚫 GraphQL Resolvers MUST NOT import from DB/Repo:** Pothos resolvers depend ONLY on the service layer (`backend/services/`). No direct data access or business logic exists in the resolvers.
- [ ] **Strict Type Narrowing:** `any`, `as any`, and `as unknown as` are banned. Types are narrowed using type guards.
- [ ] **No forward dependencies:** This task does not depend on code, types, schemas, or modules introduced by a later task in the sequence.
- [ ] **Self-contained tasks:** After completing this task, the project compiles and passes all quality gates. It does not leave the project in a broken state.
- [ ] **Zero Incomplete Implementation Policy:** There are no `// TODO`, `// FIXME`, or `@todo` comments. There are no `throw new Error("Not implemented")` stubs.
- [ ] **SSR Compatibility:** Services work in Next.js Server Components without GraphQL-specific context dependencies.
- [ ] **No Apollo client in services:** Services do not depend on `@apollo/client`, Apollo cache, or browser-only APIs.
- [ ] **Complete transaction boundaries:** Multi-table writes are atomic (wrapped in `db.transaction()`).
- [ ] **Generated GraphQL types first:** Custom types are only defined when the generated type from `graphql-types.ts` is missing fields, has incompatible nullability, or doesn't exist yet.
- [ ] **Logger utility mandatory:** `import { logger } from '@/frontend/utils/logger'` or `import { logger } from '@/backend/lib/logger'` is used. `console.log/warn/error` is forbidden.
- [ ] **100% line + function coverage:** Modified repository methods achieve 100% coverage via `bun run test:coverage`.
- [ ] **Success AND failure paths:** Tests cover valid input success, invalid input rejection, not-found handling, and transaction rollback.
- [ ] **Authorized success + unauthorized denial:** GraphQL integration tests verify both authorized success and unauthorized denial.

*End of Task Document.*

