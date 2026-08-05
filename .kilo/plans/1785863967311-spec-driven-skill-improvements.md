# Improve spec-driven-development Skill — Implementation Plan

**Status:** Implementation-ready
**Goal:** Shift semantic-bug detection left (into plan + per-task phases) to cut post-implementation review rounds from 5-12 → 2-3.
**Evidence base:** 4 implementations (auto-meeting-url, cron, quota, whatsapp) — 80+ tasks, 28+ review rounds, 1000+ findings. In every one, the per-task quality loop (tsgo+biome+lint) reported "✅" on tasks harboring race conditions, dead code, type cascades, schema drift, and cross-layer imports.

---

## Problem & Non-Goals

**Problem:** The skill's quality loop is a *verification gate* (syntax/format), not a *detection mechanism* (semantic bugs). Review skills caught every material bug — but only AFTER implementation, requiring 5-12 rounds.

**Non-goals (out of scope for this plan):**
- Creating new review skills (use existing `plan-review`, `repo-review` + `review-*` subagents)
- Writing canonical codebase docs (`docs/frontend/component-paths.md`, etc.) — those are feature-propagation targets, not skill improvements
- Automating the semantic checklist with scripts — keep it as agent self-review (low overhead)
- Touching the `plan-review` / `repo-review` skills' internals

---

## Key Decisions (Resolved)

1. **Phase numbering:** Use **fractional gates** — Phase 1.5 (plan review), Phase 2.5 (mid-point review) — keeping existing Phase 1-7 intact. Add **Phase 8 = Post-Implementation Review** AFTER existing Phase 7 (Knowledge Propagation). *(User-confirmed.)*
   - Rationale: Post-implementation review surfaces learnings that feed the Phase 7 propagation doc, but in practice the review must run on *committed* feature code. Sequence: implement → review+fix (uncommitted) → commit → knowledge propagation. So Phase 8's review work happens **between** implementation tasks and the Phase 7 propagation task, but numbered after to avoid renumbering. The template will clarify the review runs *before* the propagation *task executes*.

2. **Instruction-file path:** Canonical path is **`.agents/instructions/`** (git-tracked; confirmed via `git ls-files`). `.github/instructions/` does **NOT exist**. The `quality-gate` and `repo-review` SKILL.md files contain stale references to `.github/instructions/` — this is a **pre-existing bug** this plan will NOT fix (out of scope; would touch other skills). Our skill edits will use the correct `.agents/instructions/` path.

3. **Plan file names:** Actual feature plans use `specs.md` + `implementation.md` (or `design.md`) + `trackable-tasks.md` — NOT the template names (`requirements.md`/`design.md`/`tasks.md`). SKILL.md and templates will reference the actual names with a note that templates provide the structure.

4. **Post-implementation review before propagation:** The review+fix cycle runs on uncommitted feature code, then commits. The Phase 7 knowledge-propagation *task* runs *after* the review is clean. Phase 8 numbering is intentional to avoid renumbering 1-7; the template task list will state execution order explicitly.

---

## Scope: Files to Change

| File | Change | New? |
|---|---|---|
| `.agents/skills/spec-driven-development/SKILL.md` | Add Phase 1.5, 2.5, 8 sections; expand quality-loop semantic checklist; add interleaved-test + i18n/enum guidance | edit |
| `.agents/spec-process-guide/templates/tasks-template.md` | Add Phase 1.5, 2.5, 8 task templates; add Semantic Review subtask (X.Y.SR) to MANDATORY subtasks; interleave tests; deferred-items setup+enforcement | edit |
| `.agents/spec-process-guide/templates/requirements-template.md` | Add Requirement 0.5 (Translation System Compliance) + enum import guidance | edit |
| `.agents/spec-process-guide/templates/design-template.md` | Add Translation System Requirements block to UX/Navigation section | edit |
| `.agents/spec-process-guide/templates/checklists.md` | Add Semantic Review Checklist + Translation & Enum Import Checklist | edit |
| `.agents/spec-process-guide/templates/deferred-items-template.md` | New template: ledger table + usage + enforcement grep | NEW |
| `.agents/spec-process-guide/execution/outcome-protocol.md` | Add Section 3 (Cross-File Dependencies) + Section 7 (Pattern Discovered) | edit |

