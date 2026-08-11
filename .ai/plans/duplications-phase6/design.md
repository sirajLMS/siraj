# Design: Code Duplication Elimination — Phase 6

**Feature:** Code Duplication Elimination Phase 6 — Deferred P3 Micro Clusters & Structural Noise Suppression
**Version:** 1.0
**Date:** 2026-08-11

---

## Overview

Phase 6 addresses the items that all prior phases **explicitly deferred**: the 135 P3 micro cluster frontend pairs (11,090 tokens, deferred as D5-3 in Phase 5) and the 16 `shared/locale/` structural pairs (1,604 tokens, deferred as D5-1 "never" across all phases). Phase 6 introduces a **two-strategy approach** — jscpd-ignore for structural duplication and micro-scaffold/shared utility extraction for fixable duplication — and concludes with a **post-Phase 4/5 residual sweep** to triage any remaining unaddressed clones.

This design builds on the established patterns from Phase 2 (`docs/frontend/duplication-elimination-patterns.md`) and the Phase 5 design (`design.md`), adding the jscpd-ignore strategy as a first-class tool.

---

## Design Goals

- **G1:** Eliminate or suppress ≥100 of the 135 deferred P3 pairs without introducing new technical debt
- **G2:** Permanently suppress `shared/locale/` structural noise via `.jscpd.json` configuration (zero code changes)
- **G3:** Maintain zero new errors across tsgo, oxlint, biome, lint, check:duplicates, codescene
- **G4:** Reduce total clone count to ≤300 after Phases 4, 5, and 6 are all complete
- **G5:** Document the jscpd-ignore strategy for future phases and projects

---

## Architecture

### Two-Strategy Model

Unlike Phases 4 and 5 (which used scaffolds as the primary strategy), Phase 6 uses two strategies depending on the nature of the duplication:

```
┌─────────────────────────────────────────────────────────┐
│              P3 Pair Triage Decision Tree               │
│                                                         │
│  For each P3 pair:                                     │
│    Is the duplication STRUCTURAL?                      │
│    (locale type signatures, MUI sx boilerplate,       │
│     similar-but-different configs, by-design pattern) │
│         │                                               │
│    YES → jscpd-ignore (Strategy A)                     │
│    NO  → Is the duplication FIXABLE with minimal effort?│
│         │                                               │
│    YES → Micro-scaffold / shared utility (Strategy B)  │
│    NO  → jscpd-ignore with documented rationale (A)   │
└─────────────────────────────────────────────────────────┘
```

### Strategy A: jscpd-ignore (Structural Suppression)

**When to use:** The duplicated code is structurally required by a pattern or framework and cannot be eliminated without breaking the pattern.

**Mechanism 1: `.jscpd.json` ignore patterns (directory-level)**

```json
{
  "ignore": [
    "**/node_modules/**",
    "**/.next/**",
    "**/*.test.*",
    "**/*.spec.*",
    "shared/locale/**"
  ]
}
```

**Mechanism 2: Inline `// jscpd:ignore` directives (file-level)**

```typescript
// jscpd:ignore-start
// Structural code that must be duplicated (e.g., MUI sx boilerplate)
// jscpd:ignore-end
```

**Mechanism 3: `.jscpd.json` `ignorePatterns` (code-level)**

```json
{
  "ignorePatterns": ["// jscpd:ignore-start[\\s\\S]*?// jscpd:ignore-end"]
}
```

### Strategy B: Micro-Scaffold / Shared Utility Extraction

**When to use:** The duplicated code is a function, constant, or small component that can be extracted and shared between the two consumers with minimal effort.

**Pattern B1: Shared utility function**

```typescript
// Before: CountryDisplay.tsx and LanguageDisplay.tsx both have identical Autocomplete boilerplate
// After: Extract shared displayAutocompleteShared.ts

// frontend/common/components/ui/display/displayAutocompleteShared.ts
export function renderDisplayAutocomplete<T>({ items, getValue, ...props }) { ... }
```

**Pattern B2: Shared presentational component (micro-scaffold)**

