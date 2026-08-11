# Requirements: Code Duplication Elimination — Phase 6

**Feature:** Code Duplication Elimination Phase 6 — Deferred P3 Micro Clusters & Structural Noise Suppression
**Version:** 1.0
**Date:** 2026-08-11
**Predecessors:**
- `.ai/plans/duplications/` (Phase 1 — 1,021 → 819 clones, frontend triplication + shared + locale + test runners)
- `.ai/plans/duplications-phase2/` (Phase 2 — 819 → 580 clones, frontend UI scaffolds + within-common/within-tier consolidation)
- `.ai/plans/duplications-phase3/` (Phase 3 — 580 → 522 clones, backend services + repos + schema + GraphQL + app router + test infra)
- `.ai/plans/duplications-phase4/` (Phase 4 — 522 baseline, backend/shared/app/scripts focus, IN PROGRESS — other session)
- `.ai/plans/duplications-phase5/` (Phase 5 — 505 baseline, frontend↔frontend all 470 pairs + 6 cross-layer, IN PROGRESS — this session after Phase 6 plan)

---

## 1. Overview

Despite five prior phases, `bun check:duplicates` reports **505 clones** (68,280 duplicated tokens). Phases 4 and 5 are addressing the bulk: Phase 4 covers backend↔backend (13 pairs), scripts↔scripts (1 pair), and cross-layer enums. Phase 5 covers all 470 frontend↔frontend pairs (prioritized P0–P3) and 6 frontend↔shared cross-layer pairs.

However, Phase 5 **explicitly defers** its P3 tier — 135 micro cluster pairs (11,090 tokens) with individual pair counts of ≤91 tokens — as "batch or defer" (deferred item D5-3). Additionally, 16 `shared/locale/` intra-namespace clones (1,604 tokens) are deferred as "never" (structural, D5-1) across all phases.

**Phase 6 picks up exactly these deferred items:**

| Gap | Source | Pairs | Tokens | Prior Phase Disposition |
|-----|--------|-------|--------|------------------------|
| P3 micro clusters (frontend) | Phase 5 D5-3 | 135 | 11,090 | Deferred — "batch or defer" |
| `shared/locale/` structural | Phase 5 D5-1, Phase 4 | 16 | 1,604 | Deferred — "never" (structural) |
| Post-Phase 4/5 residual sweep | — | TBD | TBD | Depends on Phase 4/5 completion |

### 1.1 Problem Statement

