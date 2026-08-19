# Requirements: Code Duplication Elimination — Phase 8

**Feature:** Phase 8 — Final Residual Clone Elimination (D7-6 Carry-Forward + D↔M Scaffold Residuals)
**Version:** 1.0
**Date:** 2026-08-12

---

## 1. Overview

Phase 8 is the **final phase** of the code duplication elimination effort across Phases 1–7. After Phases 1–7 reduced clones from 475 to 12, Phase 8 targets the remaining **12 clone pairs** (1,192 duplicated tokens) across 3,208 files.

These residuals fall into three categories:

1. **C↔C cross-file utility duplication** (4 pairs, 387 tokens) — billing ViewModel functions and excel-export logic duplicated across sibling files in `frontend/common/`.
2. **C↔C boilerplate header** (1 pair, 83 tokens) — identical import + config-open pattern across profile loading skeletons.
3. **D↔M scaffold residuals** (6 pairs, 641 tokens) — desktop↔mobile pairs where `*Shared.tsx` scaffolds exist but wrapper boilerplate or tier-forked scaffolds leave residual duplication.
4. **D↔M barrel file** (1 pair, 81 tokens) — desktop/mobile input barrel files with 16 of 17 entries identical.

---

## 2. User Stories

**US-1:** As a maintainer, I want all 12 remaining clone pairs eliminated so `bun check:duplicates` reports 0 clones.

**US-2:** As a developer, I want billing ViewModel utilities shared across `useParentBillingViewModel` and `useUserBillingProfileViewModel` so billing logic is DRY and changes propagate automatically.

**US-3:** As a developer, I want the D↔M wrapper boilerplate reduced via hook-based prop forwarding so tier variants are thin wrappers with minimal residual duplication.

**US-4:** As a developer, I want the D↔M input barrel files deleted so the 16 identical but structurally-non-shareable `export *` entries are eliminated entirely, since both barrels have zero consumers.

**US-5:** As a developer, I want identical loading skeleton config patterns consolidated so profile role variants share a factory function.

---

## 3. Acceptance Criteria (EARS Format)

### AC-1: Zero Clone Pairs
**WHEN** `bunx jscpd . --config .jscpd.json` is run **THEN** the system SHALL report 0 clones across all formats.

### AC-2: No jscpd:ignore Directives
**WHEN** the codebase is searched for `jscpd:ignore` **THEN** zero occurrences SHALL be found.

### AC-3: No .jscpd.json Changes
**WHEN** `.jscpd.json` is compared to the Phase 7 version **THEN** it SHALL be identical (no new ignore patterns).

### AC-4: No Reexports
**WHEN** all new files created by Phase 8 are inspected **THEN** zero files SHALL contain `export * from` or `export { X } from "./..."` re-export-only statements. Every new file SHALL contain substantive logic (functions, components, types, constants — not just re-exports).

### AC-5: No Server-Dependent Tests
**WHEN** the plan's task list is inspected **THEN** zero tasks SHALL reference `test:graphql`, `test:ui:e2e`, `test:ui:components`, `test:ui`, `build:test`, `test:integration*`, `test:db*`, `test:services*`, `test` (meta), or `scripts/run-test/run-test.ts`.

### AC-6: Sole Verification Method
**WHEN** per-file quality verification is needed **THEN** the plan SHALL use `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` exclusively.

### AC-7: Billing ViewModel Utilities Extracted
**WHEN** `useParentBillingViewModel.ts` and `useUserBillingProfileViewModel.ts` are inspected post-implementation **THEN** both SHALL import shared billing utility functions from a common module instead of re-declaring duplicate logic.

### AC-8: D↔M Wrapper Boilerplate Reduced
**WHEN** D↔M pairs 8–12 are inspected post-implementation **THEN** each pair SHALL share either a `*Shared.tsx` scaffold, a shared utility, a shared type, or a hook-based prop-forwarding pattern that eliminates the jscpd-detected duplication.

### AC-9: D↔M Barrel Eliminated
**WHEN** `frontend/desktop/components/ui/input/` and `frontend/mobile/components/ui/input/` directories are inspected post-implementation **THEN** no `index.ts` barrel file SHALL exist in either directory — both barrel files SHALL be deleted, and `export * from "./input"` SHALL be removed from both `frontend/{desktop,mobile}/components/ui/index.ts`. Zero consumer updates SHALL be needed (confirmed by `bun tsgo` passing).

### AC-10: D↔M Tier-Forked Scaffold Unified
**WHEN** `heroSummaryCardShared.tsx` (common) and `supervisorHeroCardShared.tsx` (mobile) are inspected post-implementation **THEN** a single tier-agnostic `HeroSummaryCardShared` component SHALL exist with tier differences expressed via slots/options, not via two separate forked files.

### AC-11: D7-6 Carry-Forward Resolved
**WHEN** the Phase 7 deferred item D7-6 (28 same-directory cross-file clones) is evaluated **THEN** all members that overlap with the 12 Phase 8 clone pairs SHALL be resolved. Non-overlapping D7-6 members SHALL be documented with disposition in `deferred-items.md`.

### AC-12: Outcome Knowledge Base
**WHEN** any task completes **THEN** the executing agent SHALL write `.ai/plans/duplications-phase8/outcome/<task-id>-outcome.md` with implementation details.
**AND** before executing any task, the executing agent SHALL read all existing files in `.ai/plans/duplications-phase8/outcome/`.

