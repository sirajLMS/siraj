# Requirements: Code Duplication Elimination — Phase 5

**Feature:** Code Duplication Elimination Phase 5 — Frontend Triplication & Duplication Focus
**Version:** 1.0
**Date:** 2026-08-11
**Predecessors:**
- `.ai/plans/duplications/` (Phase 1 — 1,021 → 819 clones)
- `.ai/plans/duplications-phase2/` (Phase 2 — 819 → 823, frontend 718 → 457 TSX)
- `.ai/plans/duplications-phase3/` (Phase 3 — 580 → claimed 95; actual 522 currently)
- `.ai/plans/duplications-phase4/` (Phase 4 — 522 baseline, backend/shared/app/scripts focus, IN PROGRESS — other session)

---

## 1. Overview

### 1.1 Motivation

Despite four prior plans, `bun check:duplicates` reports **522 clones** (as of 2026-08-11). Phase 4 addresses 52 non-frontend pairs (backend, shared, app, scripts). **Phase 5 targets the 470 frontend↔frontend clone pairs** exclusively — the dominant category (90% of all clones, 64,932 duplicated tokens across 137 clusters).

These clones arise from the **responsive three-tier architecture** (`common/`, `desktop/`, `mobile/`) where the same UI component is implemented in multiple tiers with minor visual variations. The established `*Shared.tsx` scaffold pattern (documented in `docs/frontend/ui-shared-scaffold-pattern.md`) was successfully applied in Phases 1-3 to eliminate 30+ component triplications. Phase 5 extends this pattern to the remaining 137 clusters.

### 1.2 Scope

**In scope (470 frontend↔frontend clone pairs across 137 clusters, 64,932 tokens):**

| Priority | Clusters | Pairs | Tokens | Description |
|----------|----------|-------|--------|-------------|
| P0 (Top 10) | 10 | 146 | 22,648 | Highest-token clusters — `__shared__/` scaffold creation |
| P1 (Medium 20) | 20 | 140 | ~22,000 | UI component + view scaffolds |
| P2 (Small 49) | 49 | 49 | 6,242 | Single-pair clusters — case-by-case scaffold or consolidation (⛔ NO jscpd:ignore) |
| P3 (Micro 58) | 58 | 135 | ~14,000 | Low-token clusters — batch or defer |

**Also in scope (6 frontend↔shared cross-layer pairs, 551 tokens):**
| Pair | Tokens | Action |
|------|--------|--------|
| `frontend/common/lib/enum.ts` ↔ `shared/lib/enum.ts` | 84 | Deduplicate cross-layer enum utility |
| `frontend/common/lib/logger/index.ts` ↔ `shared/lib/logger/base-logger.ts` | 79 | Consolidate logger (shared is canonical) |
| `frontend/common/views/.../useClassDetailsLabels.ts` ↔ `shared/locale/types/...` (3 pairs) | 331 | Locale type duplication (structural — document in deferred-items.md, ⛔ NO jscpd:ignore) |
| `frontend/common/views/.../recurringSchedulesListViewModel.types.ts` ↔ `shared/locale/types/...` | 79 | Locale type (structural — document in deferred-items.md, ⛔ NO jscpd:ignore) |

**Out of scope (explicit):**
- Everything Phase 4 covers (backend, shared non-locale, app, scripts, codegen)
- `shared/locale/**` intra-namespace clones (16 pairs — by-design structural duplication from i18n pattern)
- Test file duplications (excluded via `.jscpd.json`)
- Any test requiring a Next.js server (see §3 below)

### 1.3 The Three-Tier Duplication Problem

The siraj frontend follows a **responsive three-tier architecture**:

```
frontend/common/components/ui/<category>/<Component>/
  <Component>.tsx                    # Common tier (shared logic + neutral styling)
frontend/desktop/components/ui/<category>/<component>/
  <component>.desktop.tsx            # Desktop variant (breakpoint-specific)
frontend/mobile/components/ui/<category>/<component>/
  <component>.mobile.tsx             # Mobile variant (breakpoint-specific)
```

