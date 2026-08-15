# Manager Role Mapping & Permissions Fix — Trackable Tasks

## Document Information

- **Feature Name**: Manager Role Mapping & Permissions Fix
- **Target Directory**: `.ai/plans/manager-role-permissions-fix`
- **Outcome Directory**: `.ai/plans/manager-role-permissions-fix/outcome`
- **Version**: 1.0
- **Date**: 2026-08-15
- **Author**: Copilot
- **Related Documents**:
  - Requirements: `specs.md`
  - Design: `design.md`
  - Deferred Items: `deferred-items.md`

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:** Before executing ANY task, read ALL existing files in `.ai/plans/manager-role-permissions-fix/outcome/`.
2. **Per-File Quality Verification Loop (Immediate post-edit):** After editing a file, run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit code 0 = pass).
3. **Semantic Review Checklist (Pre-Completion Gate):** Agent self-review before marking complete (see X.Y.SR subtask below).
4. **Global Health Check (Completion Gate):** Re-run sub-loop on all modified files — all MUST exit 0.
5. **Post-Execution Outcome File Creation:** Write `.ai/plans/manager-role-permissions-fix/outcome/<task-id>-outcome.md`.
6. **Task Progress Tracking:** Update `[ ]` → `[x]` in this file upon completion.

## MANDATORY Subtasks for Every Implementation Task

**EVERY implementation task (X.Y) MUST include these subtasks in strict order:**

### Quality Loop Subtask (X.Y.QL)
```markdown
- [ ] X.Y.QL **Quality Loop**: Per-file verification on `<file-path>`
  - Run: `bun run scripts/health/sub-loop.ts <file-path> --lifecycle codescene`
  - The script runs: tsgo → oxlint → biome:check → lint:type-aware → check:duplicates → codescene --file
  - It auto-discovers & prints applicable AGENTS.md + .agents/instructions files
  - It enforces the Fix-Or-Report rule (fix within same file; report cross-file deps to orchestrator)
  - Exit code 0 = all checks passed; 1 = stopped at failing check (errors printed)
  - Fix all errors and re-run until exit code 0 before proceeding
```

### Semantic Review Subtask (X.Y.SR)
```markdown
- [ ] X.Y.SR **Semantic Review**: Agent self-review before marking complete
  - [ ] No read-then-write without atomicity (SELECT FOR UPDATE / tx / advisory lock)
  - [ ] No module-level mutable state without bounds
  - [ ] All `resolveEnvConfig` calls registered in `env-config-keys.ts`
  - [ ] All `resetX()` functions invalidate all resolved keys
  - [ ] No empty-string credential acceptance
  - [ ] No dead branches (all paths reachable)
  - [ ] No cross-layer imports (frontend→backend, shared→frontend/backend)
  - [ ] Enums imported as values (not `import type`) when used at runtime
  - [ ] Schema migrations match Drizzle schema
  - [ ] All deferred items logged in `deferred-items.md`
```

### Instruction Verification Subtask (X.Y.IV)
```markdown
- [ ] X.Y.IV **Instruction Verification**: Read & validate `<file-path>` against rule files
  - The `sub-loop.ts` script (run in X.Y.QL) auto-discovers & prints applicable rule files
  - Read ALL printed AGENTS.md files
  - Read ALL printed .agents/instructions files
  - Validate the file against the rules in those files
```

**Sequence:** QL (Quality Loop) → SR (Semantic Review) → IV (Instruction Verification) → Mark `[x]`

### Layer-to-Instructions Mapping (Reference for ALL Plans)

