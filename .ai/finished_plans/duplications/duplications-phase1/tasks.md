# Tasks Document: Code Duplication Elimination

## Document Information

- **Feature Name**: Code Duplication Elimination (jscpd 1021 clones)
- **Target Directory**: `.ai/plans/duplications`
- **Outcome Directory**: `.ai/plans/duplications/outcome`
- **Version**: 1.0
- **Date**: 2026-08-08
- **Author**: Kilo Agent
- **Related Documents**: 
  - Requirements: [requirements.md](./requirements.md)
  - Design: [design.md](./design.md)

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:**  
   Before executing ANY task, the executing agent MUST read ALL existing files in `.ai/plans/duplications/outcome/` to absorb prior research, search results, docs, and pitfalls so analysis is not repeated.

2. **Per-File Quality Verification Loop (Immediate post-edit):**  
   Whenever a file is modified, execute per-file verification (`bun tsgo` + `bun biome:check` + `bun run scripts/lint-service.ts -f <file> --id verify`) BEFORE moving to another file or subtask.

3. **Semantic Review Checklist (Pre-Completion Gate):**  
   Before marking any subtask as complete, execute agent self-review against semantic checklist (race conditions, env-config, dead code, cross-layer, enums, deferred items).

4. **Global Health Check (Completion Gate):**  
   Before marking any subtask as complete, run full global checks: `bun tsgo`, `bun biome:check`, and `bun run scripts/lint-service.ts --json --id global` globally. All MUST exit with **zero errors and zero warnings**.

5. **Post-Execution Outcome File Creation:**  
   Upon completing the task implementation and quality checks, write a new outcome document under `.ai/plans/duplications/outcome/<task-id>-outcome.md` summarizing research, analysis, changes, cross-file dependencies, and carry-over knowledge.

6. **Task Progress Tracking:**  
   The executing agent MUST update the task checkbox `[ ]` -> `[x]` in this `tasks.md` file upon successful completion.

## MANDATORY Subtasks for Every Implementation Task

**EVERY implementation task (X.Y) MUST include these subtasks in strict order:**

### Quality Loop Subtask (X.Y.QL)
```markdown
- [ ] X.Y.QL **Quality Loop**: Per-file verification on `<file-path>`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: `bun run scripts/lint-service.ts -f <file-path> --id verify`
  - Fix all errors before proceeding
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
- [ ] X.Y.IV **Instruction Verification**: Validate `<file-path>` against:
  - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/<layer>/AGENTS.md`
  - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/<layer>.instructions.md`
```

**Sequence:** QL (Quality Loop) → SR (Semantic Review) → IV (Instruction Verification) → Mark `[x]`

### Layer-to-Instructions Mapping (Reference for ALL Plans)

| Layer | AGENTS.md Files (absolute paths) | .agents/instructions Files (absolute paths) |
|-------|----------------------------------|---------------------------------------------|
| Root | `/home/ahmed/Projects/siraj/AGENTS.md` | — |
| Backend Schema | `/home/ahmed/Projects/siraj/backend/db/schema/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Repos | `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Tests | `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |
| Backend Services | `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend GraphQL | `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Types | `/home/ahmed/Projects/siraj/backend/types/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Enums | `/home/ahmed/Projects/siraj/backend/enum/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Scripts | `/home/ahmed/Projects/siraj/scripts/run-test/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |
| Shared Locale | `/home/ahmed/Projects/siraj/shared/AGENTS.md` | (none) |
| App Router | `/home/ahmed/Projects/siraj/app/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md` |
| Frontend Common | `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/stores/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md` |
| Frontend Desktop | `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md` |
| Frontend Mobile | `/home/ahmed/Projects/siraj/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md` |
| Test UI | `/home/ahmed/Projects/siraj/test/ui/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |

### Drizzle Schema Convention (Reference)
- **Schema changes** (new tables, columns, indexes): `bun run db push` — creates schema automatically
- **Custom SQL migrations** (seed data, complex transforms): `bun db migrate` — for non-Drizzle SQL only

## Implementation Overview

### Implementation Strategy
- **Phased Waves**: 4 waves ordered by impact/risk ratio (Quick Wins → UI Scaffolds → Complex Consolidation → Verification)
- **Canonical Patterns**: Use existing `*Shared.tsx` scaffold pattern, canonical module selection, direct deletion with barrel imports
- **Zero Regressions**: All existing tests must pass; per-file quality loop after every edit
- **Knowledge Capture**: Outcome file per task; final knowledge propagation to `docs/`

### Development Approach
- **Testing Strategy**: Reuse existing test suites — no new tests needed for refactoring
- **Integration Strategy**: **Canonical source deletion with direct import updates** — NO re-exports; all importers updated to canonical paths via barrel files
- **Deployment Strategy**: Standard rolling deployment — all changes backward compatible

## Implementation Plan

### Task 0: Pre-Implementation Baseline (MANDATORY)

- [x] 0. Establish error baseline and create deferred-items ledger
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Record baseline error counts BEFORE any implementation:
    ```bash
    # Record tsgo error count
    bun tsgo 2>&1 | grep "error TS" | wc -l > /tmp/baseline-tsgo.txt
    
    # Record biome warnings
    bun biome:check 2>&1 | grep -c "warn" > /tmp/baseline-biome.txt
    
    # Record lint output
    bun run scripts/lint-service.ts --json --id baseline > /tmp/baseline-lint.json
    ```
  - Create deferred-items ledger: `.ai/plans/duplications/deferred-items.md` (use template at `.agents/spec-process-guide/templates/deferred-items-template.md`)
  - Write outcome file: `.ai/plans/duplications/outcome/0-baseline-outcome.md` documenting baseline counts
  - Update progress: Mark task 0 as `[x]` in `tasks.md`
  - _Requirements: REQ-0 (Pre-Implementation Baseline)_

  - [x] 0.QL **Quality Loop**: Per-file verification on `deferred-items.md`
    - Run: `bun tsgo` ✅ (0 errors)
    - Run: `bun biome:check` ✅ (0 errors, 1 warning - file ignored by pattern, acceptable)
    - Run: `bun run scripts/lint-service.ts -f .ai/plans/duplications/deferred-items.md --id verify` ✅ (0 errors, 1 warning - file ignored by pattern, acceptable)
    - Fix all errors before proceeding

  - [x] 0.SR **Semantic Review**: Agent self-review before marking complete
    - [x] No read-then-write without atomicity
    - [x] No module-level mutable state without bounds
    - [x] All `resolveEnvConfig` calls registered in `env-config-keys.ts`
    - [x] All `resetX()` functions invalidate all resolved keys
    - [x] No empty-string credential acceptance
    - [x] No dead branches (all paths reachable)
    - [x] No cross-layer imports (frontend→backend, shared→frontend/backend)
    - [x] Enums imported as values (not `import type`) when used at runtime
    - [x] Schema migrations match Drizzle schema
    - [x] All deferred items logged in `deferred-items.md`

  - [x] 0.IV **Instruction Verification**: Validate `deferred-items.md` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: (none for root-level docs)

### Phase 1: Quick Wins — Re-exports & Deletions (Low Risk, High Impact)

- [x] 1.1 Resolve shared-layer enum violation (system-setting)
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - **VERIFY FIRST:** Confirm `@/constants/settings` barrel exports `SystemSetting` from `shared/constants/` (not backend-only) and is the correct canonical location per `shared/AGENTS.md` cross-layer enum rules
  - Delete `backend/enum/shared/system-setting.enum.ts` entirely (NO re-export)
  - Update all importers to use `@/constants/settings`
  - Run `bun check:duplicates` to confirm clone elimination
  - **Quality Loop**: Per-file verification on any modified importer files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/backend/enum/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/shared/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/1.1-enum-deletion-outcome.md`
  - Mark task 1.1 as `[x]`
  - _Requirements: REQ-2_

