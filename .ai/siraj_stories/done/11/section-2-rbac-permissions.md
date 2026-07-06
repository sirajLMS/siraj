## Section 2: RBAC Permissions (Canonical)

Story 11 maps story-level permission concepts to **existing codebase permission keys** and adds one new system-level permission. Six of the seven story permissions already exist in the database catalog and `AppPermission` enum — they require no new INSERT or enum entries. Only `system.restrict_resource_access` is new.

The primary migration work is **adjusting permission group assignments** to match the story's role-based access requirements.

---

### 2.1 Permission Mapping (Story Keys → Existing Codebase Keys)

| **Story Permission** | **Codebase Permission Key** | **Enum Value** | **Status** |
|---|---|---|---|
| `student.view_directory` | `students.list` | `AppPermission.StudentsList` | ✅ Exists |
| `student.view_history` | `history.view_calendar` | `AppPermission.HistoryViewCalendar` | ✅ Exists |
| `manager.view_directory` | `staff.view_directory` | `AppPermission.StaffViewDirectory` | ✅ Exists |
| `manager.edit_profile` | `staff.edit_profile` | `AppPermission.StaffEditProfile` | ✅ Exists |
| `resource.view` | `resources.list` | `AppPermission.ResourcesList` | ✅ Exists |
| `resource.upload` | `resources.upload` | `AppPermission.ResourcesUpload` | ✅ Exists |
| `system.restrict_resource_access` | `system.restrict_resource_access` | `AppPermission.SYSTEM_RESTRICT_RESOURCE_ACCESS` | ❌ NEW |
---

### 2.2 New Permissions

Only one new permission is created in this story:

| **Permission Key** | **Category** | **Group** | **UI Gate** | **Backend Service Method** | **GraphQL Operation** |
|---|---|---|---|---|---|
| `system.restrict_resource_access` | System | System Automated | Not user-facing — service-layer gate on file download/access | `ResourceAccessGuardService.checkAccess()` | None — called internally by `LearningResourceService` methods |

**Key characteristics of `system.restrict_resource_access`:**
- It is **not held by human user roles** — no Admin, Teacher, Parent, or Staff gets this key directly.
- It is a **documentation/audit permission** that formally registers the system's resource access restriction behavior in the permissions catalog.
- The actual enforcement is in `LearningResourceService` methods and the `StorageService` integration layer, which check `resources.list` permission before allowing file access.
- It is **seeded in the migration** to be formally registered, enabling future audit logging and permission introspection.
---

### 2.3 Permission Group Assignment Changes

#### Current State (Before Story 11):

| **Permission Group** | **Slug** | **Relevant Permissions Currently Assigned** |
|---|---|---|
| Super Admin | `super_admin` | `students.list`, `staff.view_directory`, `staff.edit_profile`, `resources.list`, `resources.upload` |
| Admin | `academy_admin` | `staff.view_directory`, `staff.edit_profile` |
| Teacher | `teacher_default` | `resources.list` |
| Staff | `staff_default` | `students.list` |
| System Automated | `system_automated` | `system.enforce_time_window`, `system.enforce_leave_limit`, `system.sync_notifications`, `system.enforce_suspended_lock`, `system.process_student_leave` |

#### Required Changes (Story 11):

| **Group** | **Slug** | **Permission to ADD** | **Reason** |
|---|---|---|---|
| Admin | `academy_admin` | `students.list` | Story requires Admin to access the global Student Directory |
| Admin | `academy_admin` | `resources.upload` | Story requires Admin to upload learning resources |
| System Automated | `system_automated` | `system.restrict_resource_access` | New system permission for resource access gate |
#### Target State (After Story 11):

| **Permission Group** | **Slug** | **Relevant Permissions** |
|---|---|---|
| Super Admin | `super_admin` | `students.list`, `staff.view_directory`, `staff.edit_profile`, `resources.list`, `resources.upload` (unchanged) |
| Admin | `academy_admin` | `staff.view_directory`, `staff.edit_profile`, **`students.list`** (NEW), **`resources.upload`** (NEW) |
| Teacher | `teacher_default` | `resources.list` (unchanged) |
| Staff | `staff_default` | `students.list` (unchanged) |
| System Automated | `system_automated` | (existing) + **`system.restrict_resource_access`** (NEW) |
---

### 2.4 Migration SQL Changes

**File:** `backend/db/migration/3-system_permissions_and_groups.sql`

#### Change 1: Add new permission INSERT row (before `ON CONFLICT` clause, after `system.process_student_leave` row ~line 782):

```sql
    ,
    (
        gen_random_uuid (),
        'system.restrict_resource_access',
        'system',
        'restrict_resource_access',
        'Enforce isolation of learning resources storage from unauthorized access',
        'System',
        true
    )
```

#### Change 2: Add `students.list` and `resources.upload` to `academy_admin` group IN clause (~line 966–1016):

**Add these two keys to the existing `academy_admin` IN clause:**
```sql
        'students.list',
        'resources.upload',
```

#### Change 3: Add `system.restrict_resource_access` to `system_automated` group IN clause (~line 1075–1089):

**Add this key to the existing `system_automated` IN clause:**
```sql
        'system.restrict_resource_access',
```
---

### 2.5 New AppPermission Enum Entry

**File:** `shared/lib/enum.ts`
**Location:** After `SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave"` at line 492, before `TEST_SYSTEM_ONLY` at line 493.

**New entry:**
```typescript
  // Story 11: System-Level Resource Access Restriction
  SYSTEM_RESTRICT_RESOURCE_ACCESS = "system.restrict_resource_access",
```

**Target state (lines 490–496):**
```typescript
  // Story 10: Automated Student Status Enforcement
  SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock",
  SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave",
  // Story 11: System-Level Resource Access Restriction
  SYSTEM_RESTRICT_RESOURCE_ACCESS = "system.restrict_resource_access",
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
```
---

### 2.6 Self-Scoping vs Any-Scoping

| **Permission** | **Scope** | **Details** |
|---|---|---|
| `students.list` | Any-scoped | Admin and Staff see ALL students in the directory. No per-user filtering at the permission level — the query returns all students. |
| `history.view_calendar` | Any-scoped | Admin can view any student's class history. The `studentId` parameter determines which student, and admins can pass any valid ID. |
| `staff.view_directory` | Any-scoped | System Administrator sees ALL staff members with admin access. No self-scoping. |
| `staff.edit_profile` | Any-scoped | System Administrator can edit ANY fellow admin's profile. This is highly privileged — only Super Admin and System Administrator roles hold this. |
| `resources.list` | Any-scoped | Teachers and Admins see the same global resource library. No per-user filtering. |
| `resources.upload` | Any-scoped | Admin uploads resources to the shared repository. All authorized viewers see the uploaded resource. |
| `system.restrict_resource_access` | N/A | System-internal permission. Not user-facing. No self/any scoping distinction. |
---

### 2.7 Navigation Config Permission Gates

**File:** `frontend/views/dashboard/config/navigationConfig.ts`

Current navigation items and their permission gates:

| **Nav Key** | **Route** | **Current Permission** | **Story 11 Change** |
|---|---|---|---|
| `students` | `/students` | `AppPermission.StudentsList` | No change — permission key unchanged |
| `managers` | `/managers` | `AppPermission.StaffList` | No change — permission key unchanged |
| `resources` | `/resources` | `AppPermission.ResourcesList` | No change — permission key unchanged |

Navigation items are already properly gated. No changes needed to `navigationConfig.ts`.