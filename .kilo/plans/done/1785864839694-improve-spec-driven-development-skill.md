# Plan: Enhance the `spec-driven-development` Skill & Spec Process Guide

## Context

The `spec-driven-development` skill (`.agents/skills/spec-driven-development/SKILL.md`) and its guide tree (`.agents/spec-process-guide/`) have been used across four major feature implementations: `auto-meeting-url`, `cron`, `quota`, and `whatsapp`. Post-implementation retrospectives in each plan's `outcome/` directory identified recurring, evidence-backed friction:

- Quality loop ("tsgo + biome + lint") gives **false confidence** — it catches mechanical regressions but misses TOCTOU races, dead code, schema drift, cache-invalidation gaps, and enum divergence (whatsapp §3.1, quota Obs.1/4).
- Type cascades across files accumulate silently between phases because per-file `tsgo` compiles against local imports only (quota Obs.1).
- Deferred items ("future task") accumulate as silent tech debt with no closure gate (whatsapp §3.2, quota Obs.8).
- Plan-to-reality mismatches (wrong paths, i18n namespace strings vs enum property access, role matrix vs seed data) are only caught late via `/review` — they should be caught *before* implementation (quota Obs.11, auto-meeting-url Rec.1).
- Outcome files vary in naming and depth; cross-file dependency prediction is missing (quota Obs.3/8, cron Rec.8).
- Knowledge propagation docs drift from final code (quota Obs.6).

This plan upgrades the skill and guide to fix these without changing any source code. It only edits skill/templates/process files.

## Decisions (Resolved)