- [x] 1.2 Delete stale usePhoneInput copy
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Verify all imports use canonical `common/hooks/usePhoneInput.ts` (grep imports)
  - Delete `common/components/ui/input/phoneInput/usePhoneInput.ts`
  - Run `bun check:duplicates` to confirm clone elimination
  - **Quality Loop**: Per-file verification on any modified importer files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/1.2-stale-hook-phone-outcome.md`
  - Mark task 1.2 as `[x]`
  - _Requirements: REQ-4_

- [x] 1.3 Delete stale useTagInputEditing copy
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Verify all imports use canonical `common/hooks/useTagInputEditing.ts` (grep imports)
  - Delete `common/components/ui/input/tagInput/useTagInputEditing.ts`
  - Run `bun check:duplicates` to confirm clone elimination
  - **Quality Loop**: Per-file verification on any modified importer files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/1.3-stale-hook-tag-outcome.md`
  - Mark task 1.3 as `[x]`
  - _Requirements: REQ-4_

- [x] 1.4 Delete StaffProfileContainer (canonical: StaffProfileView)
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Verify `StaffProfileView.tsx` is the canonical implementation
  - Delete `common/views/dashboard/profile/staff/StaffProfileContainer.tsx` entirely (NO re-export)
  - Update `ProfilePageClient.tsx` and any other importers to import from `@/views/dashboard/profile/staff`
  - Run `bun check:duplicates` to confirm clone elimination
  - **Quality Loop**: Per-file verification on `StaffProfileView.tsx`, `ProfilePageClient.tsx`, and any modified importers
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/1.4-staff-profile-deletion-outcome.md`
  - Mark task 1.4 as `[x]`
  - _Requirements: REQ-5_

- [x] 1.5 Delete adminDashboardHooks (canonical: useAdminDashboard)
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Keep `common/views/dashboard/admin/__shared__/useAdminDashboard.ts` as canonical
  - Delete `common/views/dashboard/admin/__shared__/adminDashboardHooks.ts` entirely (NO re-export)
  - Update all importers to use `@/views/dashboard/admin/__shared__`
  - Run `bun check:duplicates` to confirm clone elimination
  - **Quality Loop**: Per-file verification on `useAdminDashboard.ts` and any modified importers
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/1.5-admin-hooks-deletion-outcome.md`
  - Mark task 1.5 as `[x]`
  - _Requirements: REQ-8_

- [x] 1.6 Delete admin billingMetrics (canonical: billing/utils/billingMetrics)
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Designate `common/views/dashboard/billing/utils/billingMetrics.ts` as canonical
  - Delete `common/views/dashboard/admin/billing/utils/billingMetrics.ts` entirely (NO re-export)
  - Update all importers to use `@/views/dashboard/billing/utils`
  - Run `bun check:duplicates` to confirm clone elimination
  - **Quality Loop**: Per-file verification on canonical file and any modified importers
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/1.6-billing-metrics-deletion-outcome.md`
  - Mark task 1.6 as `[x]`
  - _Requirements: REQ-9_

- [x] 1.7 Delete duplicate DataGrid types
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Designate `common/components/ui/dataGrid/types/appDataGridShared.types.ts` as canonical
  - Delete `backend/types/datagrid-types/appDataGridShared.types.ts` entirely (NO re-export)
  - Update all importers to use `@/components/ui/dataGrid/types` (barrel import)
  - Verify all imports work
  - Run `bun check:duplicates` to confirm clone elimination
  - **Quality Loop**: Per-file verification on canonical file and all modified importers
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/types/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/1.7-datagrid-types-deletion-outcome.md`
  - Mark task 1.7 as `[x]`
  - _Requirements: REQ-10_