```typescript
// Before: teacherClassListView.desktop.tsx and teacherStudentsView.desktop.tsx have similar DataGrid layout
// After: Extract shared TeacherEntityListViewShared.tsx with config props

// frontend/common/views/dashboard/teachers/components/__shared__/TeacherEntityListViewShared.tsx
export function TeacherEntityListViewShared({ columns, rows, title }) { ... }
```

**Pattern B3: Shared constant/config**

```typescript
// Before: Two files both define identical GRID_COLUMN_CONFIG
// After: Extract to shared constants file, import in both
```

---

## P3 Category Breakdown & Approach

### Category 1: Desktop↔Mobile Triplication Residuals (70 pairs, 5,791 tokens)

These are D↔M pairs where the desktop and mobile variants have small differences (a breakpoint `sx` prop, a label, or a layout variant) but share the bulk of their structure.

**Triage criteria:**
- If the D↔M pair differs by ≤3 lines → **jscpd-ignore** (the difference is too small to scaffold)
- If the D↔M pair shares a clear presentational structure with 1-2 config differences → **micro-scaffold** (config-object variant from Phase 5 design.md)
- If the D↔M pair is structurally different with only surface similarity → **jscpd-ignore** (false positive)

**Example pairs:**
- `resourceFileTypeIcon.desktop.tsx` ↔ `resourceFileTypeIcon.mobile.tsx` (91 tokens) — likely identical icon + different wrapper → ignore
- `suggestionSocialProof.desktop.tsx` ↔ `suggestionSocialProof.mobile.tsx` (91 tokens) — similar → evaluate
- `studentQuota.desktop.tsx` ↔ `studentQuota.mobile.tsx` (90 tokens, multiple overlapping pairs) → micro-scaffold candidate

### Category 2: Common↔Common Intra-Layer (31 pairs, 2,527 tokens)

Files within `frontend/common/` from different domains duplicating each other. Phase 2 Task 3.3 already established this pattern — extract shared utilities or delete dead code.

**Triage criteria:**
- If the C↔C pair is dead code (one file never imported) → **delete dead file** (Phase 2 pattern)
- If the C↔C pair shares a utility function → **extract shared function**
- If the C↔C pair has similar but domain-specific logic → **jscpd-ignore**
- If the C↔C pair is a store/model duplication → **extract shared hooks or types**

**Example pairs:**
- `CountryDisplay.tsx` ↔ `LanguageDisplay.tsx` (89 tokens) — similar display component pattern → shared utility
- `useCreateParentOnboarding.ts` ↔ `useCreateTeacherOnboarding.ts` (88 tokens) — similar onboarding hooks → shared hook
- `dashboardStore.ts` ↔ `teacherDashboardStore.ts` (82 tokens) — similar store shape → shared store factory
- `searchScheduleStore.ts` ↔ `useSearchScheduleViewModel.ts` (81 tokens) — store↔viewmodel → evaluate (may be structural)

### Category 3: Common↔Desktop Cross-Tier (12 pairs, 1,001 tokens)

Common tier base logic duplicated in desktop tier visual variants. These are NOT triplication residuals — they are common↔desktop pairs where the common tier has the base logic and the desktop tier adds visual variants.

**Triage criteria:**
- If the C↔D pair shares clear logic with minor visual variant → extend existing `*Shared.tsx` scaffold or config
- If structural (MUI variant boilerplate) → jscpd-ignore

### Category 4: Common↔Mobile Cross-Tier (11 pairs, 887 tokens)

Same as C↔D but in mobile tier.

**Triage criteria:**
- Same as C↔D above — extend existing scaffold or jscpd-ignore

### Category 5: Desktop↔Desktop Same-Tier (7 pairs, 567 tokens)

Different desktop views with similar layouts. These are NOT triplication residuals — they are two unrelated desktop views that happen to share code structure.

**Triage criteria:**
- If the D↔D pair is structurally required by MUI DataGrid/Table conventions → **jscpd-ignore**
- If the D↔D pair shares a clear view pattern → **shared view scaffold**
- If the D↔D pair is the same component family (e.g., two billing views) → **shared view scaffold**

