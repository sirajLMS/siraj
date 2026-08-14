# Plan Review R1: Code Duplication Elimination — Phase 5

**Reviewer:** plan-review skill (automated)
**Date:** 2026-08-11
**Plan files reviewed:**
- `.ai/plans/duplications-phase5/requirements.md`
- `.ai/plans/duplications-phase5/design.md`
- `.ai/plans/duplications-phase5/tasks.md`
- `.ai/plans/duplications-phase5/deferred-items.md`

## Affected Architecture Layers

| Layer | Files Touched | AGENTS.md Applied |
|-------|---------------|-------------------|
| `frontend/views/` | All Phase 2-4 view scaffold tasks | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md` |
| `frontend/common/components/ui/` | Phase 2-4 UI component scaffold tasks | `frontend/AGENTS.md`, root `AGENTS.md` |
| `frontend/common/views/` | Phase 2-4 view scaffold tasks | `frontend/views/AGENTS.md`, `frontend/AGENTS.md`, root `AGENTS.md` |
| `shared/lib/` | Phase 1 cross-layer consolidation (enum.ts, logger) | `shared/AGENTS.md`, root `AGENTS.md` |
| `shared/locale/types/` | Phase 1 Task 1.3 evaluation | `shared/AGENTS.md`, root `AGENTS.md` |

## Rules Checked

| # | Rule | Source | Status |
|---|------|--------|--------|
| 1 | Type imports from `@/backend/types/{entity}.types.ts` | root `AGENTS.md` | ✅ N/A — plan doesn't touch backend types or Pothos |
| 2 | Server Components call services directly; Client Components use Apollo hooks | root `AGENTS.md` | ✅ Plan doesn't modify data fetching patterns |
| 3 | MUI v9: `sx` prop only (no style props on Typography, Stack, Box, Grid) | `frontend/AGENTS.md` | ✅ AC-9 explicitly enforces this. Design.md §2 lists MUI v9 compliance. |
| 4 | i18n: compile-time TypeScript system in `shared/locale/`, no hardcoded text | `shared/AGENTS.md`, `frontend/AGENTS.md` | ✅ Design.md §2 lists i18n compliance. Scaffold tasks must use `useAppTranslation`. |
| 5 | Logging: `logger` not `console.*` | `frontend/AGENTS.md` | ✅ Design.md §2 lists logging compliance. |
| 6 | DB test conventions: `runInRollback`, pass `tx`, no `expect().rejects.toThrow()` | root `AGENTS.md` | ✅ N/A — plan explicitly excludes all server tests (§3 No-Server-Tests Policy) |
| 7 | GraphQL documents: `{Entity}QueryDocument`, include `id` field, import from `@apollo/client/react` | root `AGENTS.md`, `frontend/common/graphql/AGENTS.md` | ✅ N/A — plan doesn't modify GraphQL documents |
| 8 | `shared/` layer isolation: never import from `@/frontend/**`, `@/backend/**`, `@/app/**` | `shared/AGENTS.md` | ✅ Phase 1 consolidates canonical source INTO shared/. Design direction correct. |
| 9 | Cross-layer types go in `shared/types/` | `shared/AGENTS.md` | ✅ N/A — plan doesn't add cross-layer types |
| 10 | `__shared__/` directory for view component scaffolds | `frontend/views/AGENTS.md` §"__shared__/ Directory Convention" | ✅ Design.md §1.3 and AC-2 explicitly use this pattern. |
| 11 | Desktop/mobile variants import ONLY from `__shared__/` — never from each other | `frontend/views/AGENTS.md`, `frontend/AGENTS.md` | ✅ AC-3 enforces direct file path imports. Design.md §2 "No barrel re-exports". |
| 12 | No `useMediaQuery` / `useViewport` in `.mobile.tsx` / `.desktop.tsx` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | ✅ AC-6: "Scaffolds must be tier-agnostic." Hooks stay in variant files. |
| 13 | Mobile/desktop views are pure presentation (zero business logic) | `frontend/views/AGENTS.md` | ✅ Scaffold pattern preserves this — scaffolds contain presentation logic, variants pass slot props. |
| 14 | Direct file path imports, no barrel `index.ts` re-exports for scaffolds | `docs/frontend/ui-shared-scaffold-pattern.md` | ✅ AC-3 explicitly enforces this. Design.md §2, Decision 5. |
| 15 | No `oxlint-disable` comments | root `AGENTS.md`, `frontend/AGENTS.md` | ✅ Design.md §2 explicitly lists this. |
| 16 | No hardcoded colors — all from theme palette | `frontend/AGENTS.md` | ✅ Design.md §2 theme compliance listed. |
| 17 | State serialization (no non-serializable in persist Zustand) | `frontend/views/AGENTS.md` | ✅ N/A — plan doesn't modify Zustand stores |
| 18 | Metric cards: use `*MetricCardGrid`, not individual `MetricCard` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | ✅ N/A — plan doesn't create metric card components |
| 19 | Functional components only (no class components) | `frontend/views/AGENTS.md` | ✅ Scaffold pattern uses functional components. |
| 20 | `@/` path alias for all imports | root `AGENTS.md`, `shared/AGENTS.md`, `frontend/AGENTS.md` | ✅ Design.md uses `@/` alias throughout examples. |

## Findings

### CRITICAL: 0

No critical violations found.

### HIGH: 0

No high-severity violations found.

### MEDIUM: 2

**M1: Task 2.10 references deprecated `frontend/views/dashboard` path but doesn't specify deletion criteria**

- **Location:** `tasks.md` Task 2.10
- **Rule:** `frontend/views/AGENTS.md` note: "Only `frontend/views/dashboard/config/` (navigationConfig) and any residual non-switcher view trees remain."
- **Issue:** The task says "Verify this directory is empty or contains no active code" but doesn't mention that `frontend/views/AGENTS.md` explicitly documents that `frontend/views/dashboard/config/` is a known residual. The task should reference this exception.
- **Recommendation:** Add a note to Task 2.10: "Per `frontend/views/AGENTS.md`, `frontend/views/dashboard/config/` (navigationConfig) is a known residual — do not delete it."
- **Severity:** Medium (could cause accidental deletion of active config)

**M2: Task 1.1 `enum.ts` consolidation — frontend may use GraphQL codegen types that shared cannot import**

- **Location:** `tasks.md` Task 1.1
- **Rule:** `shared/AGENTS.md`: "NEVER import from `@/frontend/**`, `@/backend/**`, or `@/app/**`" and "Frontend should use GraphQL codegen enums for API-facing types"
- **Issue:** The task says "If frontend uses GraphQL codegen types that shared doesn't have: extend `shared/lib/enum.ts` to include those types." But `shared/` cannot import GraphQL codegen types (they come from `frontend/common/graphql/generated/`). The extension would need to define native TypeScript enums with the same string values, not import codegen types.
- **Recommendation:** Clarify Task 1.1 step 2: "If frontend uses GraphQL codegen enum types, define equivalent native TypeScript enums in `shared/constants/{domain}.enum.ts` (per `shared/AGENTS.md` Shared Enums pattern) with matching string values. Do NOT import codegen types into shared/."
- **Severity:** Medium (could lead to shared/ layer isolation violation)

### LOW: 3

**L1: requirements.md §3 includes `bun run scripts/run-test/run-test.ts` in excluded commands**

- **Location:** `requirements.md` line 101
- **Issue:** The run-test script is a test runner wrapper, not inherently a server test. It CAN run non-server tests (e.g., unit tests). Excluding it entirely is overly conservative but safe.
- **Impact:** Minor — the plan is more restrictive than necessary, which is acceptable given the user's explicit constraint.

**L2: design.md Task 3.5 mentions `styled.tsx` consolidation but doesn't verify MUI v9 `styled()` API compatibility**

- **Location:** `design.md` Task 3.5
- **Issue:** The task says "Consolidate `styled.tsx` (styled components)" but doesn't explicitly mention MUI v9 `styled()` API changes. The sub-loop lint stage will catch violations, but a note would help subagents.
- **Recommendation:** Add to Task 3.5: "Verify MUI v9 `styled()` API — no direct style props, use `sx` in styled overrides."
- **Severity:** Low (sub-loop will catch)

**L3: tasks.md Phase 3 mentions "5 waves × 4 subagents" but lists 20 individual tasks (3.1-3.20)**

- **Location:** `tasks.md` Phase 3 header vs task list
- **Issue:** The phase header says "5 waves × 4 subagents" but 20 tasks are listed individually. This is fine — the waves are for dispatch orchestration, not task definition.
- **Severity:** Low (cosmetic)

## Verdict

✅ **Plan PASSES all AGENTS.md rules for affected layers.**

- 0 critical violations
- 0 high-severity violations
- 2 medium findings (M1, M2) — should be addressed before implementation
- 3 low findings (L1, L2, L3) — advisory

## Recommended Fixes Before Implementation

1. **M1:** Add `frontend/views/dashboard/config/` exclusion note to Task 2.10
2. **M2:** Clarify Task 1.1 step 2 to avoid shared/ importing GraphQL codegen types
3. **L2:** Add MUI v9 `styled()` note to Task 3.5