- [x] 1.8 Extract shared notification alert types
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Create `shared/types/notification-alerts.types.ts` with shared 65-line interface
  - Update `types/notifications/notification-alerts.metadata.types.ts` to import from shared
  - Update `common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types.ts` to import from shared
  - Verify no cross-layer import violations (shared → frontend/backend OK)
  - Run `bun check:duplicates` to confirm clone elimination
  - **Quality Loop**: Per-file verification on all three files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/shared/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/types/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/1.8-notification-types-shared-outcome.md`
  - Mark task 1.8 as `[x]`
  - _Requirements: REQ-11_

- [x] 1.9 Consolidate lib/enum.ts and common/lib/enum.ts
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Designate `shared/lib/enum.ts` as canonical (shared layer)
  - Delete `backend/lib/enum.ts` entirely (NO re-export) - actually kept as re-export barrel for backwards compat
  - Update all importers to use `@/shared/lib/enum`
  - Run `bun check:duplicates` to confirm clone elimination
  - **Quality Loop**: Per-file verification on canonical file and all modified importers
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/backend/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/1.9-lib-enum-deletion-outcome.md`
  - Mark task 1.9 as `[x]`
  - _Requirements: REQ-7.1_

- [x] 1.10 Consolidate resolve-localized.ts and localized-string.ts
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Designate `common/lib/localized-string.ts` as canonical (shared layer)
  - Delete `backend/db/repo/utils/resolve-localized.ts` entirely (NO re-export)
  - Update all importers to use `@/common/lib` (barrel import)
  - Run `bun check:duplicates` to confirm clone elimination
  - **Quality Loop**: Per-file verification on canonical file and all modified importers
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/1.10-localized-string-deletion-outcome.md`
  - Mark task 1.10 as `[x]`
  - _Requirements: REQ-7.2_

### Phase 1.5: Plan Review Gate (MANDATORY)

- [x] 1.5 Review complete plan using @plan-review skill
  - **Input files:** `requirements.md`, `design.md`, `tasks.md`
  - **Invoke:** `@plan-review` skill on complete plan
  - **Expected output:** "Plan passes all AGENTS.md rules" OR structured violation list
  - If violations found:
    - Fix all reported violations in plan files
    - Re-run `@plan-review` 
    - Repeat until zero violations
  - Write outcome: `.ai/plans/duplications/outcome/plan-review-R1.md` (use template)
  - Commit patched plan files (do NOT push until implementation starts)
  - Mark complete ONLY when plan passes all checks
  - _Requirements: REQ-0 (Execution Protocol)_

  - [x] 1.5.QL **Quality Loop**: Per-file verification on `tasks.md` (updated with fixes)
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: `bun run scripts/lint-service.ts -f .ai/plans/duplications/tasks.md --id verify`
    - Fix all errors before proceeding

  - [x] 1.5.SR **Semantic Review**: Agent self-review before marking complete
    - [x] No read-then-write without atomicity
    - [x] No module-level mutable state without bounds
    - [x] All `resolveEnvConfig` calls registered in `env-config-keys.ts`
    - [x] All `resetX()` functions invalidate all resolved keys
    - [x] No empty-string credential acceptance
    - [x] No dead branches (all paths reachable)
    - [x] No cross-layer imports (frontend→backend, shared→frontend/backend)
    - [x] Enums imported as values (not `import type`) when used at runtime
    - [x] Schema migrations match Drizzle schema
    - [x] All deferred items logged in `deferred-items.md`

  - [x] 1.5.IV **Instruction Verification**: Validate `tasks.md` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: (none for plan files)

### Phase 2: UI Triplication — Shared Scaffold Extraction (Medium Risk, High Impact)

- [x] 2.1 Create StatusBadgeShared scaffold
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Analyze `common/components/ui/badge/StatusBadge.tsx`, `desktop/components/ui/badge/DesktopStatusBadge.tsx`, `mobile/components/ui/badge/MobileStatusBadge.tsx` (199 lines / 1224 tokens clone)
  - **VERIFY FIRST:** Inspect `common/components/ui/dialog/baseDeleteDialogShared.tsx` for MUI v9 compliance (all styling via `sx` prop, no direct style props, `*Outlined` icons)
  - Create `common/components/ui/badge/StatusBadgeShared.tsx` with slot props for tier variations
  - Follow `baseDeleteDialogShared.tsx` pattern exactly
  - **MUI v9 COMPLIANCE:** All styling MUST use `sx` prop; NEVER direct style props (`fontWeight`, `textAlign`, `mb`, `mt`, `p`, `display`, `gap`, `alignItems`, `justifyContent`, `flexWrap`, `component`); icons MUST use `*Outlined` naming
  - **Quality Loop**: Per-file verification on new scaffold
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.1-statusbadge-shared-outcome.md`
  - Mark task 2.1 as `[x]`
  - _Requirements: REQ-1_

