# Plan: Improve spec-driven-development Skill & Spec Process Guide

**Status:** Implementation-ready  
**Created:** 2026-08-05  
**Evidence base:** 4 completed implementations (auto-meeting-url, cron, quota, whatsapp) — 80+ tasks, 28+ review rounds, 1000+ findings

---

## Goal

Transform the `spec-driven-development` skill from a 3-phase planning tool into a comprehensive development lifecycle methodology that prevents defect propagation, catches semantic bugs early, eliminates technical debt drift, and ensures seamless knowledge propagation.

**Target outcome:** Reduce post-implementation review rounds from 5-12 → 2-3 by shifting semantic detection left into plan and per-task phases.

---

## Problem

All four implementations revealed the same structural failure: the per-task quality loop (tsgo + biome + lint) provides **false confidence** by catching syntax/style issues while allowing semantic bugs to accumulate:

| Bug Class | Examples | Quality Loop Detected? |
|---|---|---|
| Race conditions (TOCTOU) | whatsapp: notification.repository, Redis pair-rate-limit; quota: deductPendingRefresh; cron: reconcileStuckRuns | ❌ |
| Dead code | whatsapp: tryB3Resurrection upsert path; quota: unreachable branches | ❌ |
| Type cascades | quota: Student→StudentReturnType broke 8+ files; enum import confusion (all) | ❌ |
| Schema drift | whatsapp: max_phone_numbers_per_business in migration but not Drizzle schema | ❌ |
| Cross-layer violations | whatsapp: DashboardProfileShell importing from @/backend/ | ❌ |
| Env-config gaps | whatsapp: resolveEnvConfig called but keys never registered; cron: similar | ❌ |
| Deferred items | whatsapp: 2 of 5 never resolved; quota: ~40% never resolved | ❌ |

**Result:** 100% of implementation tasks reported "quality gate ✅" while harboring bugs requiring 5-12 rounds of post-implementation review.

---

## Key Decisions (Resolved)

1. **Phase numbering:** Use **Phase 0** (Baseline) and **fractional gates** (Phase 1.5 plan review, Phase 2.5 mid-point review) to avoid renumbering existing Phases 1-7. Insert review checkpoints without breaking the template's current 7-phase structure (Phase 7 = Knowledge Propagation remains).

2. **Lint consolidation dependency:** The lint-queue-server/client/config HTTP architecture is being replaced with a unified `scripts/lint-service.ts` in-process API (per `.kilo/plans/1785894852744-consolidate-lint-service.md` — under implementation). This plan references the **new API**: `import { requestLint } from "@/scripts/lint-service"` for programmatic lint, and `bun run scripts/lint-service.ts -f <file> --id <id>` for CLI. No HTTP endpoints, no port config, no server startup.

3. **Instruction file path:** Canonical path is `.agents/instructions/` (git-tracked, 5 files present). References to `.github/instructions/` in some skills are stale (pre-existing bug; out of scope to fix other skills).

4. **Actual plan file names:** Real feature plans use `specs.md` + `implementation.md`/`design.md` + `trackable-tasks.md` — NOT the template names (`requirements.md`/`design.md`/`tasks.md`). Updated skill references the actual names.

5. **Scope:** Edit ONLY skill + guide/template/process files. Do NOT create `docs/<domain>/*.md`, do NOT edit layer `AGENTS.md` rule bodies, do NOT edit source code. Those are per-feature plan responsibilities.

---

## Out of Scope

