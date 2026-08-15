# Manager Role Mapping & Permissions Fix — Design Document

## Document Information

- **Feature Name**: Manager Role Mapping & Permissions Fix
- **Target Directory**: `.ai/plans/manager-role-permissions-fix`
- **Outcome Directory**: `.ai/plans/manager-role-permissions-fix/outcome`
- **Version**: 1.0
- **Date**: 2026-08-15
- **Author**: Copilot
- **Related Documents**: `specs.md` (requirements)

## Overview

The fix changes the `ManagerAccountType` enum to remove `admin` and make `manager` the sole entry to `ACADEMY_ADMIN`. The `academy_admin` permission group's `name` JSONB is updated from `{"ar": "المسؤول", "en": "Admin"}` to `{"ar": "مدير الأكاديمية", "en": "Manager"}` via a new SQL migration. The staff directory role filter for `"manager"` is updated to match `%admin%` slugs. i18n files are updated to remove `admin` entries and relabel `manager`.

### Design Goals
1. Manager account type maps to `ACADEMY_ADMIN` — giving full ops access except permission control
2. `academy_admin` group displays as "مدير الأكاديمية" / "Manager" everywhere it's shown (profile, permissions chips)
3. Staff directory "Manager" filter surfaces `academy_admin`-grouped users
4. `admin` option removed from onboarding form (replaced by Manager)
5. `supervisor` account type unchanged

### Key Design Decisions

#### Decision 1: Remove `admin` from `ManagerAccountType` enum

**Context:** Both `admin` and `manager` would map to `ACADEMY_ADMIN` if we kept both, creating redundancy. The customer wants `manager` (مدير) to be the primary label.

**Options Considered:**
1. Keep both mapping to `ACADEMY_ADMIN` — Pros: backward compatible / Cons: redundant, confusing UX
2. Remove `admin`, `manager` is sole entry — Pros: clean enum, matches customer's mental model / Cons: breaking GraphQL change
3. Create separate group for `manager` — Pros: no breaking change / Cons: unnecessary complexity, two groups with same permissions

**Decision:** Option (b) — remove `admin`, `manager` becomes sole path to `ACADEMY_ADMIN`.

**Rationale:** Breaking change is acceptable (super-admin-only internal tool, no mobile clients). Cleaner enum, no duplicate mapping.

#### Decision 2: Update `academy_admin` group name via SQL migration

**Context:** The `academy_admin` permission group `name` is `{"ar": "المسؤول", "en": "Admin"}`. The customer wants "مدير الأكاديمية" / "Manager". The `name` JSONB column in `permission_groups` is what the UI renders for role labels in profile header and permissions chips.

**Options Considered:**
1. Edit existing seed SQL file only — Pros: simple / Cons: existing databases won't get the update (ON CONFLICT only runs on re-seed)
2. Create a new forward migration UPDATE only — Pros: existing databases updated / Cons: new databases get old name from seed
3. Both: edit seed for consistency AND create forward migration — Pros: both new and existing DBs correct / Cons: must keep two files in sync

**Decision:** Option (c) — Create a new Drizzle custom migration folder with `migration.sql` containing the UPDATE, AND update the seed SQL files directly for consistency.

**Rationale:** Existing databases need the forward migration UPDATE; new databases get the correct name from the updated seed. Both must stay in sync.

#### Decision 3: Staff directory "manager" filter matches `%admin%` slugs

**Context:** After the fix, managers have `academy_admin` slug. Current `"manager"` filter looks for `%staff%` slugs.

**Decision:** Change `roleFilter === "manager"` to `ilike(permissionGroups.slug, "%admin%")` — same as the existing `"admin"` branch. Keep `"admin"` filter for backward compatibility.

**Rationale:** Both branches now match the same pattern; managers and admins share the same group.

#### Decision 4: Directory grid i18n — relabel `t.roles.admin` to "Manager"

**Context:** The directory grid uses `mapManagerRole(roleSlug)` which maps `%admin%` slug → `"admin"` bucket. The i18n `t.roles.admin` is "Admin" / "مدير".

