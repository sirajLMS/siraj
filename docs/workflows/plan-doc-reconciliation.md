# Plan-vs-Canonical-Doc Reconciliation Workflow

**Scope:** This document captures the recurring patterns discovered during the `whatsapp-plan-fixes` effort (`.ai/plans/whatsapp-plan-fixes/`) — a documentation-only plan that corrected drift between archived WhatsApp implementation plans (`.ai/finished_plans/whatsapp/`) and their canonical reference docs (`docs/services/whatsapp-cloud-api.md`, `docs/frontend/whatsapp-ui-patterns.md`). It is a workflow reference for any future plan vs. canonical-doc reconciliation.

---

## When to use this workflow

- A plan set has been **archived** to `.ai/finished_plans/` but the codebase / canonical docs have evolved since.
- A prior plan's outcome files reference symbols, types, or resolvers that no longer (or never did) exist.
- A canonical doc (`docs/services/*.md`, `docs/frontend/*.md`) needs to surface findings from a comprehensive review (`r3-comprehensive-review.md` or similar) that were not addressed by the original plan's execution.

This workflow is **docs-only** — it never modifies source code. If a finding requires source changes, the reconciliation plan records it under "Deferred Items" and leaves a pointer in the canonical doc's "Known Open Issues" section for a future engineering plan.

---

## Reconciliation Patterns (extracted from `whatsapp-plan-fixes`)

### Pattern A — Anchor on text, not line numbers

Plan files reference canonical docs by **section title / anchor string** (e.g. "`docs/services/whatsapp-cloud-api.md` §9 '`messages[]` Stripped Defensively'"), not by line number. Line numbers drift as docs evolve; section titles are stable.

**Rule:** When a plan task says "fix line N of doc X", rewrite it as "fix the §<section-title> of doc X" and re-grep the anchor string before editing. The `whatsapp-plan-fixes` plan's `implementation.md §6 Verification Strategy` codifies this.

### Pattern B — Don't rewrite outcome files; append pointers

Historical outcome files (`.ai/finished_plans/<plan>/outcome/*.md`) are **immutable records** of what was done at execution time. They often reference symbols that were later found to be phantom — that's part of their historical value.

**Rule:** Never edit the body of an outcome file during reconciliation. Instead, insert a **one-line Plan-Correction Note** immediately below the title:

```
> **Plan-Correction Note (<date>):** The plan source this outcome executed has since been corrected in `.ai/plans/<fix-plan>/`. Contradictions recorded below are historical; do not re-apply them.
```

This preserves the historical record while protecting future readers from re-introducing the contradiction. See `whatsapp-plan-fixes` Decision D-B.

### Pattern C — Surface deferred review findings in canonical docs

Comprehensive reviews (`r3-comprehensive-review.md`, etc.) often surface HIGH-severity findings that the original plan did not address. These findings must not silently rot in `.ai/finished_plans/`.

**Rule:** Add a **"Known Open Issues"** section to the canonical doc (e.g. `docs/services/whatsapp-cloud-api.md`) with:
- A table of HIGH findings (severity, track, file, issue).
- A "Fixed: N / Total" counter.
- A pointer to the comprehensive review file for the remaining MEDIUM / LOW findings.

This makes the debt visible to anyone reading the canonical doc, without requiring them to discover the review file.

### Pattern D — Phantom spec-code handling

Plans sometimes invent spec codes (e.g. `Q10`, `Q11`) that never existed in the parent plan or canonical docs, then reference them as if they were canonical. These phantom codes spread via copy-paste.

**Rule:** When a phantom spec code is discovered:
1. Record the phantom in `.ai/analysis/<domain>/discrepancies.md` with a stable ID (e.g. D4).
2. In each plan file that cites the phantom, replace the citation with a **descriptive sentence** + parenthetical: `"(Earlier drafts referenced a "Q10" spec code — that citation was incorrect; see .ai/analysis/whatsapp/discrepancies.md D4.)"`.
3. After the fix, the only remaining hits of the phantom string in plan files must be in **prohibition/anchor context** (e.g. "do NOT exist", "Do NOT add"). Verify with `grep -cE '\bQ10\b'` — counts in `{specs,implementation,trackable-tasks}.md` should be present only in prohibition context.

