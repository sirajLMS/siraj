# Design: Code Duplication Elimination — Phase 6

**Feature:** Code Duplication Elimination Phase 6 — Deferred P3 Micro Clusters & True Duplicate Resolution
**Version:** 2.0
**Date:** 2026-08-11

---

## Overview

Phase 6 addresses the items that all prior phases **explicitly deferred**: the 135 P3 micro cluster frontend pairs (11,090 tokens, deferred as D5-3 in Phase 5) and the 16 `shared/locale/` structural pairs (1,604 tokens, deferred as D5-1 "never" across all phases).

**CRITICAL:** Phase 6 uses a **single strategy — true code extraction**. No `jscpd:ignore` directives. No `.jscpd.json` ignore additions. Every clone pair is resolved by actual code changes: extracting shared scaffolds, utilities, constants, or deleting dead code.

This design builds on the established `*Shared.tsx` / `__shared__/` scaffold patterns from Phase 1-5 (see `docs/frontend/ui-shared-scaffold-pattern.md`), applying them to the small-clone residuals that prior phases deferred.

---

## Design Goals

- **G1:** Eliminate ≥100 of the 135 deferred P3 pairs via true code extraction (no suppression)
- **G2:** Reduce `shared/locale/` structural pairs by ≥50% via type consolidation
- **G3:** Maintain zero new errors across tsgo, oxlint, biome, lint, check:duplicates, codescene
- **G4:** Zero `jscpd:ignore` directives in the entire codebase
- **G5:** Zero changes to `.jscpd.json` (no new ignore patterns)
- **G6:** Document the scaffold extraction patterns for P3 micro clusters

---

## Architecture

### Single-Strategy Model: True Code Extraction

Unlike the original plan (which used two strategies including jscpd-ignore), Phase 6 uses **one strategy only**:

```
┌─────────────────────────────────────────────────────────────┐
│              P3 Pair Triage Decision Tree                    │
│                                                             │
│  For each P3 pair:                                         │
│    Is the duplication a D↔M (desktop↔mobile) pair?          │
│         │                                                   │
│    YES → Create __shared__/*Shared.tsx scaffold             │
│         │  + *Shared.options.ts with DESKTOP/MOBILE_OPTIONS │
│         │  + Desktop/mobile become thin wrappers            │
│         │                                                   │
│    NO  → Is it a C↔C (common↔common) pair?                │
│         │                                                   │
│    YES → Extract shared utility/component to common/        │
│         │  OR delete dead code                              │
│         │  OR consolidate stores/hooks                     │
│         │                                                   │
│    NO  → Is it a C↔D or C↔M cross-tier pair?              │
│         │                                                   │
│    YES → Extend existing *Shared.tsx scaffold               │
│         │  OR create new shared component in common/        │
│         │                                                   │
│    NO  → Is it a D↔D or M↔M same-tier pair?               │
│         │                                                   │
│    YES → Create shared view scaffold in common/views/       │
│         │                                                   │
│    NO  → Is it a shared/locale structural pair?            │
│         │                                                   │
│    YES → Consolidate type definitions (Pick, base types)   │
└─────────────────────────────────────────────────────────────┘
```

### Pattern A: `__shared__/*Shared.tsx` Scaffold (for D↔M pairs)

**When to use:** Desktop and mobile variants share the bulk of their structure with only visual differences (spacing, sizing, typography variant).

**Mechanism:**
1. Create `frontend/common/views/dashboard/<domain>/components/__shared__/<componentName>Shared.tsx` containing ALL shared presentation logic.
2. Export a typed `<ComponentName>SharedOptions` interface for tier-specific config.
3. Create `frontend/common/views/dashboard/<domain>/components/__shared__/<componentName>Shared.options.ts` with `DESKTOP_OPTIONS` and `MOBILE_OPTIONS` constants.
4. Rewrite `frontend/desktop/views/.../<componentName>.desktop.tsx` to import and delegate to `*Shared` with `DESKTOP_OPTIONS`.
5. Rewrite `frontend/mobile/views/.../<componentName>.mobile.tsx` to import and delegate to `*Shared` with `MOBILE_OPTIONS`.

**Example (proven pattern from Phase 2):**

```typescript
// frontend/common/views/dashboard/classes/recurring/components/__shared__/dayScheduleRowShared.tsx
export interface DayScheduleRowSharedOptions {
  readonly containerSx: (theme: Theme) => Record<string, unknown>;
  readonly checkboxSize: "small" | "medium";
  readonly iconButtonSize: "small" | "medium";
  // ...
}

export function DayScheduleRowShared({ ...props, options }: Props & { options: Options }) {
  // ALL shared presentation logic here
}
```