| Layer | AGENTS.md Files (absolute paths) | .agents/instructions Files (absolute paths) |
|-------|----------------------------------|---------------------------------------------|
| Root | `/home/ahmed/Projects/siraj/AGENTS.md` | — |
| Backend Enums | `/home/ahmed/Projects/siraj/backend/enum/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Services | `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Repos | `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Tests | `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |
| Shared Locale | `/home/ahmed/Projects/siraj/shared/AGENTS.md` | — |
| Frontend Common | `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md` |
| Frontend GraphQL Tests | `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |

### Drizzle Schema Convention (Reference)
- **Schema changes** (new tables, columns, indexes): `bun run db push` — creates schema automatically
- **Custom SQL migrations** (seed data, complex transforms): `bun db migrate` — for non-Drizzle SQL only (this plan uses custom SQL only)

## Implementation Overview

This plan fixes the Manager role mapping so that creating a user as "Manager" (مدير) assigns the `ACADEMY_ADMIN` permission group (not `STAFF_DEFAULT`), displays them as "مدير الأكاديمية" / "Manager", and gives them all operational permissions except permission control.

### Implementation Strategy
- **Backend foundation first**: Remove `admin` from enum, update service mapping, update repo filter
- **Database migration**: Add forward UPDATE migration for `academy_admin` group name
- **i18n cascade**: Update type schema → AR/EN locale files (onboarding + directory)
- **Frontend last**: Remove `Admin` option from onboarding form
- **Codegen**: Regenerate GraphQL schema/types after enum edit
- **Tests last**: Update all 4 test files to match new expectations

### Development Approach
- **Testing Strategy**: Update existing tests in-place (no new test files)
- **Integration Strategy**: Compile-time TypeScript catches removed enum references; GraphQL codegen regenerates schema
- **Deployment Strategy**: No commit / no push per user request — implementation only

## Implementation Plan

### Task 0: Pre-Implementation Baseline (MANDATORY)

- [x] 0. Establish error baseline and create deferred-items ledger
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - Record baseline error counts BEFORE any implementation:
    ```bash
    # Record tsgo error count
    bun tsgo 2>&1 | grep "error TS" | wc -l > /tmp/baseline-tsgo.txt
    # Record biome warnings
    bun biome:check 2>&1 | grep -c "warn" > /tmp/baseline-biome.txt
    # Record lint output
    bun run scripts/lint-service.ts --json --id baseline > /tmp/baseline-lint.json
    ```
  - Verify `deferred-items.md` exists at `.ai/plans/manager-role-permissions-fix/deferred-items.md` (already created with D1-D3 entries)
  - Write outcome file: `.ai/plans/manager-role-permissions-fix/outcome/0-baseline-outcome.md` documenting baseline counts
  - _Requirements: REQ-0 (Pre-Implementation Baseline)_

### Phase 1.5: Plan Review Gate (MANDATORY)

- [x] 0.5 Review complete plan using @plan-review skill
  - **Input files:** `specs.md`, `design.md`, `tasks.md`
  - **Invoke:** `@plan-review` skill on complete plan
  - **Expected output:** "Plan passes all AGENTS.md rules" OR structured violation list
  - If violations found:
    - Fix all reported violations in plan files
    - Re-run `@plan-review`
    - Repeat until zero violations
  - Write outcome: `.ai/plans/manager-role-permissions-fix/outcome/plan-review-R1.md`
  - Mark complete ONLY when plan passes all checks
  - _Requirements: REQ-0 (Execution Protocol)_

### Phase A: Backend Foundation — Enum & Service Mapping

- [x] 1. Update `ManagerAccountType` enum — remove `admin` value
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `backend/enum/users/account-type.enum.ts`
  - **Changes:**
    - Remove `admin = "admin"` from enum (line 20)
    - Remove `ManagerAccountType.admin` from `MANAGER_ACCOUNT_TYPES` array (line 31)
    - Update docstring (lines 4-17): document `manager → ACADEMY_ADMIN (Manager)`, `supervisor → SUPERVISOR_DEFAULT`, remove `admin` line
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/backend/enum/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
  - **Applicable instructions:** `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - Cross-file dependency: TypeScript compilation will break for `SystemAccessSection.tsx` (Task 9) and locale files (Tasks 5-7) — this is expected and resolved by those tasks
  - Cross-file dependency: GraphQL codegen regeneration needed (Task 10) — logged as D1 in deferred-items.md
  - _Requirements: REQ-1 (Manager maps to ACADEMY_ADMIN)_

  - [x] 1.QL **Quality Loop**: Per-file verification on `backend/enum/users/account-type.enum.ts`
    - Run: `bun run scripts/health/sub-loop.ts backend/enum/users/account-type.enum.ts --lifecycle codescene`
    - Fix all errors and re-run until exit code 0
    - Note: `tsgo` may fail due to removed enum value breaking other files — this is expected; fix only errors within THIS file, report cross-file breakages to orchestrator

  - [x] 1.SR **Semantic Review**: Agent self-review
    - [x] No dead branches (all enum paths reachable — `manager` and `supervisor` both handled)
    - [x] Enums imported as values (not `import type`) when used at runtime
    - [x] All deferred items logged in `deferred-items.md` (D1, D2, D3 logged)

  - [x] 1.IV **Instruction Verification**: Read & validate against rule files
    - Read printed AGENTS.md + .agents/instructions files
    - Validate enum file against backend.rules and backend/enum/AGENTS.md