The P3 micro clusters represent **135 small-clone pairs** scattered across the frontend. Each pair has ≤91 duplicated tokens — too small to justify individual `*Shared.tsx` scaffolds (which were Phase 5's P0/P1 approach), but collectively 11,090 tokens of duplication noise. These fall into six categories:

1. **Desktop↔Mobile triplication residuals** (70 pairs, 5,791 tokens) — Small D↔M pairs where the visual difference is minimal (e.g., a single `sx` prop or breakpoint variant). These are candidates for **jscpd-ignore directives** or **config-object scaffolds**.

2. **Common↔Common intra-layer** (31 pairs, 2,527 tokens) — Files within `frontend/common/` duplicating each other across unrelated domains (e.g., `CountryDisplay.tsx` ↔ `LanguageDisplay.tsx`). These need **shared utility extraction** or **jscpd-ignore**.

3. **Common↔Desktop cross-tier** (12 pairs, 1,001 tokens) — Common tier base logic duplicated in desktop tier visual variants. Candidates for **extending existing scaffolds** or **jscpd-ignore**.

4. **Common↔Mobile cross-tier** (11 pairs, 887 tokens) — Same as C↔D but in mobile tier.

5. **Desktop↔Desktop same-tier** (7 pairs, 567 tokens) — Different desktop views with similar layouts (e.g., `teacherClassListView.desktop.tsx` ↔ `teacherStudentsView.desktop.tsx`). Candidates for **shared view scaffolds** or **jscpd-ignore**.

6. **Mobile↔Mobile same-tier** (4 pairs, 317 tokens) — Same as desktop↔desktop but in mobile tier. Same approach.

**Total P3:** 135 pairs, 11,090 tokens (70 + 31 + 12 + 11 + 7 + 4 = 135).

The `shared/locale/` structural pairs (16 pairs, 1,604 tokens) represent the compile-time TypeScript i18n pattern where each locale namespace (`en/`, `ar/`, `types/`) must define identical type signatures. These are **by-design structural duplication** — the correct fix is **jscpd-ignore directives** in `.jscpd.json` configuration, not code changes.

### 1.2 Scope

**In scope (151 specific clone pairs + residual sweep):**

| Category | Pairs | Tokens | Approach |
|----------|-------|--------|----------|
| P3 Desktop↔Mobile residuals | 70 | 5,791 | jscpd-ignore or micro-scaffold per pair |
| P3 Common↔Common intra-layer | 31 | 2,527 | Shared utility extraction or jscpd-ignore |
| P3 Common↔Desktop cross-tier | 12 | 1,001 | Extend existing scaffold or jscpd-ignore |
| P3 Common↔Mobile cross-tier | 11 | 887 | Extend existing scaffold or jscpd-ignore |
| P3 Desktop↔Desktop same-tier | 7 | 567 | Shared view scaffold or jscpd-ignore |
| P3 Mobile↔Mobile same-tier | 4 | 317 | Shared view scaffold or jscpd-ignore |
| `shared/locale/` structural | 16 | 1,604 | `.jscpd.json` ignore patterns (config-only, no code) |
| Post-Phase 4/5 residual sweep | TBD | TBD | Final sweep after Phases 4 & 5 complete |

**Also in scope:**
- Evaluation of each P3 pair for **jscpd-ignore directive** (for truly structural or unfixable duplication) vs **fix** (for duplication that can be eliminated with minimal effort)
- `.jscpd.json` configuration update to suppress `shared/locale/` structural noise permanently
- Final residual sweep after Phases 4 & 5 are complete (may be deferred to a post-implementation task)

**Out of scope (explicit):**
- Everything Phase 4 covers (backend↔backend, shared↔backend, app↔app, scripts↔scripts, codegen) — Phase 4 is in progress in another session
- Everything Phase 5 P0/P1/P2 covers (335 frontend pairs, ~50,000 tokens) — Phase 5 is in progress in this session
- Test file duplications (excluded via `.jscpd.json`)
- Any test requiring a Next.js server (see §3 below)

### 1.3 The Two Strategies

**Strategy A: jscpd-ignore for Structural Duplication**

For pairs where the duplication is structural (i.e., the pattern must be repeated by design — e.g., locale type signatures, MUI `sx` prop boilerplate, similar-but-different data grid column configs), adding a `// jscpd:ignore` directive or updating `.jscpd.json` ignore patterns is the correct approach. This reduces clone count without code changes.

```
// .jscpd.json — add shared/locale/** to ignore
{
  "ignore": [..., "shared/locale/**"]
}
```

Or per-file:
```typescript
// jscpd:ignore-start
// ... structural code that must be duplicated ...
// jscpd:ignore-end
```

**Strategy B: Micro-Scaffold / Shared Utility Extraction**

For pairs where the duplication can be eliminated with minimal effort — typically a shared function, constant, or small presentational component — extract the shared element and have both consumers delegate to it. This follows the Phase 2 within-common consolidation pattern (see `.ai/plans/duplications-phase2/outcome/3.3-within-common-consolidation-outcome.md`).

```typescript
// Before: CountryDisplay.tsx and LanguageDisplay.tsx both have identical Autocomplete boilerplate
// After: Extract shared DisplayAutocomplete.tsx, both delegate with config props
```

---

## 2. Goals

| Goal | Target | Verification |
|------|--------|--------------|
| G1: Eliminate/suppress 135 P3 micro cluster pairs | ≥100 pairs addressed (fix or ignore) | `bun check:duplicates` shows ≥100 fewer pairs vs Phase 6 baseline |
| G2: Suppress `shared/locale/` structural noise | `shared/locale/` pairs = 0 in jscpd output | Verify `.jscpd.json` ignore patterns match `shared/locale/**` |
| G3: Maintain code health | Zero new tsgo/oxlint/biome/lint errors from Phase 6 changes | `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` exit 0 per modified file |
| G4: Post-Phase 4/5 residual sweep | Document and triage any remaining unaddressed clones | Final jscpd report shows ≤300 total clones |
| G5: Knowledge propagation | Update `.jscpd.json` documentation and duplication-elimination-patterns.md | New doc section on jscpd-ignore strategy |

---

## 3. Acceptance Criteria

1. **WHEN** Phase 6 starts, **THEN** the executing agent **SHALL** read all existing outcome files in `.ai/plans/duplications-phase6/outcome/` for prior context.

2. **WHEN** the P3 micro cluster evaluation is complete, **THEN** each of the 135 deferred P3 pairs **SHALL** be triaged as either "fix" (shared extraction) or "ignore" (jscpd-ignore directive) with documented rationale.

3. **WHEN** a P3 pair is triaged as "fix", **THEN** the shared element (function, component, or constant) **SHALL** be extracted and both consumers **SHALL** delegate to it, verified via `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`.

4. **WHEN** a P3 pair is triaged as "ignore", **THEN** a `// jscpd:ignore` directive or `.jscpd.json` pattern **SHALL** be added with a comment explaining why the duplication is structural.

5. **WHEN** the `shared/locale/` structural suppression is complete, **THEN** `.jscpd.json` **SHALL** include `shared/locale/**` in its ignore patterns and `bun check:duplicates` **SHALL** report 0 clones from that directory.

6. **IF** Phases 4 and 5 are complete when Phase 6 reaches its residual sweep task, **THEN** the executing agent **SHALL** run `bun check:duplicates` and triage all remaining clones into "fix", "ignore", or "defer to Phase 7" categories.

7. **WHEN** any file is modified, **THE SYSTEM SHALL** pass `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` with zero errors.

8. **WHEN** the plan is drafted, **THEN** the `@plan-review` skill **SHALL** be invoked and all violations **SHALL** be fixed before implementation begins.

9. **WHEN** all tasks complete, **THEN** knowledge propagation **SHALL** update `docs/frontend/duplication-elimination-patterns.md` with the jscpd-ignore strategy and `.jscpd.json` configuration guidance.

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
| `bun run test:integration:sequential` | ❌ NEVER | Same as above |
| `bun run test:live-comm` | ❌ NEVER | Live provider calls |
| `bun run test:live-fx` | ❌ NEVER | Live FX provider calls |
| `bun run test:db` | ❌ NEVER | Requires DB server |
| `bun run test:db:sequential` | ❌ NEVER | Same as above |
| `bun run test:services` | ❌ NEVER | Requires service-layer DB connections |
| `bun run test` | ❌ NEVER | Aggregates all tests including server-dependent |
| `bun run scripts/run-test/run-test.ts <path>` | ❌ NEVER | Runs any test (server-dependent) |

**Sole verification method:** `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (runs tsgo → oxlint → biome → lint:type-aware → check:duplicates → codescene — all read-only static analysis, no server).

---

## 5. Key Design Decisions

1. **Two strategies, not one.** Unlike Phases 4 and 5 which focus on code extraction to fix duplication, Phase 6 introduces jscpd-ignore as a first-class strategy for structural duplication. Some duplication is by-design (locale type signatures, MUI boilerplate, similar data grids) and suppressing it from the clone count is more valuable than forcing a refactor.

2. **Triage before fix.** Each P3 pair is evaluated individually before any code changes. The triage outcome ("fix" vs "ignore") determines the approach. This prevents over-engineering scaffolds for pairs that are structurally duplicated by design.

3. **`.jscpd.json` config-only change for locale.** The 16 `shared/locale/` pairs are suppressed via `.jscpd.json` ignore patterns, not code changes. This is a configuration-only fix — zero risk of breaking the i18n compile-time type system.

4. **Batch by category, not by cluster.** Phase 5 organized by cluster (groups of pairs). Phase 6 organizes by **category** (D↔M residuals, C↔C intra-layer, D↔D same-tier, M↔M same-tier, locale structural) because the approach differs by category (ignore vs scaffold vs utility extraction), not by cluster.

5. **Residual sweep depends on Phases 4 & 5.** The final residual sweep task may be deferred until Phases 4 and 5 are complete. Phase 6 can start its P3 triage immediately without waiting, but the final jscpd count comparison requires Phases 4 and 5 to be done.

6. **Focus on things previous plans don't cover at all.** Phase 6 exclusively targets the deferred items from Phases 1-5 (D5-1, D5-3) plus the post-implementation residual sweep. Zero overlap with any active phase.
