# Requirements: Code Duplication Elimination — Phase 7

**Feature:** Code Duplication Elimination Phase 7 — Within-File Clones, Cross-Layer Utilities & Residual Sweep
**Version:** 1.0
**Date:** 2026-08-11
**Predecessors:**
- `.ai/plans/duplications/` (Phase 1 — 1,021 → 819 clones, frontend triplication + shared + locale + test runners)
- `.ai/plans/duplications-phase2/` (Phase 2 — 819 → 580 clones, frontend UI scaffolds + within-common/within-tier consolidation)
- `.ai/plans/duplications-phase3/` (Phase 3 — 580 → 522 clones, backend services + repos + schema + GraphQL + app router + test infra)
- `.ai/plans/duplications-phase4/` (Phase 4 — 522 baseline, backend/shared/app/scripts focus, IN PROGRESS — other session)
- `.ai/plans/duplications-phase5/` (Phase 5 — 505 baseline, frontend↔frontend all 470 pairs + 6 cross-layer, IN PROGRESS — this session)
- `.ai/plans/duplications-phase6/` (Phase 6 — 504 baseline, P3 micro clusters + locale structural ignore, PLANNED)

---

## 1. Overview

### 1.1 Motivation

Despite six prior phases, `bun check:duplicates` reports **504 clones** (68,194 duplicated tokens) across 3,131 files. Phases 4, 5, and 6 together claim to cover all 504 pairs. However, three categories of duplication are **NOT covered** by any prior phase:

1. **Within-file (self) clones** — 17 pairs, 1,815 tokens — where a section of code in a file duplicates another section in the **same** file. These are a fundamentally different refactoring pattern (local helper extraction, not shared file extraction) and are not addressed by any prior phase's scope.

2. **Cross-layer utility duplication** — 2 frontend↔shared pairs (163 tokens) — `enum.ts` and `logger` — where frontend and shared layers have parallel implementations of the same utility. Phase 5 mentions these but does not provide detailed implementation tasks for the architectural alignment required.

3. **Post-implementation residual sweep** (D6-1) + **Unfixable non-structural pairs** (D6-2) — Phase 6 defers both to "Phase 7+ or never." After Phases 4, 5, and 6 are actually executed, the residual clone landscape will shift. Phase 7 performs the final triage.

### 1.2 Scope

**In scope (19 specific clone pairs + residual sweep):**

| Category | Pairs | Tokens | Source |
|----------|-------|--------|--------|
| **Within-file clones — backend** (3 pairs) | 3 | 232 | jscpd same-file detection |
| **Within-file clones — frontend** (7 pairs) | 7 | 1,083 | jscpd same-file detection |
| **Within-file clones — shared/locale** (7 pairs) | 7 | 700 | jscpd same-file detection (Phase 6 ignores via config; Phase 7 evaluates) |
| **Cross-layer utility dedup** (2 pairs) | 2 | 163 | Phase 5 scope (enum.ts, logger) — carried forward as under-designed |
| **Post-implementation residual sweep** | TBD | TBD | Phase 6 deferred item D6-1 |
| **Unfixable non-structural triage** | TBD | TBD | Phase 6 deferred item D6-2 |

**Also in scope:**
- Evaluation of the 7 `shared/locale/**` within-file clones to determine: fix (local extraction within rich locale files) vs ignore (extend `.jscpd.json` to `shared/locale/**` which Phase 6 Task 1.1 also proposes)
- `.jscpd.json` configuration updates for within-file clones that are structural and unfixable
- Final post-Phase 4/5/6 residual jscpd sweep and triage

**Out of scope (explicit — covered by other phases):**
- Everything Phase 4 covers (backend↔backend cross-file, shared↔backend, app↔app, scripts↔scripts, codegen)
- Everything Phase 5 P0/P1/P2 covers (335 frontend↔frontend cross-file pairs)
- Everything Phase 6 covers (135 P3 frontend↔frontend micro cluster pairs + 16 shared/locale↔shared/locale cross-file pairs via ignore)
- Test file duplications (excluded via `.jscpd.json`)
- Any test requiring a Next.js server (see §3 below)

### 1.3 The Within-File Duplication Problem

Within-file clones are a distinct category. Prior phases all address **cross-file** duplication — where two different files share duplicating code, and the fix is to extract a shared module. Within-file clones occur when a **single file** contains two or more sections that duplicate each other. The refactoring pattern is different:

| Clone Type | Pattern | Example |
|-----------|---------|---------|
| Cross-file | Extract shared module, both files import it | Phase 1-6 approach |
| Within-file | Extract local helper function within the same file, both sections call it | **Phase 7 approach** |
| Within-file (structural) | jscpd-ignore directive if the duplication is by-design | Phase 7 alternative |

**17 within-file clones identified:**