**No scripts created.** All verification uses existing `@plan-review`, review subagents, and `scripts/health/sub-loop.ts`.

---

## Ordered Task List

### Wave A — Core Gate Templates (no cross-file conflicts)

**A1. Update `tasks-template.md` — phase gates + structural subtasks**
- Add **Phase 1.5: Plan Review Gate** (mandatory): invoke `@plan-review` on `specs.md`/`design.md`(`implementation.md`)/`trackable-tasks.md`; fix violations; re-run until "passes all AGENTS.md rules"; write `outcome/plan-review-R1.md`; commit patched plan.
- Add **Phase 2.5: Mid-Point Review Gate** (CONDITIONAL — multi-phase plans >15 tasks): after backend foundation, before webhook/frontend; dispatch `review-backend`, `review-types`, `review-config` (backend scope only); fix all backend findings; write `outcome/midpoint-review-R1.md`.
- Add **Phase 8: Post-Implementation Review** (mandatory, executes before Phase 7 propagation task runs): scope = files created/modified by plan (`git diff --name-only` vs baseline); dispatch `review-types`, `review-backend`, `review-frontend` as applicable; aggregate+dedupe+categorize; fix per file cluster using `.agents/instructions/*.md`; verify zero feature-specific findings; write `outcome/post-implementation-review.md`.
- Add **Semantic Review subtask (X.Y.SR)** to MANDATORY subtasks block; sequence: QL (quality loop) → SR (semantic review) → IV (instruction verification) → mark `[x]`.
- Update task structure template to **interleave paired tests** (each builder/adapter/service task gets a `X.Y.2 Write paired test` subtask with `@live-comm`/`@live-integration` tag + `X.Y.3 Run tests` + `X.Y.4 QL on both`).
- Phase 1 setup: add subtask to create `.ai/plans/<feature>/deferred-items.md` from template.
- Final quality gate (Phase 7): add subtask to enforce `grep -c "❌\|⚠️" ./deferred-items.md` == 0.
- Update file-name references to actual plan filenames (`specs.md`, etc.) with a note.

**A2. Create `deferred-items-template.md`**
- Ledger table (ID | Item | Source Task | Target Task | Status | Verified By | Notes).
- Status enum: ✅ Done / ⚠️ Partial / ❌ Blocked / 🔄 In Progress.
- When-to-add / when-to-resolve guidance.
- Enforcement: final gate runs `grep -c "❌\|⚠️"` → must be 0.

### Wave B — Skill Body (depends on A1 phase definitions)

**B1. Update `SKILL.md`**
- In "Standard Task Enhancement Rules": expand **§2 Quality Loop Per File** with the Semantic Review Checklist (race conditions, env-config coverage, cache invalidation, dead code, cross-layer, schema sync, enum imports, deferred-items). State this is agent self-review (no script).
- Add **Phase 1.5 / 2.5 / 8** subsections mirroring A1 (concise; cross-link to template).
- Update **Task Sequencing Strategies**: add "Foundation-First + Interleaved Tests (RECOMMENDED)" with the paired-test task shape.
- Note instruction-file path = `.agents/instructions/` (correct path; do NOT reference `.github/instructions/`).

### Wave C — Checklists & Templates (parallel with B; independent files)

**C1. Update `checklists.md`** — append (do not rewrite existing):
- "Semantic Review Checklist (Per-Task)" — binary yes/no items mirroring B1.
- "Translation & Enum Import Checklist (Per-Task)" — Translation enum usage, property access (not `t('key')`), single-arg `getTranslations(locale)`, value imports for runtime enums, no string literals for enums.

