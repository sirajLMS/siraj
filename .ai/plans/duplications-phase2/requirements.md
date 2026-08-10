# Requirements Document: Code Duplication Elimination Phase 2 (Frontend)

## Document Information

- **Feature Name**: Code Duplication Elimination Phase 2 — Frontend Consolidation
- **Target Directory**: `.ai/plans/duplications-phase2`
- **Outcome Directory**: `.ai/plans/duplications-phase2/outcome`
- **Version**: 1.0
- **Date**: 2026-08-10
- **Author**: Spec-driven continuation of `.ai/plans/duplications/`
- **Predecessor Plan**: [`.ai/plans/duplications/`](../duplications/) — reduced clones 1,021 → 819 (19.8%)
- **Related Documents**:
  - Predecessor Requirements: [../duplications/requirements.md](../duplications/requirements.md)
  - Predecessor Design: [../duplications/design.md](../duplications/design.md)
  - Predecessor Tasks: [../duplications/tasks.md](../duplications/tasks.md)
  - Predecessor Final Outcome: [../duplications/outcome/4.5-knowledge-propagation-outcome.md](../duplications/outcome/4.5-knowledge-propagation-outcome.md)
  - Predecessor Post-Completion Update: [../duplications/outcome/post-completion-update-outcome.md](../duplications/outcome/post-completion-update-outcome.md)
  - Design: [design.md](./design.md)
  - Tasks: [tasks.md](./tasks.md)

## Executive Summary

The predecessor plan (`.ai/plans/duplications/`) eliminated 202 of 1,021 clones (19.8% reduction), leaving 819 clones at plan completion. Post-completion re-verification on 2026-08-10 confirmed tsgo is now clean (0 errors — the 3 pre-existing errors in `ZoomMeetingAdapter.ts` were resolved by separate commit `6ebea304b`), biome passes, and jscpd reports 823 clones (slight increase from 819 due to new code, not regressions).

This continuation plan focuses on the **frontend layer**, which contains **718 of 823 clones (87.2%)** and **116,636 of 128,656 duplicated tokens (90.6%)**. The plan targets elimination of the top frontend clone clusters via three patterns:

1. **Pattern A — UI Component Triplication Scaffolds** (Phase 1, Quick Wins): ~12 UI components with common+desktop+mobile variants, consolidated using the `*Shared.tsx` scaffold pattern established in the predecessor plan.
2. **Pattern B — Desktop↔Mobile View Component Pairs** (Phase 2, UI Refactor): ~19 view-layer components with separate desktop and mobile implementations, consolidated using the same scaffold pattern.
3. **Pattern C — Within-Common Duplications** (Phase 3, Complex): ~82 clusters of duplication within the `frontend/common/` tier, including partial extractions, utility duplicates, and shared logic consolidation.

**Risk tolerance**: Aggressive consolidation — accept that some tests may need updating when consolidating components with behavioral differences. The user explicitly approved this risk profile.

**Estimated impact**: Eliminate ~600 of 718 frontend clones (~83% of frontend duplication, ~73% of total duplication), reducing total clones from 823 → ~220.

## Current State Baseline (Pre-Plan)

| Metric | Value | Source |
|--------|-------|--------|
| Total jscpd clones | 823 | `bun check:duplicates` on 2026-08-10 |
| Frontend clones | 718 (87.2%) | jscpd JSON report analysis |
| Frontend duplicated tokens | 116,636 (90.6%) | jscpd JSON report analysis |
| Frontend duplicated lines | 20,390 (93.7%) | jscpd JSON report analysis |
| tsgo errors | 0 | `bun tsgo` on 2026-08-10 |
| biome warnings | 0 | `bun biome:check` on 2026-08-10 |
| lint errors | 4 (sonarjs, pre-existing, out-of-scope) | `bun run scripts/lint-service.ts` on 2026-08-10 |

### Top Frontend Clone Clusters (by total duplicated tokens)

**Tier-pair breakdown** (full table in `tasks.md`):

