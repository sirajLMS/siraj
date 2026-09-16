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
| D1 | Trackable-tasks stale path corrections must be honored by every implementer (types → `backend/types/billing/`, query → `backend/graphql/query/billing/`, frontend views → `frontend/common/views/dashboard/billing/accounting/reports/`); `implementation.md` is authoritative per plan-review R2 | 0.3 | 1.1, 2.2, 4.x | ✅ Done | All implementers followed `implementation.md` paths; verified by the post-implementation review wave | See `outcome/0.3-plan3-prereqs-outcome.md` §Path-truth table |
| D2 | `CalculationStatusPothosEnum` consumption rule: IMPORT from `@/backend/graphql/pothos/shared/enum.pothos`; NEVER re-register via `enumType` (Pothos "already declared" runtime error — inherited from Plan 3 deferred item D6) | 0.3 | 2.1 | ✅ Done | Wave E imported the existing enum; schema build + codegen clean | `implementation.md:468`'s stale import path was not used; see `outcome/2.x-graphql-outcome.md` |
| D3 | `ClassAuditContainer` `?openOverride=1` auto-open (task 3.6) — container previously had zero searchParams handling | 0.3 | 3.6 | ✅ Done | Container reads the param, gated on `ACCOUNTING_PAYROLL_VIEW` + `_MANAGE`; final wiring uses a dedicated `classAuditStore.overrideDialogOpen` flag (superseding the `useClassDetailsStore` reuse note, which leaked into the details page's rate dialog) and renders Plan 3's `OverrideDialog` with real payroll data | See `outcome/3.6-open-override-outcome.md`, `outcome/3.6-override-dialog-wiring-outcome.md`, `outcome/p1-override-dialog-wired-outcome.md` |

---

## Status Values

- ✅ **Done** — Item completed and verified (with reference to outcome file or commit)
- ⚠️ **Partial** — Partially completed, needs follow-up work
- ❌ **Blocked** — Not resolved, plan cannot complete until addressed
- 🔄 **In Progress** — Currently being worked on