---

## 4. Constraints

| # | Constraint | Enforcement |
|---|-----------|-------------|
| C-1 | No `jscpd:ignore` directives | Verified by `grep -r "jscpd:ignore"` returning 0 |
| C-2 | No `.jscpd.json` changes | Verified by `git diff .jscpd.json` showing no changes |
| C-3 | No reexport-only files | Verified by inspecting all new files for `export * from` / `export { } from` patterns |
| C-4 | No server-dependent tests | Verified by task list inspection |
| C-5 | No `oxlint-disable` comments | Verified by `grep -r "oxlint-disable"` returning 0 |
| C-6 | No hardcoded colors | Verified by `sub-loop.ts` codescene lifecycle |
| C-7 | Follow Phase 6 task pattern (QL/SR/IV subtasks) | Verified by tasks.md structure |
| C-8 | No `as Type` assertions (use type guards) | Verified by `sub-loop.ts` oxlint lifecycle |

---

## 5. 12 Clone Pairs Inventory

| # | Pattern | File A | File B | Tokens | Lines |
|---|---------|--------|--------|--------|-------|
| 1 | C↔C utility | `frontend/common/utils/excel-export/report-export.ts` [132:9–140:8] | `frontend/common/utils/excel-export/shared-export-logic.ts` [71:80–75:2] | 84 | 9 |
| 2 | C↔C VM | `frontend/common/views/dashboard/billing/useParentBillingViewModel.ts` [235:40–248:58] | `frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.ts` [60:22–73:52] | 117 | 14 |
| 3 | C↔C VM | `frontend/common/views/dashboard/billing/useParentBillingViewModel.ts` [267:24–287:4] | `frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.ts` [88:25–108:2] | 96 | 21 |
| 4 | C↔C VM | `frontend/common/views/dashboard/billing/useParentBillingViewModel.ts` [310:29–327:25] | `frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.ts` [301:22–319:23] | 90 | 18 |
| 5 | C↔C skeleton | `frontend/common/views/dashboard/profile/parent/sections/ParentProfileLoadingSkeleton.tsx` [1:1–10:36] | `frontend/common/views/dashboard/profile/staff/sections/StaffProfileLoadingSkeleton.tsx` [1:1–10:36] | 83 | 10 |
| 6 | D↔M scaffold residual | `frontend/common/views/dashboard/supervisor/dashboard/components/__shared__/heroSummaryCardShared.tsx` [60:54–71:10] | `frontend/mobile/views/dashboard/supervisor/dashboard/components/__shared__/supervisorHeroCardShared.tsx` [63:53–74:10] | 89 | 12 |
| 7 | D↔M barrel | `frontend/desktop/components/ui/input/index.ts` [1:64–17:30] | `frontend/mobile/components/ui/input/index.ts` [1:63–17:30] | 81 | 17 |
| 8 | D↔M residual | `frontend/desktop/views/dashboard/classes/status/tracking/statusTrackingDataGrid.desktop.tsx` [159:44–172:9] | `frontend/mobile/views/dashboard/classes/status/tracking/statusTrackingDataGrid.mobile.tsx` [232:37–245:9] | 83 | 14 |
| 9 | D↔M residual | `frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertsView.desktop.tsx` [75:13–88:11] | `frontend/mobile/views/dashboard/schedule/alerts/scheduleAlertsView.mobile.tsx` [78:17–91:11] | 90 | 14 |
| 10 | D↔M residual | `frontend/desktop/views/dashboard/search-schedule/searchSchedule.desktop.tsx` [109:52–126:9] | `frontend/mobile/views/dashboard/search-schedule/searchSchedule.mobile.tsx` [151:35–168:9] | 98 | 18 |
| 11 | D↔M residual | `frontend/desktop/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.desktop.tsx` [81:47–129:21] | `frontend/mobile/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.mobile.tsx` [103:46–151:21] | 173 | 49 |
| 12 | D↔M residual | `frontend/desktop/views/dashboard/users/billing-profile/userBillingProfile.desktop.tsx` [35:23–57:9] | `frontend/mobile/views/dashboard/users/billing-profile/userBillingProfile.mobile.tsx` [36:23–58:7] | 108 | 23 |

**Total:** 12 pairs, 1,192 duplicated tokens, 207 duplicated lines.

---

## 6. Scope Boundaries

### In Scope
- All 12 clone pairs listed above
- D7-6 carry-forward from Phase 7 (overlapping members)
- `frontend/common/`, `frontend/desktop/`, `frontend/mobile/` layers
- Pattern A–G extraction strategies from Phase 6
- Hook-based prop forwarding pattern (new in Phase 8)

### Out of Scope
- Backend, shared, scripts, app layers (no remaining clone pairs in these layers)
- Any test requiring a Next.js dev server or production server
- Any GraphQL schema changes
- Any database schema changes
- Refactoring beyond the 12 listed clone pairs

---

## 7. D7-6 Carry-Forward

Phase 7 deferred 28 same-directory cross-file clone pairs (D7-6) to "Phase 8 or dedicated cross-file phase." Phase 8 addresses the **subset of D7-6 that overlaps with the 12 current clone pairs** (Pairs 1–5 are same-directory cross-file C↔C pairs). Non-overlapping D7-6 members shall be documented in `deferred-items.md` with disposition rationale.
