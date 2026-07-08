# Plan — Staff Profile

References: [spec.md](./spec.md), depends on [shared-shell](../shared-shell/plan.md)

## Architecture

```
StaffProfileContainer
  ├── ProfileShell
  ├── StaffProfileView
  │     ├── AccountSection
  │     ├── ContactSection
  │     ├── RoleSection
  │     └── PermissionsSection (scope=other, read-only)
  └── StaffProfileEditForm
        ├── CoreFieldsSection
        └── ContactEditSection (+ status for admin)
```

## File paths

| Action | Path |
|--------|------|
| Extend | `frontend/views/profile/staff/StaffProfileContainer.tsx` |
| Create | `frontend/views/profile/staff/StaffProfileView.tsx` |
| Create | `frontend/views/profile/staff/StaffProfileEditForm.tsx` |
| Create | `frontend/views/profile/staff/sections/PermissionsSection.tsx` |
| Create | `frontend/views/profile/staff/sections/RoleSection.tsx` |

## Data flow

GraphQL endpoints only — [DATA_POLICY.md](../DATA_POLICY.md).

- Query: `profileByUserId` → `staffProfile` (ManagerDirectoryRow)
- Extend with `permissionGroups` and `permissionOverrides` arrays
- Own mutation: `updateOwnProfile({ core, staff: { phone, skypeId } })`
- Admin mutation: `updateUserProfile({ core, staff: { phone, skypeId, status } })`

## GraphQL gaps

- Add `StaffAdminProfileUpdateInput` to pothos with `status` field
- Add `permissionGroups` nested field on staff profile query

## i18n

Namespace: `profile.staff.*`

## Risks

- Permissions matrix complexity — start with groups list, add matrix in follow-up
- Staff admin edit not implemented today — full build required

## Layer pipeline

| Step | Layer | Files |
|------|-------|-------|
| 1 | Types | `profile.types.ts`, `staff-profile.types.ts` — add permission group types |
| 2 | Repository | permissions repo or extend user permission queries |
| 3 | Services | `profile.service.ts`, `manager-profile.service.ts` |
| 4 | Pothos | fix `UpdateUserProfileInput.staff.status`; add permission groups |
| 5–9 | Codegen + Documents | profile.documents.ts |
| 10 | i18n + UI | `frontend/views/profile/staff/` |

See [LAYER_PIPELINE.md](../LAYER_PIPELINE.md).

## Orchestration & quality

- [ORCHESTRATION.md](../ORCHESTRATION.md) — subagents, plan-review, lint queue
- [VERIFY.md](../VERIFY.md) — gate after each layer in tasks.md
- [GRAPHQL_PATTERNS.md](../GRAPHQL_PATTERNS.md) — client patterns (if UI/GraphQL)
- [stitch-assets/](../stitch-assets/README.md) — local design reference
- Instruction files: `.github/instructions/backend.instructions.md`, `frontend.instructions.md`, `tests.instructions.md`