```typescript
// frontend/common/views/dashboard/classes/recurring/components/__shared__/dayScheduleRowShared.options.ts
export const DESKTOP_ROW_OPTIONS: DayScheduleRowSharedOptions = { /* desktop sizing */ };
export const MOBILE_ROW_OPTIONS: DayScheduleRowSharedOptions = { /* mobile sizing */ };
```

```typescript
// frontend/desktop/views/dashboard/classes/recurring/components/dayScheduleRow.desktop.tsx
export function DayScheduleRowDesktop(props: DayScheduleRowProps) {
  return <DayScheduleRowShared {...props} options={DESKTOP_ROW_OPTIONS} />;
}
```

```typescript
// frontend/mobile/views/dashboard/classes/recurring/components/dayScheduleRow.mobile.tsx
export function DayScheduleRowMobile(props: DayScheduleRowProps) {
  return <DayScheduleRowShared {...props} options={MOBILE_ROW_OPTIONS} />;
}
```

### Pattern B: Shared Utility/Component Extraction (for C↔C pairs)

**When to use:** Two files in `frontend/common/` duplicate a utility function, constant, or small component.

**Mechanism:** Extract the shared element into a new file in an appropriate `frontend/common/` location and have both consumers import from it.

### Pattern C: Dead Code Deletion (for C↔C pairs where one file is unused)

**When to use:** A duplicated file is never imported anywhere.

**Mechanism:** Delete the dead file.

### Pattern D: Store/Hook Consolidation (for C↔C store/viewModel duplications)

**When to use:** Two stores or ViewModel hooks have similar shape and logic.

**Mechanism:** Create a shared factory or base hook that both derive from.

### Pattern E: Extend Existing Scaffold (for C↔D / C↔M pairs)

**When to use:** A common-tier file duplicates logic already in a `*Shared.tsx` scaffold, or the common file should BE the scaffold.

**Mechanism:** Move the shared logic into the existing `__shared__/` scaffold, or create a new one and have the common-tier file delegate to it.

### Pattern F: Shared View Scaffold (for D↔D / M↔M same-tier pairs)

**When to use:** Two desktop (or two mobile) views share a layout pattern.

**Mechanism:** Create a `__shared__/*Shared.tsx` in `frontend/common/views/` that both same-tier variants import. This follows the same pattern as D↔M but both consumers pass similar options.

### Pattern G: Locale Type Consolidation (for shared/locale pairs)

**When to use:** Locale namespace type files define identical type signatures across locales.

**Mechanism:**
- Extract common type bases into a shared interface in `shared/locale/types/`
- Use `Pick<>` or `Omit<>` to derive locale-specific subsets
- OR consolidate repeated type definitions into a single canonical type with locale-specific overrides
- NEVER break the compile-time type safety — the locale system must still type-check all translations

---

## P3 Category Breakdown & Approach

### Category 1: Desktop↔Mobile Triplication Residuals (70 pairs, 5,791 tokens)

D↔M pairs where desktop and mobile variants have small differences but share the bulk of their structure.

**Triage criteria:**
- If the D↔M pair shares a clear presentational structure with config differences → **create `__shared__/*Shared.tsx` scaffold** (Pattern A)
- If the D↔M pair is structurally different with only surface similarity → **extract the genuinely shared sub-block** into a smaller scaffold
- If the D↔M pair differs by only 1-2 lines that are truly visual config → **still extract to scaffold** with options (never suppress)

**Domain groupings (20 domains, ~104 unique desktop files):**
- permissions (15 files, 4812 tokens), teachers (16 files, 3785 tokens), components (11 files, 2240 tokens), students (8 files, 2145 tokens), billing (7 files, 1442 tokens), parent (6 files, 1440 tokens), complaints (6 files, 1131 tokens), profile (4 files, 1155 tokens), suggestions (4 files, 777 tokens), supervisor (4 files, 670 tokens), settings (5 files, 763 tokens), resources (3 files, 582 tokens), classes (3 files, 521 tokens), schedule (2 files, 568 tokens), tools (2 files, 372 tokens), reschedule (2 files, 378 tokens), cron (1 file, 265 tokens), search-schedule (1 file, 98 tokens), admin (3 files, 463 tokens), student (1 file, 428 tokens)

### Category 2: Common↔Common Intra-Layer (31 pairs, 2,527 tokens)

Files within `frontend/common/` from different domains duplicating each other.

