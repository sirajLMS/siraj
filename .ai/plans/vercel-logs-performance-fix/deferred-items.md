# Deferred Items Ledger

**Feature:** `vercel-logs-performance-fix`  
**Plan:** `.ai/plans/vercel-logs-performance-fix/`  
**Created:** `2026-08-18`

---

## Purpose

This ledger tracks all work deferred from one task to another to ensure no deferred item is forgotten. Every deferred item must be explicitly logged here and resolved before the plan is marked complete.

---

## Ledger Table

| ID | Deferred Item | Source Task | Target Task | Status | Verified By | Notes |
|---|---|---|---|---|---|---|
| D1 | `@as-integrations/next@4.1.0` uses deprecated `url.parse()` (DEP0169). No upgrade available — 4.1.0 is latest. Upstream issue #320 (opened 2026-05-17) proposes fix but is unresolved. Monitor for a fixed release. | G1.3 | Phase G (future) | ⚠️ Deferred | Phase G outcome file | Cosmetic warning only; no functional/security impact. Fix is trivial (one-line `new URL()` swap) once upstream releases it. See `outcome/phase-g-outcome.md`. |

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

### When to Reference in Outcome Files

In task outcome files, reference this ledger when:
- Adding a deferred item: "Deferred X to Task Y (see deferred-items.md D3)"
- Completing a deferred item: "Resolved deferred item D3 (see deferred-items.md)"

---

## Enforcement

The **final quality gate task** MUST verify all deferred items are resolved:

```bash
# Count unresolved items
grep -c "❌\|⚠️" .ai/plans/vercel-logs-performance-fix/deferred-items.md
# Expected: 0
```