When desktop and mobile variants share significant presentation logic but have minor visual differences, the `*Shared.tsx` scaffold pattern extracts the shared logic into a scaffold component with `slotProps` for tier-specific customization. This eliminates the triplication.

**Two scaffold placement patterns exist:**

| Pattern | Location | When to Use |
|--------|----------|-------------|
| UI Component Scaffold | `frontend/common/components/ui/<category>/<Component>/<Component>Shared.tsx` | Triplication (common + desktop + mobile) |
| View Component Scaffold | `frontend/common/views/dashboard/<domain>/components/__shared__/<componentName>Shared.tsx` | Duplication (desktop ↔ mobile only, no common) |

---

## 2. Goals

| Goal | Target | Verification |
|------|--------|--------------|
| G1 | Eliminate ≥250 of 470 frontend clone pairs (~53%) | `bun check:duplicates` re-run |
| G2 | Reduce total clones from 522 to ≤300 (~43% overall) | `bun check:duplicates` re-run |
| G3 | Zero tsgo errors net-new | `bun tsgo` |
| G4 | Zero new oxlint/biome/lint errors | `sub-loop.ts --lifecycle codescene` per file |
| G5 | Zero runtime behavioral changes | Semantic review checklist per task |
| G6 | All new scaffolds follow `*Shared.tsx` pattern per `docs/frontend/ui-shared-scaffold-pattern.md` | Code review |

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

### AC-1: Frontend clone count reduction
**WHEN** all Phase 5 tasks are complete, **THE SYSTEM SHALL** report ≤300 total clones via `bun check:duplicates`, **PROVIDED THAT** Phase 4 is also complete (Phase 4 targets 52 non-frontend pairs that must also be eliminated to reach 300).

### AC-2: `*Shared.tsx` scaffold pattern compliance
**WHEN** a new scaffold is created, **THE SYSTEM SHALL** place it at the correct path per `docs/frontend/ui-shared-scaffold-pattern.md`:
- UI component triplication → `frontend/common/components/ui/<category>/<Component>/<Component>Shared.tsx`
- View component duplication → `frontend/common/views/dashboard/<domain>/components/__shared__/<componentName>Shared.tsx`
- **AND** the scaffold must export a typed `SlotProps` interface
- **AND** must use MUI v9 `sx` prop for ALL styling (no direct style props)
- **AND** must import scaffold via direct file path (not barrel `index.ts`)

### AC-3: Circular dependency prevention
**WHEN** a desktop or mobile variant imports a scaffold, **THE SYSTEM SHALL** use a direct file path import (e.g., `@/frontend/common/views/dashboard/<domain>/components/__shared__/fooShared`), never a barrel `index.ts` re-export, to prevent TDZ errors.

### AC-4: No behavioral change
**WHEN** a scaffold extraction replaces triplicated code, **THE SYSTEM SHALL** preserve all existing visual and interactive behavior. The desktop and mobile variants must render identically to before the refactor.

### AC-5: No new code quality issues
**WHEN** any file is modified, **THE SYSTEM SHALL** pass `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` with zero errors (tsgo + oxlint + biome + lint + check:duplicates + codescene).

### AC-6: Tier isolation maintained
**WHEN** a desktop variant uses `useViewport` or `useMediaQuery`, **THE SYSTEM SHALL** keep that hook call in the `.desktop.tsx` or `.mobile.tsx` file itself, not in the scaffold. Scaffolds must be tier-agnostic.

### AC-7: Cross-layer pairs addressed
**WHEN** a `frontend↔shared` duplicate is identified, **THE SYSTEM SHALL** either:
- Consolidate to `shared/` (canonical) and repoint frontend import, OR
- Document in `deferred-items.md` why it cannot be consolidated (e.g., layer-specific type constraints)