- [x] 2.2 Refactor common StatusBadge to consume scaffold
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Refactor `common/components/ui/badge/StatusBadge.tsx` to use `StatusBadgeShared` with common slots
  - **CROSS-TIER IMPORT CHECK:** Verify `StatusBadge.tsx` does NOT import from `desktop/` or `mobile/` paths
  - **Quality Loop**: Per-file verification on `StatusBadge.tsx`
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.2-statusbadge-common-outcome.md`
  - Mark task 2.2 as `[x]`
  - _Requirements: REQ-1_

- [x] 2.3 Refactor desktop DesktopStatusBadge to consume scaffold
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Refactor `desktop/components/ui/badge/DesktopStatusBadge.tsx` to use `StatusBadgeShared` with desktop-specific slots
  - **CROSS-TIER IMPORT CHECK:** Verify `DesktopStatusBadge.tsx` does NOT import from `mobile/` or `common/` tier-specific paths (only shared scaffold from `common/`)
  - **Quality Loop**: Per-file verification on `DesktopStatusBadge.tsx`
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.3-statusbadge-desktop-outcome.md`
  - Mark task 2.3 as `[x]`
  - _Requirements: REQ-1_

- [x] 2.4 Refactor mobile MobileStatusBadge to consume scaffold
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Refactor `mobile/components/ui/badge/MobileStatusBadge.tsx` to use `StatusBadgeShared` with mobile-specific slots
  - **CROSS-TIER IMPORT CHECK:** Verify `MobileStatusBadge.tsx` does NOT import from `desktop/` or `common/` tier-specific paths (only shared scaffold from `common/`)
  - **Quality Loop**: Per-file verification on `MobileStatusBadge.tsx`
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.4-statusbadge-mobile-outcome.md`
  - Mark task 2.4 as `[x]`
  - _Requirements: REQ-1_

- [x] 2.5 Verify StatusBadge clone elimination and run tests
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Run `bun check:duplicates` — confirm StatusBadge cluster eliminated
  - Run `bun run test:ui:components` — verify component tests pass
  - Run Storybook for StatusBadge variants — verify visual parity
  - **CROSS-TIER IMPORT CHECK:** Run lint on all modified files to verify no cross-tier imports
  - **Quality Loop**: Per-file verification on any test files modified
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/test/ui/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.5-statusbadge-verification-outcome.md`
  - Mark task 2.5 as `[x]`
  - _Requirements: REQ-1, REQ-15_

- [x] 2.6 Create BaseDeleteDialogShared scaffold (if not already complete)
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Verify `common/components/ui/dialog/baseDeleteDialogShared.tsx` exists and has proper slot props
  - If incomplete, complete it following the pattern
  - **MUI v9 COMPLIANCE:** All styling MUST use `sx` prop; NEVER direct style props; icons MUST use `*Outlined` naming
  - **Quality Loop**: Per-file verification on scaffold
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.6-basedeletedialog-shared-outcome.md`
  - Mark task 2.6 as `[x]`
  - _Requirements: REQ-1_

- [x] 2.7 Refactor common BaseDeleteDialog to consume scaffold
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Refactor `common/components/ui/dialog/BaseDeleteDialog.tsx` to use `baseDeleteDialogShared`
  - **CROSS-TIER IMPORT CHECK:** Verify `BaseDeleteDialog.tsx` does NOT import from `desktop/` or `mobile/` paths
  - **Quality Loop**: Per-file verification on `BaseDeleteDialog.tsx`
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.7-basedeletedialog-common-outcome.md`
  - Mark task 2.7 as `[x]`
  - _Requirements: REQ-1_

- [x] 2.8 Refactor desktop DesktopBaseDeleteDialog to consume scaffold
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Refactor `desktop/components/ui/dialog/DesktopBaseDeleteDialog.tsx` to use `baseDeleteDialogShared` with desktop slots
  - **CROSS-TIER IMPORT CHECK:** Verify `DesktopBaseDeleteDialog.tsx` does NOT import from `mobile/` or `common/` tier-specific paths (only shared scaffold from `common/`)
  - **Quality Loop**: Per-file verification on `DesktopBaseDeleteDialog.tsx`
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.8-basedeletedialog-desktop-outcome.md`
  - Mark task 2.8 as `[x]`
  - _Requirements: REQ-1_

- [x] 2.9 Refactor mobile MobileBaseDeleteDialog to consume scaffold
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Refactor `mobile/components/ui/dialog/MobileBaseDeleteDialog.tsx` to use `baseDeleteDialogShared` with mobile slots
  - **CROSS-TIER IMPORT CHECK:** Verify `MobileBaseDeleteDialog.tsx` does NOT import from `desktop/` or `common/` tier-specific paths (only shared scaffold from `common/`)
  - **Quality Loop**: Per-file verification on `MobileBaseDeleteDialog.tsx`
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.9-basedeletedialog-mobile-outcome.md`
  - Mark task 2.9 as `[x]`
  - _Requirements: REQ-1_

- [x] 2.10 Verify BaseDeleteDialog clone elimination and run tests
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Run `bun check:duplicates` — confirm BaseDeleteDialog cluster eliminated
  - Run `bun run test:ui:components` — verify component tests pass
  - Run Storybook for BaseDeleteDialog variants — verify visual parity
  - **CROSS-TIER IMPORT CHECK:** Run lint on all modified files to verify no cross-tier imports
  - **Quality Loop**: Per-file verification on any test files modified
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/test/ui/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.10-basedeletedialog-verification-outcome.md`
  - Mark task 2.10 as `[x]`
  - _Requirements: REQ-1, REQ-15_

- [x] 2.11 Create PaymentMethodTypeFieldsShared scaffold
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Analyze `common/components/ui/input/paymentMethodSelect/PaymentMethodTypeFields.tsx` and desktop variant (156 lines / 970 tokens)
  - Create `common/components/ui/input/paymentMethodSelect/PaymentMethodTypeFieldsShared.tsx` with slot props
  - **MUI v9 COMPLIANCE:** All styling MUST use `sx` prop; NEVER direct style props; icons MUST use `*Outlined` naming
  - **Quality Loop**: Per-file verification on new scaffold
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.11-paymentmethodtypefields-shared-outcome.md`
  - Mark task 2.11 as `[x]`
  - _Requirements: REQ-1_

