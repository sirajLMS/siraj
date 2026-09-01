# Billing Ecosystem — Plan Implementation Order

Source: each plan's `implementation.md` §9 "Cross-Plan Dependencies". The "Plans 1–7" table in
`student-credit-hours-system/specs.md` used early guessed titles and is **not** authoritative;
the folder-level cross-dependency sections are.

## Numbering → folders

| Plan | Folder | Status |
|------|--------|--------|
| 1 | `student-credit-hours-system` | ✅ Done |
| 2 | `credit-adjustment-system` | Pending |
| 3 | `teacher-payroll-engine` | Pending |
| 4 | `session-event-audit` | Pending |
| 5 | `carryover-balance-module` | Pending |
| 6 | `expense-ledger` | Pending |
| 7 | `profit-loss-dashboard` | Pending |

## Recommended order

- **Wave 1 (parallel-safe):** Plan 2 → Plan 3 → Plan 6
  - Plan 2 needs only Plan 1's credit ledger; its carryover entries persist on
    `credit_transactions` and are backfilled by Plan 5 (§2.5).
  - Plan 3 shares no tables with Plan 2.
  - Plan 6 is fully independent; only must land before Plan 5.
- **Wave 2:** Plan 4 — renders Plan 3's payroll columns (`calculationStatus`,
  `teacherPaidAmount`) and reuses Plan 3's `CalculationStatusChip`; zero schema changes.
  Degrades gracefully without Plan 3, but after Plan 3 is the intended use.
- **Wave 3:** Plan 5 — needs Plans 2, 3, 4, 6:
  - reads Plan 3's payroll columns, drives `WAITING_PAID`/`PAID` transitions,
  - calls Plan 6's `ExpenseService.createInternal`,
  - edits Plan 4's `SessionAuditDataGrid` (Phase 6: bulk-action button, "Linked" chip),
  - settles Plan 2's carryover entries via backfill.
- **Wave 4:** Plan 7 — last; read-only aggregation over Plans 1, 2, 3, 5, 6.

Linear sequence if done one at a time: **2 → 3 → 4 → 6 → 5 → 7**
(with freedom to run 2, 3, 6 in parallel and 4 right after 3).

## Not part of this sequence

- `frontend-component-patterns-review/`, `review-uncommitted/` — review workspaces, not
  implementation plans.
- Plan 1's `deferred-items.md` (D-1 `billingMode` discriminator, D-2 quota bridge, D-3
  true refund flow, D-5 gateway webhooks) — future unspec'd plans; come after the numbered
  set. Coordinate D-1 with D-4 (multi-currency ledger): mixed-currency × mixed-billing-mode
  is the hardest combination.