**Triage criteria:**
- Dead code (one file never imported) → **delete dead file** (Pattern C)
- Shared utility function → **extract shared function** (Pattern B)
- Similar store/viewModel shape → **shared factory or base hook** (Pattern D)
- Similar component pattern → **extract shared component** (Pattern B)

### Category 3: Common↔Desktop Cross-Tier (12 pairs, 1,001 tokens)

Common tier base logic duplicated in desktop tier visual variants.

**Triage criteria:**
- Shares clear logic with minor visual variant → **extend existing `*Shared.tsx` scaffold** (Pattern E)
- Common file should BE the scaffold → **move to `__shared__/` and have both common and desktop delegate**

### Category 4: Common↔Mobile Cross-Tier (11 pairs, 887 tokens)

Same as C↔D but in mobile tier.

### Category 5: Desktop↔Desktop Same-Tier (7 pairs, 567 tokens)

Different desktop views with similar layouts.

**Triage criteria:**
- Shares a clear view pattern → **shared view scaffold in `frontend/common/views/`** (Pattern F)
- Same component family → **shared scaffold**

### Category 6: Mobile↔Mobile Same-Tier (4 pairs, 317 tokens)

Same as D↔D but in mobile tier.

### Category 7: `shared/locale/` Structural (16 pairs, 1,604 tokens)

**Approach: True type consolidation.** The compile-time TypeScript i18n system requires each locale namespace to define identical type signatures. The duplication is by design BUT can be reduced by:
- Extracting common type bases into shared interfaces
- Using `Pick<>` / `Omit<>` to derive locale-specific subsets
- Consolidating repeated type definitions

This requires careful analysis of each locale pair to find which type signatures can be consolidated without breaking the compile-time type safety.

---

## Dependency Rules (from `.dependency-cruiser.js` and `eslint.config.mjs`)

| Rule | Enforcement |
|------|------------|
| `shared/` must NOT import from `frontend/`, `backend/`, `app/` | ESLint + dependency-cruiser |
| `frontend/` must NOT import from `backend/` | ESLint + dependency-cruiser |
| `.desktop.tsx` must NOT import from `@/frontend/mobile/` | ESLint |
| `.mobile.tsx` must NOT import from `@/frontend/desktop/` | ESLint |
| `.desktop.tsx` / `.mobile.tsx` must NOT use `useMediaQuery` or `useViewport` | ESLint |
| Tier views must NOT use `useAppTranslation` — labels via props | ESLint |
| All imports must use `@/` path alias | ESLint |

**Shared logic placement:**
- View scaffolds → `frontend/common/views/dashboard/<domain>/components/__shared__/`
- UI scaffolds → `frontend/common/components/ui/<category>/`
- Both desktop and mobile import from `common/` — never from each other

---

## Critical Policies

| Policy | Rule | Source |
|--------|------|--------|
| No `jscpd:ignore` | NEVER add `// jscpd:ignore-start/end` — fix by code extraction | User requirement |
| No `.jscpd.json` changes | NEVER add ignore patterns for existing code | User requirement |
| No barrel re-exports | Avoid `export * from` — TDZ risk in ESM | `frontend/AGENTS.md` |
| MUI v9 sx prop only | No `fontWeight`, `mb`, etc. as direct props | `frontend/AGENTS.md` |
| `*Outlined` icon naming | `ErrorOutline` → `ErrorOutlined` | `frontend/AGENTS.md` |
| No `oxlint-disable` | Fix root cause, never suppress | `AGENTS.md` |
| logger not console | `import { logger } from '@/frontend/utils/logger'` | `AGENTS.md` |
| i18n via useAppTranslation | No hardcoded user-facing strings | `shared/AGENTS.md` |
| No server tests | See No-Server-Tests Policy in requirements.md | requirements.md |

---

## Task Architecture

### Phase 0: Baseline & Plan Review (Serial)
- Task 0.1: Capture baseline (jscpd, tsgo, biome) — already complete
- Task 0.2: Plan review via `@plan-review` skill — already complete

### Phase 1: `shared/locale/` Type Consolidation (Serial)
- Task 1.1: Analyze and consolidate `shared/locale/` type definitions to reduce structural duplication
- Task 1.2: Verify locale pairs reduced via `bun check:duplicates`