**Example pairs:**
- `teacherClassListView.desktop.tsx` ↔ `teacherStudentsView.desktop.tsx` (151 tokens) — teacher entity list views → shared scaffold
- `parentBilling.desktop.tsx` ↔ `userBillingProfile.desktop.tsx` (114 tokens) — billing views → shared scaffold
- `parentsDataGrid.desktop.tsx` ↔ `studentDirectoryDataGrid.desktop.tsx` (98 tokens) — admin data grids → shared DataGrid config

### Category 6: Mobile↔Mobile Same-Tier (4 pairs, 317 tokens)

Same as D↔D but in mobile tier.

**Example pairs:**
- `createSubjectDialog.mobile.tsx` ↔ `editSubjectDialog.mobile.tsx` (348 tokens!) — create/edit dialogs → shared dialog scaffold (high-value fix)
- `teacherClassListView.mobile.tsx` ↔ `teacherStudentsView.mobile.tsx` (129 tokens) — teacher entity list views → shared scaffold
- `recurringScheduleDetailView.mobile.tsx` ↔ `recurringSchedulesListView.mobile.tsx` (104 tokens) — schedule views → evaluate

### Category 7: `shared/locale/` Structural (16 pairs, 1,604 tokens)

**Approach: `.jscpd.json` config-only change.** Add `shared/locale/**` to the ignore patterns in `.jscpd.json`. Zero code changes. Zero risk.

This is the compile-time TypeScript i18n system where each locale namespace must define identical type signatures. The duplication is by design — eliminating it would break the type system. See `shared/AGENTS.md` for the i18n pattern.

---

## Critical Policies (Same as Phase 5)

| Policy | Rule | Source |
|--------|------|--------|
| No barrel re-exports | Avoid `export * from` — TDZ risk in ESM | `frontend/AGENTS.md` |
| MUI v9 sx prop only | No `fontWeight`, `mb`, etc. as direct props | `frontend/AGENTS.md` |
| `*Outlined` icon naming | `ErrorOutline` → `ErrorOutlined` | `frontend/AGENTS.md` |
| No oxlint-disable | Fix root cause, never suppress | `AGENTS.md` |
| logger not console | `import { logger } from '@/frontend/utils/logger'` | `AGENTS.md` |
| i18n via useAppTranslation | No hardcoded user-facing strings | `shared/AGENTS.md` |
| No server tests | See No-Server-Tests Policy in requirements.md | requirements.md |
| jscpd-ignore is allowed | Unlike `oxlint-disable`, jscpd-ignore is a configuration directive, not a lint suppression. It tells the duplication scanner to skip structural code that must be repeated. | This plan |

---

## Task Architecture

### Phase 0: Baseline & Plan Review (Serial)
- Task 0.1: Capture baseline (jscpd, tsgo, biome)
- Task 0.2: Plan review via `@plan-review` skill

### Phase 1: Structural Suppression (Serial)
- Task 1.1: `.jscpd.json` configuration — add `shared/locale/**` ignore
- Task 1.2: Verify locale pairs suppressed (jscpd reports 0 locale clones)

### Phase 2: P3 Triage & Fix — D↔M Residuals (Parallel Subagents)
- Task 2.1–2.4: 4 waves of ~15 pairs each, parallel subagents triage and fix/ignore

### Phase 3: P3 Triage & Fix — C↔C Intra-Layer (Parallel Subagents)
- Task 3.1–3.2: 2 waves of ~20 pairs each

### Phase 4: P3 Triage & Fix — C↔D, C↔M, D↔D & M↔M (Parallel Subagents)
- Task 4.1: C↔D & C↔M cross-tier pairs (23 pairs, 1,888 tokens)
- Task 4.2: D↔D same-tier pairs (7 pairs, 567 tokens)
- Task 4.3: M↔M same-tier pairs (4 pairs, 317 tokens)

### Phase 5: Review Gates
- Task 5.1: Mid-point review after Phase 4
- Task 5.2: Post-implementation review
- Task 5.3: Final quality gate