| Tier Pair | Clusters | Total Clones | Total Tokens | Total Lines | % of Frontend Tokens |
|-----------|----------|--------------|--------------|-------------|----------------------|
| desktop↔mobile | 176 | 361 | 58,698 | 10,112 | 50.3% |
| common↔desktop | 60 | 116 | 21,592 | 3,853 | 18.5% |
| common↔mobile | 45 | 78 | 15,569 | 2,871 | 13.3% |
| common↔common | 82 | 116 | 14,522 | 2,475 | 12.4% |
| desktop↔desktop | 24 | 30 | 4,086 | 709 | 3.5% |
| mobile↔mobile | 14 | 17 | 2,169 | 370 | 1.9% |

### Out-of-Scope (Deferred to Future Plans)

The following categories are **NOT** addressed by this plan and are explicitly deferred to future plans:

- **Backend duplications** (58 clones in `backend/graphql`, 45 in `backend/db`, 32 in `backend/services`, 3 in `backend/enum`) — ~138 clones, scoped for a future `duplications-phase3` plan
- **Shared/locale duplications** (36 clones in `shared/locale`) — scoped for a future i18n-focused plan
- **App router duplications** (14 clones in `app/(dashboard)`) — scoped for a future app-router plan
- **Scripts/health duplications** (8 clones in `scripts/health`) — scoped for a future scripts plan
- **Timezone enum duplication** (1781 tokens, 446 lines — `backend/enum/shared/timezone.enum.ts` ↔ `shared/constants/iana-timezone.enum.ts`) — largest single clone, deferred from predecessor plan, scoped for a future cross-layer plan

## User Stories

### US-1: Developer Adding a New UI Component Variant

**As a** frontend developer,
**I want** UI components (CurrencyAutocomplete, PhoneInput, PaymentMethodDisplay, etc.) to have a single canonical implementation with slot-based tier variations,
**so that** adding a new feature or fixing a bug only requires changes in one place (the shared scaffold) rather than three (common, desktop, mobile).

**Current pain**: When a bug was found in `CurrencyAutocomplete`, the developer had to fix it in `frontend/common/components/ui/input/currencySelect/CurrencyAutocomplete.tsx`, `frontend/desktop/components/ui/input/currencySelect/currencyAutocomplete.desktop.tsx`, AND `frontend/mobile/components/ui/input/currencySelect/currencyAutocomplete.mobile.tsx` — three files, three reviews, three chances to miss a sync.

### US-2: Maintainer Fixing a Desktop/Mobile View Bug

**As a** frontend maintainer,
**I want** desktop and mobile variants of view components (localizedStringDrawer, searchScheduleFilterDrawer, etc.) to share their core logic via a scaffold,
**so that** a bug fix in the shared scaffold automatically propagates to both desktop and mobile variants without manual synchronization.

**Current pain**: `searchScheduleFilterDrawer.desktop.tsx` and `searchScheduleFilterDrawer.mobile.tsx` share 899 tokens across 6 clone blocks. A filter logic bug fixed in one variant often goes unfixed in the other until a user reports it.

### US-3: Refactoring Veteran Reusing Established Patterns

**As a** developer familiar with the predecessor plan's `*Shared.tsx` scaffold pattern (StatusBadge, BaseDeleteDialog, PaymentMethodTypeFields, CreateRecurringClassDialog),
**I want** the same pattern applied to the remaining UI triplications,
**so that** the codebase has a consistent, documented approach to tier-based component variation.

**Current pain**: The codebase has two coexisting patterns — some components use the `*Shared.tsx` scaffold pattern (from the predecessor plan), while others still have full triplication. This inconsistency makes it hard to know which pattern to follow when adding a new component.

### US-4: Test Suite Consumer

**As a** CI/CD pipeline consumer,
**I want** the full test suite to actually run as part of this plan's Phase 4 verification,
**so that** any regressions introduced by the aggressive consolidation are caught before merge.

**Current pain**: The predecessor plan deferred the full test suite (Task 4.3) due to pre-existing tsgo errors. Those errors have since been fixed, so this plan has no excuse to defer the full test suite again.

