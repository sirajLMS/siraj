# Requirements: Code Duplication Elimination — Phase 6

**Feature:** Code Duplication Elimination Phase 6 — Deferred P3 Micro Clusters & True Duplicate Resolution
**Version:** 2.0
**Date:** 2026-08-11

**Predecessors:**
- `.ai/plans/duplications/` (Phase 1 — 1,021 → 819 clones, frontend triplication + shared + locale + test runners)
- `.ai/plans/duplications-phase2/` (Phase 2 — 819 → 580 clones, frontend UI scaffolds + within-common/within-tier consolidation)
- `.ai/plans/duplications-phase3/` (Phase 3 — 580 → 522 clones, backend services + repos + schema + GraphQL + app router + test infra)
- `.ai/plans/duplications-phase4/` (Phase 4 — 522 baseline, backend/shared/app/scripts focus)
- `.ai/plans/duplications-phase5/` (Phase 5 — 505 baseline, frontend↔frontend all 470 pairs + 6 cross-layer)

---

## 1. Overview

Despite five prior phases, `bun check:duplicates` reports **475 clones** (62,929 duplicated tokens). Phase 6 addresses the **deferred P3 micro cluster frontend pairs** (135 pairs, ~11,090 tokens, deferred as D5-3 in Phase 5) and the `shared/locale/` structural pairs (16 pairs, 1,604 tokens, deferred as D5-1).

### 1.1 CRITICAL POLICY: No jscpd:ignore — True Code Extraction Only

**Phase 6 does NOT use `jscpd:ignore` directives, `.jscpd.json` ignore additions, or any form of suppression.**

Every single clone pair MUST be resolved by **actual code changes**:
- Extract shared logic into `__shared__/*Shared.tsx` scaffolds with `*Shared.options.ts` config files
- Extract shared utilities, constants, or types into `frontend/common/`
- Delete dead code
- Consolidate duplicate stores/hooks/ViewModels

**No `// jscpd:ignore-start` / `// jscpd:ignore-end` directives.**
**No `.jscpd.json` ignore pattern additions.**
**No suppression of any kind. Only real code fixes.**

### 1.2 Problem Statement

The P3 micro clusters represent **135 small-clone pairs** scattered across the frontend. Each pair has ≤91 duplicated tokens. They fall into six categories:

1. **Desktop↔Mobile triplication residuals** (70 pairs, 5,791 tokens) — D↔M pairs where the visual difference is minimal. These need **`__shared__/*Shared.tsx` scaffold extraction** with config-object options for tier differences.

2. **Common↔Common intra-layer** (31 pairs, 2,527 tokens) — Files within `frontend/common/` duplicating each other. These need **shared utility extraction**, **dead code deletion**, or **store/hook consolidation**.

3. **Common↔Desktop cross-tier** (12 pairs, 1,001 tokens) — Common tier base logic duplicated in desktop tier. Candidates for **extending existing `*Shared.tsx` scaffolds**.

4. **Common↔Mobile cross-tier** (11 pairs, 887 tokens) — Same as C↔D but in mobile tier.

5. **Desktop↔Desktop same-tier** (7 pairs, 567 tokens) — Different desktop views with similar layouts. Candidates for **shared view scaffolds in `frontend/common/views/`**.

6. **Mobile↔Mobile same-tier** (4 pairs, 317 tokens) — Same as D↔D but in mobile tier.

The `shared/locale/` structural pairs (16 pairs, 1,604 tokens) represent the compile-time TypeScript i18n pattern. These need **true consolidation** — extract shared type bases or reduce redundant type definitions.

### 1.3 Scope

**In scope (151 specific clone pairs):**

| Category | Pairs | Tokens | Approach |
|----------|-------|--------|----------|
| P3 Desktop↔Mobile residuals | 70 | 5,791 | `__shared__/*Shared.tsx` scaffold extraction with options |
| P3 Common↔Common intra-layer | 31 | 2,527 | Shared utility extraction, dead code deletion, store consolidation |
| P3 Common↔Desktop cross-tier | 12 | 1,001 | Extend existing scaffold or create new shared component |
| P3 Common↔Mobile cross-tier | 11 | 887 | Same as C↔D |
| P3 Desktop↔Desktop same-tier | 7 | 567 | Shared view scaffold in `frontend/common/views/` |
| P3 Mobile↔Mobile same-tier | 4 | 317 | Shared view scaffold in `frontend/common/views/` |
| `shared/locale/` structural | 16 | 1,604 | Consolidate locale type definitions (true code fix) |

**Out of scope (explicit):**
- Everything Phase 4 covers (backend, shared non-locale, app, scripts)
- Everything Phase 5 P0/P1/P2 covers (335 frontend pairs)
- Test file duplications (excluded via `.jscpd.json`)
- Any test requiring a Next.js server

---

## 2. Goals

