# Deferred Items Ledger

**Feature:** `<feature-name>`  
**Plan:** `.ai/plans/<feature-name>/`  
**Created:** `<YYYY-MM-DD>`

---

## Purpose

This ledger tracks all work deferred from one task to another to ensure no deferred item is forgotten. Every deferred item must be explicitly logged here and resolved before the plan is marked complete.

---

## Ledger Table

| ID | Deferred Item | Source Task | Target Task | Status | Verified By | Notes |
|---|---|---|---|---|---|---|
| D1 | Example: `createManyDeliveries` bulk write | 6 | 13 | ✅ Done | R5 outcome | Implemented in Task 13.2 |
| D2 | Example: Env-config key registration | 5 | 7 | ❌ Blocked | — | Never registered; breaks cache invalidation |
| D3 | Example: `resetWhatsappChannel` cache completeness | 3 | 7 | ⚠️ Partial | R7 | Missing 3 keys until R7 fix |
| D4 | GraphQL codegen refresh for new `AppPermission` values (`accounting.payroll_view` / `accounting.payroll_manage`) | 0.2 | 2.1–2.7 | 🔄 In Progress | 0.2 outcome | `AppPermissionPothosEnum` derives from the TS enum; run `generate:gqlSchema` + `codegen` with the Phase 2 GraphQL tasks so schema/generated types include both values |
| D5 | PG enum value propagation: `ALTER TYPE system_setting_category ADD VALUE 'payroll'` must ship in the Task 0.6 migration (drizzle diff should emit it from the TS enum change — verify before applying) | 0.3 | 0.6 | ✅ Done | 0.6 outcome | Shipped in `backend/drizzle/20260829031638_payroll_calculation_types/migration.sql` (types unit); applied to dev + test DBs via `bun run db migrate`; the `payroll` label verified present on `system_setting_category` by the payroll-columns migration test |
| D6 | `CalculationStatusPothosEnum` must be IMPORTED (not re-registered) by Phase 2/4 Pothos tasks — `implementation.md` §4.1 snippet re-registers it in `payroll.pothos.ts`, which triggers the Pothos "already declared" runtime error | 0.1 | 2.1 / 4.1 | 🔄 In Progress | 0.1-0.3 outcome | Registered once in `backend/graphql/pothos/shared/enum.pothos.ts` (line 250); import from `@/backend/graphql/pothos/shared/enum.pothos` |
| D7 | Green run of the payroll grace-settings test (`backend/db/test/repo/shared/system-settings.repository.test.ts`) — currently 22/23 pass, 1 fail with PG 22P02 `invalid input value for enum system_setting_category: "payroll"` | 0.5 | 0.6 | ✅ Done | 0.6 outcome | Re-run after 0.6 applied: 23 pass / 0 fail / 41 expect() calls, exit 0 — the payroll grace-settings test passes unedited (D5 enum value + migration 37 settings rows in place) |
| D8 | `system_settings` CHECK constraint rejecting negative payroll grace values (risk-table mitigation + AC-8.4 "new CHECK") — never implemented; migration 37 is INSERT-only | 1.4 | Final hardening gate (pre-TB.3 pentest) | 🔄 In Progress | 1.4 outcome | `resolveGraceSettings`' runtime fallback (warn + wholesale defaults) fully protects the calculation path; the settings write path can still persist negatives — add a dialect-aware CHECK scoped to the three `payroll.grace_*` rows or validate in the settings upsert path before plan completion |
| D9 | Payroll-reports UI strings referenced by AC-1.3 and the page-composition section but absent from the authoritative §7.1 label inventory: Subject column header, per-row Override action label, Export CSV button label | 3.3 | 4.4–4.6 (filter bar / data grid / toolbar) | 🔄 In Progress | 3.3–3.5 outcome | dashboard.billing.payroll implements §7.1 verbatim (37 keys, EN/AR parity compile-enforced); Phase 4 must either reuse existing shared labels (filters.teacher/filters.student double as column headers; check commonTranslations for generic Export/Override strings) or extend the namespace with the three missing keys (additive: types + en + ar + snapshot regen) |

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

The **final quality gate task** (last task before Phase 7: Knowledge Propagation) MUST verify all deferred items are resolved:

```bash
# Count unresolved items
grep -c "❌\|⚠️" .ai/plans/<feature-name>/deferred-items.md

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
