# Deferred Items Ledger

**Feature:** `session-event-audit` (Plan 4)
**Plan:** `.ai/plans/session-event-audit/`
**Created:** `2026-09-04`

---

## Purpose

This ledger tracks all work deferred from one task to another to ensure no deferred item is forgotten. Every deferred item must be explicitly logged here and resolved before the plan is marked complete.

---

## Ledger Table

| ID | Deferred Item | Source Task | Target Task | Status | Verified By | Notes |
|---|---|---|---|---|---|---|
| D1 | Trackable-tasks stale path corrections must be honored by every implementer (types → `backend/types/billing/`, query → `backend/graphql/query/billing/`, frontend views → `frontend/common/views/dashboard/billing/accounting/reports/`); `implementation.md` is authoritative per plan-review R2 | 0.3 | 1.1, 2.2, 4.x | ❌ Blocked | — | See `outcome/0.3-plan3-prereqs-outcome.md` §Path-truth table |
| D2 | `CalculationStatusPothosEnum` consumption rule: IMPORT from `@/backend/graphql/pothos/shared/enum.pothos` (line 250); NEVER re-register via `enumType` (Pothos "already declared" runtime error — inherited from Plan 3 deferred item D6) | 0.3 | 2.1 | ❌ Blocked | — | `implementation.md:468` shows a stale import from `backend/graphql/pothos/billing/payroll.pothos` — that path does not exist; do not copy it |
| D3 | `ClassAuditContainer` `?openOverride=1` auto-open (task 3.6) — container currently has zero searchParams handling; new work must reuse the existing `useClassDetailsStore.openOverrideDialog` plumbing from `classes/details` | 0.3 | 3.6 | ❌ Blocked | — | See `outcome/0.3-plan3-prereqs-outcome.md` §4 |

---

## Status Values

- ✅ **Done** — Item completed and verified (with reference to outcome file or commit)
- ⚠️ **Partial** — Partially completed, needs follow-up work
- ❌ **Blocked** — Not resolved, plan cannot complete until addressed
- 🔄 **In Progress** — Currently being worked on