- [x] 2. Update `resolveTargetGroupSlug` in manager onboarding service
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `backend/services/staff/manager-onboarding.service.ts`
  - **Line range:** 35-43
  - **Changes:**
    - Delete `admin` branch (lines 36-38): `if (accountType === ManagerAccountType.admin) { return SystemPermissionGroupSlug.ACADEMY_ADMIN; }`
    - Change fallback (line 42) from `return SystemPermissionGroupSlug.STAFF_DEFAULT;` to `return SystemPermissionGroupSlug.ACADEMY_ADMIN;`
    - Supervisor branch (lines 39-41) stays unchanged
    - Result: `manager` → `ACADEMY_ADMIN`, `supervisor` → `SUPERVISOR_DEFAULT`
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
  - **Applicable instructions:** `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-1 (Manager maps to ACADEMY_ADMIN)_

  - [x] 2.QL **Quality Loop**: Per-file verification on `backend/services/staff/manager-onboarding.service.ts`
    - Run: `bun run scripts/health/sub-loop.ts backend/services/staff/manager-onboarding.service.ts --lifecycle codescene`
    - Fix all errors and re-run until exit code 0

  - [x] 2.SR **Semantic Review**: Agent self-review
    - [x] No dead branches (both `manager` and `supervisor` paths reachable, fallback covers only `manager` now)
    - [x] No cross-layer imports
    - [x] Enums imported as values at runtime

  - [x] 2.IV **Instruction Verification**: Read & validate against rule files

### Phase B: Backend — Repository Role Filter

- [x] 3. Update `resolveRoleCondition` for manager role filter
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `backend/db/repo/teachers/staff-profile.repository.ts`
  - **Line range:** 155-173
  - **Changes:**
    - Change `roleFilter === "manager"` branch (lines 162-171) from:
      ```typescript
      or(
        isNull(permissionGroups.slug),
        and(
          notIlike(permissionGroups.slug, "%admin%"),
          notIlike(permissionGroups.slug, "%supervisor%"),
          ilike(permissionGroups.slug, "%staff%")
        )
      )
      ```
      To:
      ```typescript
      ilike(permissionGroups.slug, "%admin%")
      ```
    - The `"admin"` branch (lines 156-158) stays unchanged for backward compatibility
    - Verify `getManagerDirectoryMetrics` (lines 289-318): `totalAdmin` counts `%admin%` → now includes managers ✓; `systemStaff` counts `NOT ILIKE %admin%` → now excludes managers ✓ — no changes needed
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
  - **Applicable instructions:** `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - _Requirements: REQ-3 (Staff directory Manager filter shows academy_admin users)_

  - [x] 3.QL **Quality Loop**: Per-file verification on `backend/db/repo/teachers/staff-profile.repository.ts`
    - Run: `bun run scripts/health/sub-loop.ts backend/db/repo/teachers/staff-profile.repository.ts --lifecycle codescene`
    - Fix all errors and re-run until exit code 0

  - [x] 3.SR **Semantic Review**: Agent self-review
    - [x] No read-then-write without atomicity (this is a read-only filter — N/A)
    - [x] No dead branches (both `"admin"` and `"manager"` branches reachable, `"supervisor"` branch reachable)
    - [x] Enums imported as values at runtime
    - [x] Schema migrations match Drizzle schema (no schema change here)

  - [x] 3.IV **Instruction Verification**: Read & validate against rule files

### Phase C: Database Migration — Group Name Update

- [x] 4. Create Drizzle custom migration updating `academy_admin` group name
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **Create new migration folder:** `backend/drizzle/<timestamp>_custom_update_academy_admin_group_name/migration.sql`
    - Use `drizzle-generate` skill to generate a blank custom migration: `bun drizzle-kit generate --custom --name update-academy-admin-group-name`
  - **Migration SQL (idempotent):**
    ```sql
    UPDATE permission_groups
    SET name = '{"ar": "مدير الأكاديمية", "en": "Manager"}'::jsonb,
        description = '{"ar": "وصول إداري كامل للنظام لإدارة المعلمين والطلاب والجداول والمالية عدا إدارة الصلاحيات", "en": "Full system access for managing teachers, students, schedules, and billing — except permission control"}'::jsonb,
        updated_at = NOW()
    WHERE slug = 'academy_admin';
    ```
  - Run `drizzle-check` to verify no snapshot conflicts: use the `drizzle-check` MCP tool
  - **No quality loop needed** for migration SQL files (not TypeScript)
  - Write outcome file documenting the migration filename and SQL content
  - _Requirements: REQ-2 (academy_admin group name updated)_

- [x] 5. Update seed SQL mirrors for consistency
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File 1:** `backend/db/migration/3-system_permissions_and_groups.sql`
    - **Lines 1023-1031:** Update `academy_admin` INSERT name from `{"ar": "المسؤول", "en": "Admin"}` to `{"ar": "مدير الأكاديمية", "en": "Manager"}`
    - Update description from `{"ar": "إشراف تشغيلي كامل...", "en": "Full operational oversight..."}` to `{"ar": "وصول إداري كامل للنظام لإدارة المعلمين والطلاب والجداول والمالية عدا إدارة الصلاحيات", "en": "Full system access for managing teachers, students, schedules, and billing — except permission control"}`
    - **Lines 1067-1073:** Update UPSERT `ON CONFLICT (slug) DO UPDATE` SET clause to match the new name/description
  - **File 2:** `backend/drizzle/20260815025626_custom_3-system_permissions_and_groups/migration.sql`
    - **Lines 1057-1065:** Update `academy_admin` INSERT name + description (same as File 1)
    - **Lines 1101-1107:** Update UPSERT SET clause to match
  - **No quality loop needed** for seed SQL files (not TypeScript)
  - Write outcome file documenting the exact lines changed
  - _Requirements: REQ-2 (seed SQL consistency)_