**C2. Update `requirements-template.md`** — add **Requirement 0.5: Translation System Compliance** (EARS ACs for client/server/resolver i18n + enum value-import compliance + anti-patterns list).

**C3. Update `design-template.md`** — add **Translation System Requirements** block under UX/Navigation: the 4-context code examples (client `useAppTranslation(Translation.X.Y)` + property access; server `getTranslations(locale)` single arg; resolver `ctx.t`; API/script `getServerTranslations(locale)`); Forbidden patterns (string-literal namespaces, two-arg `getTranslations`, `next-intl`, hardcoded strings); enum value-vs-type import example.

### Wave D — Outcome Protocol (independent)

**D1. Update `outcome-protocol.md`** — add two mandatory/optional sections:
- **Section 3: Cross-File Dependencies** (MANDATORY) — for each type/enum/interface changed: file path, consumer chain, breaking-change flag, impact, where fixed.
- **Section 7: Pattern Discovered** (OPTIONAL) — name, location, reusable-for, code sketch.

### Wave E — Validation (requires A-D complete)

**E1. Validate on a small real feature plan**
- Pick a 5-7 task feature; create plan using updated skill/templates.
- Execute Phase 1 → 1.5 (run `@plan-review`, record findings) → Phase 2 → 2.5 if applicable → Phase 3 → Phase 8 review → Phase 7 propagation.
- Capture metrics: findings at each gate, false positives, total review rounds.
- Write `.kilo/plans/1785863967311-spec-driven-skill-improvements/validation-outcome.md` with results + ref refinements (apply as a patch to A-D if needed).

---

## Validation Criteria

Plan succeeds when a validation feature shows:
- Phase 1.5 catches ≥70% of path/i18n/GraphQL/permission errors before implementation.
- Phase 2.5 (if triggered) catches ≥50% of backend architecture issues before frontend.
- Phase 8 finds <20 feature-specific findings (vs 134+ baseline).
- Per-task Semantic Review catches race/dead-code/cross-layer issues before quality loop "passes".
- Deferred-items ledger enforcement blocks any plan with unresolved ❌/⚠️.
- Total review rounds = 2-3 (vs 5-12 baseline).

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Semantic checklist adds per-task overhead | Self-review only (no scripts); net savings 6-40h/feature from fewer review rounds |
| Phase 1.5 `@plan-review` false positives block progress | Skill already project-tuned; validated on auto-meeting-url (28 real findings, ~0 false positives) |
| Phase 8 "after Phase 7 numbering" misleads execution order | Template task list states explicit execution order: review runs BEFORE the propagation task executes |
| Offline review subagents may re-surface pre-existing-code findings (whatsapp R11 rebound) | Scope reviews to plan-touched files only (`git diff --name-only` vs baseline); record pre-existing findings but don't block |
| Instruction-path confusion (`.agents/` vs stale `.github/` refs in other skills) | Our edits use correct `.agents/instructions/`; flag the pre-existing bug in validation outcome but do NOT fix other skills here |

---

## Known Pre-existing Bugs (Flagged, NOT Fixed by This Plan)

1. `quality-gate/SKILL.md` and `repo-review/SKILL.md` reference `.github/instructions/*.md` which does not exist — actual path is `.agents/instructions/`. Fixing these is out of scope (would modify other skills).
2. Skill templates use `requirements.md`/`tasks.md` names but actual plans use `specs.md`/`implementation.md`(`design.md`)/`trackable-tasks.md`. This plan updates the skill to reference actual names where it adds new content.

---

## Out-of-Scope for This Plan

- Fixing the `.github/instructions` stale references in `quality-gate`/`repo-review` skills.
- Creating canonical codebase docs (`docs/frontend/component-paths.md`, `docs/i18n/translation-api.md`, etc.) — these belong to per-feature Knowledge Propagation tasks, not the skill.
- Building an automated traceability-verification script — kept as agent self-review for low overhead.
- Changing the `plan-review` or `repo-review` skill internals.
