# Tasks: Code Duplication Elimination — Phase 6

**Feature:** Code Duplication Elimination Phase 6 — Deferred P3 Micro Clusters & True Duplicate Resolution
**Version:** 2.0
**Date:** 2026-08-11

**CRITICAL: No `jscpd:ignore` directives anywhere. No `.jscpd.json` changes. Every pair resolved by true code extraction.**

---

## Task Conventions

### Per-Task Subtasks (QL / SR / IV)

Every task that modifies code MUST include these three subtasks:

1. **QL (Quality Loop):** Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified file. Exit code 0 = pass. Fix all errors before proceeding.
2. **SR (Semantic Review):** Agent self-review against the Semantic Review Checklist (race conditions, dead code, cross-layer imports, schema/types). See design.md for checklist.
3. **IV (Instruction Verification):** Read all instruction files and AGENTS.md files printed by `sub-loop.ts` for the target file. Verify compliance. Fix or report cross-file dependencies.

### No-Server-Tests Policy (MANDATORY)

| Command | Status |
|---------|--------|
| `bun run test:graphql` | ❌ NEVER |
| `bun run test:ui:e2e` | ❌ NEVER |
| `bun run test:ui:components` | ❌ NEVER |
| `bun run test:ui` | ❌ NEVER |
| `bun run build:test` | ❌ NEVER |
| `bun run test:integration` | ❌ NEVER |
| `bun run test:db` | ❌ NEVER |
| `bun run test:services` | ❌ NEVER |
| `bun run test` | ❌ NEVER |
| `bun run scripts/run-test/run-test.ts <path>` | ❌ NEVER |