### Phase D: i18n Updates

- [x] 6. Update onboarding locale type schema — remove `admin` keys
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `shared/locale/types/dashboard/staff/onboarding.ts`
  - **Line range:** 24-34
  - **Changes:**
    - Remove `admin: string;` from `accountType` interface (line 27)
    - Remove `admin: string;` from `accountTypeDescriptions` interface (line 32)
    - Keep `manager: string;` and `supervisor: string;` in both interfaces
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/shared/AGENTS.md`
  - **Applicable instructions:** (none for shared locale)
  - Cross-file dependency: TS compilation breaks if AR/EN locale files (Tasks 7-8) still have `admin` keys — must edit all 3 files before running `tsgo`
  - _Requirements: REQ-4 (i18n type schema updated)_

  - [x] 6.QL **Quality Loop**: Per-file verification on `shared/locale/types/dashboard/staff/onboarding.ts`
    - Run: `bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/staff/onboarding.ts --lifecycle codescene`
    - Note: `tsgo` may fail until AR/EN files are also updated — fix only errors in THIS file

  - [x] 6.SR **Semantic Review**: Agent self-review
    - [x] No dead branches (type schema — N/A)
    - [x] No cross-layer imports (shared must not import from frontend/backend)
    - [x] All deferred items logged (D3 resolved by this task)

  - [x] 6.IV **Instruction Verification**: Read & validate against `shared/AGENTS.md`

- [x] 7. Update Arabic onboarding translations — remove `admin`, update `manager`
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `shared/locale/ar/dashboard/staff/onboarding.ts`
  - **Line range:** 27-36
  - **Changes:**
    - Remove `admin: "مسؤول"` from `accountType` object (line 29)
    - Remove `admin: "يتمتع المسؤولون بتحكم كامل..."` from `accountTypeDescriptions` object (line 34)
    - Update `manager: "مدير"` (line 28) → `manager: "مدير الأكاديمية"`
    - Update `accountTypeDescriptions.manager` (line 33) → `"وصول إداري كامل للنظام لإدارة المعلمين والطلاب والجداول والمالية عدا إدارة الصلاحيات"`
    - Keep `supervisor` entries unchanged
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/shared/AGENTS.md`
  - _Requirements: REQ-4 (AR onboarding translations updated)_

  - [x] 7.QL **Quality Loop**: Per-file verification on `shared/locale/ar/dashboard/staff/onboarding.ts`
    - Run: `bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/staff/onboarding.ts --lifecycle codescene`

  - [x] 7.SR **Semantic Review**: Agent self-review
    - [x] No cross-layer imports (shared must not import from frontend/backend)
    - [x] No hardcoded error strings (these are locale labels, not error messages — OK)

  - [x] 7.IV **Instruction Verification**: Read & validate against `shared/AGENTS.md`

- [x] 8. Update English onboarding translations — remove `admin`, update `manager`
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `shared/locale/en/dashboard/staff/onboarding.ts`
  - **Line range:** 27-36
  - **Changes:**
    - Remove `admin: "Administrator"` from `accountType` object (line 29)
    - Remove `admin: "Administrators have full system control..."` from `accountTypeDescriptions` object (line 34)
    - Keep `manager: "Manager"` (line 28) — already correct
    - Update `accountTypeDescriptions.manager` (line 33) → `"Full system access for managing teachers, students, schedules, and billing — except permission control"`
    - Keep `supervisor` entries unchanged
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/shared/AGENTS.md`
  - _Requirements: REQ-4 (EN onboarding translations updated)_

  - [x] 8.QL **Quality Loop**: Per-file verification on `shared/locale/en/dashboard/staff/onboarding.ts`
    - Run: `bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/staff/onboarding.ts --lifecycle codescene`

  - [x] 8.SR **Semantic Review**: Agent self-review
    - [x] No cross-layer imports (shared must not import from frontend/backend)

  - [x] 8.IV **Instruction Verification**: Read & validate against `shared/AGENTS.md`

- [x] 9. Update Arabic staff directory i18n role labels
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `shared/locale/ar/dashboard/staff/directory.ts`
  - **Line range:** 53-57
  - **Changes:**
    - Update `admin: "مدير"` → `admin: "مدير الأكاديمية"` (line 54)
    - Keep `manager: "مدير"` (line 55) — may become unused after `mapManagerRole` change, but keeping it is safe (no dead code since the type still defines it)
    - Keep `supervisor: "مشرف"` (line 56) unchanged
  - **Also update type schema:** `shared/locale/types/dashboard/staff/directory.ts` lines 51-55 — verify the `roles` interface still has `admin`, `manager`, `supervisor` keys (no change needed since we're keeping all keys)
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/shared/AGENTS.md`
  - _Requirements: REQ-4 (AR directory role labels updated)_

  - [x] 9.QL **Quality Loop**: Per-file verification on `shared/locale/ar/dashboard/staff/directory.ts`
    - Run: `bun run scripts/health/sub-loop.ts shared/locale/ar/dashboard/staff/directory.ts --lifecycle codescene`

  - [x] 9.SR **Semantic Review**: Agent self-review
    - [x] No cross-layer imports (shared must not import from frontend/backend)

  - [x] 9.IV **Instruction Verification**: Read & validate against `shared/AGENTS.md`

