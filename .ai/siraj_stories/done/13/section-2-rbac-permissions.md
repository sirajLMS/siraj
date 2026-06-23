## Section 2: RBAC Permissions (Canonical)

### 2.1 Reused Existing Permissions

**No new permissions are created.** This sprint reuses existing permissions from `3-system_permissions_and_groups.sql`:

| **Permission Key** | **Resource** | **Action** | **Description** |
|---|---|---|---|
| `teachers.create` | `teachers` | `create` | Create teacher accounts |
| `parents.create` | `parents` | `create` | Create parent accounts |
| `staff.create` | `staff` | `create` | Create staff accounts |

### 2.2 Permission Usage Mapping

| **Workflow** | **Permission Used** | **Additional Service-Layer Checks** |
|---|---|---|
| Teacher Onboarding | `teachers.create` | None — Academy Admin and Super Admin can create teachers |
| Parent Onboarding | `parents.create` | None — Academy Admin and Super Admin can create parents |
| Manager Onboarding | `staff.create` | **Super Admin only** — Service layer enforces that only `super_admin` group can create managers with elevated RBAC privileges |

### 2.3 Existing Permission Group Assignments

These permissions are **already assigned** in the migration file:

| **Permission Group** | **Slug** | **Relevant Permissions** |
|---|---|---|
| Super Admin | `super_admin` | `teachers.create`, `parents.create`, `staff.create` |
| Academy Admin | `academy_admin` | `teachers.create`, `parents.create` (NO `staff.create`) |
| Teacher Default | `teacher_default` | (none) |
| Parent Default | `parent_default` | (none) |
| Staff Default | `staff_default` | (none) |

**Note:** `staff.create` is intentionally NOT assigned to `academy_admin` in the migration, which naturally prevents Academy Admins from creating staff/manager accounts.

### 2.4 Self-Scoping vs Any-Scoping

**Teacher Provisioning (`teachers.create`):**
- **Academy Admin (any-scoped):** Can create any teacher account. Creator identity recorded for audit.
- **Super Admin (any-scoped):** Same as Academy Admin.

**Parent Provisioning (`parents.create`):**
- **Academy Admin (any-scoped):** Can create any parent account with billing configuration. Creator identity recorded for audit.
- **Super Admin (any-scoped):** Same as Academy Admin.

**Manager Provisioning (`staff.create`):**
- **Super Admin only (any-scoped):** The migration already restricts `staff.create` to Super Admins only. Academy Admins do not have this permission assigned.
- **Academy Admin (DENIED):** Academy Admins cannot create manager accounts because `staff.create` is not in their permission group. This is enforced at the database level by the migration.
