# Deferred Items: Code Duplication Elimination — Phase 6

**Feature:** Phase 6 — Deferred P3 Micro Clusters & True Duplicate Resolution
**Version:** 2.0
**Date:** 2026-08-11

---

## Active Deferred Items

| ID | Description | Reason Deferring | Target Phase |
|----|-------------|------------------|---------------|
| D6-1 | Post-Phase 4/5 residual sweep | Phases 4 and 5 may not be complete when Phase 6 reaches its final sweep. If they're still running, defer the final jscpd comparison and residual triage to a post-implementation task or Phase 7. | Post-Phase 4/5 or Phase 7 |
| D6-2 | Locale type pairs that are truly independent | Some `shared/locale/` pairs may have type signatures that are genuinely different and cannot be consolidated without breaking the compile-time type system. These are the ONLY acceptable deferrals — documented with technical rationale. | Phase 7+ or never |

---

## Resolved Items

| ID | Description | Resolution |
|----|-------------|------------|
| D5-1 | `shared/locale/` intra-namespace clones (16 pairs, 1,604 tokens) | **Phase 6 Task 1.1-1.2** — Consolidate type definitions using shared bases, `Pick<>`/`Omit<>` aliases. True code fix, NOT `.jscpd.json` ignore. |
| D5-2 | `frontend↔shared` locale type pairs (331 tokens, 3 pairs) | **Phase 6 Task 1.2** — Evaluate and consolidate. Frontend types that mirror locale types should reference the canonical `shared/locale/types/` definitions. |
| D5-3 | P3 Micro clusters (135 pairs, ~11,090 tokens) | **Phase 6 Phases 2-4** — Extract `__shared__/*Shared.tsx` scaffolds with options pattern. True code extraction, NOT `jscpd:ignore`. |

---

## Carry-Forward from Phase 5

Phase 5 deferred items (`D5-1`, `D5-2`, `D5-3`) are the **direct inputs** to Phase 6:

| Phase 5 ID | Description | Phase 6 Disposition |
|------------|-------------|---------------------|
| D5-3 | P3 Micro clusters (135 pairs, ~11,090 tokens) | **Primary scope** — Phase 6 Phases 2-4 resolve all 135 pairs via scaffold extraction (Patterns A-F) |
| D5-1 | `shared/locale/` intra-namespace clones (16 pairs, 1,604 tokens) | **Primary scope** — Phase 6 Task 1.1-1.2 consolidates type definitions (Pattern G) |
| D5-2 | `frontend↔shared` locale type pairs (331 tokens, 3 pairs) | **Evaluate in Phase 6** — Task 1.2 evaluates and consolidates to canonical `shared/locale/types/` source |

---

## Carry-Forward from Phase 4

Phase 4 is in progress in another session. Phase 6 does NOT inherit any Phase 4 deferred items — Phase 4's scope (backend, shared non-locale, app, scripts) is disjoint from Phase 6's scope (frontend P3 deferred + shared/locale structural).

---

## Critical Policy Change (v2.0)

**The original Phase 6 plan (v1.0) used `jscpd:ignore` directives and `.jscpd.json` ignore patterns as Strategy A. This approach was REJECTED by the user.**

**v2.0 eliminates ALL `jscpd:ignore` strategies. Every clone pair MUST be resolved by true code extraction:**
- Pattern A: `__shared__/*Shared.tsx` scaffold + options extraction for D↔M pairs
- Pattern B: Shared utility/component extraction for C↔C pairs
- Pattern C: Dead code deletion
- Pattern D: Store/hook consolidation
- Pattern E: Extend existing scaffold for C↔D/C↔M pairs
- Pattern F: Shared view scaffold for D↔D/M↔M pairs
- Pattern G: Locale type consolidation for shared/locale pairs

**Zero `jscpd:ignore` directives. Zero `.jscpd.json` changes.**

---

## Notes

- The `shared/locale/` structural clones (D5-1) are resolved by TRUE TYPE CONSOLIDATION — extracting shared type bases and using `Pick<>`/`Omit<>` aliases. The compile-time i18n type system remains fully type-safe.
- The P3 micro clusters (D5-3) are resolved by the proven `*Shared.tsx` / `__shared__/` scaffold pattern from Phase 1-5. Each D↔M pair gets a scaffold with config options; desktop/mobile become thin wrappers.
- D6-1 (residual sweep) is conditional on Phases 4 and 5 being complete.
- D6-2 (unfixable locale pairs) is the ONLY acceptable deferral — and ONLY if the locale types are genuinely independent and cannot be consolidated without breaking compile-time type safety.
