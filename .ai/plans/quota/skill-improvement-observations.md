# Skill Improvement Observations: spec-driven-development

**Source**: Full implementation of the Quota System plan (`.ai/plans/quota/`)
**Scope**: 19 commits, 182 files changed, 35K+ insertions, 5+ rounds of iterative review and fixes
**Date**: 2025-07-17

---

## Executive Summary

The spec-driven-development skill provided a strong structural foundation for the quota system implementation. The three-phase workflow (Requirements → Design → Tasks), outcome knowledge base, per-file quality loop, and instruction verification subtasks all worked as designed. However, the implementation exposed several gaps — primarily around **cross-file type cascade detection**, **outcome file depth**, **post-implementation verification**, and **enum/type coherence** — that required 5+ additional review rounds to catch and fix. These observations describe how the skill can be improved to catch such issues earlier.

---

## Observation 1: No Cross-File Type Cascade Verification Step

### What Happened

The per-file quality loop (`tsgo + biome + lint`) caught issues within individual files. However, it did **not** catch type cascades across files:

- Renaming `Student` → `StudentReturnType` in `backend/types/student.types.ts` broke 8+ files that consumed the old type name
- Adding `idempotencyKey` and `rolloverPolicy` to `QuotaSubmitInput` (in Pothos) broke `useQuotaFormViewModel.ts` which didn't pass these fields — a 1-new-tsgo-error introduced by the RT-3 fix
- `StudentReturnType` originally omitted `createdAt`/`updatedAt` from its Omit list, requiring Pothos resolver changes downstream
- `DayOfWeek` enum vs string literal mismatches across test files and frontend utils were not caught until the final review round

The tsgo check passed per-file because each file compiled in isolation against its local imports. But when a type definition changed in one file, the consumers that imported it were not re-verified.

### Recommendation

Add a **cross-file type coherence gate** as a phase-boundary checkpoint between major plan phases:

```markdown
### Phase Boundary: Type Coherence Gate (NEW)
Between implementation phases (e.g., after Phase 2: Types & Repositories, before Phase 3: Services),
the executing agent MUST run:
  bun tsgo  # FULL project type check, not per-file

If new tsgo errors appear (compared to the pre-phase baseline), the agent MUST:
1. Identify which type definition change caused the cascade
2. Fix ALL downstream consumers before proceeding to the next phase
3. Record the cascade in the outcome file for that phase

This prevents type errors from accumulating silently across phases.
```

Add this as a standard subtask at the end of each phase (not just at the end of the entire plan):

```markdown
- [ ] X.Y **Phase Boundary Type Gate**: Run full `bun tsgo` and compare against the pre-phase
  baseline. Fix all new errors caused by type/enum changes in this phase before proceeding.
  Record any type cascades discovered in the outcome file.
```

---

## Observation 2: Enum Import Patterns (`import type` vs Value Import) Not Explicitly Guided

### What Happened

A recurring issue across the implementation was confusion between `import type` and value imports for enums:

- `ClassType` needed to be a **value import** (not `import type`) in `mapRecurringClassFormData.ts` because it was used as a runtime value in a cast expression
- `DayOfWeek` enum was used as string literals (`"MONDAY"`) in test files instead of enum values (`DayOfWeek.Monday`)
- `QuotaLedgerReason` enum was initially imported as a type but used as a value in conditional logic
- Multiple files used string literals where enum types were expected, bypassing type safety

### Recommendation

Add an **enum import guidance** section to the skill's Quality Checklists:

```markdown
### Enum/Type Import Checklist (NEW)
- [ ] All enums are imported as **value imports** (not `import type`) when used in:
  - Runtime cast expressions (`x as ClassType`)
  - Conditional comparisons (`if (x === ClassType.Regular)`)
  - Object literals used at runtime
- [ ] String literals are NOT used where enum types are expected — always use enum members
- [ ] `import type` is only used for pure type annotations (interfaces, type aliases, generic params)
- [ ] Enum consumer files (tests, utils, formatters) are verified to use enum values, not string literals
```

---

## Observation 3: Outcome Files Were Too Brief for Cross-File Dependencies

### What Happened

The outcome files (14 files, averaging ~2KB each) were structured well for individual task documentation but lacked critical cross-file dependency information:

