# Deferred Items Ledger

**Feature:** `manager-role-permissions-fix`
**Plan:** `.ai/plans/manager-role-permissions-fix/`
**Created:** `2026-08-15`

---

## Purpose

This ledger tracks all work deferred from one task to another to ensure no deferred item is forgotten. Every deferred item must be explicitly logged here and resolved before the plan is marked complete.

---

## Ledger Table

| ID | Deferred Item | Source Task | Target Task | Status | Verified By | Notes |
|---|---|---|---|---|---|---|
| D1 | GraphQL codegen regeneration after enum edit | 1 | 12 | ✅ Done | `outcome/12-graphql-codegen-outcome.md` | `bun run generate:gqlSchema` + `bun codegen` executed, schema.graphql and graphql-types.ts updated |
| D2 | Frontend `SystemAccessSection.tsx` compile-safe removal of `Admin` label key | 1 | 11 | ✅ Done | `outcome/11-system-access-section-outcome.md` | `ACCOUNT_TYPE_LABEL_KEYS` Record type and ACCOUNT_TYPES updated, sub-loop exit 0 |
| D3 | Locale type schema `admin` key removal | 1 | 6 | ✅ Done | `outcome/6-onboarding-locale-type-outcome.md` | `shared/locale/types/dashboard/staff/onboarding.ts` and AR/EN translations updated, sub-loop exit 0 |

---

## Status Values

- ✅ **Done** — Item completed and verified (with reference to outcome file or commit)
- ⚠️ **Partial** — Partially completed, needs follow-up work
- ❌ **Blocked** — Not resolved, plan cannot complete until addressed
- 🔄 **In Progress** — Currently being worked on
- 🔄 **Planned** — Known dependency, will be addressed by target task

---

## Enforcement

The **final quality gate task** (Task 17) MUST verify all deferred items are resolved:

```bash
# Count unresolved items
grep -c "❌\|⚠️" .ai/plans/manager-role-permissions-fix/deferred-items.md

# Expected: 0
# If >0: Task is blocked — resolve all ❌ or ⚠️ items before plan completion
```

**Exit criteria:** Plan cannot be marked complete if any ❌ or ⚠️ status remains.