**Decision:** Update `t.roles.admin` from "Admin" / "مدير" to "Manager" / "مدير الأكاديمية". Keep `mapManagerRole` as-is.

**Rationale:** Minimal change; `mapManagerRole` doesn't need updating since `%admin%` → `"admin"` bucket is functionally correct. Only the displayed label changes.

## UX/Navigation Specification

### New Routes & URLs

**No new routes.** This is a behavioral change to existing flows only.

### Sidebar Navigation Integration

No changes to sidebar navigation. The staff directory and onboarding form already exist.

### Role-Based Access Matrix

| Role | Create Manager | View Staff Directory | View Profile | Onboarding Form |
|------|---------------|---------------------|-------------|-----------------|
| SUPER_ADMIN | ✅ (superAdmin scope) | ✅ | ✅ | Sees 2 options: Manager, Supervisor |
| ACADEMY_ADMIN (Manager) | ❌ (requires superAdmin) | ✅ | ✅ | N/A |
| SUPERVISOR | ❌ | ✅ | ✅ | N/A |
| TEACHER | ❌ | ❌ | ✅ (own) | N/A |
| PARENT | ❌ | ❌ | ✅ (own) | N/A |
| STUDENT | ❌ | ❌ | ✅ (own) | N/A |

### Per-Audience Rendering

| Audience | Prominent Content / Differences |
|----------|--------------------------------|
| Student | Not affected — no access to onboarding or staff directory |
| Parent | Not affected — no access to onboarding or staff directory |
| Teacher | Not affected — no access to onboarding or staff directory |
| Supervisor | Not affected — no access to onboarding. Sees staff directory unchanged |
| Super Admin | Sees onboarding form with 2 options (Manager, Supervisor). Staff directory "Manager" filter shows `academy_admin` users |
| Academy Admin (Manager) | Profile shows "مدير الأكاديمية". Has all operational permissions except permission control |

### Mobile vs Desktop Variants

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Onboarding form | `SystemAccessSection.tsx` — 2 radio cards (Manager, Supervisor) | Same component, responsive layout (no separate mobile variant) |
| Staff directory grid | `managersDataGrid.desktop.tsx` — uses `t.roles[params.row.role]` for chip label | `managersCardList.mobile.tsx` — uses same `t.roles[role]` i18n keys |

### Permission Mapping

| Component/Route | Required Permission | Source |
|-----------------|---------------------|--------|
| Staff onboarding form | `superAdmin` scope | `createManager` mutation requires superAdmin auth scope |
| Staff directory | `staff.view_directory` | `requirePermissionForPage` |
| Profile | `loggedIn` | Standard auth |

### Translation System Requirements

All i18n changes use the existing compile-time TypeScript locale system in `shared/locale/`. No `next-intl` imports. No string literals — all locale type schemas are TypeScript interfaces.

## Architecture

### System Context

This is a targeted fix within the existing staff onboarding and directory architecture. No new external integrations. The change affects:

1. **Backend enum layer** — `ManagerAccountType` enum definition
2. **Backend service layer** — `resolveTargetGroupSlug` mapping function
3. **Backend repository layer** — `resolveRoleCondition` filter
4. **Database migration layer** — `permission_groups` row UPDATE
5. **i18n layer** — Locale type schemas and translation files
6. **Frontend view layer** — Onboarding form component
7. **GraphQL codegen layer** — Auto-generated schema and types

### High-Level Architecture