- `4-graphql-and-permissions-outcome.md` documented pitfalls like "Pothos input inference nullability" but did not list the specific files affected by each pitfall
- `2-types-and-repos-outcome.md` listed type definitions created but did not predict which downstream consumers would need changes
- The knowledge propagation outcome (`14-task-31-knowledge-propagation-outcome.md`) correctly listed files created/modified but did not catalog type cascades that occurred during implementation

This meant that when later phases needed to understand what changed in earlier phases, the agents had to re-read the actual source files rather than relying on outcome files for guidance.

### Recommendation

Enhance the **Post-Execution Outcome File** template to require cross-file dependency documentation:

```markdown
### Required Outcome File Sections (ENHANCED)

Each outcome file MUST include:

1. **Summary** — what was done (existing)
2. **Key Changes** — files created/modified (existing)
3. **Cross-File Dependencies** — NEW: list every type, enum, or interface
   created/modified in this task and predict which downstream files/phases
   will be affected. Format:
   - `QuotaSubmitInput` (backend/types/billing/quota.types.ts)
     - Consumers: quota.pothos.ts → QuotaService.createQuota → useQuotaFormViewModel.ts
     - Breaking change: YES/NO — describe what breaks if consumers aren't updated
4. **Pitfalls & Lessons** — including type cascade warnings (existing, enhanced)
5. **Verification Results** — tsgo/biome/lint status (existing)
6. **Carry-Over Points** — including type cascades to watch for in next phase (existing, enhanced)
```

---

## Observation 4: No Post-Implementation Comprehensive Review Step

### What Happened

