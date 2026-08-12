# Design Document: Code Duplication Elimination Phase 2 (Frontend)

## Document Information

- **Feature Name**: Code Duplication Elimination Phase 2 — Frontend Consolidation
- **Target Directory**: `.ai/plans/duplications-phase2`
- **Version**: 1.0
- **Date**: 2026-08-10
- **Author**: Spec-driven continuation of `.ai/plans/duplications/`
- **Related Documents**:
  - Requirements: [requirements.md](./requirements.md)
  - Tasks: [tasks.md](./tasks.md)
  - Predecessor Design: [../duplications/design.md](../duplications/design.md)

## Overview

This design document defines the technical approach for eliminating the top frontend code duplications in the siraj codebase. Building on the predecessor plan's `*Shared.tsx` scaffold pattern (which eliminated 202 clones), this phase applies the same pattern to 12 UI component triplications (Phase 1), 19 desktop↔mobile view component pairs (Phase 2), and ~82 within-common duplications (Phase 3).

The design leverages three established patterns from the predecessor plan:
1. **Canonical-source-with-barrel-import** (used in Phase 1 deletions of the predecessor)
2. **`*Shared.tsx` scaffold with slot props** (used in Phase 2 of the predecessor — StatusBadge, BaseDeleteDialog, PaymentMethodTypeFields, CreateRecurringClassDialog)
3. **`.jscpd.json` ignore for intentional duplications** (used in Phase 3.6 of the predecessor for Storybook stories)

The design introduces no new patterns — the user's `CON-5` constraint mandates use of established patterns.

## Design Goals

1. **Eliminate ≥70% of frontend clones** (≥500 of 718 clones) via scaffold extraction and consolidation
2. **Maintain zero regressions** — all existing tests must pass (with updates allowed for aggressive consolidation per `REQ-11`)
3. **Establish pattern consistency** — every UI component and view component with tier variations follows the `*Shared.tsx` scaffold pattern
4. **Preserve cross-tier import boundaries** — desktop/mobile variants import only from `common/` scaffolds, never from each other
5. **Run the full test suite** — the predecessor plan's deferral is resolved; this plan actually runs `bun run build:test` + all test suites in Phase 4

## Key Design Decisions

### Decision 1: Reuse `*Shared.tsx` Scaffold Pattern from Predecessor Plan

**Context**: The predecessor plan successfully consolidated 4 UI component triplications (StatusBadge, BaseDeleteDialog, PaymentMethodTypeFields, CreateRecurringClassDialog) using a scaffold pattern with slot props. The remaining 12 UI triplications and 19 view pairs need the same treatment.

**Options Considered**:
1. **Reuse `*Shared.tsx` pattern** — Pros: consistent with predecessor, documented in `docs/frontend/ui-shared-scaffold-pattern.md`, well-understood by team. / Cons: requires per-component slot prop design.
2. **Use React Context for tier variation** — Pros: less prop drilling. / Cons: breaks MUI v9 compliance, harder to trace, no precedent in codebase.
3. **Use Higher-Order Components** — Pros: classic pattern. / Cons: outdated with hooks, harder to type, no precedent in codebase.
4. **Use render props** — Pros: flexible. / Cons: callback hell, harder to read, no precedent in codebase.

**Decision**: Reuse the `*Shared.tsx` pattern exactly as defined in `docs/frontend/ui-shared-scaffold-pattern.md` and exemplified by `frontend/common/components/ui/dialog/baseDeleteDialogShared.tsx`.

**Rationale**: The user's `CON-5` constraint mandates use of established patterns. The predecessor plan's `docs/frontend/ui-shared-scaffold-pattern.md` already documents this pattern with rules, examples, and anti-patterns. Introducing a new pattern would create inconsistency.

### Decision 2: Aggressive Consolidation for View Components with Behavioral Differences

**Context**: Some desktop↔mobile view component pairs have behavioral differences (not just styling) — e.g., `searchScheduleFilterDrawer.desktop.tsx` shows filters in a sidebar, while `searchScheduleFilterDrawer.mobile.tsx` shows them in a bottom sheet. The user approved "aggressive consolidation" risk tolerance (`REQ-11`).

**Options Considered**:
1. **Strict refactoring (zero behavioral changes)** — Pros: lowest risk. / Cons: leaves many duplications untouched, defeats the purpose of the plan.
2. **Minor improvements (allow small behavioral alignment)** — Pros: medium risk. / Cons: still leaves larger behavioral duplications untouched.
3. **Aggressive consolidation (extract all shared logic, keep only genuinely different behavior)** — Pros: maximum duplication elimination. / Cons: requires test updates, may change behavior in subtle ways.

**Decision**: Aggressive consolidation (option 3) per the user's explicit risk tolerance selection.

