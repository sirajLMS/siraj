## Section 2: RBAC Permissions (Canonical)

Story 10 adds two system-automated permission keys. These permissions are not user-facing — they are enforced internally by the service layer when an admin changes a student's status. They are assigned only to the `system_automated` group, which is used by backend automation services, not individual human users.

---

### 2.1 New Permissions

| **Permission Key** | **Category** | **Group** | **UI Gate** | **Backend Service Method** | **GraphQL Mutation** |
|---|---|---|---|---|---|
| `system.enforce_suspended_lock` | System | System Automated | Not user-facing — triggered internally when admin sets student to SUSPENDED | `SuspendedLockService.enforceSuspendedLock()` | None — called internally by `StudentLifecycleService.changeStudentStatus()` |
| `system.process_student_leave` | System | System Automated | Not user-facing — triggered internally when admin sets student to ON_LEAVE | `StudentLeaveProcessingService.processStudentLeave()` | None — called internally by `StudentLifecycleService.changeStudentStatus()` |

**Key characteristics of these permissions:**
- They are **not held by human user roles** — no Academy Admin, Super Admin, Teacher, Parent, or Staff gets these keys directly.
- They are **not checked at the resolver level** — the GraphQL mutation for `changeStudentStatus` (from Story 9) already gates on `student.manage_status`. The new system permissions are checked implicitly by the existence of the service methods.
- They are **seeded in the migration** to be formally registered in the permissions catalog, enabling future audit logging and permission introspection.
- They are **documented as `AppPermission` enum values** to prevent magic string usage in the codebase.

---

### 2.2 Permission Mapping to Existing Permissions

| **Story 10 Permission** | **Existing Related Permission** | **Relationship** |
|---|---|---|
| `system.enforce_suspended_lock` | `student.manage_status` (Story 9) | Downstream effect — triggered AFTER `student.manage_status` change to SUSPENDED is committed |
| `system.process_student_leave` | `student.manage_status` (Story 9) | Downstream effect — triggered AFTER `student.manage_status` change to ON_LEAVE is committed |
| `system.enforce_suspended_lock` | `system.enforce_time_window` (prior sprint) | Sibling — both are automated system enforcement rules in `system_automated` group |
| `system.enforce_suspended_lock` | `system.enforce_leave_limit` (prior sprint) | Sibling — both are automated system enforcement rules in `system_automated` group |
| `system.process_student_leave` | `system.sync_notifications` (prior sprint) | Sibling — all three are in `system_automated` group |

**Execution Flow (permission chain):**

```
1. Admin holds `student.manage_status` → triggers GraphQL mutation `changeStudentStatus`
2. StudentLifecycleService.changeStudentStatus() verifies `student.manage_status` via PermissionsService
3. StudentRepository.changeStatus() commits the status change to DB
4. [If new status = SUSPENDED] → SuspendedLockService.enforceSuspendedLock() runs (system.enforce_suspended_lock behavior)
5. [If new status = ON_LEAVE] → StudentLeaveProcessingService.processStudentLeave() runs (system.process_student_leave behavior)
6. [If current status = SUSPENDED AND new status = REGULAR] → SuspendedLockService.releaseSuspendedLock() runs
```

The two new permissions document WHAT the system is doing at steps 4 and 5. They are not re-checked at runtime (no `hasPermission()` call in the side-effect services).

---

### 2.3 Permission Group Assignments

| **Permission Group** | **Slug** | **Current Permissions** | **New Permissions Added (Story 10)** |
|---|---|---|---|
| System Automated | `system_automated` | `system.enforce_time_window`, `system.enforce_leave_limit`, `system.sync_notifications` | `system.enforce_suspended_lock`, `system.process_student_leave` |

**Migration SQL change** (in `backend/db/migration/3-system_permissions_and_groups.sql` at the `system_automated` group block near line 1063):

**Before (Story 9 state):**
```sql
    AND p.key IN (
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'system.sync_notifications'
    );
```