- [x] 10. Update English staff directory i18n role labels
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `shared/locale/en/dashboard/staff/directory.ts`
  - **Line range:** 53-57
  - **Changes:**
    - Update `admin: "Admin"` → `admin: "Manager"` (line 54)
    - Keep `manager: "Manager"` (line 55) unchanged
    - Keep `supervisor: "Supervisor"` (line 56) unchanged
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/shared/AGENTS.md`
  - _Requirements: REQ-4 (EN directory role labels updated)_

  - [x] 10.QL **Quality Loop**: Per-file verification on `shared/locale/en/dashboard/staff/directory.ts`
    - Run: `bun run scripts/health/sub-loop.ts shared/locale/en/dashboard/staff/directory.ts --lifecycle codescene`

  - [x] 10.SR **Semantic Review**: Agent self-review
    - [x] No cross-layer imports (shared must not import from frontend/backend)

  - [x] 10.IV **Instruction Verification**: Read & validate against `shared/AGENTS.md`

### Phase E: Frontend Updates

- [x] 11. Update `SystemAccessSection.tsx` — remove `Admin` option
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `frontend/common/views/dashboard/staff/onboarding/SystemAccessSection.tsx`
  - **Changes:**
    - Remove `ManagerAccountType.Admin` from `ACCOUNT_TYPES` array (line 13)
    - Remove `Admin: "admin"` from `ACCOUNT_TYPE_LABEL_KEYS` (line 19) and tighten the `Record` type from `Record<ManagerAccountType, "manager" | "admin" | "supervisor">` to `Record<ManagerAccountType, "manager" | "supervisor">`
    - Remove the `accountType === ManagerAccountType.Admin` description branch (lines 94-95)
    - Result: Only 2 options remain (Manager, Supervisor)
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
  - **Applicable instructions:** `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Cross-file dependency: Must be done AFTER Task 1 (enum edit) or TypeScript compilation will fail on `ManagerAccountType.Admin` reference
  - _Requirements: REQ-5 (Onboarding form shows only Manager + Supervisor)_

  - [x] 11.QL **Quality Loop**: Per-file verification on `frontend/common/views/dashboard/staff/onboarding/SystemAccessSection.tsx`
    - Run: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/staff/onboarding/SystemAccessSection.tsx --lifecycle codescene`

  - [x] 11.SR **Semantic Review**: Agent self-review
    - [x] No dead branches (only 2 options, both reachable)
    - [x] No cross-layer imports (frontend must not import from backend directly — uses `@/backend/enum/...` path alias which is allowed)
    - [x] Enums imported as values (not `import type`) — `ManagerAccountType` is used at runtime in conditionals

  - [x] 11.IV **Instruction Verification**: Read & validate against rule files
    - Verify MUI v9 compliance (no style props as direct props)
    - Verify React 19 patterns (no `FormEvent`)

### Phase F: GraphQL Code Generation

- [x] 12. Regenerate GraphQL schema and types
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **Generated files (auto):**
    - `frontend/common/graphql/generated/schema.graphql` — `enum ManagerAccountType` will drop `admin`
    - `frontend/common/graphql/generated/gql/graphql-types.ts` — generated enum will drop `Admin`
  - **Commands:**
    ```bash
    bun run generate:gqlSchema    # Generate GraphQL schema from Pothos
    bun codegen                    # Generate TypeScript types from schema
    ```
  - **Verification:**
    - `grep -A 3 "enum ManagerAccountType" frontend/common/graphql/generated/schema.graphql` → should show only `manager` and `supervisor`
    - `grep -A 3 "ManagerAccountType" frontend/common/graphql/generated/gql/graphql-types.ts` → should show only `Manager` and `Supervisor`
  - **No quality loop needed** for generated files (do not edit manually)
  - Write outcome file documenting the regenerated files
  - Update deferred item D1 → ✅ Done in `deferred-items.md`
  - _Requirements: REQ-1 (GraphQL schema updated)_

### Phase G: Tests

- [x] 13. Update manager onboarding service test
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `backend/services/staff/test/manager-onboarding.service.test.ts`
  - **Changes:**
    - Delete "creates manager with admin account type" test (lines 152-165) — `ManagerAccountType.admin` no longer exists
    - Update "creates manager with manager account type" test (lines 167-177): change expected `SystemPermissionGroupSlug.STAFF_DEFAULT` → `SystemPermissionGroupSlug.ACADEMY_ADMIN`
    - Update any rejection tests using `ManagerAccountType.manager` for rejection — verify context mocks still make sense (manager is now a valid admin type)
  - **Run test:** `bun run scripts/run-test/run-test.ts backend/services/staff/test/manager-onboarding.service.test.ts`
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
  - **Applicable instructions:** `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - _Requirements: REQ-6 (Tests updated)_

  - [x] 13.QL **Quality Loop**: Per-file verification on `backend/services/staff/test/manager-onboarding.service.test.ts`
    - Run: `bun run scripts/health/sub-loop.ts backend/services/staff/test/manager-onboarding.service.test.ts --lifecycle codescene`

  - [x] 13.SR **Semantic Review**: Agent self-review
    - [x] No dead branches in test logic
    - [x] Enums imported as values at runtime (test uses `ManagerAccountType.manager`)
    - [x] All test paths reachable

  - [x] 13.IV **Instruction Verification**: Read & validate against rule files