### Pattern E — Markdown link-integrity as quality loop

`.md` files don't go through `tsgo` / `oxlint` / `biome` / lint / codescene. The standard `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` is a no-op for `.md` files.

**Rule:** Substitute a **markdown link-integrity check** as the per-file quality loop for `.md` edits:
1. `grep` for backtick-quoted relative path references (e.g. `` `docs/services/whatsapp-cloud-api.md` ``).
2. For each extracted path, run `test -e <path>` (or `view` / `ls`) to confirm the target exists.
3. Flag any broken references for repair.

See `whatsapp-plan-fixes` Decision D-E and Task 29.

---

## Forbidden-symbol sweep (verification gate)

After all edits, run a forbidden-symbol sweep across the corrected plan set:

```bash
grep -rcE '<symbol1>|<symbol2>|...' .ai/finished_plans/<plan>/{specs,implementation,trackable-tasks}.md .ai/finished_plans/<plan>/ui-spec/{specs,implementation,trackable-tasks}.md
```

**Expected:** every count is 0 in plan files (excluding outcome/research files, which retain historical occurrences by design per Pattern B). Hits remaining in plan files must all be in **prohibition/anchor context** — manually verify each hit's surrounding text.

## Plan-wide diff verification (docs-only guard)

Before marking a reconciliation plan complete:

```bash
# Source paths should show only pre-existing baseline mods (NOT my work)
git diff --stat -- 'backend/**' 'frontend/**' 'app/**' 'shared/**' 'test/**' 'scripts/**'

# My work's delta — should only touch .ai/ and docs/ paths
git diff --name-only -- '.ai/**' 'docs/**'
```

No source file (.ts/.tsx/.js/.jsx/.json outside `.ai/`) should appear in the delta introduced by the reconciliation plan. This is the docs-only safety guard (e.g. `whatsapp-plan-fixes` AC-27).

---

## Reconciliation plan file layout

A typical reconciliation plan lives at `.ai/plans/<domain>-plan-fixes/` and contains:

```
.ai/plans/<domain>-plan-fixes/
├── specs.md              # EARS acceptance criteria incl a "no source code touched" safety AC
├── implementation.md     # Design decisions incl D-B (don't rewrite outcomes) and D-E (md link-integrity)
├── trackable-tasks.md    # Phased tasks (Phase 0 baseline → Phase A/B/C/D/E/F/G)
└── outcome/
    ├── plan-review-R1.md # Phase 1.5 plan-review gate result
    └── plan-review-R2.md # Post-execution re-verification
```

Phases:
- **Phase 0** — baseline capture (`git status` snapshot, forbidden-symbol pre-counts)
- **Phase A–C** — fix the child/parent plan files (CRITICAL → MAJOR → MINOR)
- **Phase D–E** — fold the corrections into canonical docs + hygiene files
- **Phase F** — verification (forbidden-symbol sweep, link-integrity, diff scope, plan-review gate)
- **Phase G** — knowledge propagation (this doc + root `AGENTS.md` reference)

---

## References

- `.ai/plans/whatsapp-plan-fixes/` — the source plan that established this workflow.
- `.ai/analysis/whatsapp/` — the analysis files (`discrepancies.md`, `doc-gaps.md`, `plan-gaps.md`, `internal-consistency.md`) that drove the reconciliation.
- `docs/services/whatsapp-cloud-api.md` "Known Open Issues" section — example of Pattern C.
- `.ai/finished_plans/whatsapp/ui-spec/outcome/1-i18n-foundations-outcome.md` — example of Pattern B (Plan-Correction Note pointer).