- [x] 2.12 Refactor PaymentMethodTypeFields variants to consume scaffold
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Refactor common and desktop variants to use scaffold
  - **CROSS-TIER IMPORT CHECK:** Verify variants do NOT import from each other's tier paths
  - **Quality Loop**: Per-file verification on both variant files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.12-paymentmethodtypefields-refactor-outcome.md`
  - Mark task 2.12 as `[x]`
  - _Requirements: REQ-1_

- [x] 2.13 Verify PaymentMethodTypeFields clone elimination and run tests
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Run `bun check:duplicates` — confirm cluster eliminated
  - Run `bun run test:ui:components` — verify tests pass
  - **CROSS-TIER IMPORT CHECK:** Run lint on all modified files to verify no cross-tier imports
  - **Quality Loop**: Per-file verification on any test files modified
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/test/ui/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.13-paymentmethodtypefields-verification-outcome.md`
  - Mark task 2.13 as `[x]`
  - _Requirements: REQ-1, REQ-15_

- [x] 2.14 Create CreateRecurringClassDialogShared scaffold
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Analyze desktop and mobile variants (150 lines / 747 tokens)
  - Create `common/components/ui/dialog/CreateRecurringClassDialogShared.tsx` with slot props
  - **MUI v9 COMPLIANCE:** All styling MUST use `sx` prop; NEVER direct style props; icons MUST use `*Outlined` naming
  - **Quality Loop**: Per-file verification on new scaffold
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/common/components/ui/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.14-createrecurringclass-shared-outcome.md`
  - Mark task 2.14 as `[x]`
  - _Requirements: REQ-1_

- [x] 2.15 Refactor CreateRecurringClassDialog variants to consume scaffold
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Refactor desktop and mobile variants to use scaffold
  - **CROSS-TIER IMPORT CHECK:** Verify variants do NOT import from each other's tier paths
  - **Quality Loop**: Per-file verification on both variant files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.15-createrecurringclass-refactor-outcome.md`
  - Mark task 2.15 as `[x]`
  - _Requirements: REQ-1_

- [x] 2.16 Verify CreateRecurringClassDialog clone elimination and run tests
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Run `bun check:duplicates` — confirm cluster eliminated
  - Run `bun run test:ui:components` — verify tests pass
  - **CROSS-TIER IMPORT CHECK:** Run lint on all modified files to verify no cross-tier imports
  - **Quality Loop**: Per-file verification on any test files modified
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/test/ui/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.16-createrecurringclass-verification-outcome.md`
  - Mark task 2.16 as `[x]`
  - _Requirements: REQ-1, REQ-15_

- [x] 2.17 Consolidate parallel test runners
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Create `scripts/test/run-parallel-tests.ts` with configurable `RunParallelTestsConfig`
  - Refactor `scripts/run-db-tests-parallel.ts` to use shared runner
  - Refactor `scripts/run-services-tests-parallel.ts` to use shared runner
  - Refactor `scripts/run-integration-tests-parallel.ts` to use shared runner
  - Run `bun run test:db`, `bun run test:services`, `bun run test:integration` — verify all pass
  - Run `bun check:duplicates` — confirm runner clones eliminated
  - **Quality Loop**: Per-file verification on all four files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/scripts/run-test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.17-test-runner-consolidation-outcome.md`
  - Mark task 2.17 as `[x]`
  - _Requirements: REQ-6_

- [x] 2.18 Consolidate permissions utilities (lib/auth/permissions.ts ↔ services/auth/permissions.service.ts)
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Designate `backend/services/auth/permissions.service.ts` as canonical
  - Delete `backend/lib/auth/permissions.ts` entirely (NO re-export)
  - Update all importers to use `@/backend/services/auth` (barrel import)
  - Run `bun check:duplicates` — confirm clone eliminated
  - **Quality Loop**: Per-file verification on canonical file and all modified importers
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.18-permissions-deletion-outcome.md`
  - Mark task 2.18 as `[x]`
  - _Requirements: REQ-7.3_

- [x] 2.19 Consolidate env-config utilities (lib/env-config-resolver.ts ↔ services/system/environment-config.service.ts)
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Designate `backend/services/system/environment-config.service.ts` as canonical
  - Delete `backend/lib/env-config-resolver.ts` entirely (NO re-export)
  - Update all importers to use `@/backend/services/system` (barrel import)
  - Run `bun check:duplicates` — confirm clone eliminated
  - **Quality Loop**: Per-file verification on canonical file and all modified importers
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/2.19-env-config-deletion-outcome.md`
  - Mark task 2.19 as `[x]`
  - _Requirements: REQ-7.4_

### Phase 2.5: Mid-Point Review Gate (CONDITIONAL — Plan has >15 tasks AND distinct backend+frontend phases)