The plan included a "Quality loop (global)" task (#30) that ran `tsgo + biome + lint` across the entire project. However, this only checked for compilation and style errors — it did **not** review for:

- Type naming conventions (canonical naming, duplication)
- Import path consistency (`@/` alias vs relative)
- Dead code introduced during implementation
- Duplicate code across new files
- Security vulnerabilities (IDOR, TOCTOU)
- Business logic correctness (credit leaks, race conditions)

These issues were only discovered during the 5+ rounds of review using `/review`, `/repo-review`, `/review-types`, and `/review-uncommitted` skills AFTER the implementation was "complete" (all 31 tasks marked `[x]`). The reviews found **134 unique findings** (2 CRITICAL, 36 HIGH, 68 MEDIUM, 28 LOW) — all in code that had passed the quality loop.

### Recommendation

Add a **Post-Implementation Review Phase** as a mandatory final phase:

```markdown
### Phase 4: Post-Implementation Review (NEW)

After all implementation tasks are complete, the agent MUST run a comprehensive review:

- [ ] **4.1 Type Review**: Use /review-types skill or equivalent to verify:
  - Canonical type naming across all new/modified files
  - No duplicate type definitions
  - Import path consistency (all `@/` aliases, no relative imports)
  - Enum usage (value imports vs type imports) correct everywhere

- [ ] **4.2 Code Review**: Use /review skill or equivalent to verify:
  - No IDOR vulnerabilities in new GraphQL queries
  - No TOCTOU race conditions in repository methods
  - No credit/resource leaks in service-layer transactions
  - No dead code (unused exports, unreachable methods)

- [ ] **4.3 Duplication Review**: Check for:
  - Duplicated logic across new files (e.g., idempotency key derivation)
  - Similar component patterns that should be shared (e.g., audience-specific views)
  - Repeated locale keys that should be consolidated

- [ ] **4.4 Edge Case Review**: Verify:
  - Null/undefined handling on optional fields
  - Empty array/object edge cases
  - Concurrent access scenarios (optimistic locking, SELECT FOR UPDATE)
  - Error path completeness (all error branches have correct types)
```

---

## Observation 5: Lint Queue Port Should Be Dynamically Resolved, Not Hardcoded

### What Happened

The implementation guide in `implementation.md` hardcoded the lint queue port as `4777` in curl commands. While this matched the default in `scripts/lint-queue-config.ts`, it would break if the port was overridden via the `LINT_QUEUE_PORT` environment variable. During implementation, this caused no direct issues, but it's a fragility point.

### Recommendation

Update the quality loop instructions to use a dynamically resolved port:

```bash
# In implementation guides, use the resolved port:
export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify","files":["<the-file>"]}'
```

Or better, recommend the `bun run lint` wrapper which resolves the port automatically.

---

## Observation 6: Knowledge Propagation Effectiveness Could Be Measured

### What Happened

Task 31 (Knowledge Propagation) successfully:
- Created `docs/billing/quota-system.md` with architecture reference
- Updated root `AGENTS.md` with reference to the new doc
- Updated `backend/AGENTS.md`, `backend/db/repo/AGENTS.md`, `backend/services/AGENTS.md`
- Verified `.agents/skills/` and `.agents/instructions/` for needed updates

However, the actual content of `docs/billing/quota-system.md` was later found to have issues during the review rounds:
- It documented `resetUsedThisPeriod` which was later removed from the codebase
- It didn't capture the `deriveIdempotencyKey` pattern that was extracted during review fixes
- Several cross-file patterns (e.g., the append-only ledger transaction boundary, the FIFO selection ordering) were described but not cross-referenced with the specific repository methods

### Recommendation

Add a **knowledge propagation verification step** to the skill:

```markdown
- [ ] X.Z **Knowledge Propagation Verification**: After creating the docs and updating AGENTS.md,
  verify that:
  - All method names referenced in docs still exist in the codebase (no stale references)
  - All patterns described in docs match the final implementation (not just the initial version)
  - Cross-references between docs and source files are bidirectional
  - The docs are re-verified AFTER any post-implementation review fixes are applied
```

---

## Observation 7: Race Condition / Concurrency Testing Gap

### What Happened

The plan's Task 19 included a "race test (mirror `class_quota_race.test.ts`)" but the test was ultimately **deferred** because it required concurrent runner infrastructure that wasn't available. This was noted in the progress summary but not escalated as a plan gap.

During the review rounds, several race condition issues were found:
- `deductPendingRefresh` lacked `SELECT FOR UPDATE` (fixed in review)
- `redeemForInstanceBatch` had a TOCTOU window between checking and setting `quotaDeducted` (fixed in review)
- Credit leak when reschedule didn't re-deduct for the successor instance (fixed in review)

### Recommendation

Add guidance for **concurrency-sensitive features**:

```markdown
### Concurrency Assessment (Conditional)
If the feature involves any of:
-Shared mutable state (counters, balances, quotas)
- Multiple concurrent actors modifying the same record
- Optimistic locking / version fields
- Transaction-isolation-dependent correctness

Then the plan MUST include:
- An explicit concurrency model section in the design document
- A list of all race condition scenarios (enumerate actor pairs × operations)
- Repository-level SELECT FOR UPDATE documentation for all critical mutations
- A concurrent test case for each race scenario (or explicit deferral with rationale)
```

---

## Observation 8: Outcome File IDs Should Be Predictable

### What Happened

The outcome files used a mix of naming conventions:
- `1-schema-and-enums-outcome.md`
- `2-types-and-repos-outcome.md`
- `4-graphql-and-permissions-outcome.md`
- `14-task-31-knowledge-propagation-outcome.md`

The numbering shifted from matching task numbers (1-13) to a separate sequence (14) for the knowledge propagation task. This made it hard to programmatically map outcome files to tasks.

### Recommendation

Standardize outcome file naming to always match task IDs:

```markdown
Outcome file naming convention:
.ai/plans/<feature-name>/outcome/<task-id>-<task-slug>-outcome.md

Where <task-id> is the exact task number from tasks.md.
Example: task 31 → `31-knowledge-propagation-outcome.md`
```

---

## Observation 9: Instruction Verification Could Be Automated

### What Happened

Each task included an "Instruction Verification" subtask listing the AGENTS.md and `.agents/instructions/` files to read. In practice, agents manually read these files, but there was no automated check that they actually complied with all rules. The plan-review skill later found **13 AGENTS.md compliance violations** that should have been caught during implementation.

### Recommendation

Add a **compliance check script** or enhance the quality loop:

```bash
# After quality loop passes, run a compliance check:
bun run scripts/health/sub-loop.ts <file-path> --lifecycle instructions

# This would:
# 1. Identify the file's layer (frontend, backend, shared, etc.)
# 2. Load all applicable AGENTS.md files
# 3. Parse rule patterns (MUST, MUST NOT, ALWAYS, NEVER)
# 4. Check the file against each rule
# 5. Report violations
```

While full automation may not be feasible, even a grep-based check for common patterns (e.g., `console.log` in non-test files, relative imports, hardcoded colors) would catch many violations.

---

## Observation 10: Plan Should Include a Pre-Implementation Baseline Check

### What Happened

During verification after CRITICAL/HIGH fixes, it was discovered that there were **27 pre-existing tsgo errors** on the branch. This made it difficult to distinguish between new errors introduced by fixes and pre-existing errors. The team had to stash changes and re-run tsgo to establish a baseline.

### Recommendation

Add a **pre-implementation baseline** task at the start of every plan:

```markdown
- [ ] 0. **Pre-Implementation Baseline** (NEW)
  - Run `bun tsgo 2>&1 | grep "error TS" | wc -l` and record the count
  - Run `bun biome:check 2>&1 | grep -c "warn"` and record the count
  - Run `bun lint 2>&1 | tail -1` and record the output
  - Record these as the baseline. After each phase, compare against this baseline.
  - If the baseline is non-zero, document which errors are pre-existing to avoid confusion.
```

---

## Summary: Suggested Skill Enhancements

| # | Enhancement | Priority | Impact |
|---|---|---|---|
| 1 | Cross-file type coherence gate between phases | HIGH | Catches type cascades before they propagate |
| 2 | Enum import guidance in quality checklists | HIGH | Prevents most common type import mistakes |
| 3 | Enhanced outcome file template with cross-file deps | MEDIUM | Better knowledge transfer between phases |
| 4 | Post-implementation review phase (types, code, duplication, edge cases) | HIGH | Catches issues that quality loop misses |
| 5 | Dynamic lint queue port resolution | LOW | Prevents port mismatch fragility |
| 6 | Knowledge propagation verification step | MEDIUM | Ensures docs match final implementation |
| 7 | Concurrency assessment for shared-state features | HIGH | Catches race conditions early |
| 8 | Standardized outcome file naming | LOW | Programmatic task→outcome mapping |
| 9 | Automated instruction compliance checking | MEDIUM | Reduces AGENTS.md violations |
| 10 | Pre-implementation baseline check | MEDIUM | Distinguishes new vs pre-existing errors |

---

## What Worked Well (Keep These)

1. **Three-phase workflow** — Requirements → Design → Tasks provided clear structure and prevented implementation before design was validated
2. **Outcome knowledge base** — Reading prior outcomes before starting a new task prevented re-analysis and maintained context across phases
3. **Per-file quality loop** — Running tsgo + biome + lint after each file caught most compilation and style issues immediately
4. **Instruction verification subtasks** — Explicitly listing AGENTS.md and instruction file paths ensured agents knew which rules to follow
5. **Knowledge propagation task** — Creating `docs/billing/quota-system.md` and updating AGENTS.md files ensured learnings were preserved
6. **EARS acceptance criteria** — The "WHEN/THEN" format produced testable, unambiguous requirements
7. **Task sequencial dependencies** — Foundation-first ordering (schema → types → repos → services → GraphQL → frontend) prevented circular dependencies
8. **UX/Navigation specification** — Including routes, permissions, sidebar placement, and per-audience rendering in the design prevented navigation gaps

---

*This document was produced as an outcome of the quota system implementation, reflecting observations from 5+ rounds of iterative review across 19 commits, 134 review findings, and 30+ parallel subagent dispatches.*

---

## Observation 11: Plan-Review Process Should Be Integrated Into Skill Workflow

### What Happened

After the UI improvement plan (`.ai/plans/quota/ui/`) was created using spec-driven-development, the user requested a `/plan-review` with maximum parallel subagents. This review was NOT part of the original skill workflow — it was requested ad-hoc. The review deployed 9 parallel subagents covering:

1. i18n compliance
2. Component patterns
3. Quota files alignment
4. GraphQL documents
5. AGENTS.md rules
6. Navigation/routing
7. Tests and animation
8. Task coverage
9. Design issues

All 9 subagents completed and returned **33 specific findings** across the 4 plan files (requirements.md, design.md, tasks.md, implementation.md). These findings required systematic fixes including:

- Navigation group: "Billing" → "Finance (`grp_finance`)" (actual config value)
- Route behavior: `/students/[id]/quotas` is a redirect shim, not a render route
- GraphQL document naming: all must have `Query` suffix per convention
- Schema function names: `createBillingQuotaSchema` → `createQuotaSchema` (actual function)
- i18n namespace: `Translation.Dashboard.BillingQuota` not string literals
- ViewModel `t` types: must use typed `labels: DashboardBillingQuota` not `t: (key: string) => string`
- `useMediaQuery` violation: must use CSS `@media (prefers-reduced-motion: reduce)` in tier files
- Arabic pluralization: binary singular/other, not CLDR singular/dual/plural
- Missing Role-Based Access Matrix requirement (R16)
- Missing accessibility sub-tasks (keyboard nav, WCAG AA contrast)
- Missing design system sub-tasks (MUI icon naming, typography variants)
- Missing animation sub-tasks (MetricCard count-up, StatusBadge transition)
- CodeScene LOC budget guardrail (150 lines per tier file)

### Recommendation

Add a **Plan-Review Phase** as a mandatory step between plan creation and implementation:

```markdown
### Phase 1.5: Plan Review (NEW)

After tasks.md is created and before implementation begins, the agent MUST run a plan-review:

- [ ] **1.5.1 Multi-Perspective Review**: Dispatch parallel subagents to validate the plan against:
  - [ ] Actual codebase conventions (i18n, GraphQL, navigation, types)
  - [ ] AGENTS.md rules for all affected layers
  - [ ] Component patterns and MUI v9 breaking changes
  - [ ] Test conventions and coverage gaps
  - [ ] Accessibility requirements (WCAG AA, keyboard nav)
  - [ ] Design system compliance (icons, typography, colors)
  - [ ] Animation patterns and CodeScene budgets
  - [ ] Role/permission matrices

- [ ] **1.5.2 Finding Aggregation**: Collect all subagent findings into a structured list
  - [ ] Categorize by file and severity
  - [ ] Identify cross-file dependencies
  - [ ] Resolve contradictory findings

- [ ] **1.5.3 Plan Patching**: Apply all fixes to plan files before any implementation
  - [ ] Update requirements.md, design.md, tasks.md, implementation.md
  - [ ] Re-run verification (grep checks) to confirm all problematic patterns eliminated
  - [ ] Commit patched plan (do NOT push until implementation starts)

This catches plan-to-reality mismatches BEFORE implementation begins, avoiding costly rework.
```

---

## Observation 12: Translation Enum Convention Must Be Explicit in Skill

### What Happened

During the plan-review of the quota UI plan, one of the 33 findings was that the plan used string literal namespace arguments:
```typescript
// Plan had (INCORRECT)
useAppTranslation("DashboardBillingQuota")
useAppTranslation("DashboardStudentQuota")

// Codebase convention (CORRECT)
useAppTranslation(Translation.Dashboard.BillingQuota)
useAppTranslation(Translation.Dashboard.StudentQuota)
```

The `Translation` enum is defined in `shared/locale/namespaces/translation.ts` and re-exported from `@/shared/locale`. This pattern is used consistently across the entire codebase (60+ files). The plan-review subagent caught this, requiring fixes in both design.md and tasks.md.

### Recommendation

Add **translation namespace convention** to the skill's quality checklists:

```markdown
### i18n Translation Convention Checklist (NEW)
- [ ] All `useAppTranslation` calls use `Translation.<Namespace>` enum, NOT string literals
- [ ] Namespace paths match `shared/locale/namespaces/translation.ts` exactly
  - e.g., `Translation.Dashboard.BillingQuota`, `Translation.Dashboard.StudentQuota`
- [ ] Server components use `getTranslations(locale, "namespace")` with string key (this is correct)
- [ ] GraphQL resolvers use `ctx.t("namespace")` with string key (this is correct)
- [ ] API routes/scripts/tests use `getServerTranslations(locale, "namespace")` with string key
- [ ] No hardcoded strings in any UI component — all from typed translation objects
```

This is a common convention that must be followed for compile-time i18n safety.
