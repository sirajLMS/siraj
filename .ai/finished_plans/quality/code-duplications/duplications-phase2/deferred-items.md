# Deferred Items Ledger

**Feature:** Code Duplication Elimination Phase 2 — Frontend Consolidation
**Plan:** `.ai/plans/duplications-phase2/`
**Created:** 2026-08-10
**Predecessor Plan:** `.ai/plans/duplications/` (all 7 deferred items resolved — see `../duplications/deferred-items.md`)

---

## Purpose

This ledger tracks all work deferred from one task to another to ensure no deferred item is forgotten. Every deferred item must be explicitly logged here and resolved before the plan is marked complete.

---

## Ledger Table

| ID | Deferred Item | Source Task | Target Task | Status | Verified By | Notes |
|---|---|---|---|---|---|---|
| _(empty — no deferred items yet)_ | | | | | | |

---

## Predecessor Plan Carry-Forward (Reference)

The predecessor plan (`.ai/plans/duplications/`) had 7 deferred items, all resolved. Two were explicitly deferred to this continuation plan:

| Predecessor ID | Item | Status | Notes |
|---|---|---|---|
| D3 | Remaining UI triplications (CatalogImageUpload, tagInput, PhoneInput, CurrencyAutocomplete, EditableTypography, LocalizedStringInput, PaymentMethodAutocomplete, PaginationControls, etc.) | ✅ Deferred to this plan | Addressed in Phase 1 (UI component scaffolds) and Phase 3 (within-common consolidation) |
| D4 (remaining) | `backend/enum/shared/timezone.enum.ts` ↔ `shared/constants/iana-timezone.enum.ts` (1781 tokens, 446 lines) | ❌ Out of scope for this plan | This plan is frontend-only (CON-1, CON-4). Timezone enum deferred to a future cross-layer plan. |

---

## Status Values

- ✅ **Done** — Item completed and verified (with reference to outcome file or commit)
- ⚠️ **Partial** — Partially completed, needs follow-up work
- ❌ **Blocked** — Not resolved, plan cannot complete until addressed
- 🔄 **In Progress** — Currently being worked on

---

## Usage Guidelines

### When to Add a Deferred Item

Add a row to the table when:
1. A task discovers work that belongs to a different task/phase
2. A technical constraint requires splitting work across tasks
3. A dependency is discovered that blocks immediate completion
4. A TODO comment is added to code with "deferred to Task X"
5. A clone cluster is intentionally excluded (e.g., `.jscpd.json` ignore pattern added)

**Format:**
```markdown
| D<next-id> | <Brief description> | <source-task-id> | <target-task-id> | ❌ Blocked | — | <Context/rationale> |
```

### When to Update Status

Update the status when:
- **To 🔄 In Progress:** Target task begins working on the item
- **To ⚠️ Partial:** Item partially resolved but needs follow-up
- **To ✅ Done:** Item fully resolved and verified
  - Add verification reference (outcome file, commit hash, review round)
  - Example: `R5 outcome` or `commit abc123f` or `Task 13.2 complete`

### When to Reference in Outcome Files

In task outcome files, reference this ledger when:
- Adding a deferred item: "Deferred X to Task Y (see deferred-items.md D3)"
- Completing a deferred item: "Resolved deferred item D3 (see deferred-items.md)"

---

## Enforcement

The **final quality gate task** (Task 4.4) MUST verify all deferred items are resolved:

```bash
# Count unresolved items
grep -c "❌\|⚠️" .ai/plans/duplications-phase2/deferred-items.md

# Expected: 0
# If >0: Task is blocked — resolve all ❌/⚠️ items before plan completion
```

**Exit criteria:** Plan cannot be marked complete if any ❌ or ⚠️ status remains.

---

## Common Deferred Item Patterns

### Intentional Duplication (jscpd Ignore)
```markdown
| DX | <file-a> ↔ <file-b>: intentional duplication (static data / different schemas) | <task> | <task> | ✅ Done | <task> outcome | Added `.jscpd.json` ignore pattern with justification; both files documented with distinction |
```

### Partial Extraction Completion
```markdown
| DX | <component>: complete partial extraction (existing scaffold not fully consumed) | <task> | 3.1 | 🔄 In Progress | — | `catalogImageUploadShared.tsx` exists but `CatalogImageUpload.tsx` doesn't fully consume it (7 clones, 1083 tokens) |
```

### Test Updates for Aggressive Consolidation
```markdown
| DX | Update <test-file> to reflect behavioral change from <task> consolidation | <task> | <task> | ✅ Done | <task> outcome | Test updated to expect new scaffold-based behavior; documented in outcome file "Behavioral Changes" section |
```

### Cross-Tier Import Violation Discovery
```markdown
| DX | Fix cross-tier import in <file> (imports from <sibling-tier>) | <task> | <task> | ❌ Blocked | — | Discovered during mid-point review; must fix before Phase 3 |
```

---

## Anti-Patterns (What NOT to Do)

❌ **Don't defer without logging:** "I'll handle this later" without adding to ledger
❌ **Don't use vague descriptions:** "Fix the thing" → use specific item names
❌ **Don't mark ✅ without verification:** Status changes must reference outcome file or commit
❌ **Don't leave ⚠️ unresolved:** Partial items must have a plan for completion
❌ **Don't defer critical bugs:** Security, data corruption, or blocking bugs must be fixed immediately

---

## Related Documents

- Predecessor ledger: `../duplications/deferred-items.md` (all 7 items resolved)
- Task template: `.agents/spec-process-guide/templates/tasks-template.md` — Phase 1 setup, Final quality gate
- Execution guide: `.agents/spec-process-guide/execution/implementation-guide.md` — Deferred item workflow
- SKILL.md: `.agents/skills/spec-driven-development/SKILL.md` — Deferred-items ledger enforcement