**After (Story 10 addition):**
```sql
    AND p.key IN (
        'system.enforce_time_window',
        'system.enforce_leave_limit',
        'system.sync_notifications',
        'system.enforce_suspended_lock',
        'system.process_student_leave'
    );
```

**No other permission groups receive these permissions.** They are exclusively assigned to `system_automated`.

---

### 2.4 Self-Scoping vs Any-Scoping

Story 10's two permissions are **system-internal** — they have no notion of user-scoping:

- `system.enforce_suspended_lock` operates on class instances scoped to `studentId`. The `studentId` is not user-supplied via GraphQL — it is the entity whose status just changed, passed internally through the service call chain.
- `system.process_student_leave` similarly operates on future class instances for the same `studentId`.

Neither permission involves a "self vs any" distinction because human users never invoke them directly. The scoping is fully determined by the `studentId` passed through `StudentLifecycleService.changeStudentStatus()`.

---

### 2.5 New AppPermission Enum Entries

**File:** `shared/lib/enum.ts`
**Location:** After `SYSTEM_SYNC_NOTIFICATIONS = "system.sync_notifications"` at line 489

**Current state of enum (lines 487–492, verified):**
```typescript
  SYSTEM_ENFORCE_TIME_WINDOW = "system.enforce_time_window",
  SYSTEM_ENFORCE_LEAVE_LIMIT = "system.enforce_leave_limit",
  SYSTEM_SYNC_NOTIFICATIONS = "system.sync_notifications",
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
```

**New entries to add after `SYSTEM_SYNC_NOTIFICATIONS` (before `TEST_SYSTEM_ONLY`):**
```typescript
  // Story 10: Automated Student Status Enforcement
  SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock",
  SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave",
```

**Target state after Story 10 (lines 487–494):**
```typescript
  SYSTEM_ENFORCE_TIME_WINDOW = "system.enforce_time_window",
  SYSTEM_ENFORCE_LEAVE_LIMIT = "system.enforce_leave_limit",
  SYSTEM_SYNC_NOTIFICATIONS = "system.sync_notifications",
  // Story 10: Automated Student Status Enforcement
  SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock",
  SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave",
  TEST_SYSTEM_ONLY = "test.system_only",
  TEST_CUSTOM_ONLY = "test.custom_only",
```

**Note on `SystemPermissionGroupSlug` enum:** The `SystemPermissionGroupSlug` enum at lines 494–500 currently has `SUPER_ADMIN`, `ACADEMY_ADMIN`, `TEACHER_DEFAULT`, `PARENT_DEFAULT`, `STAFF_DEFAULT` — there is **no `SYSTEM_AUTOMATED` entry**. Adding this entry is OUT OF SCOPE for Story 10. The `system_automated` group is created and referenced via its SQL slug string in the migration, not via a TypeScript enum value. The `SystemPermissionGroupSlug` enum will be extended in a future sprint when the need arises.

---

### 2.6 Verification Commands

After completing Task A (Migration & Enum), verify:

```bash
# Verify enum entries exist
grep -n "SYSTEM_ENFORCE_SUSPENDED_LOCK\|SYSTEM_PROCESS_STUDENT_LEAVE" shared/lib/enum.ts

# Verify migration SQL contains new permission rows
grep -n "enforce_suspended_lock\|process_student_leave" backend/db/migration/3-system_permissions_and_groups.sql

# Verify system_automated group assignment includes new permissions
grep -A 10 "system_automated" backend/db/migration/3-system_permissions_and_groups.sql

# Verify no AppPermission enum values reference system_automated (would be wrong)
grep -n "SYSTEM_AUTOMATED" shared/lib/enum.ts
```

**Expected outputs:**
- First command: 2 lines found in `shared/lib/enum.ts`
- Second command: 2+ lines found in migration file
- Third command: Shows `enforce_suspended_lock` and `process_student_leave` in the IN clause
- Fourth command: Empty (no `SYSTEM_AUTOMATED` in enum — correct, it's out of scope)
