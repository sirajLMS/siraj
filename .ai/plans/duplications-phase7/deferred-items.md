# Deferred Items: Code Duplication Elimination — Phase 7

**Feature:** Phase 7 — Within-File Clones, Cross-Layer Utilities & Residual Sweep
**Version:** 1.0
**Date:** 2026-08-11

---

## Active Deferred Items

| ID | Description | Reason Deferring | Target Phase |
|----|-------------|------------------|---------------|
| D7-1 | Cross-layer `enum.ts` pair — if consolidation not possible | `frontend/common/lib/enum.ts` uses GraphQL codegen types; `shared/lib/enum.ts` uses backend enum types. If creating a `shared → frontend/common/graphql/generated` dependency violates layer isolation, jscpd-ignore is applied instead. | Permanently deferred (if jscpd-ignore chosen) |
| D7-2 | Cross-layer `logger` pair — if inheritance not possible | `frontend/common/lib/logger/index.ts` uses browser APIs; `shared/lib/logger/base-logger.ts` uses `node:fs/promises`. If `BaseLogger` cannot be extended by `ClientLogger` due to Node.js imports, jscpd-ignore is applied. | Permanently deferred (if jscpd-ignore chosen) |
| D7-3 | D6-2 unfixable non-structural pairs — permanently deferred | Pairs that are neither fixable (too small) nor structural (not by-design). These get jscpd-ignore with "low-value" rationale or are documented as permanently deferred. | Permanently deferred |
| D7-4 | Post-implementation residual sweep (D6-1) — if Phases 4/5/6 incomplete | If Phases 4, 5, or 6 are still in progress when Phase 7 reaches its residual sweep task, the sweep is deferred to a post-implementation follow-up. | Post-Phase 4/5/6 or Phase 8 |

---

## Resolved Items

_None at plan creation time._

---

## Carry-Forward from Phase 6

| Phase 6 ID | Description | Phase 7 Disposition |
|------------|-------------|---------------------|
| D6-1 | Post-Phase 4/5 residual sweep | **Phase 7 Task 6.1-6.2** — conditional on all prior phases being complete |
| D6-2 | P3 pairs that are truly unfixable and not structural | **Phase 7 Task 5.1-5.2** — triage with jscpd-ignore or permanent deferral |

---

## Carry-Forward from Phase 5

| Phase 5 ID | Description | Phase 7 Disposition |
|------------|-------------|---------------------|
| D5-2 | `frontend↔shared` locale type pairs (331 tokens, 3 pairs) | **Phase 6 evaluates** — if Phase 6 adds `shared/locale/**` to `.jscpd.json`, these cross-file locale pairs are auto-suppressed. Phase 7 Task 3.1 verifies. |

---

## Notes

- The within-file clone category (17 pairs, 1,815 tokens) is **entirely novel** — no prior phase addresses self-clones. Phase 7 is the first phase to introduce the local-helper-within-file refactoring pattern.
- The cross-layer utility pairs (`enum.ts`, `logger`) were mentioned in Phase 5 but not given detailed implementation tasks. Phase 7 provides the architectural evaluation and resolution.
- D6-1 (residual sweep) and D6-2 (unfixable pairs) are the two deferred items from Phase 6 that Phase 7 explicitly picks up.
- If Phase 6's `.jscpd.json` ignore of `shared/locale/**` is already implemented, the 7 shared/locale within-file pairs are auto-suppressed and Phase 7 Task 3.2 is skipped.
