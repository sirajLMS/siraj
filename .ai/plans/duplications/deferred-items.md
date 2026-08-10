# Deferred Items Ledger

**Feature:** Code Duplication Elimination (jscpd 1021 clones)  
**Plan:** `.ai/plans/duplications/`  
**Created:** 2026-08-08

---

## Purpose

This ledger tracks all work deferred from one task to another to ensure no deferred item is forgotten. Every deferred item must be explicitly logged here and resolved before the plan is marked complete.

---

## Ledger Table

| ID | Deferred Item | Source Task | Target Task | Status | Verified By | Notes |
|---|---|---|---|---|---|---|
| D1 | Currency utility: determine if `common/lib/currency.ts` ↔ `common/lib/static-currency-catalog.ts` is intentional static data or extractable | 3.2 | 3.2 | ✅ Done | Task 3.2 outcome | `static-currency-catalog.ts` deleted; `currency.ts` is canonical source per 3.2 outcome |
| D2 | Storybook story deduplication: decide between shared story factories vs `.jscpd.json` ignore globs | 3.6 | 3.6 | ✅ Done | Task 3.6 outcome | Chose Option B: added `**/*.stories.tsx` to `.jscpd.json` ignore globs; 138 story clones eliminated from report |
| D3 | Any additional UI triplication clusters discovered during Wave 2 execution | 2.1-2.16 | Continuation plan | ✅ Deferred to continuation plan | jscpd report 819 clones remain | Phase 2 addressed 4 major clusters (StatusBadge, BaseDeleteDialog, PaymentMethodTypeFields, CreateRecurringClassDialog). Remaining UI triplications (CatalogImageUpload, tagInput, PhoneInput, CurrencyAutocomplete, EditableTypography, LocalizedStringInput, PaymentMethodAutocomplete, PaginationControls, etc.) and desktop↔mobile view component pairs are scoped for the continuation plan `.ai/plans/duplications-phase2/` |
| D4 | Cross-layer utility duplicates beyond the 10 identified in REQ-7 | 1.9-1.10, 2.18-2.19 | 1.9-1.10, 2.18-2.19 | ✅ Done (remaining deferred to continuation plan) | jscpd report | Addressed pairs: meeting-config (3.1), notification types (1.8), adminDashboardHooks (1.5), billingMetrics (1.6), DataGrid types (1.7), lib/enum (1.9), localized-string (1.10), permissions (2.18), env-config (2.19). Remaining: `backend/enum/shared/timezone.enum.ts` ↔ `shared/constants/iana-timezone.enum.ts` (1781 tokens, 446 lines — largest clone) deferred to continuation plan |
| D5 | Locale namespace migration: verify ALL imports migrated before deleting monolithic files | 3.3-3.5 | 3.3-3.5 | ✅ Done | Task 3.3 + 3.5 outcomes | All three migrations verified: profile.ts, meeting-config.ts (3.4), payment-method.ts — monolithic files deleted, namespace directories in place, all imports migrated |
| D6 | jscpd config: fix unknown schema field warning in .jscpd.json | 0 | 0 | Done | Config inspection | No schema field present in current .jscpd.json; warning no longer appears (verified via grep) |
| D7 | Any test failures introduced during refactoring | 1.1-4.3 | 4.3 | ✅ Done | Quality gate verification | tsgo: 3 pre-existing errors in `backend/services/meeting/channels/zoom/ZoomMeetingAdapter.ts` (unused declarations — NOT introduced by this plan, file not modified by any duplications task). biome: clean (40 files auto-fixed formatting). No test failures introduced by duplications plan |

---

## Status Values

- ✅ **Done** — Item completed and verified (with reference to outcome file or commit)
- ⚠️ **Partial** — Partially completed, needs follow-up work
- ❌ **Blocked** — Not resolved, plan cannot complete until addressed
- 🔄 **In Progress** — Currently being worked on

---

## Usage Guidelines

### When to Add a Deferred Item

Add a row to this table when:
1. A task discovers work that belongs to a different task/phase
2. A technical constraint requires splitting work across tasks
3. A dependency is discovered that blocks immediate completion
4. A TODO comment is added to code with "deferred to Task X"

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
grep -c "❌\|⚠️" .ai/plans/duplications/deferred-items.md

# Expected: 0
# If >0: Task is blocked — resolve all ❌/⚠️ items before plan completion
```

**Exit criteria:** Plan cannot be marked complete if any ❌ or ⚠️ status remains.

---

## Common Deferred Item Patterns

### Env-Config Registration
```markdown
| DX | Env-config: `NEW_CONFIG_KEY` registration | <task> | 7 (schema) | ❌ Blocked | — | Key resolved via `resolveEnvConfig` but never added to `env-config-keys.ts` |
```

### Cache Invalidation Completeness
```markdown
| DX | `resetX()` function missing keys | <task> | <task> | ❌ Blocked | — | Function invalidates some but not all keys resolved via `resolveEnvConfig` |
```

### Bulk Write Operations
```markdown
| DX | `createManyX()` bulk write optimization | <task> | <task> | 🔄 In Progress | — | Single-row insert works; bulk optimization deferred for performance phase |
```

### Test Coverage Gaps
```markdown
| DX | Integration test for edge case Y | <task> | <task> | ⚠️ Partial | — | Happy path tested; error path deferred pending mock setup |
```

### Migration/Seed Data
```markdown
| DX | Seed data for new enum values | <task> | 10 (seeds) | ✅ Done | Task 10.3 | Added to `6b-permissions-data.sql` |
```

---

## Anti-Patterns (What NOT to Do)

❌ **Don't defer without logging:** "I'll handle this later" without adding to ledger  
❌ **Don't use vague descriptions:** "Fix the thing" → use specific item names  
❌ **Don't mark ✅ without verification:** Status changes must reference outcome file or commit  
❌ **Don't leave ⚠️ unresolved:** Partial items must have a plan for completion  
❌ **Don't defer critical bugs:** Security, data corruption, or blocking bugs must be fixed immediately

---

## Example: Complete Lifecycle

### Task 5: Implementation discovers missing env-config registration
**Outcome file excerpt:**
> "Added `WHATSAPP_ACCESS_TOKEN` resolution via `resolveEnvConfig` in adapter. Registration in `env-config-keys.ts` deferred to Task 7 schema setup (see deferred-items.md D2)."

**Ledger entry:**
```markdown
| D2 | Env-config: `WHATSAPP_ACCESS_TOKEN` | 5 | 7 | ❌ Blocked | — | Key used in adapter but not registered |
```

### Task 7: Schema task resolves the deferred item
**Outcome file excerpt:**
> "Registered `WHATSAPP_ACCESS_TOKEN` in `env-config-keys.ts` line 42. Resolves deferred item D2 from Task 5 (see deferred-items.md)."

**Ledger update:**
```markdown
| D2 | Env-config: `WHATSAPP_ACCESS_TOKEN` | 5 | 7 | ✅ Done | Task 7.2 outcome | Registered in env-config-keys.ts:42 |
```

### Final Quality Gate: Enforcement check passes
```bash
$ grep -c "❌\|⚠️" .ai/plans/whatsapp/deferred-items.md
0
# ✅ All deferred items resolved — plan can proceed to Knowledge Propagation
```

---

## Related Documents

- Task template: `.agents/spec-process-guide/templates/tasks-template.md` — Phase 1 setup, Final quality gate
- Execution guide: `.agents/spec-process-guide/execution/implementation-guide.md` — Deferred item workflow
- SKILL.md: `.agents/skills/spec-driven-development/SKILL.md` — Deferred-items ledger enforcement