- [x] 14. Update staff profile repository test
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `backend/db/test/repo/teachers/staff-profile.test.ts`
  - **Changes:**
    - "filters by manager role (non-admin slugs)" test (lines 216-222): currently expects `staffUser.id` + `noGroupUser.id` for `roleFilter: "manager"`. After the fix, "manager" matches `%admin%` — update the test fixture/provisioning so the expected users have admin-slugged groups (academy_admin). Users with only staff_default slugs will NO LONGER match the "manager" filter.
    - "filters by admin role" test (lines 204-214): verify it still passes (unchanged behavior — still matches `%admin%`)
    - Metrics test (lines 262-272): verify `totalAdmin` assertion — now includes both admin-created and manager-created users
    - Use `runInRollback` wrapper for all DB tests (per AGENTS.md)
    - Use `entity-setup.ts` helpers for test data creation (NEVER query seed data)
    - Use try/catch helper pattern (NEVER `expect(...).rejects.toThrow()` inside `runInRollback`)
  - **Run test:** `bun run scripts/run-test/run-test.ts backend/db/test/repo/teachers/staff-profile.test.ts`
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
  - **Applicable instructions:** `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - _Requirements: REQ-6 (Repository tests updated)_

  - [x] 14.QL **Quality Loop**: Per-file verification on `backend/db/test/repo/teachers/staff-profile.test.ts`
    - Run: `bun run scripts/health/sub-loop.ts backend/db/test/repo/teachers/staff-profile.test.ts --lifecycle codescene`

  - [x] 14.SR **Semantic Review**: Agent self-review
    - [x] No read-then-write without atomicity (DB tests use `runInRollback` — OK)
    - [x] All `tx` passed to ALL repository methods inside transactions
    - [x] No `expect(...).rejects.toThrow()` inside `runInRollback`
    - [x] No seed data queries — uses `entity-setup.ts` helpers

  - [x] 14.IV **Instruction Verification**: Read & validate against rule files

- [x] 15. Update GraphQL onboarding test
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `frontend/common/graphql/test/teachers/manager-onboarding.test.ts`
  - **Changes:**
    - "Super Admin can create manager with admin type" test (lines 68-85): change `ManagerAccountType.Admin` → `ManagerAccountType.Manager`, verify `assignedGroupSlug` is still `"academy_admin"`
    - "Super Admin can create manager with manager type" test (lines 87-102): update to use `ManagerAccountType.Supervisor` (or remove if redundant with the supervisor test), verify `assignedGroupSlug`
    - Update input builders to not pass `accountType: ManagerAccountType.Admin`
  - **Run test:** Requires dev server — `bun run test:graphql` (or `bun run scripts/run-test/run-test.ts`)
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/frontend/common/graphql/test/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
  - **Applicable instructions:** `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - _Requirements: REQ-6 (GraphQL onboarding tests updated)_

  - [x] 15.QL **Quality Loop**: Per-file verification on `frontend/common/graphql/test/teachers/manager-onboarding.test.ts`
    - Run: `bun run scripts/health/sub-loop.ts frontend/common/graphql/test/teachers/manager-onboarding.test.ts --lifecycle codescene`

  - [x] 15.SR **Semantic Review**: Agent self-review
    - [x] No dead branches
    - [x] Enums imported as values at runtime (test uses `ManagerAccountType.Manager`, `ManagerAccountType.Supervisor`)
    - [x] All mutation arguments covered (Rule 11: both meaningful non-null and null optionals tested)

  - [x] 15.IV **Instruction Verification**: Read & validate against rule files