- Creating canonical `docs/<domain>/` reference files (each feature plan's Knowledge Propagation task does this).
- Editing layer `AGENTS.md`, `.agents/instructions/*.md`, or source code.
- Migrating completed plans' outcome files to new naming convention (retroactive; not needed).
- Fixing stale `.github/instructions/` references in `quality-gate`/`repo-review` skills (separate task).
- Bulk-updating 50+ historical plan markdown files with stale lint-queue references (out of scope per AGENTS.md).

---

## Affected Files

### Skill
- `.agents/skills/spec-driven-development/SKILL.md` — Add Phase 0, 1.5, 2.5; expand quality loop with semantic checklist; add interleaved tests, parallel review wave pattern, outcome synthesis protocol.

### Templates (`.agents/spec-process-guide/templates/`)
- `requirements-template.md` — Add Requirement 0 (baseline + deferred ledger); i18n enum property (`Translation.Dashboard.X`); role matrix anchored to seed files.
- `design-template.md` — Add Concurrency Assessment; i18n property access (`t.propertyName`); Drizzle anti-patterns (no inline `--` comments in `sql`` templates); enum value vs type imports.
- `tasks-template.md` — Add Task 0 (baseline), Task 1.5 (plan review gate), Phase 2.5 (mid-point review gate), Phase-Boundary Type Coherence Gates, semantic review subtask, interleaved test structure, deferred-items ledger enforcement, standardized outcome naming.
- `checklists.md` — Add Enum Import, Semantic Review, Race Condition, Dead Code, i18n Property Access, Type Cascade, Scope Boundary checklists.
- `plan-review-template.md` (NEW) — Structured plan review report format.
- `deferred-items-template.md` (NEW) — Technical debt ledger table.
- `quick-spec-template.md` — Add simplified Phase 0 baseline, per-task quality loop; omit Phase 1.5/4 formal reviews.
- `micro-spec-template.md` — Add baseline count, per-file quality loop; omit reviews/propagation.

### Process Guides (`.agents/spec-process-guide/process/`)
- `requirements-phase.md` — Align with Phase 0 + Phase 1.5.
- `design-phase.md` — Add Concurrency Assessment + Plan Review Gate.
- `tasks-phase.md` — Add Phase-Boundary Type Coherence Gate, interleaved tests, deferred ledger.
- `README.md` — Index expanded lifecycle.

### Execution Guides (`.agents/spec-process-guide/execution/`)
- `implementation-guide.md` — Semantic checklist, deferred ledger, type coherence gate, new lint service API.
- `quality-assurance.md` — Parallel review wave pattern, scope boundary enforcement.
- `troubleshooting.md` — Add pitfalls from four outcomes (type cascade, deferred drift, TOCTOU, i18n string-vs-enum).
- `README.md` — Index new phases.

### Navigation
- `NAVIGATION.md` — Add new templates, phases, checklist sections.
- Root `README.md` — Reference expanded lifecycle.
- `methodology/lightweight-specs.md` — Define scaled-down ruleset for quick/micro specs.

---

## Implementation Tasks (Ordered)

### Wave A: New Templates (no dependencies)
**A1. Create `plan-review-template.md`**
- Structure: Round, Date, Subagents Dispatched, Findings by Dimension (table), Fix Subagents, Post-Fix Verification, Lessons.

**A2. Create `deferred-items-template.md`**
- Table: ID | Deferred Item | Source Task | Target Task | Status (✅/⚠️/❌/🔄) | Verified By | Notes.
- Enforcement: Final gate runs `grep -c "❌\|⚠️"` → must be 0.

### Wave B: Core Skill (depends on understanding A1/A2 structure)
**B1. Update `SKILL.md`**
- Add **Phase 0: Pre-Implementation Baseline** — Record tsgo/biome/lint error counts before starting to distinguish new from pre-existing.
- Add **Phase 1.5: Plan Review Gate** — Invoke `@plan-review` skill on `specs.md`/`implementation.md`/`trackable-tasks.md`; fix violations; re-run until clean; write `outcome/plan-review-R1.md`.
- Add **Phase 2.5: Mid-Point Review Gate** (conditional, multi-phase plans >15 tasks) — After backend foundation, before webhook/frontend; dispatch `review-backend`, `review-types`, `review-config` (backend scope only); fix; write `outcome/midpoint-review-R1.md`.
- Expand **Quality Loop Per File** with **Semantic Review Checklist**:
  - Race conditions: No read-then-write without atomicity (SELECT FOR UPDATE / tx / advisory lock)
  - Concurrency: No module-level mutable state without bounds
  - Env-config: All `resolveEnvConfig` calls registered in `env-config-keys.ts`
  - Cache: All `resetX()` functions invalidate all resolved keys
  - Credentials: No empty-string acceptance
  - Dead code: All branches reachable
  - Cross-layer: No frontend→backend or shared→frontend/backend imports
  - Types: Enums imported as values when used at runtime (not `import type`)
  - Schema: Migration columns exist in Drizzle schema
  - Deferred items: All logged in `deferred-items.md`
- Add **Parallel Review Wave Pattern** — Post-implementation: dispatch `review-types`, `review-backend`, `review-frontend` on files created/modified by plan; aggregate+fix+verify until zero feature-specific findings.
- Add **Interleaved Test Structure** — Each builder/adapter/service task includes paired test subtask.
- Add **Outcome Synthesis Protocol** — Extract recurring patterns from outcome files into `docs/<domain>/`, update layer `AGENTS.md`, skills, instructions.
- Note: Lint service is now `import { requestLint } from "@/scripts/lint-service"` (in-process API) or `bun run scripts/lint-service.ts -f <file> --id <id>` (CLI) — no HTTP, no server.

### Wave C: Templates (can run parallel with B after A completes)
**C1. Update `requirements-template.md`**
- Add **Requirement 0: Pre-Implementation Baseline & Execution Protocol** — Run tsgo/biome/lint, record counts; create deferred-items.md.
- Add **Requirement 0.5: Translation System Compliance** — EARS ACs for `useAppTranslation(Translation.<Namespace>)` enum property, `t.propertyName` access (not `t('key')`), server `getTranslations(locale)` single arg, enum value imports for runtime.

**C2. Update `design-template.md`**
- Add **Concurrency & Race Condition Assessment** section (for shared state features: list race scenarios, document SELECT FOR UPDATE / advisory locks, note TOCTOU windows).
- Update **UX/Navigation** with Translation System Requirements block: code examples for client/server/resolver/API-script contexts; enum property access; forbidden patterns.
- Add **Drizzle SQL Template Anti-Patterns**: NEVER use inline `--` comments inside `sql`` templates (shifts parameter bindings).
- Add **Enum Import Guidance**: value imports (`import { Enum }`) for runtime usage; type imports (`import type`) only for pure annotations.

**C3. Update `tasks-template.md`**
- Add **Task 0: Pre-Implementation Baseline** — Run tsgo/biome/lint, record counts; create `.ai/plans/<feature>/deferred-items.md`.
- Add **Phase 1.5: Plan Review Gate** — Invoke `@plan-review` on complete plan; fix violations; re-run until "passes all AGENTS.md rules"; write `outcome/plan-review-R1.md`; commit patched plan.
- Add **Phase 2.5: Mid-Point Review Gate** (conditional) — After backend, before frontend; dispatch backend-scoped reviews; fix; write `outcome/midpoint-review-R1.md`.
- Add **Semantic Review subtask (X.Y.SR)** to MANDATORY subtasks — Agent self-review checklist before marking `[x]`; sequence: QL (quality loop) → SR (semantic review) → IV (instruction verification).
- Add **Phase-Boundary Type Coherence Gate** — After each major phase: run full `bun tsgo`, compare against pre-phase baseline; fix all new errors caused by type/enum changes before proceeding.
- Update task structure to **interleave paired tests** — Each builder/adapter task gets `X.Y.2 Write paired test` subtask + `X.Y.3 Run tests` + `X.Y.4 Quality loop on both`.
- Phase 1 setup: Add subtask to create `deferred-items.md` from template.
- Final quality gate (before Phase 7): Add subtask to enforce `grep -c "❌\|⚠️" deferred-items.md` == 0.
- Update **lint service references**: Replace all `curl -X POST http://localhost:${LINT_QUEUE_PORT}/lint` with `bun run scripts/lint-service.ts -f <file> --id <id>` or `requestLint("id", [files])` for programmatic.
- Update file-name references to actual plan filenames (`specs.md`, `implementation.md`, `trackable-tasks.md`) with a note that templates provide structure.

**C4. Update `checklists.md`**
- Add **Semantic Review Checklist (Per-Task)** — Binary yes/no items mirroring B1.
- Add **Translation & Enum Import Checklist (Per-Task)** — Translation enum usage, property access, single-arg `getTranslations(locale)`, value imports for runtime enums, no string literals.
- Add **Race Condition Review Checklist** — Async read-then-write, module-level state, Redis atomicity, concurrency primitives.
- Add **Type Cascade Checklist** — Phase-boundary full tsgo, cross-file dependency prediction.
- Add **Scope Boundary Checklist** — Distinguish in-scope (plan-touched) from pre-existing files during reviews.

**C5. Update `quick-spec-template.md`**
- Add simplified Phase 0 baseline (record counts only).
- Add per-task quality loop (tsgo + biome + lint service).
- Add basic outcome logging.
- Explicitly note Phase 1.5/4 formal reviews omitted (scaled-down for <3 day features).

**C6. Update `micro-spec-template.md`**
- Add baseline count only.
- Add per-file quality loop.
- Single outcome file.
- Note reviews/propagation omitted (scaled-down for <1 day changes).

### Wave D: Process & Execution Guides (depends on B/C for phase definitions)
**D1. Update `process/requirements-phase.md`**
- Align with Phase 0 + Phase 1.5.
- i18n enum property standards.

**D2. Update `process/design-phase.md`**
- Add Concurrency Assessment section.
- Add Plan Review Gate integration.

**D3. Update `process/tasks-phase.md`**
- Add Phase-Boundary Type Coherence Gate.
- Add interleaved test guidance.
- Add deferred-items ledger usage.

**D4. Update `process/README.md`**
- Index expanded lifecycle (Phase 0, 1.5, 2.5, 1-7 existing).

**D5. Update `execution/implementation-guide.md`**
- Document semantic self-review checklist.
- Document deferred-items ledger instructions.
- Document phase-boundary type coherence gate (full `bun tsgo`).
- Update lint service API: `requestLint` programmatic or CLI.

**D6. Update `execution/quality-assurance.md`**
- Add Parallel Review Wave pattern (8-dimension dispatch, findings synthesis, fix subagents, post-fix verification).
- Add Scope Boundary enforcement (in-scope vs pre-existing files).
- Integrate Semantic Review into quality gates.

**D7. Update `execution/troubleshooting.md`**
- Add common pitfalls from four outcomes: type cascade, deferred-item drift, TOCTOU, i18n string-vs-enum, lint service migration.

**D8. Update `execution/README.md`**
- Index new execution phases.

### Wave E: Navigation & Validation (depends on all above)
**E1. Update `NAVIGATION.md`**
- Add `plan-review-template.md`, `deferred-items-template.md`.
- Add Phase 0, 1.5, 2.5 entries.
- Add new checklist sections.

**E2. Update root `README.md`**
- Reference expanded lifecycle.

**E3. Update `methodology/lightweight-specs.md`**
- Define scaled-down ruleset boundary (what's in quick/micro, what's out).

**E4. Validate**
- Verify all relative links across templates and guides resolve.
- Verify EARS syntax, code snippets match Siraj conventions.
- Check all `Translation.Dashboard.X` enum references, `t.propertyName` access, lint service API calls.
- Run `bun tsgo` and `bun biome:check` (these are Markdown-only edits but biome may flag formatting).

---

## Evidence → Improvement Traceability

| Improvement | Evidence |
|---|---|
| Phase 0 Baseline | quota Obs.10 (27 pre-existing tsgo errors caused confusion) |
| Phase 1.5 Plan Review | quota Obs.11 (33 findings in plan); auto-meeting-url Rec.1 (28 findings caught pre-implementation → only 3 rounds needed total) |
| Concurrency Assessment | quota Obs.7, whatsapp §5.9, whatsapp §3.1 (TOCTOU in 9 tasks passed ✅) |
| i18n enum property access | quota Obs.12, whatsapp §7.3, auto-meeting-url pattern #4 |
| Semantic Review Checklist | whatsapp §5.1 (quality loop gives false confidence), quota Obs.2 |
| Interleaved Tests | whatsapp §5.3, §3.3 (Task 4 builders shipped without tests) |
| Type Coherence Gate | quota Obs.1 (Student→StudentReturnType cascade across 8+ files) |
| Deferred-Items Ledger | whatsapp §5.2, §3.2 (2 of 5 never resolved), quota Obs.8 (~40% never resolved) |
| Parallel Review Waves | auto-meeting-url Rec.1, cron §3 (8 rounds), whatsapp (12 rounds) |
| Outcome naming/propagation | quota Obs.6/8, cron Rec.8, auto-meeting-url Rec.3 |
| Drizzle inline-comment anti-pattern | cron §1 (parameter binding shift from `--` comment) |

---

## Validation Plan

1. **Link audit:** Every relative link in `NAVIGATION.md`, `README.md` files, and template cross-references resolves to existing file.
2. **Convention audit:** Grep all updated files for forbidden patterns:
   - ❌ Hardcoded lint port (`4777`, `5055` literal in commands)
   - ❌ String-literal i18n (`useAppTranslation("...")`, `t('...')`, `t("...")`)
   - ❌ Stale lint-queue references (`lint-queue-server`, `lint-queue-client`, `lint-queue-config`, `curl .../lint`, `LINT_QUEUE_PORT`)
   - ❌ `.github/instructions/` references (should be `.agents/instructions/`)
3. **Completeness audit:** Each new phase (0, 1.5, 2.5) appears in SKILL.md, relevant template, relevant process guide, relevant execution guide, and NAVIGATION.md.
4. **Quality gate:** `bun tsgo` clean; `bun biome:check` clean.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Semantic checklist adds per-task overhead | Self-review only (no scripts); net savings 6-40h/feature from fewer review rounds |
| Phase 1.5 `@plan-review` false positives | Skill already project-tuned; validated on 3 implementations (~0 false positives) |
| Phase numbering (0, 1.5, 2.5) confuses execution order | Template task list states explicit execution order; phase numbers avoid renumbering 1-7 |
| Lint service migration incomplete (stale references) | This plan updates skill/templates/guides; historical plans out of scope; live operational docs flagged for separate bulk-update |
| Instruction-path confusion (`.agents/` vs `.github/`) | Our edits use correct `.agents/instructions/`; flag pre-existing bug in other skills (out of scope to fix) |

---

## Success Criteria

Plan succeeds when:
- Phase 0 baseline distinguishes new from pre-existing errors (100% of plans).
- Phase 1.5 plan review catches ≥70% of path/i18n/GraphQL/permission errors before implementation.
- Phase 2.5 mid-point review (when triggered) catches ≥50% of backend issues before frontend starts.
- Per-task Semantic Review catches race/dead-code/cross-layer issues before quality loop "passes".
- Deferred-items ledger enforcement achieves 100% resolution rate (up from ~60%).
- Parallel review waves (post-implementation) find <20 feature-specific findings (down from 130+).
- Total review rounds: 2-3 (down from 5-12).

---

## Known Pre-Existing Bugs (Flagged, NOT Fixed)

1. **`quality-gate/SKILL.md` and `repo-review/SKILL.md`** reference `.github/instructions/*.md` which does not exist — actual path is `.agents/instructions/`. Fixing these is out of scope (would modify other skills not part of this plan).

2. **50+ historical plan markdown files** in `.kilo/plans/`, `.ai/finished_plans/`, `communication_specs.md` mention `lint-queue-*`, `LINT_QUEUE_PORT`, `curl ... /lint`, "start the server". Per AGENTS.md, do NOT edit historical plans in a skill refactor. Live operational docs in `.agents/skills/`, `.agents/instructions/`, `.agents/agents/` with stale references are flagged for separate bulk-update strategy (15+ files).
