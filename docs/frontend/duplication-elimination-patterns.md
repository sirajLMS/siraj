# Duplication Elimination Patterns

This document consolidates the patterns used to eliminate code duplication in the siraj codebase, based on the duplications plan (`.ai/plans/duplications/`).

## Pattern 1: Canonical Source with Direct Imports (Deletion)

**When to use:** Two or more files contain identical or near-identical code, and one is clearly the canonical location.

**Process:**
1. Designate the canonical file (prefer `shared/` layer for cross-layer types, `common/` for frontend-shared)
2. Delete the duplicate file(s) entirely — NO re-exports
3. Update all importers to use the canonical path via barrel imports
4. Verify with `bun check:duplicates`

**Example (Task 1.7):**
- Canonical: `common/components/ui/dataGrid/types/appDataGridShared.types.ts`
- Deleted: `backend/types/datagrid-types/appDataGridShared.types.ts`
- Importers updated to: `@/components/ui/dataGrid/types`

## Pattern 2: Shared Scaffold with Slot Props

**When to use:** Same UI component exists in common/desktop/mobile tiers with minor visual variations.

**See:** `docs/frontend/ui-shared-scaffold-pattern.md`

## Pattern 3: Shared Types Extraction

**When to use:** Identical type definitions exist in multiple layers (backend + frontend).

**Process:**
1. Create the type in `shared/types/` (accessible from both backend and frontend)
2. Update both layers to import from `shared/types/`
3. Delete the duplicate type definitions

**Example (Task 1.8):**
- Created: `shared/types/notification-alerts.types.ts`
- Updated: `backend/types/notifications/...` and `frontend/common/views/.../types/...`

## Pattern 4: Service Consolidation

**When to use:** Utility functions in `backend/lib/` duplicate service-layer logic in `backend/services/`.

**Process:**
1. Designate the service file as canonical
2. Delete the `lib/` duplicate
3. Update importers to use `@/backend/services/<module>` barrel

**Example (Task 2.18):**
- Canonical: `backend/services/auth/permissions.service.ts`
- Deleted: `backend/lib/auth/permissions.ts`

## Pattern 5: Locale Namespace Migration

**When to use:** Monolithic locale files (`profile.ts`, `meeting-config.ts`) should be split into sub-module directories.

**See:** `docs/i18n/locale-namespace-migration.md`

## Pattern 6: jscpd Ignore for Test Artifacts

**When to use:** Duplicated code is in test/development artifacts (stories, seeds, migrations) that mirror production architecture.

**Process:**
1. Add glob pattern to `.jscpd.json` `ignore` array
2. Document the rationale in the plan outcome

**Example (Task 3.6):**
- Added `**/*.stories.tsx` to ignore — 138 story clones excluded

## Anti-Patterns

- DO NOT use re-exports as a shortcut — they hide duplication and create import ambiguity
- DO NOT delete without verifying all importers first — use `grep -rn` to find all imports
- DO NOT create scaffolds for trivial components (<50 lines)
- DO NOT ignore cross-layer import rules (frontend must not import from backend)

## Verification

After any duplication elimination:
1. `bun tsgo` — zero new errors
2. `bun biome:check` — zero warnings
3. `bun run scripts/lint-service.ts` — zero lint errors
4. `bun check:duplicates` — clone count reduced

## Related Documents

- `.ai/plans/duplications/` — the plan that established these patterns
- `docs/frontend/ui-shared-scaffold-pattern.md`
- `docs/backend/shared-types-pattern.md`
- `docs/i18n/locale-namespace-migration.md`
- `docs/testing/shared-test-runner.md`