**Rationale**: The user selected "Aggressive consolidation — aggressively consolidate even when behavior differs slightly — accept that some tests may need updating as part of the consolidation" in the clarification questions. This decision is encoded in `REQ-11`.

**Implementation**: For each view component pair:
1. Identify the shared logic (filter application, state management, data fetching, etc.)
2. Extract shared logic to the scaffold
3. Identify the genuinely different behavior (layout, interaction patterns, etc.)
4. Keep different behavior in the tier variants as slot implementations
5. Update affected tests to reflect the new structure
6. Document behavioral changes in the task's outcome file

### Decision 3: Place View Scaffolds Next to Variants (Not in `common/`)

**Context**: UI component scaffolds (Phase 1) live in `frontend/common/components/ui/<component>/<Component>Shared.tsx` because the variants are in `common/`, `desktop/`, and `mobile/`. View component scaffolds (Phase 2) are different — the variants live in `frontend/desktop/views/...` and `frontend/mobile/views/...`, with no `common/` counterpart.

**Options Considered**:
1. **Place view scaffolds in `frontend/common/views/...`** — Pros: aligns with UI component pattern. / Cons: creates a new `common/views/` path that doesn't currently exist for these views, breaks the "common is for shared UI" convention.
2. **Place view scaffolds next to the desktop/mobile variants** — Pros: keeps related files together, no new directory structure. / Cons: scaffold is in `desktop/` or `mobile/` — but wait, that would be cross-tier.
3. **Place view scaffolds in a new `__shared__/` subdirectory next to the variants** — Pros: clearly marked as shared, follows the predecessor plan's `__shared__/` pattern (e.g., `common/views/dashboard/admin/__shared__/useAdminDashboard.ts`). / Cons: introduces `__shared__/` directories in `desktop/` and `mobile/` paths.

**Decision**: Place view scaffolds in a `__shared__/` subdirectory next to the variants (option 3), but place that `__shared__/` directory at the **parent** level (not inside `desktop/` or `mobile/`).

**Concrete example**: For `desktop/views/dashboard/teachers/reassignment/components/managementControlsCard.desktop.tsx` and `mobile/views/dashboard/teachers/reassignment/components/managementControlsCard.mobile.tsx`, the scaffold goes at `frontend/views/dashboard/teachers/reassignment/components/__shared__/managementControlsCardShared.tsx`.

**Rationale**: The predecessor plan already uses `__shared__/` directories (e.g., `common/views/dashboard/admin/__shared__/useAdminDashboard.ts`). Extending this pattern to view components at the `frontend/views/` level (which is tier-agnostic) is consistent. The `frontend/views/` directory already exists as a tier-agnostic location.

### Decision 4: Complete Partial Extractions in Phase 3

**Context**: The jscpd report shows `common/components/ui/input/catalogImageUpload/CatalogImageUpload.tsx` ↔ `common/components/ui/input/catalogImageUpload/catalogImageUploadShared.tsx` with 7 clones / 1083 tokens — indicating a partial extraction was started but not completed.

**Options Considered**:
1. **Complete the extraction in Phase 1** (along with other UI triplications) — Pros: fixes the issue sooner. / Cons: clutters Phase 1 with a "fix existing scaffold" task that's different from "create new scaffold".
2. **Complete the extraction in Phase 3** (within-common duplications) — Pros: Phase 3 is for complex consolidations including partial extractions. / Cons: delays the fix.
3. **Skip — leave as-is** — Pros: zero work. / Cons: leaves 1083 tokens of duplication.

**Decision**: Complete the extraction in Phase 3 (option 2). Phase 1 handles new scaffold creation; Phase 3 handles completion of partial extractions and within-common consolidation.

**Rationale**: Phase 1 is for clean new scaffold extractions. The CatalogImageUpload case is a completion of an existing partial extraction, which fits Phase 3's "complex consolidation" scope.

### Decision 5: Don't Invent New Patterns for Within-Common Duplications

**Context**: The 82 within-common clusters (e.g., `excel-export/parent-directory-export.ts` ↔ `excel-export/tracking-export.ts` with 810 tokens) don't fit the `*Shared.tsx` scaffold pattern — they're utility functions, not components.

**Options Considered**:
1. **Invent a new "shared utility module" pattern** — Pros: clean. / Cons: introduces a new pattern, violates `CON-5`.
2. **Use the predecessor plan's "canonical-source-with-barrel-import" pattern** — Pros: established pattern, documented in `docs/frontend/duplication-elimination-patterns.md`. / Cons: requires per-cluster investigation.
3. **Use `.jscpd.json` ignore for all within-common duplications** — Pros: zero work. / Cons: doesn't actually eliminate duplication.