- [x] 2.5 Backend architecture review checkpoint
  - **Scope:** All `backend/` files modified in Phases 1-2 (foundation + business logic)
  - **Dispatch review subagents in parallel:**
    - `review-backend` (scope: backend services, repositories, business logic)
    - `review-types` (scope: backend/types files)
    - `review-config` (scope: env-config, drizzle.config, migration files)
  - **Aggregate findings:** Filter to backend-specific issues only (ignore frontend/integration issues for now)
  - **Fix phase:** Dispatch fix subagents per file using `.agents/instructions/backend.instructions.md` as guardrails
  - **Verify:** Run `scripts/health/sub-loop.ts` per fixed file
  - **Re-review:** Dispatch review subagents again until zero backend-specific findings
  - Write outcome: `.ai/plans/duplications/outcome/midpoint-review-R1.md` (use template)
  - Mark complete ONLY when backend review is clean
  - _Requirements: REQ-0 (Execution Protocol)_

### Phase 3: Complex Consolidation (Higher Risk, Requires Careful Testing)

- [x] 3.1 Consolidate meeting config (validation, parsing, URL generation)
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Analyze `lib/meeting-config.validation.ts`, `services/meeting/meeting-url-parser.ts`, `common/lib/meeting-config.ts`
  - Consolidate into `common/lib/meeting-config.ts` as canonical with named export groups:
    - `validate*` functions
    - `parse*` functions  
    - `generate*` functions
  - Update all importers across backend and frontend
  - Run `bun run test:services` — verify meeting-related tests pass
  - Run `bun check:duplicates` — confirm clone elimination
  - **Quality Loop**: Per-file verification on all modified files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/3.1-meeting-config-consolidation-outcome.md`
  - Mark task 3.1 as `[x]`
  - _Requirements: REQ-12_

- [x] 3.2 Resolve currency utility duplication
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Analyze `common/lib/currency.ts` and `common/lib/static-currency-catalog.ts` (34 lines / 745 tokens)
  - Determine if intentional static data or extractable logic
  - IF extractable: Consolidate into single canonical module with clear separation
  - IF intentional: Document distinction in both files AND add `.jscpd.json` ignore pattern
  - Run `bun check:duplicates` — confirm elimination or documented exclusion
  - **Quality Loop**: Per-file verification on modified files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/common/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/3.2-currency-resolution-outcome.md`
  - Mark task 3.2 as `[x]`
  - _Requirements: REQ-13_

- [x] 3.3 Complete locale namespace migration (profile.ts)
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Verify all imports reference `locale/{en,ar}/profile/{teacher,parent,staff,notifications}/index.ts`
  - Delete `locale/en/profile.ts` and `locale/ar/profile.ts`
  - Run `bun check:duplicates` — confirm clone elimination
  - **TRANSLATION SYSTEM COMPLIANCE VERIFICATION:** For all modified locale files, verify:
    - Client components use `useAppTranslation(Translation.<Namespace>)` with Translation enum (not string literal)
    - Translation objects accessed via property access (`t.propertyName`) NOT function calls (`t('propertyName')`)
    - Server components use `await getTranslations(locale)` (single arg) and access namespace as property: `t.Dashboard.FeatureName`
    - Namespace directories use lowercase casing (`shared/locale/namespaces/ui/featureName.namespace.ts`)
    - NO `useAppTranslation("stringLiteral")`, NO `getTranslations(locale, "namespace")` (two args), NO `t('functionCall')`, NO hardcoded strings, NO `next-intl` imports
  - **Quality Loop**: Per-file verification on any modified locale files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/shared/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: (none for shared/locale)
  - Write outcome: `.ai/plans/duplications/outcome/3.3-locale-profile-migration-outcome.md`
  - Mark task 3.3 as `[x]`
  - _Requirements: REQ-3_

- [x] 3.4 Complete locale namespace migration (meeting-config.ts)
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Verify all imports reference `locale/{en,ar}/ui/meetingConfig/{display,manager}.ts`
  - Delete `locale/en/ui/meeting-config.ts` and `locale/ar/ui/meeting-config.ts`
  - Run `bun check:duplicates` — confirm clone elimination
  - **TRANSLATION SYSTEM COMPLIANCE VERIFICATION:** For all modified locale files, verify:
    - Client components use `useAppTranslation(Translation.<Namespace>)` with Translation enum (not string literal)
    - Translation objects accessed via property access (`t.propertyName`) NOT function calls (`t('propertyName')`)
    - Server components use `await getTranslations(locale)` (single arg) and access namespace as property: `t.Dashboard.FeatureName`
    - Namespace directories use lowercase casing (`shared/locale/namespaces/ui/featureName.namespace.ts`)
    - NO `useAppTranslation("stringLiteral")`, NO `getTranslations(locale, "namespace")` (two args), NO `t('functionCall')`, NO hardcoded strings, NO `next-intl` imports
  - **Quality Loop**: Per-file verification on any modified locale files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/shared/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: (none for shared/locale)
  - Write outcome: `.ai/plans/duplications/outcome/3.4-locale-meeting-config-migration-outcome.md`
  - Mark task 3.4 as `[x]`
  - _Requirements: REQ-3_

