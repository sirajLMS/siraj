# Phase 9 Outcome: Knowledge Propagation

## Summary

Created the permanent documentation file `docs/auth/supervisor-permissions.md` and updated three AGENTS.md files to propagate learnings from the supervisor permissions implementation (GitHub issue #47) to permanent project documentation.

## Files Created

### Task 9.1: `docs/auth/supervisor-permissions.md`

New documentation file covering:

1. **Supervisor permission model** — Supervisors have full teacher/student management permissions (create, edit, manage schedule, reassign, change status) + all `edit_other` field-ACL profile permissions. They manage teachers and students exactly like superAdmin, except they cannot manage permissions (lack `PermissionGroupsManage`).
2. **Migration maintenance rule** — Any new teacher/student management permission MUST be added to `supervisor_default` group in `backend/db/migration/6-lms-permissions-and-groups.sql`. Comment block above the INSERT documents this.
3. **System group editability** — System permission groups can have permission bundles edited via `updateGroup` (add/remove permissions), but name/slug/description are immutable, and delete is blocked. Frontend shows edit/revoke buttons for system groups but makes name/description fields read-only.
4. **GraphQL authScope pattern** — Use `authScopes: { permission: AppPermission.X }` (not `authScopes: { superAdmin: true }`) for mutations accessible by non-superadmin users. The `permission:` check passes for `ctx.isSuperAdmin || ctx.permissions.includes(key)`. Defined in `gqlSchemaBuilder.ts`.
5. **`applySupervisorNavOverrides`** — Runs AFTER `getNavItemsForPermissions` permission-based filtering. Must NOT override permission-based filtering for items the supervisor has permissions for. Only genuinely admin-only items (settings, whatsapp-settings, dst-migration, cron, etc.) should remain hidden.
6. **Manager (academy_admin) ACL customization** — Academy admin now has `permission_groups.manage`, `permission_groups.assign`, `teachers.edit`, `teachers.list`, `students.edit`, `students.change_teacher`, `students.change_status` — allowing them to customize permission groups for their academy staff.

## Files Updated

### Task 9.2: `backend/services/AGENTS.md`

Added a new **System Permission Groups** section before the Linting Rules section, documenting:
- System permission groups can have permission bundles edited via `updateGroup` but cannot be renamed or deleted
- The service layer skips `validateGroupName` for system groups and passes `undefined` for name/description
- Reference to `docs/auth/supervisor-permissions.md` for the complete model reference

### Task 9.3: `backend/graphql/AGENTS.md`

Added a new **authScope Patterns (Permission-Based Access)** section before the Linting Rules section, documenting:
- Use `authScopes: { permission: AppPermission.X }` not `authScopes: { superAdmin: true }` for mutations accessible by non-superadmin users
- The `permission:` check passes for `ctx.isSuperAdmin || ctx.permissions.includes(key)`
- `AppPermission` must be imported as a value import when used in `authScopes`
- Reference to `docs/auth/supervisor-permissions.md` for the complete pattern reference

### Task 9.4: Root `AGENTS.md`

Added `docs/auth/supervisor-permissions.md` to the Important References section, under the auth/docs section, immediately after `docs/auth/permission-architecture.md`:
```
- `docs/auth/supervisor-permissions.md` - Supervisor permission model, system group editability, authScope patterns, navigation overrides
```

## Quality Verification

All modified files passed `sub-loop.ts --lifecycle codescene`:

| File | tsgo | oxlint | Exit Code |
|------|------|--------|-----------|
| `docs/auth/supervisor-permissions.md` | ✅ pass | N/A (`.md` — not lintable) | 0 |
| `backend/services/AGENTS.md` | ✅ pass | N/A (`.md` — not lintable) | 0 |
| `backend/graphql/AGENTS.md` | ✅ pass | N/A (`.md` — not lintable) | 0 |
| `AGENTS.md` | ✅ pass | N/A (`.md` — not lintable) | 0 |

Note: oxlint reports "No files found to lint" for `.md` files (they are not in oxlint's file type scope). This is expected behavior, not an error — the process exits 0.

### Task 9.5: This outcome file