### US-5: Future Plan Author

**As a** future plan author working on backend duplications (phase 3),
**I want** this plan's outcome files to clearly document which frontend clones were eliminated, which were deferred, and what patterns were used,
**so that** I don't have to re-analyze the frontend when planning the backend phase.

**Current pain**: The predecessor plan's outcome files were thorough but the stale outcomes (mentioning "3 pre-existing tsgo errors" that have since been fixed) caused confusion during this plan's preparation.

## Acceptance Criteria (EARS Format)

### REQ-0: Pre-Implementation Baseline

1. **WHEN** this plan starts **THEN** the executing agent SHALL record baseline error counts (tsgo, biome, lint, jscpd) in `/tmp/baseline-phase2-*.txt` files BEFORE any implementation work begins.
2. **WHEN** the baseline is recorded **THEN** the executing agent SHALL create `deferred-items.md` (using the predecessor plan's format as a template) to track any work deferred from one task to another.
3. **WHEN** the baseline is complete **THEN** the executing agent SHALL write `outcome/0-baseline-outcome.md` documenting the baseline counts.

### REQ-1: UI Component Triplication Scaffold Pattern (Phase 1)

1. **WHEN** a UI component has three variants (common, desktop, mobile) with ≥500 duplicated tokens **THEN** the executing agent SHALL create a `*Shared.tsx` scaffold with slot props following the predecessor plan's `StatusBadgeShared.tsx` pattern.
2. **WHEN** a scaffold is created **THEN** the executing agent SHALL refactor all three variants (common, desktop, mobile) to consume the scaffold with tier-specific slot implementations.
3. **WHEN** a scaffold is consumed **THEN** the consuming variant SHALL NOT import from sibling tier paths (e.g., `desktop/` variant SHALL NOT import from `mobile/` or `common/` tier-specific paths — only from the shared scaffold in `common/`).
4. **WHEN** a scaffold refactor is complete **THEN** the executing agent SHALL run `bun check:duplicates` to confirm the clone cluster is eliminated.
5. **IF** a UI component has only two variants (common + desktop, or common + mobile) **THEN** the executing agent SHALL still create a scaffold and refactor both variants — the pattern is the same regardless of variant count.

### REQ-2: Desktop↔Mobile View Component Scaffold Pattern (Phase 2)

1. **WHEN** a view-layer component has separate desktop and mobile implementations with ≥500 duplicated tokens **THEN** the executing agent SHALL create a `*Shared.tsx` scaffold with slot props for tier-specific rendering.
2. **WHEN** a view scaffold is created **THEN** the executing agent SHALL place it in the same directory as the desktop and mobile variants (e.g., `frontend/views/dashboard/teachers/reassignment/components/managementControlsCardShared.tsx`).
3. **WHEN** a view scaffold is consumed **THEN** the desktop and mobile variants SHALL import only from the scaffold, NOT from each other.
4. **IF** the desktop and mobile variants have meaningful behavioral differences (not just styling) **THEN** the executing agent SHALL consolidate aggressively per the user-approved risk tolerance — extract shared logic to the scaffold, keep only the genuinely different behavior in the tier variants, and update tests as needed.

### REQ-3: Within-Common Duplication Consolidation (Phase 3)

1. **WHEN** two files within `frontend/common/` share ≥400 duplicated tokens **THEN** the executing agent SHALL investigate whether the duplication is intentional (e.g., static data) or extractable (e.g., shared logic).
2. **IF** the duplication is extractable **THEN** the executing agent SHALL consolidate into a single canonical module with clear separation of concerns.
3. **IF** the duplication is intentional **THEN** the executing agent SHALL document the distinction in both files AND add a `.jscpd.json` ignore pattern with justification in `deferred-items.md`.
4. **WHEN** a partial extraction exists (e.g., `CatalogImageUpload.tsx` ↔ `catalogImageUploadShared.tsx` with 7 clones / 1083 tokens) **THEN** the executing agent SHALL complete the extraction so the canonical file consumes the shared scaffold fully.

### REQ-4: Plan Review Gate (Phase 1.5)

1. **WHEN** `requirements.md`, `design.md`, and `tasks.md` are all drafted **THEN** the executing agent SHALL invoke the `@plan-review` skill on the complete plan.
2. **IF** the plan review reports violations **THEN** the executing agent SHALL fix all violations and re-run the review.
3. **WHEN** the plan review passes **THEN** the executing agent SHALL write `outcome/plan-review-R1.md` documenting the review.

### REQ-5: Mid-Point Review Gate (Phase 2.5)

1. **WHEN** Phase 2 (UI Refactor) completes **THEN** the executing agent SHALL dispatch parallel review subagents scoped to all `frontend/` files modified in Phases 1-2.
2. **WHEN** the review subagents report findings **THEN** the executing agent SHALL aggregate, deduplicate, and categorize findings (CRITICAL / HIGH / MEDIUM / LOW).
3. **WHEN** fix subagents resolve findings **THEN** the executing agent SHALL re-run the review until zero frontend-specific findings remain.
4. **WHEN** the mid-point review is clean **THEN** the executing agent SHALL write `outcome/midpoint-review-R1.md` documenting the review.

### REQ-6: Per-File Quality Loop (All Phases)

1. **WHEN** any file is modified or created **THEN** the executing agent SHALL run `bun tsgo` + `bun biome:check` + `bun run scripts/lint-service.ts -f <file> --id verify` BEFORE moving to another file or subtask.
2. **IF** any quality check fails **THEN** the executing agent SHALL fix all errors before proceeding.
3. **WHEN** the quality loop passes **THEN** the executing agent MAY proceed to the next file or subtask.

### REQ-7: Outcome File Per Task (All Phases)

1. **WHEN** any task completes **THEN** the executing agent SHALL write `outcome/<task-id>-outcome.md` summarizing research, analysis, changes, cross-file dependencies, and carry-over knowledge.
2. **WHEN** the outcome file is written **THEN** the executing agent SHALL update the task checkbox `[ ]` → `[x]` in `tasks.md`.

### REQ-8: Final Verification (Phase 4)

1. **WHEN** all implementation tasks complete **THEN** the executing agent SHALL run `bun check:duplicates` and document the final clone count.
2. **WHEN** the final jscpd verification is complete **THEN** the executing agent SHALL run `bun tsgo` + `bun biome:check` + `bun run scripts/lint-service.ts` and document the results.
3. **WHEN** the quality gate passes **THEN** the executing agent SHALL run `bun run build:test` + `bun run test:db` + `bun run test:services` + `bun run test:integration` + `bun run test:ui:components` + `bun run test:ui:e2e` — the full test suite SHALL actually run this time (no deferral).
4. **IF** any test fails **THEN** the executing agent SHALL fix the failure before marking the plan complete.
5. **WHEN** the test suite passes **THEN** the executing agent SHALL compare current error counts vs. the Phase 0 baseline and document any deltas.

### REQ-9: Knowledge Propagation (Phase 4.5)

1. **WHEN** all verification tasks complete **THEN** the executing agent SHALL read all outcome files in `outcome/` to synthesize learnings.
2. **WHEN** learnings are synthesized **THEN** the executing agent SHALL update `docs/frontend/duplication-elimination-patterns.md` (created by the predecessor plan) with any new patterns discovered in this phase.
3. **WHEN** the doc is updated **THEN** the executing agent SHALL update `frontend/common/components/ui/AGENTS.md` and `frontend/views/AGENTS.md` with references to the new patterns.
4. **WHEN** AGENTS.md files are updated **THEN** the executing agent SHALL update root `AGENTS.md` Important References section if any new docs were created.
5. **WHEN** knowledge propagation is complete **THEN** the executing agent SHALL run global quality checks (`bun tsgo` + `bun biome:check` + `bun run scripts/lint-service.ts --json --id final-check`) and document 0 errors / 0 warnings (excluding the 4 pre-existing out-of-scope sonarjs errors).

### REQ-10: Deferred Items Enforcement

1. **WHEN** any task defers work to another task or phase **THEN** the executing agent SHALL add a row to `deferred-items.md` with a clear description, source task, target task, and initial status of "🔄 In Progress" or "❌ Blocked".
2. **WHEN** a deferred item is resolved **THEN** the executing agent SHALL update its status to "✅ Done" with a verification reference (outcome file or commit hash).
3. **WHEN** the plan reaches Phase 4.4 (baseline comparison) **THEN** the executing agent SHALL run `grep -c "❌\|⚠️" .ai/plans/duplications-phase2/deferred-items.md` and verify the count is 0.
4. **IF** any deferred item has status "❌ Blocked" or "⚠️ Partial" **THEN** the plan SHALL NOT be marked complete.

### REQ-11: Aggressive Consolidation Risk Acceptance

1. **WHEN** consolidating two components that have behavioral differences (not just styling) **THEN** the executing agent SHALL extract the shared logic to the scaffold and keep only the genuinely different behavior in the tier variants.
2. **WHEN** aggressive consolidation changes behavior **THEN** the executing agent SHALL update the affected tests as part of the same task (not defer to a later task).
3. **WHEN** a test is updated **THEN** the executing agent SHALL document the behavioral change in the task's outcome file with a "Behavioral Changes" section.

### REQ-12: Cross-Tier Import Compliance

1. **WHEN** a tier variant (desktop or mobile) is refactored to consume a scaffold **THEN** the variant SHALL NOT import from sibling tier paths.
2. **WHEN** a common-tier component is refactored to consume a scaffold **THEN** the common component SHALL NOT import from `desktop/` or `mobile/` paths.
3. **WHEN** a scaffold is placed in `common/` **THEN** desktop and mobile variants MAY import from `common/` (the scaffold), but NOT from each other.
4. **WHEN** the cross-tier import check is run **THEN** the executing agent SHALL verify via `bun run scripts/lint-service.ts` that no new cross-tier violations were introduced.

### REQ-13: MUI v9 Compliance

1. **WHEN** a scaffold or variant is created/modified **THEN** all styling SHALL use the `sx` prop — NEVER direct style props (`fontWeight`, `textAlign`, `mb`, `mt`, `p`, `display`, `gap`, `alignItems`, `justifyContent`, `flexWrap`, `component`).
2. **WHEN** icons are used **THEN** they SHALL use the `*Outlined` naming convention (e.g., `ErrorOutlined`, `CheckCircleOutlined`).
3. **WHEN** MUI v9 compliance is verified **THEN** the executing agent SHALL inspect the predecessor plan's `baseDeleteDialogShared.tsx` as the reference implementation.

## Non-Functional Requirements

### NFR-1: Zero New tsgo Errors

The plan SHALL NOT introduce any new tsgo errors. The current baseline is 0 errors; the plan SHALL maintain 0 errors throughout implementation.

### NFR-2: Zero New biome Warnings

The plan SHALL NOT introduce any new biome warnings. The current baseline is 0 warnings; the plan SHALL maintain 0 warnings throughout implementation.

### NFR-3: Zero New lint Errors (Excluding Pre-Existing Out-of-Scope)

The plan SHALL NOT introduce any new lint errors. The 4 pre-existing sonarjs errors (in `meeting-integrations.service.test.ts`, `payment-method-mask.ts`, `parentOnboardingSchema.ts`, `teacherOnboardingSchema.ts`) are out-of-scope and SHALL NOT be fixed by this plan.

### NFR-4: Clone Reduction Target

The plan SHALL eliminate at least 500 of 718 frontend clones (≥70% reduction). The target final clone count is ≤323 total clones (down from 823).

### NFR-5: Test Suite Pass Rate

The plan SHALL maintain a 100% test pass rate. Any test that fails due to aggressive consolidation SHALL be updated as part of the consolidating task, not deferred.

## Constraints

### CON-1: No Backend Modifications

This plan SHALL NOT modify any `backend/` files. Backend duplications are scoped for a future `duplications-phase3` plan.

### CON-2: No Shared/Locale Modifications

This plan SHALL NOT modify any `shared/locale/` files. Locale duplications are scoped for a future i18n-focused plan.

### CON-3: No App Router Modifications

This plan SHALL NOT modify any `app/` files. App router duplications are scoped for a future app-router plan.

### CON-4: No Timezone Enum Modifications

This plan SHALL NOT modify `backend/enum/shared/timezone.enum.ts` or `shared/constants/iana-timezone.enum.ts`. The timezone enum duplication (1781 tokens, 446 lines — largest clone in the repo) is deferred from the predecessor plan and scoped for a future cross-layer plan.

### CON-5: Use Established Scaffold Pattern

This plan SHALL use the `*Shared.tsx` scaffold pattern established in the predecessor plan (see `docs/frontend/ui-shared-scaffold-pattern.md` and `frontend/common/components/ui/dialog/baseDeleteDialogShared.tsx` as the reference implementation). New patterns SHALL NOT be invented without justification in `design.md`.

### CON-6: Follow spec-driven-development SKILL.md

This plan SHALL follow the methodology defined in `.agents/skills/spec-driven-development/SKILL.md`, including:
- Pre-execution outcome knowledge read
- Post-execution outcome file creation
- Task progress checkbox tracking
- Per-file quality loop
- Deferred-items ledger enforcement

## Assumptions

1. The `*Shared.tsx` scaffold pattern from the predecessor plan is well-understood and applicable to the remaining UI triplications.
2. The desktop and mobile variants of view components share enough logic to make scaffold extraction worthwhile (≥500 duplicated tokens).
3. The aggressive consolidation risk tolerance means the executing agent has authority to update tests when behavior changes — no separate "behavioral change review" is required.
4. The 4 pre-existing lint errors (sonarjs) will not be fixed by this plan and will not block plan completion.
5. The full test suite can be run successfully now that tsgo is clean (0 errors).

## Dependencies

1. **Predecessor plan completion**: The predecessor plan (`.ai/plans/duplications/`) is complete with all 35 tasks marked `[x]`. The post-completion update outcome (`post-completion-update-outcome.md`) confirms the stale outcomes have been updated.
2. **Predecessor knowledge artifacts**: The predecessor plan created 5 docs under `docs/` and updated 5 AGENTS.md files. This plan builds on those artifacts and updates them.
3. **Predecessor outcome files**: The executing agent SHALL read all outcome files in `../duplications/outcome/` before starting any task, to absorb prior research and pitfalls.
4. **Clean tsgo baseline**: The plan depends on tsgo being clean (0 errors) at start. The post-completion re-verification confirmed this on 2026-08-10.

## Glossary

- **Clone**: A block of duplicated code detected by jscpd (≥30 tokens by default, configurable).
- **Cluster**: A group of clones between the same pair of files. One cluster may contain multiple clone blocks.
- **Scaffold**: A `*Shared.tsx` component that contains the shared logic and structure of a UI component, with slot props for tier-specific variations.
- **Tier**: One of `common`, `desktop`, `mobile` — the three frontend implementation layers.
- **Triplication**: A UI component implemented three times — once in `common/`, once in `desktop/`, once in `mobile/`.
- **Variant**: A tier-specific implementation of a component (e.g., `currencyAutocomplete.desktop.tsx` is the desktop variant of `CurrencyAutocomplete`).

## Requirements Checklist

- [x] All user roles identified (developer, maintainer, refactoring veteran, CI consumer, future plan author)
- [x] Normal, edge, and error cases covered (consolidation with behavioral differences, partial extraction completion, cross-tier import violations)
- [x] Requirements are testable and measurable (clone count targets, quality gate pass rates, deferred items enforcement)
- [x] No conflicting requirements (NFR-4 clone reduction target aligns with REQ-1/2/3 consolidation tasks)
- [x] EARS format used consistently (WHEN/THEN/SHALL, IF/THEN/SHALL)

---

**Status**: Draft v1.0
**Date**: 2026-08-10