**Decision**: Use the predecessor plan's "canonical-source-with-barrel-import" pattern (option 2) for extractable duplications, and `.jscpd.json` ignore with justification (option 3) for intentional duplications.

**Rationale**: The predecessor plan's `docs/frontend/duplication-elimination-patterns.md` already documents both patterns (canonical deletion for extractable, jscpd ignore for intentional). No new pattern needed.

## UX/Navigation Specification

This plan is a **pure refactoring effort** — no new routes, sidebar items, or permissions are introduced. All changes are internal to existing components and views.

### Routes & URLs
- **No new routes** — all changes are to existing components and views.

### Sidebar/Navigation Integration
- **No sidebar changes** — navigation structure is unchanged.

### Role-Based Access Matrix
- **No permission changes** — all existing permissions remain identical.

### Per-Audience Rendering
- **No audience changes** — desktop and mobile variants continue to render for their respective audiences. The scaffold extraction is transparent to end users.

### Mobile vs Desktop Variants
- **Behavioral parity preserved** — desktop and mobile variants continue to behave identically to before (except where aggressive consolidation explicitly aligns behavior, documented per-task in outcome files).

### Permission Mapping
- **No permission mapping changes** — all existing permission checks remain in place.

## Component Architecture

### Pattern A: UI Component Triplication Scaffold (Phase 1)

**Structure**:
```
frontend/common/components/ui/<category>/<Component>/
├── <Component>Shared.tsx       # NEW — scaffold with slot props
├── <Component>.tsx              # common variant (refactored to consume scaffold)
├── index.ts                     # barrel export (updated if needed)
```

```
frontend/desktop/components/ui/<category>/<Component>/
├── <component>.desktop.tsx      # desktop variant (refactored to consume scaffold)
```

```
frontend/mobile/components/ui/<category>/<Component>/
├── <component>.mobile.tsx       # mobile variant (refactored to consume scaffold)
```

**Scaffold interface**:
```typescript
// <Component>Shared.tsx
export interface <Component>SharedSlots {
  /** Slot for the root element styling (tier-specific) */
  rootSx?: SxProps<Theme>;
  /** Slot for tier-specific sub-components (e.g., mobile bottom sheet vs desktop popover) */
  Container?: React.ComponentType<{ children: React.ReactNode; open: boolean; onClose: () => void }>;
  /** Slot for tier-specific input rendering */
  Input?: React.ComponentType<InputProps>;
  // ... component-specific slots
}

export interface <Component>SharedProps extends <Component>SharedSlots {
  // ... component-specific props (shared across all tiers)
}

export function <Component>Shared(props: <Component>SharedProps): JSX.Element {
  // Shared logic: state management, data fetching, event handlers
  // Uses slots for tier-specific rendering
}
```

**Variant consumption**:
```typescript
// <Component>.tsx (common variant)
import { <Component>Shared } from "./<Component>Shared";

export function <Component>(props: <Component>Props): JSX.Element {
  return <Component>Shared {...props} Container={CommonContainer} Input={CommonInput} />;
}
```

```typescript
// <component>.desktop.tsx (desktop variant)
import { <Component>Shared } from "@/common/components/ui/<category>/<Component>/<Component>Shared";

export function Desktop<Component>(props: <Component>Props): JSX.Element {
  return <Component>Shared {...props} Container={DesktopPopover} Input={DesktopInput} rootSx={{ minWidth: 320 }} />;
}
```

**Reference implementation**: `frontend/common/components/ui/dialog/baseDeleteDialogShared.tsx` (from predecessor plan).

### Pattern B: Desktop↔Mobile View Component Scaffold (Phase 2)

**Structure**:
```
frontend/views/dashboard/<section>/<feature>/components/
├── __shared__/                                   # NEW directory
│   └── <component>Shared.tsx                     # NEW — scaffold with slot props
├── <component>.desktop.tsx                       # desktop variant (refactored)
└── <component>.mobile.tsx                        # mobile variant (refactored)
```

**Scaffold interface**: Same as Pattern A, but the scaffold is placed at `frontend/views/...` level (tier-agnostic) rather than `frontend/common/...`.

**Variant consumption**: Same as Pattern A, but desktop/mobile variants import from `@/views/dashboard/<section>/<feature>/components/__shared__`.

### Pattern C: Within-Common Utility Consolidation (Phase 3)

**Structure** (for extractable duplications):
```
frontend/common/utils/<category>/
├── <utility>.ts                    # canonical utility (kept)
├── <other-utility>.ts              # deleted; importers updated to use <utility>.ts
├── index.ts                        # barrel export (updated)
```

**Structure** (for intentional duplications):
```
frontend/common/utils/<category>/
├── <utility>.ts                    # documented as intentional
├── <other-utility>.ts              # documented as intentional
```