```
Onboarding Form (SystemAccessSection.tsx)
  → ManagerAccountType enum (account-type.enum.ts)
  → createManager mutation (onboarding.mutation.ts)
  → resolveTargetGroupSlug (manager-onboarding.service.ts)
  → ACADEMY_ADMIN slug → user_permission_groups
  → permission_groups.name JSONB → "مدير الأكاديمية" / "Manager"

Staff Directory (ManagersContainer)
  → roleFilter: "manager"
  → resolveRoleCondition (staff-profile.repository.ts)
  → ilike(slug, "%admin%") → returns academy_admin users
  → mapManagerRole(roleSlug) → "admin" bucket
  → t.roles.admin → "Manager" / "مدير الأكاديمية"
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Backend enum | TypeScript enum | Existing pattern — Pothos derives GraphQL enum automatically |
| Backend service | TypeScript | Existing pattern — pure function mapping |
| Backend repository | Drizzle ORM | Existing pattern — `ilike` filter |
| Database migration | Custom SQL (Drizzle) | Existing pattern — seed data uses custom SQL folders |
| i18n | Compile-time TypeScript locale | Project standard — no `next-intl` |
| Frontend | React 19 + MUI v9 | Project standard |
| GraphQL codegen | Pothos → codegen | Project standard — auto-regenerated |

## Components and Interfaces

### Component 1: `ManagerAccountType` Enum

**Purpose**: Defines the account type options available in the staff onboarding form.

**Responsibilities**:
- Provide type-safe enum values for account types
- Feed Pothos GraphQL enum registration automatically

**Interfaces**:
- **Input**: None (static enum)
- **Output**: `manager | supervisor` (was `admin | manager | supervisor`)
- **Dependencies**: Pothos enum registration at `backend/graphql/pothos/shared/enum.pothos.ts:69-71`

**Implementation Notes**:
- File: `backend/enum/users/account-type.enum.ts`
- Delete `admin = "admin"` from enum (line 20)
- Remove from `MANAGER_ACCOUNT_TYPES` array (line 31)
- Update docstring (lines 4-17)

### Component 2: `resolveTargetGroupSlug` Function

**Purpose**: Maps `ManagerAccountType` to `SystemPermissionGroupSlug`.

**Responsibilities**:
- `manager` → `ACADEMY_ADMIN` (changed from `STAFF_DEFAULT`)
- `supervisor` → `SUPERVISOR_DEFAULT` (unchanged)

**Interfaces**:
- **Input**: `ManagerAccountType` value
- **Output**: `SystemPermissionGroupSlug` value
- **Dependencies**: `SystemPermissionGroupSlug` enum from `backend/enum/permissions/permission-group.enum.ts`

**Implementation Notes**:
- File: `backend/services/staff/manager-onboarding.service.ts:35-43`
- Delete `admin` branch (lines 36-38)
- Change fallback (line 42) from `STAFF_DEFAULT` to `ACADEMY_ADMIN`
- Module-private function, single caller at line 56

### Component 3: `resolveRoleCondition` Function

**Purpose**: Builds a Drizzle filter for staff directory role filtering.

**Responsibilities**:
- `roleFilter === "admin"` → `ilike(slug, "%admin%")` (unchanged)
- `roleFilter === "manager"` → `ilike(slug, "%admin%")` (changed from `%staff%` match)
- `roleFilter === "supervisor"` → `ilike(slug, "%supervisor%")` (unchanged)

**Implementation Notes**:
- File: `backend/db/repo/teachers/staff-profile.repository.ts:155-173`
- Change `"manager"` branch (lines 162-171) from `or(isNull, and(notIlike admin, notIlike supervisor, ilike %staff%))` to `ilike(permissionGroups.slug, "%admin%")`

### Component 4: `academy_admin` Group Name Migration

**Purpose**: Updates the `permission_groups.name` JSONB for `slug = 'academy_admin'`.

**Implementation Notes**:
- New Drizzle custom migration folder: `backend/drizzle/<timestamp>_custom_update_academy_admin_group_name/migration.sql`
- Idempotent UPDATE by unique slug
- Also update seed SQL mirrors for consistency:
  - `backend/db/migration/3-system_permissions_and_groups.sql` lines 1023-1031
  - `backend/drizzle/20260815025626_custom_3-system_permissions_and_groups/migration.sql` lines 1057-1065

### Component 5: i18n Locale Files

**Purpose**: Remove `admin` entries and relabel `manager` in onboarding and directory locale files.

**Implementation Notes**:
- Onboarding type schema: `shared/locale/types/dashboard/staff/onboarding.ts:24-34` — remove `admin` keys
- AR onboarding: `shared/locale/ar/dashboard/staff/onboarding.ts:27-36` — remove `admin`, update `manager`
- EN onboarding: `shared/locale/en/dashboard/staff/onboarding.ts:27-36` — remove `admin`, update `manager`
- AR directory: `shared/locale/ar/dashboard/staff/directory.ts:53-57` — update `roles.admin` to "مدير الأكاديمية"
- EN directory: `shared/locale/en/dashboard/staff/directory.ts:53-57` — update `roles.admin` to "Manager"

### Component 6: `SystemAccessSection.tsx`

**Purpose**: Onboarding form component showing account type options.

**Implementation Notes**:
- File: `frontend/common/views/dashboard/staff/onboarding/SystemAccessSection.tsx`
- Remove `ManagerAccountType.Admin` from `ACCOUNT_TYPES` array (line 13)
- Remove `Admin` entry from `ACCOUNT_TYPE_LABEL_KEYS` (line 19), tighten Record type
- Remove `Admin` description branch (lines 94-95)

## Data Models

### `permission_groups` table (existing, row UPDATE only)

```typescript
// No schema change — row UPDATE only
interface PermissionGroup {
  id: string;
  name: LocalizedString; // JSONB {"ar": "...", "en": "..."}
  slug: string; // "academy_admin"
  description: LocalizedString;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Migration**: `UPDATE permission_groups SET name = '{"ar": "مدير الأكاديمية", "en": "Manager"}'::jsonb, description = '...'::jsonb WHERE slug = 'academy_admin'`

### `ManagerAccountType` enum (modified)

```typescript
// Before:
enum ManagerAccountType {
  admin = "admin",
  manager = "manager",
  supervisor = "supervisor",
}

// After:
enum ManagerAccountType {
  manager = "manager",
  supervisor = "supervisor",
}
```

## Security Considerations

### Authorization
- `createManager` mutation requires `superAdmin` auth scope — unchanged
- `academy_admin` group permissions already exclude `permission_groups.manage`, `permission_groups.assign`, `settings.edit_env`, `profile.staff_permissions.edit_*` — no change needed

### Breaking Change Assessment
- `admin` value removed from `ManagerAccountType` GraphQL enum — acceptable because:
  - Only `superAdmin` can invoke `createManager` (super-admin-only mutation)
  - No mobile/external clients send `accountType: admin` in production
  - Internal admin tool, not a public API

## Error Handling

No new error paths. Existing error handling in `createManager` mutation and `resolveTargetGroupSlug` remains unchanged. The enum change is a compile-time constraint — TypeScript will catch any references to the removed `admin` value.

## Testing Strategy

### Unit Testing
- **Service test**: `backend/services/staff/test/manager-onboarding.service.test.ts` — update expectations
- **Repository test**: `backend/db/test/repo/teachers/staff-profile.test.ts` — update role filter expectations

### Integration Testing
- **GraphQL test**: `frontend/common/graphql/test/teachers/manager-onboarding.test.ts` — update expectations
- **GraphQL test**: `frontend/common/graphql/test/teachers/manager-directory-graphql.test.ts` — update assertions

### Regeneration
- `bun run generate:gqlSchema` + `bun codegen` — verify `admin` dropped from enum

## Migration and Compatibility

### Data Migration
- Forward migration: `UPDATE permission_groups SET name=... WHERE slug='academy_admin'` — idempotent, safe to re-run
- No user data migration needed (enum values are transient — only slugs persist in `user_permission_groups`)

### Backward Compatibility
- GraphQL schema: breaking change (enum value removed) — acceptable per assessment
- Database: backward compatible (row UPDATE only, no schema change)
- Frontend: `mapManagerRole` function unchanged (`%admin%` → `"admin"` bucket still works)

## Outcome & Knowledge Transfer Protocol

- **BEFORE Execution**: Read ALL files in `.ai/plans/manager-role-permissions-fix/outcome/`
- **AFTER Execution**: Write `.ai/plans/manager-role-permissions-fix/outcome/<task-id>-outcome.md`
- **PROGRESS TRACKING**: Update `[ ]` → `[x]` in `tasks.md`