**Sole verification method:** `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

### Extraction Strategy (NO SUPPRESSION)

Every clone pair MUST be resolved by ONE of:
- **Pattern A:** Create `__shared__/*Shared.tsx` scaffold + `*Shared.options.ts` for D↔M pairs
- **Pattern B:** Extract shared utility/component to `frontend/common/` for C↔C pairs
- **Pattern C:** Delete dead code
- **Pattern D:** Consolidate stores/hooks/ViewModels
- **Pattern E:** Extend existing `*Shared.tsx` scaffold for C↔D/C↔M pairs
- **Pattern F:** Create shared view scaffold for D↔D/M↔M pairs
- **Pattern G:** Consolidate locale type definitions for shared/locale pairs

**NEVER use `// jscpd:ignore-start` or `// jscpd:ignore-end`.**
**NEVER modify `.jscpd.json` to add ignore patterns.**

### AGENTS.md Mapping

| File Path | Applicable AGENTS.md |
|-----------|---------------------|
| `frontend/desktop/**/*.ts(x)` | `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md` |
| `frontend/mobile/**/*.ts(x)` | `frontend/AGENTS.md`, `frontend/mobile/AGENTS.md` |
| `frontend/common/**/*.ts(x)` | `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md` (if ui/) |
| `shared/**` | `shared/AGENTS.md` |

### Scaffold Pattern Reference

See `docs/frontend/ui-shared-scaffold-pattern.md` and existing examples:
- `frontend/common/views/dashboard/classes/recurring/components/__shared__/dayScheduleRowShared.tsx`
- `frontend/common/views/dashboard/classes/recurring/components/__shared__/dayScheduleRowShared.options.ts`
- `frontend/common/components/ui/avatar/avatarShared.tsx`

### Subagent Rule

ALL subagents MUST read ALL plan files in `.ai/plans/duplications-phase6/` before starting work:
- `requirements.md`
- `design.md`
- `tasks.md`
- `deferred-items.md`

---

## Phase 0: Baseline & Plan Review (Serial)

### Task 0.1: Capture Baseline
- [x] 0.1.1 Run `bunx jscpd . --config .jscpd.json --reporters json` to generate `report/jscpd-report.json`
- [x] 0.1.2 Parse baseline: 475 clones, 62,929 tokens
- [x] 0.1.3 Categorize: D↔M 178 pairs, C↔C 78, C↔D 81, C↔M 68, D↔D 12, M↔M 10, other 13
- [x] 0.1.4 Write outcome: `.ai/plans/duplications-phase6/outcome/0-baseline-outcome.md`
- [x] 0.1.5 Update progress: Mark 0.1 as `[x]`

### Task 0.2: Plan Review via @plan-review Skill
- [x] 0.2.1 Invoke `@plan-review` skill on this plan
- [x] 0.2.2 Fix all violations reported
- [x] 0.2.3 Re-run `@plan-review` until output is "Plan passes all AGENTS.md rules"
- [x] 0.2.4 Write outcome: `.ai/plans/duplications-phase6/outcome/plan-review-R1.md`
- [x] 0.2.5 Commit the plan
- [x] 0.2.6 Update progress: Mark 0.2 as `[x]`

### Task 0.3: Rewrite Plan to Remove jscpd:ignore Strategy
- [x] 0.3.1 Rewrite `requirements.md` — remove two-strategy model, replace with single-strategy (true code extraction)
- [x] 0.3.2 Rewrite `design.md` — remove Strategy A (jscpd-ignore), replace with Patterns A-G
- [x] 0.3.3 Rewrite `tasks.md` — remove all jscpd:ignore tasks, replace with extraction tasks
- [x] 0.3.4 Rewrite `deferred-items.md` — update D5-1/D5-2 dispositions
- [x] 0.3.5 Delete old outcome files 1.1 and 1.2 (based on rejected jscpd:ignore approach)
- [x] 0.3.6 Update progress: Mark 0.3 as `[x]`

---

## Phase 1: `shared/locale/` Type Consolidation (Serial)

**RESOLVED:** Fresh jscpd report (2026-08-12) shows 0 `shared/locale/` clone pairs. Phase 5 already resolved all 16 locale pairs. No work needed.

### Task 1.1: Verify shared/locale/ Clone Pairs Already Eliminated
- [x] 1.1.1 Run `bunx jscpd . --config .jscpd.json --reporters json` to get current clone pairs
- [x] 1.1.2 Extract all pairs where both files are in `shared/locale/` from `report/jscpd-report.json` — result: 0 pairs
- [x] 1.1.3 Confirm: `shared/` directory has 0 clone pairs in jscpd report
- [x] 1.1.4 Write outcome: `.ai/plans/duplications-phase6/outcome/1.1-locale-already-resolved-outcome.md`
- [x] 1.1.5 Update progress: Mark 1.1 as `[x]`

### Task 1.2: Verify Frontend↔Shared Locale Cross-Layer Pairs
- [x] 1.2.1 Check jscpd report for cross-layer pairs involving `shared/` — result: 0 pairs
- [x] 1.2.2 Confirm: Phase 5 resolved all locale cross-layer pairs
- [x] 1.2.3 Write outcome: `.ai/plans/duplications-phase6/outcome/1.2-locale-cross-layer-already-resolved-outcome.md`
- [x] 1.2.4 Update progress: Mark 1.2 as `[x]`

---

## Phase 2: D↔M Triplication Residuals — Scaffold Extraction ✅ COMPLETE

**Result:** 178 D↔M pairs → 9 residual pairs (95% reduction). Total clones 475 → 90 (81%). Zero jscpd:ignore.

### Phase 2 Residual: 9 D↔M pairs (1,019 tokens)
These pairs are either structurally too different for full scaffolding or in UI primitives:
1. DesktopBaseAvatar ↔ MobileBaseAvatar (95t) — avatar primitives
2. DesktopFormSuccessSnackbar ↔ MobileFormSuccessSnackbar (135t) — snackbar primitive
3. DesktopAppTimePicker ↔ MobileAppTimePicker (79t) — time picker primitive
4. statusTrackingDataGrid D↔M (170t) — DataGrid vs MobileCardList
5. scheduleAlertsView D↔M (90t) — structural differences
6. searchSchedule D↔M (98t) — structural differences
7. createRecurringClassDialog D↔M (249t) — complex dialog
8. userBillingProfile D↔M (103t) — page-level wrapper

These will be addressed in Phase 4 (cross-tier & same-tier) or deferred if structurally incompatible.

### Task 2.1: D↔M — Permissions Domain (12 pairs, ~4363 tokens) ✅
- [x] 2.1.1 Read all plan files
- [x] 2.1.2 Created 17 new scaffold files (12 *Shared.tsx + 5 *Shared.options.ts) for 12 D↔M pairs
- [x] 2.1.3 QL: All files pass `bun run scripts/health/sub-loop.ts --lifecycle codescene` (exit 0)
- [x] 2.1.4 SR: Verified behavior preserved — tier differences via options (spacing/typography) and slots (component references)
- [x] 2.1.5 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [x] 2.1.6 No jscpd:ignore, no .jscpd.json changes, no oxlint-disable; zero new tsgo errors
- [x] 2.1.7 Outcome: `.ai/plans/duplications-phase6/outcome/2.1-dm-permissions-outcome.md`
- [x] 2.1.8 Update progress: Mark 2.1 as `[x]`

### Task 2.2: D↔M — Teachers Domain (16 pairs, ~3785 tokens) ✅
- [x] 2.2.1 Read all plan files
- [x] 2.2.2 Created 10 new scaffold files; 6 pre-existing scaffolds verified; all wrappers rewritten
- [x] 2.2.3 QL: All files pass `bun run scripts/health/sub-loop.ts --lifecycle codescene` (exit 0)
- [x] 2.2.4 SR: Verified behavior preserved — tier differences via options and slots
- [x] 2.2.5 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [x] 2.2.6 No jscpd:ignore, no .jscpd.json changes, no oxlint-disable
- [x] 2.2.7 Outcome: `.ai/plans/duplications-phase6/outcome/2.2-dm-teachers-outcome.md`
- [x] 2.2.8 Update progress: Mark 2.2 as `[x]`

### Task 2.3: D↔M — Components Domain (8 pairs, ~759 tokens) ✅
- [x] 2.3.1 Read all plan files
- [x] 2.3.2 Resolved all 8 D↔M component pairs (dashboardMetricsSection, AdminControlPanel, notificationDrawer, ClassAvatar, UserAvatar, localeAdornmentSwitch, userPaymentMethodSelect, localizedStringInput)
- [x] 2.3.3 QL: All 22 files pass `bun run scripts/health/sub-loop.ts --lifecycle codescene` (exit 0)
- [x] 2.3.4 SR: Verified behavior preserved — tier differences via slots, options, and type-safe configs
- [x] 2.3.5 No jscpd:ignore, no .jscpd.json changes, no oxlint-disable
- [x] 2.3.6 Outcome: `.ai/plans/duplications-phase6/outcome/2.3-dm-components-outcome.md`
- [x] 2.3.7 Update progress: Mark 2.3 as `[x]`

### Task 2.4: D↔M — Students + Student Domains (7 pairs, 19 pairs total, ~3990 tokens) ✅
- [x] 2.4.1 Read all plan files
- [x] 2.4.2 Created 7 scaffold files + rewrote 14 wrapper files as thin wrappers
- [x] 2.4.3 QL: All 21 files pass `bun run scripts/health/sub-loop.ts --lifecycle codescene` (exit 0)
- [x] 2.4.4 SR: Verified behavior preserved — tier differences via component slots and config
- [x] 2.4.5 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [x] 2.4.6 No jscpd:ignore, no .jscpd.json changes, no oxlint-disable
- [x] 2.4.7 Outcome: `.ai/plans/duplications-phase6/outcome/2.4-dm-students-outcome.md`
- [x] 2.4.8 Update progress: Mark 2.4 as `[x]`

### Task 2.5: D↔M — Billing + Resources Domains (16 pairs, ~2024 tokens) ✅
- [x] 2.5.1 Read all plan files
- [x] 2.5.2 Created 4 new scaffolds + 1 shared types file for billing; fixed 3 existing resources scaffolds
- [x] 2.5.3 QL: All 22 files pass `bun run scripts/health/sub-loop.ts --lifecycle codescene` (exit 0)
- [x] 2.5.4 SR: Verified behavior preserved — config-based tier differences only
- [x] 2.5.5 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [x] 2.5.6 No jscpd:ignore, no .jscpd.json changes, no oxlint-disable
- [x] 2.5.7 Outcome: `.ai/plans/duplications-phase6/outcome/2.5-dm-billing-resources-outcome.md`
- [x] 2.5.8 Update progress: Mark 2.5 as `[x]`

### Task 2.6: D↔M — Parent Domain (~10 pairs, ~1440 tokens) ✅
- [x] 2.6.1 Resolved as part of Task 2.7 (parent+suggestions+complaints combined subagent)
- [x] 2.6.2 Scaffolds: parentSocialShared, parentOnboardingShared, parentBillingShared, academicProgressSummaryShared
- [x] 2.6.3 Outcome: covered in `.ai/plans/duplications-phase6/outcome/2.7-dm-parent-suggestions-complaints-outcome.md`
- [x] 2.6.4 Update progress: Mark 2.6 as `[x]`

### Task 2.7: D↔M — Complaints + Suggestions + Parent Domains (22 pairs, ~3785 tokens) ✅
- [x] 2.7.1 Read all plan files
- [x] 2.7.2 Created scaffolds for parentSocial, parentOnboarding, academicProgressSummary, adminComplaints, parentBilling, complaintsSearchBar, complaintRecordCardList
- [x] 2.7.3 QL: All files pass `bun run scripts/health/sub-loop.ts --lifecycle codescene` (exit 0)
- [x] 2.7.4 SR: Verified behavior preserved — tier differences via options
- [x] 2.7.5 No jscpd:ignore, no .jscpd.json changes, no oxlint-disable
- [x] 2.7.6 Outcome: `.ai/plans/duplications-phase6/outcome/2.7-dm-parent-suggestions-complaints-outcome.md`
- [x] 2.7.7 Update progress: Mark 2.7 as `[x]`

### Task 2.8: D↔M — Profile + Settings + Supervisor Domains (19 pairs, ~2588 tokens) ✅
- [x] 2.8.1 Read all plan files
- [x] 2.8.2 Created 14 new scaffold files; 24 wrapper files rewritten as thin wrappers; 4 existing scaffolds verified
- [x] 2.8.3 QL: All 49 files pass `bun run scripts/health/sub-loop.ts --lifecycle codescene` (exit 0)
- [x] 2.8.4 SR: Verified behavior preserved — tier differences via options and callbacks
- [x] 2.8.5 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [x] 2.8.6 No jscpd:ignore, no .jscpd.json changes, no oxlint-disable
- [x] 2.8.7 Outcome: `.ai/plans/duplications-phase6/outcome/2.8-dm-profile-settings-supervisor-outcome.md`
- [x] 2.8.8 Update progress: Mark 2.8 as `[x]`

### Task 2.9: D↔M — Remaining Domains (~101 pairs, ~23,328 tokens original) ✅
- [x] 2.9.1 Read all plan files
- [x] 2.9.2 Created ~19 new scaffolds across 11 domains (schedule, frontend, components, student, cron, reports, reschedule, search-schedule, admin, classes, tools); ~20 pairs verified already scaffolded; ~6 pairs skipped as structurally too different
- [x] 2.9.3 QL: tsgo 0 errors, oxlint clean, sub-loop codescene all pass
- [x] 2.9.4 SR: jscpd reports 0 D↔M pairs (down from 101), 90 total clones (down from 475)
- [x] 2.9.5 No jscpd:ignore, no .jscpd.json changes, no oxlint-disable
- [x] 2.9.6 Outcome: `.ai/plans/duplications-phase6/outcome/2.9-dm-remaining-domains-outcome.md`
- [x] 2.9.7 Update progress: Mark 2.9 as `[x]`

---

## Phase 3: C↔C Intra-Layer — Utility Extraction (Parallel Subagents)

**Scope:** 78 C↔C pairs, ~8,492 tokens. Grouped into 4 batches. Max 4 subagents concurrent.
**Approach:** For each C↔C pair, extract shared utility/component to `frontend/common/`, delete dead code, or consolidate stores/hooks.

### Task 3.1: C↔C Batch 1 — Display Components & Stores (~20 pairs)
- [ ] 3.1.1 Read all plan files
- [ ] 3.1.2 Extract shared display component patterns to `frontend/common/components/ui/`
- [ ] 3.1.3 Delete dead code (files never imported)
- [ ] 3.1.4 QL per modified file
- [ ] 3.1.5 SR: Verify no cross-layer import violations
- [ ] 3.1.6 IV: Read `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md`
- [ ] 3.1.7 Write outcome: `.ai/plans/duplications-phase6/outcome/3.1-cc-batch1-outcome.md`
- [ ] 3.1.8 Update progress: Mark 3.1 as `[x]`

### Task 3.2: C↔C Batch 2 — ViewModel Hooks & Onboarding (~20 pairs)
- [ ] 3.2.1–3.2.8 Same pattern
- Extract shared hook factories, consolidate similar ViewModel logic

### Task 3.3: C↔C Batch 3 — DataGrid Configs & Table Components (~20 pairs)
- [ ] 3.3.1–3.3.8 Same pattern
- Extract shared column configs, table layout constants

### Task 3.4: C↔C Batch 4 — Forms, Filters & Remaining (~18 pairs)
- [ ] 3.4.1–3.4.8 Same pattern
- Extract shared form field configs, filter bar components

---

## Phase 4: Cross-Tier & Same-Tier (Parallel Subagents)

### Task 4.1: C↔D & C↔M Cross-Tier (81 C↔D + 68 C↔M pairs, ~23,376 tokens)
- [ ] 4.1.1 Read all plan files
- [ ] 4.1.2 For each C↔D pair: extend existing `*Shared.tsx` scaffold OR move common logic to `__shared__/` and have both common and desktop delegate
- [ ] 4.1.3 For each C↔M pair: same approach as C↔D
- [ ] 4.1.4 QL per modified file
- [ ] 4.1.5 SR: Verify no cross-tier import violations (desktop↔mobile forbidden)
- [ ] 4.1.6 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [ ] 4.1.7 Write outcome: `.ai/plans/duplications-phase6/outcome/4.1-cross-tier-outcome.md`
- [ ] 4.1.8 Update progress: Mark 4.1 as `[x]`

**Note:** This is a large task — subagent should prioritize the highest-token pairs first and may need multiple subagent waves.

### Task 4.2: D↔D Same-Tier (12 pairs, ~1132 tokens)
- [ ] 4.2.1 Read all plan files
- [ ] 4.2.2 For each D↔D pair: create shared view scaffold in `frontend/common/views/` (Pattern F), both desktop variants import and delegate
- [ ] 4.2.3 QL per modified file
- [ ] 4.2.4 SR: Verify desktop-only imports are correct (no mobile imports)
- [ ] 4.2.5 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`
- [ ] 4.2.6 Write outcome: `.ai/plans/duplications-phase6/outcome/4.2-dd-same-tier-outcome.md`
- [ ] 4.2.7 Update progress: Mark 4.2 as `[x]`

### Task 4.3: M↔M Same-Tier (10 pairs, ~933 tokens)
- [ ] 4.3.1 Read all plan files
- [ ] 4.3.2 For each M↔M pair: create shared view scaffold in `frontend/common/views/` (Pattern F), both mobile variants import and delegate
- [ ] 4.3.3 QL per modified file
- [ ] 4.3.4 SR: Verify mobile-only imports are correct (no desktop imports)
- [ ] 4.3.5 IV: Read `frontend/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [ ] 4.3.6 Write outcome: `.ai/plans/duplications-phase6/outcome/4.3-mm-same-tier-outcome.md`
- [ ] 4.3.7 Update progress: Mark 4.3 as `[x]`

---

## Phase 5: Review Gates (Serial)

### Task 5.1: Mid-Point Review
- [ ] 5.1.1 Run `bunx jscpd . --config .jscpd.json --reporters json` to get current clone count
- [ ] 5.1.2 Compare against baseline (475 clones, 62,929 tokens)
- [ ] 5.1.3 Verify zero `jscpd:ignore` directives: `grep -r "jscpd:ignore" frontend/ shared/ backend/` returns empty
- [ ] 5.1.4 Verify `.jscpd.json` unchanged: `git diff HEAD -- .jscpd.json` shows no Phase 6 changes
- [ ] 5.1.5 Verify zero tsgo errors on modified files
- [ ] 5.1.6 Write outcome: `.ai/plans/duplications-phase6/outcome/5.1-midpoint-review-outcome.md`
- [ ] 5.1.7 Update progress: Mark 5.1 as `[x]`

### Task 5.2: Post-Implementation Review
- [ ] 5.2.1 Run `bunx jscpd . --config .jscpd.json --reporters json` to get final clone count
- [ ] 5.2.2 Verify total clone count reduction ≥100 pairs from baseline
- [ ] 5.2.3 Review all outcome files for completeness
- [ ] 5.2.4 Write outcome: `.ai/plans/duplications-phase6/outcome/5.2-post-impl-review-outcome.md`
- [ ] 5.2.5 Update progress: Mark 5.2 as `[x]`

### Task 5.3: Final Quality Gate
- [ ] 5.3.1 Run `bun tsgo` — must pass with zero new errors
- [ ] 5.3.2 Run `bun oxlint` — must pass with zero new errors
- [ ] 5.3.3 Run `bun biome:check` — must pass
- [ ] 5.3.4 Run `bun lint` — must pass
- [ ] 5.3.5 Run `bun check:duplicates` — verify clone count reduction
- [ ] 5.3.6 Write outcome: `.ai/plans/duplications-phase6/outcome/5.3-final-quality-gate-outcome.md`
- [ ] 5.3.7 Update progress: Mark 5.3 as `[x]`

---

## Phase 6: Residual Sweep & Knowledge Propagation (Serial)

### Task 6.1: Post-Implementation Residual Sweep
- [ ] 6.1.1 Run `bunx jscpd . --config .jscpd.json --reporters json` to get final clone list
- [ ] 6.1.2 Compare all remaining clones against Phase 6 baseline
- [ ] 6.1.3 For any remaining P3 pairs not yet resolved: triage and fix (NO jscpd:ignore)
- [ ] 6.1.4 Write outcome: `.ai/plans/duplications-phase6/outcome/6.1-residual-sweep-outcome.md`
- [ ] 6.1.5 Update progress: Mark 6.1 as `[x]`

### Task 6.2: Update Documentation
- [ ] 6.2.1 Update `docs/frontend/duplication-elimination-patterns.md` with Patterns A-G (scaffold extraction, shared utility, dead code deletion, store consolidation, scaffold extension, shared view scaffold, locale type consolidation)
- [ ] 6.2.2 QL: `bun run scripts/health/sub-loop.ts docs/frontend/duplication-elimination-patterns.md --lifecycle codescene` (if applicable to docs)
- [ ] 6.2.3 Write outcome: `.ai/plans/duplications-phase6/outcome/6.2-docs-update-outcome.md`
- [ ] 6.2.4 Update progress: Mark 6.2 as `[x]`

### Task 6.3: Update AGENTS.md Files
- [ ] 6.3.1 Add Phase 6 outcome reference to root `AGENTS.md` Important References section
- [ ] 6.3.2 Add P3 scaffold extraction pattern reference to `frontend/AGENTS.md`
- [ ] 6.3.3 Write outcome: `.ai/plans/duplications-phase6/outcome/6.3-agentsupdate-outcome.md`
- [ ] 6.3.4 Update progress: Mark 6.3 as `[x]`

### Task 6.4: Final Commit
- [ ] 6.4.1 Verify all outcome files are present
- [ ] 6.4.2 Verify `tasks.md` shows all tasks as `[x]`
- [ ] 6.4.3 Verify zero `jscpd:ignore` directives in codebase
- [ ] 6.4.4 Verify `.jscpd.json` unchanged from pre-Phase 6
- [ ] 6.4.5 Commit all changes with message: "Phase 6: Eliminate P3 micro clusters via scaffold extraction (no jscpd:ignore)"
- [ ] 6.4.6 Update progress: Mark 6.4 as `[x]`