1. **Workflow model**: Expand from 3 phases to an explicit lifecycle: **Phase 0** (Baseline) → **Phase 1** (Requirements) → **Phase 1.5** (Plan Review Gate) → **Phase 2** (Design) → **Phase 3** (Interleaved Tasks + mid-point gate) → **Phase 4** (Parallel Review Waves) → **Phase 5** (Knowledge Propagation).
2. **Lightweight specs** (`quick-spec-template.md`, `micro-spec-template.md`): Scaled-down — include simplified Phase 0 baseline, per-task quality loop, and basic outcome logging; **omit** Phase 1.5 multi-agent reviews, formal parallel review waves, and dedicated knowledge-propagation tasks. Scoped by `methodology/lightweight-specs.md`.
3. **Lint queue port**: Configured default is **4777** (`scripts/lint-queue-config.ts:19`); env var `LINT_QUEUE_PORT` overrides it. All guide snippets must use the dynamic resolver `export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)` — **never** hardcode `4777` or `5055`. (Current draft's `5055` claim was a per-session override, not the config — corrected here.)
4. **Instruction directory**: `.agents/instructions/` is the correct, existing path today (verified: 5 files present). `.github/instructions/` does **not** exist. The whatsapp §3.8 observation was stale. Auto-detect logic is kept as **future-proofing**, not a bug fix — framed as "use `.agents/instructions/` as the canonical path."
5. **i18n convention**: Enforce `useAppTranslation(Translation.Dashboard.X)` (enum property) for client components and `t.propertyName` for accessing labels; server/resolver/script variants keep their existing key-based APIs per root `AGENTS.md`.
6. **Scope boundary**: This plan edits ONLY skill + guide/template/process files. It does NOT create `docs/<domain>/*.md`, does NOT edit layer `AGENTS.md` rule bodies, does NOT touch source code. Those are per-feature plan responsibilities (the skill *documents* the propagation protocol; it doesn't pre-create docs).

## Out of Scope

- Creating canonical `docs/<domain>/` reference files (that's each feature plan's Phase 5 job).
- Editing any layer `AGENTS.md`, `.agents/instructions/*.md`, or source code.
- Migrating the four completed plans' outcome files to the new naming convention (retroactive; not needed).
- Automating any check via new scripts (e.g., a `compliance-check` script) — only documenting manual/automatable steps in guides.

---

## Affected Files (Authoritative Inventory)

### Skill
- `.agents/skills/spec-driven-development/SKILL.md` — expand 6-phase workflow, outcome naming, deferred ledger, concurrency guidelines, parallel review wave pattern, semantic review checklist, knowledge propagation protocol, updated checklists.

### Templates (`.agents/spec-process-guide/templates/`)
- `requirements-template.md` — add Requirement 0 (baseline + deferred ledger), i18n enum-property conventions, seed-anchored role matrix.
- `design-template.md` — add Concurrency & Race Condition Assessment, i18n property access (`t.propertyName`), component path rules, enum import rules (`import` value vs `import type`), Drizzle SQL template anti-patterns (no inline `--` comments).
- `tasks-template.md` — add Task 0 (baseline), Task 1.5 (plan review gate), interleaved test subtasks, dynamic-port quality loop, per-task semantic checklist, mid-point review gate, Phase-Boundary Type Coherence Gate (`bun tsgo` full project), Phase 4 parallel review wave tasks, Phase 5 knowledge propagation task, standardized outcome naming `<task-id>-<slug>-outcome.md`.
- `checklists.md` — add Enum Import, Semantic Review, Race Condition, Dead-Code, i18n Property Access, and Type Cascade checklists across all phases.
- `quick-spec-template.md` — scaled-down: simplified Phase 0 baseline, per-task quality loop, basic outcome logging; omit Phase 1.5/4/5.
- `micro-spec-template.md` — even lighter: baseline count only, per-file quality loop, single outcome file; omit reviews/propagation.
- `plan-review-template.md` (NEW) — Plan Review Report: round, subagents, findings-by-dimension table, severity, fix tracking, post-fix verification, lessons.

### Process Guides (`.agents/spec-process-guide/process/`)
- `requirements-phase.md` — align with Phase 0 + Phase 1.5.
- `design-phase.md` — add Concurrency Assessment + Plan Review Gate integration.
- `tasks-phase.md` — add Phase-Boundary Type Coherence Gate, interleaved tests, deferred ledger, Phase 4/5 task structure.
- `README.md` — index the expanded lifecycle.
- `workflow-diagrams.md` — add Phase 0, 1.5, 4, 5 to diagrams (if editable markdown; skip if binary).

### Execution Guides (`.agents/spec-process-guide/execution/`)
- `implementation-guide.md` — dynamic port resolution, semantic self-review checklist, deferred-items ledger instructions, phase-boundary type coherence gate.
- `quality-assurance.md` — Parallel Review Wave pattern, scope-boundary enforcement (in-scope vs pre-existing files), Semantic Review integration into quality gates.
- `troubleshooting.md` — add common pitfalls from the four outcomes (type cascade, deferred-item drift, TOCTOU, i18n string-vs-enum).
- `README.md` — index new execution phases.

### Navigation
- `NAVIGATION.md` — add `plan-review-template.md`, new phases, new checklist sections.
- `README.md` (root guide) — reference expanded lifecycle.
- `methodology/lightweight-specs.md` — define the scaled-down ruleset boundary for quick/micro specs.

---

## Implementation Tasks (Ordered)

### Phase A: New Templates First
1. **Create** `.agents/spec-process-guide/templates/plan-review-template.md` — round/table/findings/fix/verify/lessons structure (per auto-meeting-url Rec.5, quota Obs.11).
2. **Create** `.agents/spec-process-guide/templates/deferred-items-template.md` — ledger columns: Item | Deferred In Task | Target Task | Status | Verified By (per whatsapp §5.2).

### Phase B: Core Skill + Full Templates
3. **Update** `.agents/skills/spec-driven-development/SKILL.md` — insert 6-phase lifecycle; add Concurrency Assessment section; add Parallel Review Wave Pattern; expand Outcome Knowledge Base with naming convention + deferred ledger + pattern extraction; replace checklists with the new consolidated set.
4. **Update** `templates/requirements-template.md` — Requirement 0 (baseline+ledger), i18n enum-property access with code snippets, role matrix anchored to seed-file cites.
5. **Update** `templates/design-template.md` — Concurrency & Race Condition Assessment section; UX/Nav i18n property access; component path rules (`dialog/` singular); enum import rules; Drizzle inline-comment (`` sql`-- ...` ``) anti-pattern.
6. **Update** `templates/tasks-template.md` — Task 0 baseline, Task 1.5 plan review, interleaved test subtasks, dynamic-port quality loop, per-task Semantic Checklist subtask, Mid-Point Review Gate task, Phase-Boundary Type Coherence Gate task, Phase 4 Review Wave tasks, Phase 5 Knowledge Propagation task, standardized outcome naming.
7. **Update** `templates/checklists.md` — add Enum Import, Semantic Review, Race Condition, Dead-Code, i18n Property Access, Type Cascade, Scope Boundary checklists.

### Phase C: Lightweight Templates
8. **Update** `templates/quick-spec-template.md` — add simplified Phase 0 baseline (record counts), per-task quality loop, basic outcome logging; explicitly note Phase 1.5/4/5 omitted.
9. **Update** `templates/micro-spec-template.md` — baseline count only, per-file quality loop, single outcome file; note reviews/propagation omitted.
10. **Update** `methodology/lightweight-specs.md` — define the scaled-ruleset boundary (what's in, what's out) to govern quick/micro.

### Phase D: Process & Execution Guides
11. **Update** `process/requirements-phase.md` — Phase 0 + Phase 1.5 step descriptions.
12. **Update** `process/design-phase.md` — Concurrency Assessment + Plan Review Gate.
13. **Update** `process/tasks-phase.md` — Type Coherence Gates, interleaved tests, deferred ledger, Phase 4/5 structure.
14. **Update** `process/README.md` — index expanded lifecycle.
15. **Update** `execution/implementation-guide.md` — dynamic port resolver, semantic checklist, deferred ledger, type coherence gate (full `bun tsgo`).
16. **Update** `execution/quality-assurance.md` — Review Wave pattern, scope-boundary enforcement, Semantic Review in quality gates.
17. **Update** `execution/troubleshooting.md` — add pitfalls from the four outcomes (type cascade, deferred drift, TOCTOU, i18n string-vs-enum, lint port mismatch).
18. **Update** `execution/README.md` — index new execution phases.

### Phase E: Navigation & Validation
19. **Update** `NAVIGATION.md` — add `plan-review-template.md`, `deferred-items-template.md`, new phases, new checklist sections, scaled-down lightweight path.
20. **Update** root `.agents/spec-process-guide/README.md` — reference expanded lifecycle and new templates.
21. **Validate**: verify all relative links across the guide resolve; verify EARS syntax, code snippets, and checklist items match Siraj conventions (`Translation.Dashboard.X`, `t.propertyName`, dynamic `LINT_QUEUE_PORT`).
22. **Quality check**: run `bun tsgo` and `bun biome:check` to confirm no workspace files broken (these edits are Markdown-only, but biome may flag formatting).

---

## Key Evidence → Improvement Trace

| Improvement | Evidence |
|---|---|
| Phase 0 Baseline | quota Obs.10 (27 pre-existing tsgo errors) |
| Phase 1.5 Plan Review | quota Obs.11 (33 findings), auto-meeting-url Rec.1/2 |
| Concurrency Assessment | quota Obs.7, whatsapp §5.9, whatsapp §3.1 (TOCTOU 9 tasks passed ✅) |
| i18n enum property access | quota Obs.12, whatsapp §7.3, auto-meeting-url pattern #4 |
| Semantic Review Checklist | whatsapp §5.1, quota Obs.2 |
| Interleaved Tests | whatsapp §5.3, §3.3 |
| Type Coherence Gate | quota Obs.1 (type cascade across 8+ files) |
| Deferred-Items Ledger | whatsapp §5.2, §3.2, quota Obs.8 |
| Parallel Review Waves | auto-meeting-url Rec.1, cron §3 (8 rounds), whatsapp §5.4 |
| Outcome naming/propagation | quota Obs.6/8, cron Rec.8, auto-meeting-url Rec.3 |
| Drizzle `` sql` ` `` inline-comment anti-pattern | cron §1 (parameter binding shift) |
| Dynamic lint port | quota Obs.5, cron Rec.6 |

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Guide becomes too heavy for small features | Lightweight templates (Tasks 8-10) carry only baseline + quality loop + outcome logging. |
| New phases get ignored in practice | Phase 1.5 + Phase 4 codified as checkbox tasks in `tasks-template.md` so they're visible in every full plan. |
| i18n snippet drift from actual API | Snippets cross-checked against `shared/locale/` real usage; server/resolver variants kept as key-based per root AGENTS.md. |
| Markdown-only edits still break biome formatting | Task 22 runs `bun biome:check`; fix any formatting biome flags before declaring done. |

## Validation Plan

1. **Link audit**: every relative link in `NAVIGATION.md`, `README.md` files, and template cross-references resolves to an existing file.
2. **Convention audit**: grep all updated guide files for forbidden patterns — hardcoded port numbers (`4777`/`5055` literal in commands), `useAppTranslation("...")` string args, `t('...')`/`t("...")` string-key access, `.github/instructions/` references.
3. **Completeness audit**: each new phase (0, 1.5, 4, 5) appears in SKILL.md, the relevant template, the relevant process guide, the relevant execution guide, and NAVIGATION.md.
4. **Quality gate**: `bun tsgo` clean; `bun biome:check` clean.

## Open Questions

None blocking. The instruction-directory and port ambiguities were resolved by direct inspection. If the user later wants automated compliance checks (quota Obs.9) or separate `docs/` sneakers, that's a follow-up plan.