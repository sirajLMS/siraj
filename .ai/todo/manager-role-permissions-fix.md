# Manager Role Mapping & Permissions Fix

## 📌 Problem Description
**Customer Request / Complaint (Arabic):**
> "لما بضيف حد كـ مدير، بيسميه موظف! أنا عايزه يسميه مدير ويديله كل الصلاحيات عدا التحكم في الصلاحيات."

**English Summary:**
When creating a user with the **Manager (`مدير`)** account type in the staff onboarding form, the system currently assigns them the `STAFF_DEFAULT` permission group. As a result:
1. The user is labeled and displayed across the UI (navbar, profile, staff directory) as an **Employee / Staff (`موظف`)**.
2. The user receives restricted staff-level permissions and is unable to manage teachers, students, schedules, billing, classes, or invoices.

---

## 🔍 Root Cause Analysis

1. **Frontend & i18n Mismatch**:
   - In `shared/locale/ar/dashboard/staff/onboarding.ts`:
     - `manager: "مدير"`
     - `admin: "مسؤول"`
     - `supervisor: "مشرف"`
2. **Backend Service Resolution**:
   - In `backend/services/staff/manager-onboarding.service.ts` (`resolveTargetGroupSlug`):
     - `ManagerAccountType.admin` ➡️ `SystemPermissionGroupSlug.ACADEMY_ADMIN`
     - `ManagerAccountType.supervisor` ➡️ `SystemPermissionGroupSlug.SUPERVISOR_DEFAULT`
     - `ManagerAccountType.manager` ➡️ Defaults to `SystemPermissionGroupSlug.STAFF_DEFAULT`
3. **Role & Display Name Propagation**:
   - `user_permission_groups` receives `staff_default`.
   - `PermissionsService.resolveRoleFromGroupSlugs(["staff_default"])` returns `UserRole.STAFF`.
   - `permission_groups` table row for `staff_default` maps to name `{"ar": "موظف", "en": "Staff"}`.
   - The user is displayed as **"موظف"** everywhere.

---

## 🎯 Target Requirement

### 1. Accurate Role Display
- When selected as **Manager (`مدير`)**, the account must be assigned the **`ACADEMY_ADMIN` (`academy_admin`)** group and displayed as **`مدير الأكاديمية` / `Manager`** instead of **`موظف`**.

### 2. Permissions Scope: Full Operations EXCEPT Permissions Control
- **Included (Full Academy Operations)**:
  - **Teachers**: `teachers.list`, `teachers.create`, `teachers.edit`, `teachers.manage_schedule`, `teacher.view_dashboard`, etc.
  - **Students**: `students.list`, `students.create`, `students.edit`, `students.change_teacher`, `students.change_status`, `students.override_quota`, etc.
  - **Parents**: `parents.list`, `parents.create`, `parents.edit`, `parent.view_directory`, `parent.manage_status`, etc.
  - **Staff**: `staff.view_directory`, `staff.list`, `staff.create`, `staff.edit`, `staff.edit_profile`, etc.
  - **Schedules & Sessions**: `schedule.view_all`, `schedule.create_class`, `schedule.delete_class`, `session.activate_class`, `session.reschedule`, `session.override_actions`, etc.
  - **Invoices & Billing**: `invoices.create`, `invoices.delete`, `invoices.mark_paid`, `billing.create_invoice`, `billing.view_exchange_rates`, etc.
  - **Curriculum & Resources**: `subjects.*`, `categories.*`, `resources.*`, `notes.*`.
  - **Feedback & Reports**: `complaints.*`, `suggestions.*`, `reports.generate`, `report.view_financials`, `lesson_reports.*`.
  - **Ledgers & Integrations**: `credits.manage`, `teacher_dues.*`, `quotas.manage`, `whatsapp.*`, `meeting_configs.*`.
- **Strictly Excluded (عدا التحكم في الصلاحيات)**:
  - ❌ `PERMISSION_GROUPS_MANAGE` (`"permission_groups.manage"`) — Cannot create/edit/delete permission groups.
  - ❌ `PERMISSION_GROUPS_ASSIGN` (`"permission_groups.assign"`) — Cannot assign or alter user permission groups.
  - ❌ `PROFILE_STAFF_PERMISSIONS_EDIT_OTHER` (`"profile.staff_permissions.edit_other"`) — Cannot modify granular staff overrides.
  - ❌ `PROFILE_STAFF_PERMISSIONS_EDIT_OWN` (`"profile.staff_permissions.edit_own"`) — Cannot self-escalate overrides.
  - ❌ `SETTINGS_EDIT_ENV` (`"settings.edit_env"`) — Cannot modify server env/secrets.
  - ❌ Permission Group Simulation (super-admin only).

---

## 🛠️ Action Items / Implementation Checklist

- [ ] **1. Backend Service**:
  - Update `resolveTargetGroupSlug` in `backend/services/staff/manager-onboarding.service.ts`:
    Map `ManagerAccountType.manager` ➡️ `SystemPermissionGroupSlug.ACADEMY_ADMIN`.
- [ ] **2. Backend Enums**:
  - Update docstring in `backend/enum/users/account-type.enum.ts` to document `manager` -> `ACADEMY_ADMIN`.
- [ ] **3. Staff Repository & Directory**:
  - In `backend/db/repo/teachers/staff-profile.repository.ts`:
    - Update `resolveRoleCondition` so `roleFilter: "manager"` matches `ilike(permissionGroups.slug, '%admin%')`.
    - Update `getManagerDirectoryMetrics` to aggregate `totalAdmin` and `systemStaff` accurately.
- [ ] **4. i18n Updates**:
  - Update `shared/locale/ar/dashboard/staff/onboarding.ts`:
    - `manager`: `"مدير الأكاديمية"`
    - `description`: `"وصول إداري كامل للنظام لإدارة المعلمين والطلاب والجداول والمالية عدا إدارة الصلاحيات"`
  - Update `shared/locale/en/dashboard/staff/onboarding.ts` accordingly.
- [ ] **5. Permissions Seed Audit**:
  - Verify that the `academy_admin` group in `permission_groups` and migrations contains all operational permissions and strictly omits `permission_groups.manage` and `permission_groups.assign`.
- [ ] **6. Tests & Validation**:
  - Update `backend/services/staff/test/manager-onboarding.service.test.ts` (`accountType: ManagerAccountType.manager` -> `ACADEMY_ADMIN`).
  - Verify `frontend/common/graphql/test/teachers/manager-directory-graphql.test.ts`.
  - Run `bun quality-gate`.
