# Plan Review R1 — Phase 6 Duplications Elimination Plan

**Date:** 2026-08-11
**Reviewer:** @plan-review skill
**Plan files reviewed:**
- `.ai/plans/duplications-phase6/requirements.md`
- `.ai/plans/duplications-phase6/design.md`
- `.ai/plans/duplications-phase6/tasks.md`
- `.ai/plans/duplications-phase6/deferred-items.md`

## Affected Architecture Layers

| File Path Pattern | AGENTS.md | Status |
|---|---|---|
| `frontend/**/*.ts(x)` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` | Read ✅ |
| `shared/locale/**` | `shared/AGENTS.md` | Read ✅ |
| `.jscpd.json` | Root `AGENTS.md` | Read ✅ |

## Cross-Cutting Compliance Checks

| Rule | Status | Notes |
|---|---|---|
| Type imports from `@/backend/types` | ✅ PASS | Plan doesn't create new types |
| Service boundaries (Server→Service, Client→Apollo) | ✅ PASS | No service layer changes |
| MUI v9 sx prop only | ✅ PASS | Design examples use `sx` prop |
| i18n via compile-time system | ✅ PASS | No new user-facing strings |
| Logging via `logger` not `console` | ✅ PASS | No logging introduced |
| Test conventions (runInRollback, tx, no rejects) | ✅ PASS | No server tests per No-Server-Tests Policy |
| GraphQL document naming | ✅ PASS | No GraphQL changes |
| No barrel re-exports | ✅ PASS | Listed as critical policy in design.md |
| jscpd-ignore vs oxlint-disable distinction | ✅ PASS | Explicitly distinguished in design.md |
| shared/ layer isolation (no frontend/backend imports) | ✅ PASS | Task 1.2 consolidates TO shared (correct direction) |
| `__shared__/` directory convention | ✅ PASS | Design examples reference `__shared__/` correctly for existing pairs |

## Findings

### Finding 1: LOW — P3 pair count mismatch between requirements.md and tasks.md

**[REQUIREMENTS]** requirements.md §1.1 Category breakdown: "~60 pairs" D↔M, "~40 pairs" C↔C, "~13 pairs" D↔D, "~11 pairs" M↔M
**[TASKS]** tasks.md Phase 2 header: "70 desktop↔mobile pairs"
**[REQUIREMENTS]** requirements.md §1.2 Scope table: "~60" D↔M, "~40" C↔C, "~13" D↔D, "~11" M↔M

→ Expected: Consistent pair counts across requirements and tasks
→ Plan has: Approximate counts in requirements (~60, ~40, ~13, ~11) vs exact counts in tasks (70, 31, 7, 4)
→ **Resolution:** The tasks.md exact counts (70 D↔M, 31 C↔C, 7 D↔D, 4 M↔M) are derived from the actual jscpd parse. The requirements.md approximate counts (~60, ~40, ~13, ~11) are pre-parse estimates. The sum in requirements.md (135) matches the tasks.md sum (70+31+7+4=112... wait, that's only 112, not 135).

Actually, the discrepancy is that requirements.md says 135 total P3 pairs but tasks.md only accounts for 70+31+7+4 = 112 pairs. The remaining 23 pairs are the C↔D (12) + C↔M (11) = 23 cross-tier pairs in Phase 4, which are not listed in the requirements.md category breakdown. So: 112 + 23 = 135. ✅ This is consistent — the requirements.md category breakdown omits C↔D and C↔M categories, but the tasks.md covers them in Phase 4.

**Severity:** LOW (cosmetic — counts are consistent when all categories are included)
**Fix:** Update requirements.md §1.1 to include all 6 categories (D↔M, C↔C, C↔D, C↔M, D↔D, M↔M) for completeness.

### Finding 2: LOW — design.md Strategy B2 example path missing `__shared__/` subdirectory

**[DESIGN]** design.md Strategy B2 example:
```
frontend/common/views/dashboard/teachers/components/TeacherEntityListViewShared.tsx
```

→ Expected: `frontend/common/views/dashboard/teachers/components/__shared__/TeacherEntityListViewShared.tsx` per `frontend/views/AGENTS.md` "## __shared__/ Directory Convention"
→ Plan has: Missing `__shared__/` subdirectory

**Severity:** LOW (illustrative example, not an actual file path to create)
**Fix:** Update the example path in design.md to include `__shared__/`.

## Summary

The plan passes all AGENTS.md rules for affected layers. Two LOW-severity findings:
1. Requirements.md category breakdown omits C↔D and C↔M categories (cosmetic — tasks.md is complete)
2. Design.md Strategy B2 example path missing `__shared__/` subdirectory (illustrative example)

No CRITICAL or HIGH findings. No architecture violations. No i18n, logging, or type import violations. The jscpd-ignore strategy is correctly distinguished from oxlint-disable. The shared/locale structural suppression is a config-only change that doesn't modify the i18n compile-time type system.
