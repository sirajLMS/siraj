## Section 2: RBAC Permissions (Canonical)

### 2.1 New Permissions

| **Permission Key** | **Group** | **UI Gate** | **Backend Service Method** | **GraphQL Mutation** |
|---|---|---|---|---|
| `staff.create_teacher` | Academy Admin | Teacher Onboarding page visibility, "Add Teacher" button | `TeacherOnboardingService.createTeacher()` | `createTeacher` |
| `parent.create_account` | Academy Admin | Parent Onboarding page visibility, "Add Parent" button | `ParentOnboardingService.createParent()` | `createParent` |
| `manager.create_account` | System Administrator | Manager Onboarding page visibility, "Add Manager" button | `ManagerOnboardingService.createManager()` | `createManager` |

### 2.2 Permission Mapping to Existing Permissions

| **Story Permission** | **Existing Related Permission** | **Relationship** |
|---|---|---|
| `staff.create_teacher` | `teachers.create` | Granular — `teachers.create` is a general permission; `staff.create_teacher` specifically gates the comprehensive onboarding workflow with salary and banking details |
| `staff.create_teacher` | `TEACHERS_CREATE` (enum) | Complementary — the enum value exists but has no implementation; this story implements the full provisioning workflow |
| `parent.create_account` | `parents.create` | Granular — `parents.create` is a general permission; `parent.create_account` specifically gates the onboarding workflow with billing configuration |
| `parent.create_account` | `PARENTS_CREATE` (enum) | Complementary — the enum value exists but has no implementation; this story implements the full provisioning workflow |
| `manager.create_account` | `staff.create` | Granular — `staff.create` is a general permission; `manager.create_account` specifically gates manager provisioning with RBAC privilege tier assignment |
| `manager.create_account` | `STAFF_CREATE` (enum) | Complementary — the enum value exists but has no implementation; this story implements the full provisioning workflow |

### 2.3 Permission Group Assignments

| **Permission Group** | **Slug** | **New Permissions Assigned** |
|---|---|---|
| Super Admin | `super_admin` | `staff.create_teacher`, `parent.create_account`, `manager.create_account` |
| Academy Admin | `academy_admin` | `staff.create_teacher`, `parent.create_account` |
| Teacher Default | `teacher_default` | (none — teachers do not create accounts) |
| Parent Default | `parent_default` | (none — parents do not create accounts) |
| Staff Default | `staff_default` | (none — standard staff do not create accounts) |
| System Automated | `system_automated` | (none — system processes do not create user accounts manually) |

### 2.4 Self-Scoping vs Any-Scoping

**Teacher Provisioning (`staff.create_teacher`):**
- **Academy Admin (any-scoped):** The service layer allows Academy Admins to create any teacher account. The admin's identity is recorded as the creator for audit purposes, but there is no ownership constraint on the created teacher.
- **Super Admin (any-scoped):** Same as Academy Admin — can create any teacher account.

**Parent Provisioning (`parent.create_account`):**
- **Academy Admin (any-scoped):** The service layer allows Academy Admins to create any parent account with billing configuration. The admin's identity is recorded as the creator for audit purposes.
- **Super Admin (any-scoped):** Same as Academy Admin — can create any parent account.

**Manager Provisioning (`manager.create_account`):**
- **System Administrator only (any-scoped):** The service layer enforces that ONLY users with the `super_admin` permission group slug can create manager accounts. Academy Admins are explicitly denied this operation. The account type selection (Admin vs Manager) determines the permission group assigned to the new manager.
- **Academy Admin (DENIED):** Academy Admins cannot create manager accounts. This is a critical security boundary that prevents privilege escalation.
