# Deferred Items: Code Duplication Elimination — Phase 6

**Feature:** Phase 6 — Deferred P3 Micro Clusters & Structural Noise Suppression
**Version:** 1.0
**Date:** 2026-08-11

---

## Active Deferred Items

| ID | Description | Reason Deferring | Target Phase |
|----|-------------|------------------|---------------|
| D6-1 | Post-Phase 4/5 residual sweep | Phases 4 and 5 may not be complete when Phase 6 reaches its final sweep. If they're still running, defer the final jscpd comparison and residual triage to a post-implementation task or Phase 7. | Post-Phase 4/5 or Phase 7 |
| D6-2 | P3 pairs that are truly unfixable and not structural | Some P3 pairs may be neither fixable (too small to scaffold) nor structural (not by-design). These get jscpd-ignore with "low-value" rationale. Future phases can revisit if tooling improves. | Phase 7+ or never |

---

## Resolved Items

_None at plan creation time._

---

## Carry-Forward from Phase 5

Phase 5 deferred items (`D5-1`, `D5-2`, `D5-3`) are the **direct inputs** to Phase 6:

| Phase 5 ID | Description | Phase 6 Disposition |
|------------|-------------|---------------------|
| D5-3 | P3 Micro clusters (135 pairs, ~11,090 tokens) | **Primary scope** — Phase 6 Phases 2-4 triage and fix/ignore all 135 pairs |
| D5-1 | `shared/locale/` intra-namespace clones (16 pairs, 1,604 tokens) | **Primary scope** — Phase 6 Task 1.1 adds `.jscpd.json` ignore pattern |
| D5-2 | `frontend↔shared` locale type pairs (331 tokens, 3 pairs) | **Evaluate in Phase 6** — if not structural, fix; if structural, jscpd-ignore |

---

## Carry-Forward from Phase 4

Phase 4 is in progress in another session. Phase 6 does NOT inherit any Phase 4 deferred items — Phase 4's scope (backend, shared non-locale, app, scripts) is disjoint from Phase 6's scope (frontend P3 deferred + shared/locale structural).

---

## Notes

- The `shared/locale/` structural clones (D5-1) are explicitly resolved by Phase 6 Task 1.1 via `.jscpd.json` configuration, NOT code changes. The locale compile-time type system is untouched.
- The P3 micro clusters (D5-3) are the largest single deferred item across all phases. Phase 6 uses a `jscpd-ignore` / micro-scaffold two-strategy approach to address them efficiently.
- D6-1 (residual sweep) is conditional on Phases 4 and 5 being complete. If they're still running when Phase 6 reaches Phase 6 (Residual Sweep), the task is deferred to a post-implementation follow-up.