- [x] 16. Update GraphQL manager directory test
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **File:** `frontend/common/graphql/test/teachers/manager-directory-graphql.test.ts`
  - **Changes:**
    - Line 58: change `ManagerAccountType.Admin` → `ManagerAccountType.Manager` for `adminMgr` fixture (or restructure test fixtures to use only `Manager` account type)
    - Update assertions that check `roleSlug === "staff_default"` → `"academy_admin"` (around line 145 area)
    - Verify `provisionTestManager` helper needs no code change (parameterized)
  - **Run test:** `bun run test:graphql`
  - **Applicable AGENTS.md:** `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
  - **Applicable instructions:** `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - _Requirements: REQ-6 (GraphQL directory tests updated)_

  - [x] 16.QL **Quality Loop**: Per-file verification on `frontend/common/graphql/test/teachers/manager-directory-graphql.test.ts`
    - Run: `bun run scripts/health/sub-loop.ts frontend/common/graphql/test/teachers/manager-directory-graphql.test.ts --lifecycle codescene`

  - [x] 16.SR **Semantic Review**: Agent self-review
    - [x] Enums imported as values at runtime
    - [x] No dead branches in test logic

  - [x] 16.IV **Instruction Verification**: Read & validate against rule files

### Phase H: Validation & Knowledge Propagation

- [x] 17. Run full quality gate and baseline comparison
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **Commands:**
    ```bash
    bun tsgo           # Verify no type errors from removed enum value
    bun run lint        # Verify no lint errors
    bun biome:check     # Formatting
    bun quality-gate    # Full progressive gate (tsgo → oxlint → biome → lint → duplicates → codescene → sonar)
    ```
  - **Baseline comparison:**
    - Compare current tsgo errors vs `/tmp/baseline-tsgo.txt`
    - Compare current biome warnings vs `/tmp/baseline-biome.txt`
    - Document any NEW errors introduced (should be 0)
  - **Deferred items enforcement (BLOCKING):**
    ```bash
    grep -c "❌\|⚠️" .ai/plans/manager-role-permissions-fix/deferred-items.md
    # Expected: 0 — if >0, task is BLOCKED
    ```
  - Update all deferred items D1-D3 → ✅ Done in `deferred-items.md` with verification references
  - Write outcome file: `.ai/plans/manager-role-permissions-fix/outcome/17-quality-gate-outcome.md`
  - _Requirements: REQ-0 (Execution Protocol)_

- [x] 18. Permission seed audit
  - Read all existing files in `.ai/plans/manager-role-permissions-fix/outcome/`
  - **Verification (no code changes expected — investigation confirmed exclusions are already in place):**
    - Verify `academy_admin` group in seed SQL files contains all operational permissions from the todo's "Included" list:
      - teachers, students, parents, schedules, sessions, billing, invoices, resources, complaints, suggestions, reports, lesson_reports, credits, teacher_dues, quotas, subjects, categories, notes, whatsapp.view, meeting_configs
    - Verify `academy_admin` group does NOT contain:
      - `permission_groups.manage`, `permission_groups.assign`
      - `profile.staff_permissions.edit_own`, `profile.staff_permissions.edit_other`
      - `settings.edit_env`
      - `staff.create`, `staff.edit`
    - Verify `permission_groups.assign` and `staff.create`/`staff.edit` are super-admin-only (granted to `super_admin` group only, not `academy_admin`)
  - **Source files:**
    - `backend/db/migration/3-system_permissions_and_groups.sql` lines 1292-1363 (academy_admin grants)
    - `backend/drizzle/20260815025626_custom_3-system_permissions_and_groups/migration.sql` lines 1323-1394
  - Document findings in outcome file — if any permission is missing or present when it should be excluded, create a new task to fix the seed SQL
  - Write outcome file: `.ai/plans/manager-role-permissions-fix/outcome/18-seed-audit-outcome.md`
  - _Requirements: REQ-2 (Permission audit confirms all-ops-except-permission-control)_