| File | Pairs | Tokens | Lines | Category |
|------|-------|--------|-------|----------|
| `frontend/common/views/dashboard/config/navigationConfig.ts` | 2 | 342 | 1,108 | Repeating nav config blocks |
| `frontend/common/views/dashboard/classes/details/useClassDetailsLabels.ts` | 1 | 164 | 290 | Repeating label lookup blocks |
| `frontend/common/views/dashboard/billing/components/InvoicePaymentDetailsDialog.tsx` | 1 | 142 | 893 | Repeating payment detail sections |
| `frontend/mobile/views/dashboard/students/quota/components/contextualHelperCards.mobile.tsx` | 1 | 83 | 103 | Repeating helper card components |
| `frontend/common/views/dashboard/admin/parents/students/types.ts` | 1 | 76 | 79 | Repeating type definitions |
| `frontend/common/views/dashboard/resources/types/resourcesTypes.ts` | 1 | 76 | 114 | Repeating type definitions |
| `shared/locale/types/errors/index.ts` | 2 | 189 | — | Repeating error type signatures |
| `shared/locale/ar/errors/index.ts` | 2 | 204 | — | Repeating Arabic error translations |
| `shared/locale/en/errors/index.ts` | 2 | 229 | — | Repeating English error translations |
| `shared/locale/types/dashboard/parents/onboarding.ts` | 1 | 78 | — | Repeating onboarding type signatures |
| `backend/graphql/mutation/billing/payment-method.mutation.ts` | 1 | 75 | — | Repeating mutation field blocks |
| `backend/graphql/pothos/scheduling/recurring-schedule.pothos.ts` | 1 | 77 | — | Repeating Pothos field definitions |
| `backend/graphql/query/scheduling/schedule.query.ts` | 1 | 80 | — | Repeating query resolver blocks |

### 1.4 The Cross-Layer Utility Problem

Two frontend↔shared pairs involve **parallel implementations** of the same conceptual utility, not simple copies:

**Pair 1: `frontend/common/lib/enum.ts` (348 lines) ↔ `shared/lib/enum.ts` (263 lines) — 84 tokens**

The frontend version imports GraphQL codegen enum types and uses browser-side parsing. The shared version imports backend enum types and `@/shared/constants`. Both define `BookingStatus`, `parseBookingStatus`, etc. but with different type sources and implementation details. Consolidating requires aligning the type sources or splitting the interface.

**Pair 2: `frontend/common/lib/logger/index.ts` (263 lines) ↔ `shared/lib/logger/base-logger.ts` (99 lines) — 79 tokens**

The frontend `ClientLogger` class uses browser APIs (`/api/logs` endpoint, `sessionId`, batch queue, `NEXT_PUBLIC_ENABLE_LOGGING`). The shared `BaseLogger` abstract class uses Node.js APIs (`fs/promises`, `process.cwd()`, file-based logging, `ENABLE_LOGGING`). Both share a common concept (log levels, enabled flag) but the implementations are environment-specific.

These require architectural decisions:
- Can the shared `BaseLogger` be extended by `ClientLogger` (inheritance)?
- Can the shared `enum.ts` define the canonical types that frontend re-exports?
- Or are these intentionally parallel implementations that should be jscpd-ignored?

---

## 2. Goals

| Goal | Target | Verification |
|------|--------|--------------|
| G1 | Eliminate/triage all 17 within-file clone pairs | `bun check:duplicates` shows ≤487 total clones (17 fewer) |
| G2 | Resolve the 2 cross-layer utility pairs (fix or document as structural) | `bun check:duplicates` shows ≤485 total or documented in deferred-items |
| G3 | Zero tsgo errors net-new | `bun tsgo` |
| G4 | Zero new oxlint/biome/lint errors | `sub-loop.ts --lifecycle codescene` per file |
| G5 | Zero runtime behavioral changes | Semantic review checklist per task |
| G6 | Post-implementation residual sweep complete | Final jscpd triage report in outcome |
| G7 | All unfixable pairs documented | deferred-items.md updated with rationale |

---

## 3. ⛔ No-Server-Tests Policy (CRITICAL — Restated)

This plan NEVER runs any test requiring a Next.js server, GraphQL dev server, UI runtime, or external connection. Excluded commands:

| Command | Status |
|---------|--------|
| `bun run test:graphql` | ❌ NEVER |
| `bun run test:ui:components` | ❌ NEVER |
| `bun run test:ui:e2e` | ❌ NEVER |
| `bun run test:ui` | ❌ NEVER |
| `bun run build:test` | ❌ NEVER |
| `bun run build` | ❌ NEVER |
| `bun run test:db` / `:sequential` | ❌ NEVER |
| `bun run test:services` / `:sequential` | ❌ NEVER |
| `bun run test:integration` | ❌ NEVER |
| `bun run test:live-fx` / `:live-comm` | ❌ NEVER |
| `bun run test` (meta) | ❌ NEVER |
| `bun run scripts/run-test/run-test.ts <path>` | ❌ NEVER |