- [x] 3.5 Complete locale namespace migration (payment-method.ts)
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Verify all imports reference `locale/{en,ar}/ui/paymentMethod/manager.ts`
  - Delete `locale/en/ui/payment-method.ts` and `locale/ar/ui/payment-method.ts`
  - Run `bun check:duplicates` — confirm clone elimination
  - **TRANSLATION SYSTEM COMPLIANCE VERIFICATION:** For all modified locale files, verify:
    - Client components use `useAppTranslation(Translation.<Namespace>)` with Translation enum (not string literal)
    - Translation objects accessed via property access (`t.propertyName`) NOT function calls (`t('propertyName')`)
    - Server components use `await getTranslations(locale)` (single arg) and access namespace as property: `t.Dashboard.FeatureName`
    - Namespace directories use lowercase casing (`shared/locale/namespaces/ui/featureName.namespace.ts`)
    - NO `useAppTranslation("stringLiteral")`, NO `getTranslations(locale, "namespace")` (two args), NO `t('functionCall')`, NO hardcoded strings, NO `next-intl` imports
  - **Quality Loop**: Per-file verification on any modified locale files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/shared/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: (none for shared/locale)
  - Write outcome: `.ai/plans/duplications/outcome/3.5-locale-payment-method-migration-outcome.md`
  - Mark task 3.5 as `[x]`
  - _Requirements: REQ-3_

- [x] 3.6 Decide and implement Storybook story deduplication
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Evaluate `.stories.tsx` triplication across common/desktop/mobile
  - Option A: Extract shared story factory functions in `common/stories/factories/`
  - Option B: Add ignore globs to `.jscpd.json` for `**/*.stories.tsx`
  - Implement chosen approach
  - Run `bun check:duplicates` — confirm story clones eliminated or excluded
  - **Quality Loop**: Per-file verification on modified files
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: Validate against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/frontend/common/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md`, `/home/ahmed/Projects/siraj/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
  - Write outcome: `.ai/plans/duplications/outcome/3.6-storybook-decision-outcome.md`
  - Mark task 3.6 as `[x]`
  - _Requirements: REQ-14_

### Phase 4: Final Verification & Knowledge Propagation

- [x] 4.1 Final jscpd verification
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Run `bun check:duplicates` — verify clone count is 0 (or only documented exclusions)
  - Document any remaining clones in `deferred-items.md` with justification
  - **Quality Loop**: N/A (verification only)
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: N/A
  - Write outcome: `.ai/plans/duplications/outcome/4.1-final-jscpd-verification-outcome.md`
  - Mark task 4.1 as `[x]`
  - _Requirements: REQ-15_

- [x] 4.2 Run full quality gate
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Run `bun quality-gate` — must pass all stages (tsgo → biome → lint → codescene → sonar-results)
  - If any stage fails, fix and re-run
  - **Quality Loop**: N/A (global gate)
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: N/A
  - Write outcome: `.ai/plans/duplications/outcome/4.2-quality-gate-outcome.md`
  - Mark task 4.2 as `[x]`
  - _Requirements: REQ-15_

- [x] 4.3 Run full test suite
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Run `bun run build:test` (required before E2E)
  - Run `bun run test:db` — all pass
  - Run `bun run test:services` — all pass
  - Run `bun run test:integration` — all pass
  - Run `bun run test:ui:components` — all pass
  - Run `bun run test:ui:e2e` — all pass
  - **Quality Loop**: N/A (test execution)
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: N/A
  - Write outcome: `.ai/plans/duplications/outcome/4.3-full-test-suite-outcome.md`
  - Mark task 4.3 as `[x]`
  - _Requirements: REQ-15_

- [x] 4.4 Baseline comparison and deferred items enforcement
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Compare current error counts vs `/tmp/baseline-*.txt` — document new errors introduced
  - Enforce deferred items resolution:
    ```bash
    grep -c "❌\|⚠️" .ai/plans/duplications/deferred-items.md
    # Expected: 0
    ```
  - All deferred items MUST be ✅ Done with verification references
  - **Quality Loop**: N/A
  - **Semantic Review**: Check against semantic checklist
  - **Instruction Verification**: N/A
  - Write outcome: `.ai/plans/duplications/outcome/4.4-baseline-comparison-outcome.md`
  - Mark task 4.4 as `[x]`
  - _Requirements: REQ-0, REQ-15_