### AC-8: Byte-identical pairs eliminated first
**WHEN** a desktop↔mobile pair is byte-identical (only export function name differs), **THE SYSTEM SHALL** delete one variant and re-export from the other (Pattern 1: canonical source deletion), rather than creating an unnecessary scaffold.

### AC-9: MUI v9 compliance
**WHEN** scaffold code uses MUI components, **THE SYSTEM SHALL** use `sx` prop for all styling. No direct style props (`fontWeight`, `textAlign`, `mb`, `mt`, `p`, `display`, etc.) on Typography, Stack, Box, Grid. Icon naming uses `*Outlined` (not `*Outline`). See `frontend/AGENTS.md`.

### AC-10: ⛔ No jscpd:ignore comments (CRITICAL)
**THE SYSTEM SHALL NEVER** add `jscpd:ignore-start` / `jscpd:ignore-end` comments (or any jscpd ignore directive) to any file as a means of "resolving" a duplicate. **Every duplicate MUST be truly eliminated** via one of:
- Pattern A: `*Shared.tsx` scaffold with slot props (for desktop↔mobile↔common triplication)
- Pattern B: `__shared__/` directory scaffold (for desktop↔mobile duplication with no common tier)
- Pattern C: Canonical source deletion (for byte-identical pairs — delete one, re-export from other)
- Consolidation within a tier (for intra-common, intra-desktop, intra-mobile pairs)
- Cross-layer consolidation to `shared/` (for frontend↔shared pairs)

**If a duplicate cannot be eliminated via these patterns**, it MUST be documented in `deferred-items.md` with a structural justification — **NOT suppressed with jscpd:ignore**.

### AC-11: Cross-tier import rules (ESLint + dependency-cruiser compliance)
**THE SYSTEM SHALL** place all shared scaffolds in `frontend/common/` (either `components/ui/<category>/<Component>/<Component>Shared.tsx` or `views/dashboard/<domain>/components/__shared__/<name>Shared.tsx`). Desktop and mobile variants **MUST** import scaffolds from `frontend/common/` — never from each other's tier directories.

**Enforced by:**
- ESLint `no-restricted-imports` regex: `*.mobile.tsx` files cannot import `*.desktop.tsx` and vice versa
- `.dependency-cruiser.js`: Cross-tier imports are forbidden
- Scaffolds MUST be tier-agnostic: no `useMediaQuery`, `useViewport`, or `ViewportContext` imports in scaffold files

**Verification**: `bun run scripts/health/sub-loop.ts <scaffold-file> --lifecycle codescene` will fail if scaffold imports from desktop or mobile tier.

---

## 5. Key Design Decisions

1. **Focus on frontend only.** Phase 4 handles backend/shared/app/scripts. Phase 5 handles frontend↔frontend exclusively. No overlap.
2. **Top 10 clusters first.** 34.9% of all frontend duplicated tokens are in 10 clusters. These are the highest ROI.
3. **`__shared__/` directory for view scaffolds.** When a desktop↔mobile pair has no tier-neutral `common` variant, create a `__shared__/` directory at `frontend/common/views/dashboard/<domain>/components/__shared__/`.
4. **Direct imports, no barrels.** Circular dependency prevention per `docs/frontend/ui-shared-scaffold-pattern.md` — always use direct file paths.
5. **Byte-identical pairs → delete, not scaffold.** If desktop↔mobile files are byte-identical (only function name differs), delete one and re-export from the other (Pattern 1).
6. **Single-pair clusters → batch scaffold.** 49 clusters have only 1 pair each (6,242 tokens total). Low ROI for individual scaffolds — batch similar ones by domain. **⛔ NEVER use `jscpd:ignore` — always create a proper scaffold or consolidate.**
7. **Cross-layer pairs → consolidate to `shared/`.** 6 frontend↔shared pairs involve `enum.ts`, `logger`, and locale types. Consolidate canonical source to `shared/` per AGENTS.md cross-layer rules.