### Phase 2: D↔M Triplication Residuals — Scaffold Extraction (Parallel Subagents)
- Task 2.1–2.9: 9 domain-grouped batches, each creating `__shared__/` scaffolds:
  - 2.1: permissions (15 files)
  - 2.2: teachers (16 files)
  - 2.3: components (11 files)
  - 2.4: students + student (9 files)
  - 2.5: billing (7 files)
  - 2.6: parent (6 files)
  - 2.7: complaints + suggestions (10 files)
  - 2.8: profile + settings + supervisor (13 files)
  - 2.9: resources + classes + schedule + tools + reschedule + cron + search-schedule + admin (15 files)

### Phase 3: C↔C Intra-Layer — Utility Extraction (Parallel Subagents)
- Task 3.1–3.4: 4 batches of ~8 pairs each

### Phase 4: Cross-Tier & Same-Tier (Parallel Subagents)
- Task 4.1: C↔D & C↔M cross-tier pairs (23 pairs)
- Task 4.2: D↔D same-tier pairs (7 pairs) — shared view scaffolds
- Task 4.3: M↔M same-tier pairs (4 pairs) — shared view scaffolds

### Phase 5: Review Gates
- Task 5.1: Mid-point review after Phase 4
- Task 5.2: Post-implementation review
- Task 5.3: Final quality gate

### Phase 6: Residual Sweep & Knowledge Propagation
- Task 6.1: Post-implementation residual sweep
- Task 6.2: Update `docs/frontend/duplication-elimination-patterns.md` with scaffold extraction patterns
- Task 6.3: Update AGENTS.md files with P3 resolution patterns
- Task 6.4: Final jscpd comparison vs baseline

---

## Parallelism Strategy

### Subagent Pool: 8 max concurrent

Each subagent handles one domain group (for Phase 2) or one batch of pairs (for Phases 3-4):

```
Phase 2 (D↔M): 9 domain batches, 4-5 concurrent max
Phase 3 (C↔C): 4 batches, 4 concurrent max
Phase 4 (cross-tier + same-tier): 3 tasks, 3 concurrent max
```

### Subagent Task Template

Each subagent receives:
1. A list of clone pairs with file paths, token counts, and line ranges
2. The triage decision tree (from this design)
3. Instruction to **extract shared code** (create scaffold, utility, or delete dead code)
4. Quality verification: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified file
5. Outcome file: `.ai/plans/duplications-phase6/outcome/<task-id>-outcome.md`
6. **MUST read ALL plan files** in `.ai/plans/duplications-phase6/` before starting work

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| R1: Scaffold extraction too aggressive — breaking component behavior | Medium | High | Each scaffold MUST preserve exact rendering. Verify with sub-loop (tsgo + oxlint + biome + lint + codescene). Desktop/mobile wrappers must produce identical output. |
| R2: Breaking the i18n type system with locale consolidation | Low | High | Locale type consolidation MUST preserve compile-time type safety. Use `Pick<>`/`Omit<>` not type erasure. Verify with tsgo. |
| R3: Cross-dependency violations | Medium | High | All shared code goes to `common/`. Desktop/mobile import from common only. Sub-loop includes lint which enforces dependency rules. |
| R4: P3 pairs too small to scaffold meaningfully | Medium | Low | Even small pairs can be scaffolded — the options pattern handles 1-line differences. Every pair gets a real fix. |
| R5: Subagent edit conflicts (same file in multiple pairs) | Medium | Medium | Group by file, not by pair. Fix all pairs touching the same file in a single subagent task. |
| R6: Phase 4/5 not complete when residual sweep runs | High | Low | Residual sweep task is conditional — may be deferred. P3 triage is independent. |

---

## Edge Cases

1. **A P3 pair that Phase 5 already fixed** — Check git diff before starting. If already fixed, skip and note in outcome.
2. **A P3 pair where one file is deleted by Phase 4** — If Phase 4 deletes a file, the pair disappears. Skip it.
3. **Multiple P3 pairs sharing the same file** — Group by file, not by pair. Fix all pairs touching the same file in a single subagent task.
4. **A D↔M pair where the scaffold already exists** — Extend the existing scaffold rather than creating a new one.
5. **A locale pair where consolidation would break type safety** — Document as deferred with technical rationale. This is the ONLY acceptable deferral.
6. **P3 pair token count changed after Phase 5** — Re-run jscpd before triage to get current counts.

---

## Knowledge Propagation Targets

| Artifact | Update |
|----------|--------|
| `docs/frontend/duplication-elimination-patterns.md` | Add "P3 Micro Cluster Scaffold Extraction" section with patterns A-G |
| `AGENTS.md` (root) | Add Phase 6 outcome reference to Important References |
| `.ai/plans/duplications-phase6/outcome/` | Per-task outcome files documenting extraction decisions |