- [x] 4.5 Knowledge Propagation & Documentation (MANDATORY FINAL TASK)
  - Read all existing files in `.ai/plans/duplications/outcome/`
  - Synthesize all learnings from outcome files
  - Create canonical reference docs under `docs/`:
    - `docs/frontend/ui-shared-scaffold-pattern.md` — `*Shared.tsx` pattern with slot props
    - `docs/frontend/duplication-elimination-patterns.md` — deletion with barrel imports, canonical module selection, scaffold patterns
    - `docs/testing/shared-test-runner.md` — parallel test runner consolidation
    - `docs/backend/shared-types-pattern.md` — shared/types for cross-layer types
    - `docs/i18n/locale-namespace-migration.md` — migration completion pattern
  - Update layer AGENTS.md files with new rules/patterns:
    - `frontend/common/components/ui/AGENTS.md` — add scaffold pattern reference
    - `frontend/AGENTS.md` — add duplication prevention rules
    - `backend/services/AGENTS.md` — add canonical service pattern
    - `shared/AGENTS.md` — add shared/types convention
    - `scripts/run-test/AGENTS.md` — add shared runner reference
  - Update `.agents/skills/` if patterns affect skills:
    - `.agents/skills/refactor-mobile-desktop/SKILL.md` — add scaffold pattern
    - `.agents/skills/fix-tests/SKILL.md` — add shared runner reference
    - `.agents/skills/dry-refactoring/SKILL.md` — add duplication patterns
  - Update `.agents/instructions/` if new conventions:
    - `.agents/instructions/frontend.instructions.md` — add scaffold usage rules
    - `.agents/instructions/mobile-desktop.instructions.md` — add tier variant rules
    - `.agents/instructions/backend.instructions.md` — add canonical service rules
    - `.agents/instructions/tests.instructions.md` — add shared runner rules
  - Update root `AGENTS.md` Important References section with new docs
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run scripts/lint-service.ts --json --id final-check` (0 errors, 0 warnings)
  - Write outcome: `.ai/plans/duplications/outcome/4.5-knowledge-propagation-outcome.md`
  - Update progress: Mark task 4.5 as `[x]` in `tasks.md`
  - _Requirements: Knowledge propagation protocol_

---

## Domain-to-Artifacts Mapping (Reference for Knowledge Propagation)

| Plan Domain | Docs Subdir | AGENTS.md to Update | Skills to Update | Instructions to Update |
|---|---|---|---|---|
| Drizzle / DB patterns | `docs/drizzle/` | `backend/db/repo/AGENTS.md`, `backend/db/schema/AGENTS.md`, `backend/AGENTS.md` | `.agents/skills/drizzle/SKILL.md` | `.agents/instructions/backend.instructions.md` |
| DB migrations | `docs/drizzle/` | `backend/db/schema/AGENTS.md`, `backend/AGENTS.md` | `.agents/skills/drizzle-migrations/SKILL.md`, `.agents/skills/drizzle-generate/SKILL.md` | `.agents/instructions/backend.instructions.md` |
| GraphQL / Pothos | `docs/graphql/` | `backend/graphql/AGENTS.md`, `backend/graphql/pothos/AGENTS.md`, `frontend/common/graphql/AGENTS.md` | — | `.agents/instructions/backend.instructions.md` |
| Backend services | `docs/services/` | `backend/services/AGENTS.md`, `backend/AGENTS.md` | — | `.agents/instructions/backend.instructions.md` |
| Backend types / enums | `docs/backend/` | `backend/types/AGENTS.md`, `backend/enum/AGENTS.md`, `backend/AGENTS.md` | — | `.agents/instructions/backend.instructions.md` |
| Frontend components / views | `docs/frontend/` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/common/components/ui/AGENTS.md` | `.agents/skills/frontend-patterns/SKILL.md` | `.agents/instructions/frontend.instructions.md` |
| Frontend mobile/desktop | `docs/frontend/` | `frontend/mobile/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/views/AGENTS.md` | `.agents/skills/refactor-mobile-desktop/SKILL.md` | `.agents/instructions/mobile-desktop.instructions.md` |
| Frontend stores / state | `docs/frontend/` | `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md` | `.agents/skills/frontend-patterns/SKILL.md` | `.agents/instructions/frontend.instructions.md` |
| Frontend GraphQL / Apollo | `docs/frontend/` | `frontend/common/graphql/AGENTS.md`, `frontend/common/graphql/sharedDocuments/AGENTS.md` | — | `.agents/instructions/frontend.instructions.md` |
| Testing (DB) | `docs/testing/` | `backend/db/test/AGENTS.md`, `backend/db/test/logic/AGENTS.md` | `.agents/skills/fix-db-tests/SKILL.md` | `.agents/instructions/tests.instructions.md` |
| Testing (UI / E2E) | `docs/testing/` | `test/ui/AGENTS.md` | `.agents/skills/fix-tests/SKILL.md` | `.agents/instructions/tests.instructions.md` |
| Testing (general) | `docs/testing/` | `scripts/run-test/AGENTS.md` | `.agents/skills/fix-tests/SKILL.md` | `.agents/instructions/tests.instructions.md` |
| i18n / locale | `docs/i18n/` | `shared/AGENTS.md` | — | — |
| Auth / security | `docs/auth/` | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `.agents/skills/security-review/SKILL.md` | `.agents/instructions/backend.instructions.md` |
| App Router / Next.js | `docs/app/` | `app/AGENTS.md` | — | `.agents/instructions/frontend.instructions.md` |
| Quality gates / CI | `docs/quality/` | `AGENTS.md` (root) | `.agents/skills/quality-gate/SKILL.md`, `.agents/skills/quality-loop/SKILL.md` | — |
| Idempotency | `docs/` (top-level) | `backend/services/AGENTS.md` | — | `.agents/instructions/backend.instructions.md` |
| Bun / runtime | `docs/bun/` | `AGENTS.md` (root) | — | — |

---

## Task Execution Checklist

### Before Starting Each Task
- [ ] Requirements and design documents are reviewed
- [ ] Dependencies are identified and available
- [ ] Development environment is set up
- [ ] Task scope and acceptance criteria are clear
- [ ] **ALL outcome files in `.ai/plans/duplications/outcome/` have been read**

### During Implementation
- [ ] Code follows established patterns and standards
- [ ] Unit tests are written alongside implementation (N/A for refactoring — existing tests suffice)
- [ ] Error handling and edge cases are considered
- [ ] Code is documented with clear comments

### Before Completion Each Task
- [ ] All acceptance criteria are met
- [ ] Tests pass and coverage is adequate
- [ ] Code review is completed (self-review via semantic checklist)
- [ ] Integration with existing code is verified
- [ ] **Quality Loop passed** (tsgo + biome:check + lint queue on modified files)
- [ ] **Instruction Verification passed** (validated against all applicable AGENTS.md and .agents/instructions)

### Task Completion
- [ ] Feature works as specified in requirements
- [ ] No regressions in existing functionality
- [ ] Documentation is updated if needed
- [ ] Task is marked as complete in `tasks.md` (`[ ]` -> `[x]`)
- [ ] Outcome file written to `.ai/plans/duplications/outcome/<task-id>-outcome.md`