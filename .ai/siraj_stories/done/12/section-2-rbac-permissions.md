## Section 2: RBAC Permissions (Canonical)

Story 12 introduces three critical permission keys. These permissions govern highly sensitive operations within the platform: the hard destruction of physical and digital records (`resources.delete`), the generation of comprehensive operational aggregation (`report.generate_custom`), and the explicit exposure of highly sensitive payroll mathematics (`report.view_financials`).

---

### 2.1 New Permissions

| **Permission Key** | **Category** | **Group** | **UI Gate** | **Backend Service Method** | **GraphQL Context** |
|---|---|---|---|---|---|
| `resources.delete` | Destructive | Academy Admin | Delete Action Button | `LearningResourceService.deleteResource()` | `deleteLearningResource` (Mutation) |
| `report.generate_custom` | Operational | Academy Admin | Custom Report Form | `ReportService.generateAttendanceReport()` | `generateAttendanceReport` (Query) |
| `report.view_financials` | Financial | Academy Admin | Payroll Column Rendering | `ReportService.generateAttendanceReport()` (Internal branch masking) | Masked explicitly if absent |

**Key characteristics of these permissions:**
- They are **held exclusively by Academy Admin user roles** (and Super Admins). Teachers, Parents, and Students do not receive these keys.
- The `report.view_financials` permission acts as a **sub-permission or modifier** to `report.generate_custom`. A user must have the generation permission to execute the query, but without the financial permission, the system intercepts the database payload and masks the outputs.
- They are **seeded in the migration** (`backend/db/migration/4-story-12-permissions.sql`) to be formally registered in the permissions catalog, enabling UI context evaluation.
- They are **documented as `AppPermission` enum values** to prevent magic string usage across both the backend logic and the frontend components.

---

### 2.2 Permission Mapping to Existing Permissions

| **Story 12 Permission** | **Existing Related Permission** | **Relationship** |
|---|---|---|
| `resources.delete` | `resources.upload` (Prior sprint) | Sibling — both manage the physical lifecycle of a resource. The upload creates the record, the delete physically removes the file and destroys the DB record. |
| `report.generate_custom` | `dashboard.view_metrics` (Prior sprint) | Sibling — both handle aggregations, but dashboards are static snapshots while reports are parameterized (date bounded, teacher filtered). |
| `report.view_financials` | `billing.create_invoice` (Story 9) | Sibling / Financials — both govern the exposure of monetary values in the Academy platform. |

**Execution Flow (Resource Deletion):**
```
1. Admin clicks "Delete" -> UI evaluates <RequirePermission permission={AppPermission.RESOURCES_DELETE}>
2. User confirms destructive prompt -> triggers `deleteLearningResource` mutation
3. LearningResourceService.deleteResource() verifies `resources.delete` via PermissionsService
4. Service invokes StorageService to destroy S3/Local file
5. Service invokes LearningResourceRepository to execute `DELETE FROM learning_resources`
```

**Execution Flow (Reporting):**
```
1. Admin fills out Report Filter Form -> triggers `generateAttendanceReport` query
2. ReportService.generateAttendanceReport() verifies `report.generate_custom` via PermissionsService
3. Service calls Repo to perform massive GROUP BY aggregation across class instances
4. Service checks `report.view_financials` via PermissionsService
5. [If Absent] -> Intercept the DB results, map all `paidEGP`, `paidUSD`, `hours` to 0 or null.
6. [If Present] -> Pass through the DB results unaltered.
7. Return secure payload to GraphQL resolver.
```

---

### 2.3 Permission Group Assignments

| **Permission Group** | **Slug** | **Current State** | **New Permissions Added (Story 12)** |
|---|---|---|---|
| Academy Admin | `academy_admin` | Has global management rights | `resources.delete`, `report.generate_custom`, `report.view_financials` |

**Migration SQL addition:**
```sql
INSERT INTO permissions (key, description, created_at, updated_at) VALUES
('resources.delete', 'Can delete learning resources permanently', NOW(), NOW()),
('report.generate_custom', 'Can generate operational attendance reports', NOW(), NOW()),
('report.view_financials', 'Can view sensitive financial and payroll columns in reports', NOW(), NOW());

-- And then inserted into the permission_group_permissions mapping table explicitly for academy_admin.
```

**No other permission groups receive these permissions.** They are exclusively assigned to `academy_admin`.

---

### 2.4 Self-Scoping vs Any-Scoping

Story 12's reporting permissions do not implement a "self vs any" distinction because reports are currently designed as an Academy-wide aggregation engine explicitly for Admins.

However, the `report.view_financials` acts as a **Property-Scope constraint**. Rather than restricting *which* rows the user can see, it restricts *which properties* of the rows the user is permitted to extract data from. This is a crucial architectural distinction managed exclusively by the Service Layer.

---

### 2.5 New AppPermission Enum Entries

**File:** `shared/lib/enum.ts`
**Location:** After the existing enum values

**New entries to add:**
```typescript
  // Story 12: Resource Management & Financial Reporting
  RESOURCES_DELETE = "resources.delete",
  REPORT_GENERATE_CUSTOM = "report.generate_custom",
  REPORT_VIEW_FINANCIALS = "report.view_financials",
```

**Target state after Story 12 (verified):**
```typescript
  // Previous entries...
  SYSTEM_SYNC_NOTIFICATIONS = "system.sync_notifications",
  SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock",
  SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave",
  // Story 12: Resource Management & Financial Reporting
  RESOURCES_DELETE = "resources.delete",
  REPORT_GENERATE_CUSTOM = "report.generate_custom",
  REPORT_VIEW_FINANCIALS = "report.view_financials",
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
```

---

### 2.6 Verification Commands

After completing Task A (Migration & Enum), the following verifications are strictly required:

```bash
# Verify enum entries exist
grep -n "RESOURCES_DELETE\|REPORT_GENERATE_CUSTOM\|REPORT_VIEW_FINANCIALS" shared/lib/enum.ts

# Verify migration SQL contains new permission rows
grep -n "resources.delete\|report.generate_custom" backend/db/migration/4-story-12-permissions.sql

# Verify academy_admin group assignment includes new permissions
grep -A 10 "academy_admin" backend/db/migration/4-story-12-permissions.sql
```

**Expected outputs:**
- First command: 3 lines found in `shared/lib/enum.ts`
- Second command: 3+ lines found in migration file
- Third command: Shows the new permission keys mapped accurately in the DB SQL.