- [x] 19. Knowledge Propagation & Documentation
  - Read all outcome files in `.ai/plans/manager-role-permissions-fix/outcome/` to synthesize all learnings
  - **Domain:** Auth / permissions → `docs/auth/` subdirectory
  - **Create canonical reference doc:** `docs/auth/manager-role-mapping.md`
    - Document the `ManagerAccountType` → `SystemPermissionGroupSlug` mapping pattern
    - Document the `academy_admin` group name convention (JSONB `{ar, en}`)
    - Document the `resolveRoleCondition` filter pattern for role-based directory queries
    - Document the i18n label cascade (group name → profile header, permissions chips; i18n bucket → directory grid)
  - **Update layer AGENTS.md files** (layer-specific rules + one-line doc reference):
    - `backend/enum/AGENTS.md` — add rule: `ManagerAccountType` enum maps account types to permission group slugs; `manager` → `ACADEMY_ADMIN`, `supervisor` → `SUPERVISOR_DEFAULT`. See `docs/auth/manager-role-mapping.md`.
    - `backend/services/AGENTS.md` — add rule: `resolveTargetGroupSlug` is the single mapping function from `ManagerAccountType` to `SystemPermissionGroupSlug`. See `docs/auth/manager-role-mapping.md`.
    - `backend/db/repo/AGENTS.md` — add rule: `resolveRoleCondition` maps `roleFilter` values to `ilike` patterns on `permission_groups.slug`. `"admin"` and `"manager"` both match `%admin%`; `"supervisor"` matches `%supervisor%`. See `docs/auth/manager-role-mapping.md`.
  - **Update root `AGENTS.md`** Important References section with: `- docs/auth/manager-role-mapping.md - Manager role mapping & permission group slug convention`
  - **Run global check:** `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified AGENTS.md file
  - Write outcome file: `.ai/plans/manager-role-permissions-fix/outcome/19-knowledge-propagation-outcome.md`
  - Update progress: Mark task 19 as `[x]`
  - _Requirements: Knowledge propagation protocol_

## Files Modified Summary

| # | File | Change Type | Phase |
|---|------|-------------|-------|
| 1 | `backend/enum/users/account-type.enum.ts` | Edit — remove `admin` enum value | A |
| 2 | `backend/services/staff/manager-onboarding.service.ts` | Edit — `manager` → `ACADEMY_ADMIN` | A |
| 3 | `backend/db/repo/teachers/staff-profile.repository.ts` | Edit — `roleFilter:"manager"` → `%admin%` | B |
| 4 | `backend/drizzle/<new>/migration.sql` | Create — UPDATE `academy_admin` group name | C |
| 5 | `backend/db/migration/3-system_permissions_and_groups.sql` | Edit — update seed name for consistency | C |
| 5 | `backend/drizzle/20260815025626_custom_3-system_permissions_and_groups/migration.sql` | Edit — update name for consistency | C |
| 6 | `shared/locale/types/dashboard/staff/onboarding.ts` | Edit — remove `admin` keys from type | D |
| 7 | `shared/locale/ar/dashboard/staff/onboarding.ts` | Edit — remove `admin`, update `manager` | D |
| 8 | `shared/locale/en/dashboard/staff/onboarding.ts` | Edit — remove `admin`, update `manager` | D |
| 9 | `shared/locale/ar/dashboard/staff/directory.ts` | Edit — update `roles.admin` label | D |
| 10 | `shared/locale/en/dashboard/staff/directory.ts` | Edit — update `roles.admin` label | D |
| 11 | `frontend/common/views/dashboard/staff/onboarding/SystemAccessSection.tsx` | Edit — remove `Admin` option | E |
| 12 | `frontend/common/graphql/generated/schema.graphql` | Auto-regenerated | F |
| 12 | `frontend/common/graphql/generated/gql/graphql-types.ts` | Auto-regenerated | F |
| 13 | `backend/services/staff/test/manager-onboarding.service.test.ts` | Edit — update/delete tests | G |
| 14 | `backend/db/test/repo/teachers/staff-profile.test.ts` | Edit — update role filter tests | G |
| 15 | `frontend/common/graphql/test/teachers/manager-onboarding.test.ts` | Edit — update/delete tests | G |
| 16 | `frontend/common/graphql/test/teachers/manager-directory-graphql.test.ts` | Edit — update tests | G |

## Task Execution Checklist

### Before Starting
- [x] Requirements and design documents are reviewed
- [x] Dependencies are identified and available
- [x] Task scope and acceptance criteria are clear

### Before Completion
- [x] All acceptance criteria are met
- [x] Tests pass and coverage is adequate
- [x] **Quality Loop passed** (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` exit code 0)
- [x] **Instruction Verification passed**
- [x] **Semantic Review passed**
- [x] No regressions in existing functionality
- [x] Outcome file written to `.ai/plans/manager-role-permissions-fix/outcome/`
- [x] Task marked as `[x]` in this file

### Plan Completion
- [x] All deferred items resolved (0 ❌ or ⚠️ in `deferred-items.md`)
- [x] Baseline comparison shows no new errors introduced
- [x] Knowledge propagation task (19) completed