**Sole verification method:** `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (runs tsgo → oxlint → biome → lint:type-aware → check:duplicates → codescene — all read-only static analysis, no server).

---

## 4. Acceptance Criteria (EARS Format)

### AC-1: Within-file clone reduction
**WHEN** all Phase 7 within-file tasks are complete, **THE SYSTEM SHALL** report ≤487 total clones via `bun check:duplicates`, representing a reduction of ≥17 within-file pairs.

### AC-2: Within-file refactoring pattern
**WHEN** a within-file clone is triaged as "fix", **THE SYSTEM SHALL** extract a local helper function (or component, or constant block) within the same file such that both duplicated sections delegate to it, verified via `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`.

### AC-3: Within-file structural ignore
**WHEN** a within-file clone is triaged as "structural" (by-design duplication within a single file), **THE SYSTEM SHALL** add a `// jscpd:ignore-start` / `// jscpd:ignore-end` directive around the duplicated region with a comment explaining the structural reason.

### AC-4: Cross-layer utility resolution
**WHEN** the 2 cross-layer utility pairs (enum.ts, logger) are evaluated, **THE SYSTEM SHALL** either:
- Consolidate the duplicate to the canonical layer (`shared/`) and repoint imports, OR
- Document in `deferred-items.md` why the duplication is architecturally intentional (e.g., browser vs Node.js runtime, GraphQL codegen vs backend enum types)

### AC-5: Backend within-file clones
**WHEN** the 3 backend within-file clones are addressed, **THE SYSTEM SHALL** extract local helper functions for repeating field blocks in GraphQL Pothos/mutation/query files, following the `_*Fields(t, ...)` helper factory pattern documented in Phase 4.

### AC-6: Frontend within-file clones
**WHEN** the 7 frontend within-file clones are addressed, **THE SYSTEM SHALL** extract local helper functions, components, or constant arrays within the same file. Localization config arrays (`navigationConfig.ts`) may use shared config-builder helpers if the duplicated pattern is identical.

### AC-7: shared/locale within-file clones
**WHEN** the 7 `shared/locale/**` within-file clones are evaluated, **THE SYSTEM SHALL** either:
- Fix by extracting a local type/translation helper within the same file, OR
- Confirm that Phase 6 Task 1.1's `.jscpd.json` ignore of `shared/locale/**` suppresses these within-file pairs as well (no additional action needed if already ignored at directory level)

### AC-8: Post-implementation residual sweep
**IF** Phases 4, 5, and 6 are complete when Phase 7 reaches its residual sweep task, **THEN** the executing agent **SHALL** run `bun check:duplicates` and triage all remaining unaddressed clones into "fix", "ignore", or "defer" categories, updating `deferred-items.md`.

### AC-9: Unfixable pair documentation
**WHEN** the D6-2 unfixable non-structural pairs are triaged, **THE SYSTEM SHALL** either:
- Add `// jscpd:ignore` directives with "low-value" rationale, OR
- Document them in `deferred-items.md` as "permanently deferred" with justification

### AC-10: No code quality regressions
**WHEN** any file is modified, **THE SYSTEM SHALL** pass `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` with zero errors (tsgo + oxlint + biome + lint + check:duplicates + codescene).

### AC-11: Plan review
**WHEN** the plan is drafted, **THEN** the `@plan-review` skill **SHALL** be invoked and all violations **SHALL** be fixed before implementation begins.

### AC-12: Knowledge propagation
**WHEN** all tasks complete, **THEN** `docs/frontend/duplication-elimination-patterns.md` **SHALL** be updated with the within-file clone extraction pattern and cross-layer utility alignment guidance.

---

## 5. Key Design Decisions

1. **Within-file clones are the primary novel scope.** No prior phase addresses within-file (self-clone) duplication. Phase 7 introduces the local-helper-within-file pattern as a first-class refactoring strategy. This is distinct from the cross-file shared-module extraction used in Phases 1-6.

2. **Triage before fix.** Each within-file pair is evaluated individually: "fix" (local helper extraction) vs "structural" (jscpd-ignore directive). The approach depends on whether the duplication is actionable or by-design.

3. **Cross-layer utilities need architectural evaluation.** The `enum.ts` and `logger` pairs are not simple copies — they are parallel implementations for different runtime environments (browser vs Node.js). Phase 7 evaluates whether these can be consolidated via inheritance/re-export or whether they are architecturally intentional and should be jscpd-ignored.

4. **shared/locale within-file may be auto-resolved by Phase 6.** If Phase 6 Task 1.1 adds `shared/locale/**` to `.jscpd.json` ignore patterns, the 7 shared/locale within-file clones are automatically suppressed at the directory level. Phase 7 verifies this and only acts if Phase 6 has not been implemented.

5. **Residual sweep is conditional on Phases 4/5/6.** The final residual sweep task may find that Phases 4, 5, and 6 are still in progress. In that case, Phase 7 documents the current state and defers the sweep to a post-implementation task.

6. **Focus on things previous plans don't cover at all.** Phase 7 exclusively targets within-file clones (17 pairs, 1,815 tokens), cross-layer utility dedup (2 pairs, 163 tokens), and the deferred residual sweep (D6-1 + D6-2). Zero overlap with any active phase's cross-file scope.

7. **No-Server-Tests Policy is absolute.** All verification is via static analysis only (`sub-loop.ts --lifecycle codescene`). No GraphQL, UI, E2E, database, integration, or build tests are ever run.
