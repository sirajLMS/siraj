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

## Pattern 7: View Component Scaffold in `__shared__/` Directory

**When to use:** Same view component exists in desktop/mobile tiers with shared presentation logic but different layout/styling. Also applies to within-tier duplications (e.g., two desktop dialogs sharing form structure).

**Process:**
1. Create a `__shared__/` directory alongside the component variants
2. Extract a `<ComponentName>Shared.tsx` scaffold with all shared presentation logic
3. Use slot props for tier-specific variations (components, sx styles, layout options)
4. Refactor each variant to delegate to the scaffold with its specific slots

**Example (Phases 2-3, 30 scaffolds created):**
- View scaffolds: `frontend/common/views/dashboard/.../__shared__/<Component>Shared.tsx`
- Desktop variant: `frontend/desktop/views/dashboard/.../<Component>.desktop.tsx` (thin wrapper)
- Mobile variant: `frontend/mobile/views/dashboard/.../<Component>.mobile.tsx` (thin wrapper)

**Slot prop patterns discovered:**
- `CardComponent` slot for card wrapping (BaseCard vs MobileBaseCard)
- `anchor` + `paperSx` for Drawer variants (right/bottom anchoring)
- Render functions for type-incompatible slots (avoids ComponentType contravariance)
- Config objects for purely visual differences (spacing, column widths, typography variants)

## Pattern 8: Within-Common Utility Consolidation

**When to use:** Two utility files in `frontend/common/` share logic but serve different domains.

**Process:**
1. Extract shared logic to a `shared-<domain>-logic.ts` module
2. Refactor both files to import and use the shared module
3. Remove duplicated code from both files

**Example (Task 3.2):**
- Created: `frontend/common/utils/excel-export/shared-export-logic.ts`
- Refactored: `parent-directory-export.ts`, `tracking-export.ts`, `report-export.ts`
- Result: 4 clones / 810 tokens eliminated

## Pattern 9: Loading Skeleton Consolidation

**When to use:** Multiple profile/page types have near-identical loading skeletons.

**Process:**
1. Create a single config-driven skeleton component
2. Pass config (row count, heights, etc.) as props
3. Delete per-type skeleton files

**Example (Task 3.3):**
- Created: shared `ProfileLoadingSkeleton` (config-driven)
- Deleted: `ParentProfileLoadingSkeleton.tsx`, `StaffProfileLoadingSkeleton.tsx`, `TeacherProfileLoadingSkeleton.tsx`

## Pattern 10: Within-Tier Shared Module Extraction

**When to use:** Two components in the same tier (both desktop or both mobile) share logic.

**Process:**
1. Create a shared module in the same tier (e.g., `__shared__/` or `components/ui/display/.../__shared__/`)
2. For cross-tier duplicates (same components in both desktop AND mobile), create a shared scaffold in `common/`
3. Refactor both consumers to use the shared module

**Example (Task 3.4):**
- Desktop payment catalog grids: shared `catalogGridShared.tsx`
- Desktop subject dialogs: shared `subjectFormDialogShared.tsx`
- Profile links (both tiers): enhanced existing `ProfileLinkBase.tsx` in common

## CRITICAL: Circular Dependency Prevention

**NEVER** import through barrel `index.ts` re-exports when the importing and imported components live in the same barrel. This causes TDZ (Temporal Dead Zone) errors at runtime.

**Wrong:**
```typescript
import { MobilePhoneDisplay } from "@/frontend/mobile/components/ui/display";
// If the barrel exports paymentMethod/ before phoneDisplay/, MobilePhoneDisplay
// won't be initialized yet when PaymentMethodDisplay tries to use it → TDZ error
```

**Right:**
```typescript
import { MobilePhoneDisplay } from "@/frontend/mobile/components/ui/display/phoneDisplay/phoneDisplay.mobile";
```

Always use **direct file paths** for scaffold imports to prevent circular dependencies.

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
- `.ai/plans/duplications-phase2/` — the continuation plan that established view component scaffold patterns
- `docs/frontend/ui-shared-scaffold-pattern.md`
- `docs/backend/shared-types-pattern.md`
- `docs/i18n/locale-namespace-migration.md`
- `docs/testing/shared-test-runner.md`
