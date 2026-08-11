# Deferred Items: Code Duplication Elimination — Phase 5

**Feature:** Phase 5 — Frontend Triplication & Duplication Focus
**Version:** 1.0
**Date:** 2026-08-11

---

## Active Deferred Items

| ID | Description | Reason Deferring | Target Phase |
|----|-------------|------------------|---------------|
| D5-1 | `shared/locale/**` intra-namespace clones (16 pairs) | By-design structural duplication from i18n compile-time type pattern | Never (structural) |
| D5-2 | `frontend↔shared` locale type duplicates (331 tokens, 3 pairs) | `useClassDetailsLabels.ts` ↔ `shared/locale/types/` — may be structural to i18n pattern; evaluate in Task 1.3 | Phase 5 Task 1.3 or defer |
| D5-3 | P3 Micro clusters (58 clusters, ~14,000 tokens) | Low-token, may not be worth individual scaffolds — batch or add jscpd-ignore | Phase 5 extension or Phase 6 |

---

## Resolved Items

_None at plan creation time._

---

## Carry-Forward from Phase 4

Phase 4 deferred items are tracked in `.ai/plans/duplications-phase4/deferred-items.md`. Phase 5 does not inherit any Phase 4 deferred items — scopes are disjoint.

---

## Notes

- The `shared/locale/` intra-namespace clones (16 pairs) are explicitly out of scope for ALL phases. These are structural duplications from the compile-time TypeScript i18n system where each locale namespace (`en/`, `ar/`) must define the same type signatures. See `shared/AGENTS.md` for the i18n pattern.
- P3 micro clusters (58 clusters with ~2-4 pairs each, total ~14,000 tokens) may not be worth the effort of creating individual scaffolds. These should be evaluated after Phases 2-4 complete. If the remaining count is already ≤300 clones, P3 can be deferred to a future phase.