`.jscpd.json` updated with:
```json
{
  "ignore": [
    "**/<utility>.ts",
    "**/<other-utility>.ts"
  ]
}
```

## Data Models

No data model changes — this is a pure refactoring effort.

## Interfaces

No new public interfaces — the scaffold interfaces are internal to each component family.

## Error Handling

Error handling is preserved per-variant — the scaffold delegates error handling to slot implementations where tier-specific behavior is needed. No new error handling patterns are introduced.

## Testing Strategy

### Unit Tests

- **Existing unit tests** continue to pass (with updates allowed for aggressive consolidation per `REQ-11`).
- **No new unit tests required** — the scaffolds are tested via the existing variant tests.

### Integration Tests

- **Existing integration tests** continue to pass.
- **No new integration tests required** — the refactoring is structural, not behavioral.

### E2E Tests

- **`bun run test:ui:e2e`** SHALL run in Phase 4.3 — this is the predecessor plan's deferred test that this plan MUST actually run.
- **Any E2E failures** SHALL be fixed before plan completion.

### Visual Regression

- **Storybook stories** continue to render correctly for all variants.
- **No new stories required** — the scaffolds are visualized via the existing variant stories.

## Rollout Strategy

### Pre-Implementation (Phase 0)

1. Record baseline: tsgo, biome, lint, jscpd counts.
2. Create `deferred-items.md` ledger.
3. Write `outcome/0-baseline-outcome.md`.

### Implementation (Phases 1-3)

1. **Phase 1**: Create 12 UI component scaffolds, refactor 3 variants each.
2. **Phase 1.5**: Run `@plan-review` skill, fix violations.
3. **Phase 2**: Create 19 view component scaffolds, refactor 2 variants each.
4. **Phase 2.5**: Mid-point review with parallel subagents.
5. **Phase 3**: Consolidate within-common duplications, complete partial extractions.

### Verification (Phase 4)

1. **Phase 4.1**: Final jscpd verification — confirm clone reduction.
2. **Phase 4.2**: Full quality gate — tsgo + biome + lint.
3. **Phase 4.3**: Full test suite — `bun run build:test` + all test suites (no deferral this time).
4. **Phase 4.4**: Baseline comparison + deferred items enforcement.
5. **Phase 4.5**: Knowledge propagation — update `docs/frontend/duplication-elimination-patterns.md` with new patterns.

### Deployment

- Standard rolling deployment — all changes are backward compatible.
- No database migrations required.
- No environment variable changes required.

## Risk Analysis

### Risk 1: Aggressive Consolidation Introduces Behavioral Regressions

**Likelihood**: Medium
**Impact**: High
**Mitigation**:
- Per-task outcome files document behavioral changes
- Affected tests updated as part of the consolidating task
- Phase 4.3 runs the full test suite to catch regressions
- Phase 2.5 mid-point review catches issues before Phase 3

### Risk 2: Scaffold Extraction Breaks Visual Parity

**Likelihood**: Low
**Impact**: Medium
**Mitigation**:
- All styling uses `sx` prop (MUI v9 compliance per `REQ-13`)
- Slot props preserve tier-specific styling
- Storybook stories verify visual parity (run in Phase 4.3)

### Risk 3: Cross-Tier Import Violations Introduced

**Likelihood**: Low
**Impact**: High
**Mitigation**:
- `REQ-12` explicitly forbids cross-tier imports
- Per-task quality loop includes `bun run scripts/lint-service.ts` which catches cross-tier violations
- Phase 2.5 mid-point review includes cross-tier import audit

### Risk 4: Within-Common Consolidation Breaks Consumers

**Likelihood**: Medium
**Impact**: Medium
**Mitigation**:
- Phase 3 tasks include "update all importers" as a mandatory step
- Per-task quality loop verifies all imports resolve
- Phase 4.3 full test suite catches missed importers

### Risk 5: Test Suite Deferral (Like Predecessor Plan)

**Likelihood**: Low
**Impact**: High
**Mitigation**:
- `REQ-8.3` mandates the full test suite SHALL actually run (no deferral)
- tsgo is now clean (0 errors), so `bun run build:test` will succeed
- Phase 4.3 outcome file documents actual test results (not deferred)

## Design Checklist

- [x] All requirements addressed in design (REQ-0 through REQ-13, NFR-1 through NFR-5, CON-1 through CON-6)
- [x] Component responsibilities well-defined (Pattern A, B, C)
- [x] Interfaces between components specified (scaffold slot props)
- [x] Error handling covers expected failures (Risk Analysis section)
- [x] Security considerations addressed (no security-sensitive changes — pure refactoring)
- [x] UX/Navigation Specification complete (no changes — pure refactoring)

---

**Status**: Draft v1.0
**Date**: 2026-08-10