| Goal | Target | Verification |
|------|--------|--------------|
| G1: Eliminate 135 P3 micro cluster pairs | ≥100 pairs resolved via code extraction | `bun check:duplicates` shows ≥100 fewer pairs vs baseline |
| G2: Resolve `shared/locale/` pairs | `shared/locale/` pairs reduced by ≥50% | `bun check:duplicates` shows fewer locale pairs |
| G3: Maintain code health | Zero new tsgo/oxlint/biome/lint errors | `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` exit 0 per modified file |
| G4: No jscpd:ignore directives | ZERO `jscpd:ignore` directives in codebase | `grep -r "jscpd:ignore" frontend/ shared/` returns empty |
| G5: No .jscpd.json changes | `.jscpd.json` unchanged from pre-Phase 6 | `git diff HEAD -- .jscpd.json` shows no Phase 6 changes |
| G6: Knowledge propagation | Update docs with scaffold extraction patterns | `docs/frontend/duplication-elimination-patterns.md` updated |

---

## 3. Acceptance Criteria

1. **WHEN** Phase 6 starts, **THEN** the executing agent **SHALL** read all existing outcome files in `.ai/plans/duplications-phase6/outcome/` for prior context.

2. **WHEN** a P3 pair is triaged, **THEN** it **SHALL** be resolved via code extraction — either a shared scaffold, shared utility, shared constant, or dead code deletion.

3. **WHEN** a D↔M pair is resolved, **THEN** a `__shared__/*Shared.tsx` scaffold **SHALL** be created in `frontend/common/views/.../components/__shared__/` with a `*Shared.options.ts` file containing `DESKTOP_OPTIONS` and `MOBILE_OPTIONS`. Both desktop and mobile variants **SHALL** become thin wrappers that delegate to the scaffold.

4. **WHEN** a C↔C pair is resolved, **THEN** a shared utility, component, or constant **SHALL** be extracted into `frontend/common/` and both consumers **SHALL** delegate to it.

5. **WHEN** any file is modified, **THE SYSTEM SHALL** pass `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` with zero errors.

6. **NEVER** shall a `// jscpd:ignore-start` or `// jscpd:ignore-end` directive be added to any file.

7. **NEVER** shall `.jscpd.json` be modified to add ignore patterns for code that exists during Phase 6.

8. **WHEN** the plan is drafted, **THEN** the `@plan-review` skill **SHALL** be invoked and all violations **SHALL** be fixed before implementation begins.

9. **WHEN** all tasks complete, **THEN** knowledge propagation **SHALL** update `docs/frontend/duplication-elimination-patterns.md` with the scaffold extraction patterns.

---

## 4. No-Server-Tests Policy

| Command | Status | Reason |
|---------|--------|--------|
| `bun run test:graphql` | ❌ NEVER | Requires dev server |
| `bun run test:ui:e2e` | ❌ NEVER | Requires production server |
| `bun run test:ui:components` | ❌ NEVER | Requires Happy DOM + Apollo mocking |
| `bun run test:ui` | ❌ NEVER | Aggregates component + E2E |
| `bun run build:test` | ❌ NEVER | Builds production bundle for E2E |
| `bun run test:integration` | ❌ NEVER | Requires provider integrations |
| `bun run test:db` | ❌ NEVER | Requires DB server |
| `bun run test:services` | ❌ NEVER | Requires service-layer DB connections |
| `bun run test` | ❌ NEVER | Aggregates all tests including server-dependent |

**Sole verification method:** `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (runs tsgo → oxlint → biome → lint:type-aware → check:duplicates → codescene — all read-only static analysis, no server).

---

## 5. Dependency Rules (from `.dependency-cruiser.js` and `eslint.config.mjs`)

| Layer | Rule | Enforcement |
|-------|------|------------|
| `shared/` | Must NOT import from `frontend/`, `backend/`, or `app/` | ESLint `no-restricted-imports` + dependency-cruiser |
| `frontend/` | Must NOT import from `backend/` | ESLint `no-restricted-imports` + dependency-cruiser |
| `backend/` | Must NOT import from `frontend/` | ESLint `no-restricted-imports` + dependency-cruiser |
| `.desktop.tsx` files | Must NOT import from `@/frontend/mobile/` | ESLint `no-restricted-imports` |
| `.mobile.tsx` files | Must NOT import from `@/frontend/desktop/` | ESLint `no-restricted-imports` |
| `.desktop.tsx` / `.mobile.tsx` files | Must NOT use `useMediaQuery` or `useViewport` | ESLint `no-restricted-imports` |
| `.desktop.tsx` / `.mobile.tsx` views | Must NOT use `useAppTranslation` directly — labels via props from ViewModel | ESLint `no-restricted-imports` |
| All imports | Must use `@/` path alias, not relative `./` or `../` | ESLint `no-restricted-syntax` |

**Shared logic placement for D↔M pairs:**
- View component scaffolds → `frontend/common/views/dashboard/<domain>/components/__shared__/*Shared.tsx`
- UI component scaffolds → `frontend/common/components/ui/<category>/*Shared.tsx`
- Both desktop and mobile variants import from `common/` — never from each other.
