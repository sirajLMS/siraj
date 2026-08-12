# Plan Review Round 1 — Outcome

**Date:** 2026-08-11
**Reviewer:** `plan-review` skill (general-purpose subagent)
**Plan:** `.ai/plans/duplications-phase4/` (requirements.md, design.md, tasks.md)

## Summary

**The plan is fundamentally sound and well-aligned with AGENTS.md.** No phantom-file paths found.
No test-policy violations. No `oxlint-disable` additions planned. Plan correctly enforces the
No-Server-Tests Policy at every task.

### Critical Findings (2) — FIXED

1. **Task 2.5a/b `build*InsertPayload` placement — repo vs service boundary**
   - **Was:** `backend/db/repo/{parents,teachers}/__shared__/build*InsertPayload.ts`
   - **Rule violated:** `backend/db/repo/AGENTS.md` — repositories are strictly for data access;
     payload assembly is service-layer business logic
   - **Fix applied:** Moved to `backend/services/{parent,teacher}/__shared__/build*InsertPayload.ts`
     (NEW directories, same `__shared__/` pattern as `backend/services/meeting/__shared__/`)
   - Added explicit placement-decision note referencing the precedent

2. **Task 4.2 `coreScheduleColumns` schema helper placement**
   - **Was:** New `backend/db/schema/classes/__shared__/coreScheduleColumns.ts` (new subdirectory)
   - **Precedent:** Existing schema helpers live at `backend/db/schema/__shared__/columnHelpers.ts`
     and `backend/db/schema/__shared__/junctionTableHelper.ts`
   - **Fix applied:** Moved to `backend/db/schema/__shared__/coreScheduleColumns.ts` (colocated with
     existing helpers — avoids fragmentation)
   - Added explicit placement-decision note referencing the precedent

### Pass Summary (13 rules checked)

- ✅ Rule 1 — Type imports from `@/backend/types/{entity}.types.ts` (no local Pothos types)
- ✅ Rule 2 — Service boundaries (Server Components call services directly)
- ✅ Rule 3 — MUI v9 style props (N/A for this plan — sub-loop will catch)
- ✅ Rule 4 — i18n / no hardcoded user-facing strings (SR checklist includes i18n compliance)
- ✅ Rule 5 — Logging / no `console.*` (scripts/ already exempted in `eslint.config.mjs` lines 202-221)
- ✅ Rule 6 — Test conventions (Phase 4 has zero tests — fully enforces No-Server-Tests Policy)
- ✅ Rule 7 — GraphQL documents (plan does not touch frontend documents)
- ✅ Rule 8 — Cross-layer rules (deletes `backend/enum/shared/*` — correct direction)
- ✅ Rule 9 — Path aliases & `__shared__/` direct imports (no barrel, all `@/` aliases)
- ✅ Rule 10 — Scripts no-console exemption (already at config level, no new override required)
- ✅ Rule 11 — No `oxlint-disable` comments anywhere
- ✅ Rule 12 — `sub-loop.ts` per-file verification mandated for every task
- ✅ Rule 13 — No server tests (all 12 excluded commands explicitly struck through)

### Path Existence Verification

All cited source paths verified to exist (70+ paths checked). All NEW `__shared__/` directories
confirmed NOT to exist yet (plan correctly creates them). `codegen.ts` confirmed at repo root.

### Verdict

**Plan passes AGENTS.md review after R1 fixes.** Safe to proceed to Phase 0 baseline capture and
Phase 1 implementation.