### Phase 6: Residual Sweep & Knowledge Propagation
- Task 6.1: Post-Phase 4/5 residual sweep (conditional — may defer)
- Task 6.2: Update `.jscpd.json` documentation
- Task 6.3: Update `docs/frontend/duplication-elimination-patterns.md` with jscpd-ignore strategy
- Task 6.4: Update AGENTS.md files and root AGENTS.md

---

## Parallelism Strategy

### Subagent Pool: 8 max concurrent

Phase 6 uses fewer parallel subagents than Phase 5 (8 vs 16) because P3 pairs are small and triage is quick. Each subagent handles a batch of ~8-10 pairs:

```
Phase 2 (D↔M): 4 waves × 2 subagents = 8 concurrent max
Phase 3 (C↔C): 2 waves × 2 subagents = 4 concurrent max
Phase 4 (C↔D+C↔M, D↔D, M↔M): 3 tasks × 1 subagent = 3 concurrent max
```

### Subagent Task Template

Each subagent receives:
1. A list of 8-10 P3 pairs with file paths, token counts, and line ranges
2. The triage decision tree (from this design)
3. Instruction to either "fix" (extract shared element) or "ignore" (add jscpd-ignore directive)
4. Quality verification: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified file
5. Outcome file: `.ai/plans/duplications-phase6/outcome/<task-id>-outcome.md`

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| R1: jscpd-ignore overuse — suppressing real duplication that should be fixed | Medium | Medium | Triage criteria require explicit structural justification for each ignore. Mid-point review checks ignore-to-fix ratio. |
| R2: Breaking the i18n type system with locale ignores | Very Low | High | `.jscpd.json` ignore is a scanner config change — it does NOT modify any code. The i18n compile-time system is untouched. |
| R3: Phase 4/5 not complete when residual sweep runs | High | Low | Residual sweep task is conditional — it may be deferred until Phases 4/5 complete. The P3 triage (Phase 6's main work) is independent. |
| R4: P3 pairs too small to fix meaningfully | Medium | Low | jscpd-ignore is the fallback. For pairs where extraction would add more complexity than the duplication itself, ignore with rationale. |
| R5: `shared/locale/**` ignore too broad — may suppress non-structural locale duplication | Low | Low | Verify with `bun check:duplicates` before/after. All 16 current locale pairs are structural. Monitor for future regressions. |
| R6: Duplicate effort with Phase 5 (which also covers P3 frontend pairs) | Low | Medium | Phase 5 defers P3 explicitly (D5-3). Phase 6 picks up only what Phase 5 defers. No overlap. |

---

## Edge Cases

1. **A P3 pair that Phase 5 already fixed** — Check git diff before starting. If Phase 5 already fixed a pair, skip it and note in the outcome.
2. **A P3 pair where one file is deleted by Phase 4** — Phase 4 modifies backend/shared/app/scripts. If Phase 4 deletes a file that participates in a P3 pair, the pair disappears from jscpd output. Skip it.
3. **jscpd-ignore directive conflicts with oxlint** — `// jscpd:ignore` is a comment directive, not an oxlint suppression. It does NOT trigger `no-oxlint-disable` rules. Verify with sub-loop.
4. **.`jscpd.json` already ignores `shared/locale/**`** — Check current config before adding. If already present, skip Task 1.1.
5. **P3 pair token count increased after Phase 5 changes** — Phase 5 may increase some clone sizes by consolidating pairs. Re-run jscpd before triage to get current counts, not the baseline counts.
6. **Multiple P3 pairs sharing the same file** — Group by file, not by pair. Fix all pairs touching the same file in a single subagent task to avoid edit conflicts.

---

## Knowledge Propagation Targets

| Artifact | Update |
|----------|--------|
| `docs/frontend/duplication-elimination-patterns.md` | Add "jscpd-ignore Strategy" section with config and inline directive patterns |
| `AGENTS.md` (root) | Add `.jscpd.json` configuration reference to Important References |
| `.jscpd.json` | Add `shared/locale/**` to ignore patterns (Task 1.1) |
| `.ai/plans/duplications-phase6/outcome/` | Per-task outcome files documenting triage decisions |
