# TB.1 + TB.2 Outcome — Cash-In & Earned-Revenue Journey Diagrams

## Summary

Both journey tests already existed and pass. This run added only the two missing
`DIAGRAMS.md` sections — no test code, no service code, no plan-task checkbox changes.

## Changes

- `test/workflows/accounting/DIAGRAMS.md`: appended two new sections at the end, matching the
  existing `profit-loss-expense-visibility.test.ts` section's format (heading named after the test
  file, 1-2 sentence intro, single `mermaid` `sequenceDiagram` block with `autonumber`, participants
  named after the real service calls, a `Note over` closing line):
  - `## profit-loss-cash-in-visibility.test.ts` — billing → executive cash-in journey
    (`AccountingPaymentService.recordPayment`, Income Payments tab, `createdAt` month bucketing,
    permission-gate denial, read-path notification silence).
  - `## profit-loss-earned-revenue.test.ts` — teacher → executive earned-revenue journey
    (`ClassSessionService` state machine + payroll snapshot, session-linked subtract credit,
    Payments tab, never-calculated exclusion, multi-actor permission-gate denial).

## Verification

- `bun run validate:mermaid test/workflows/accounting/DIAGRAMS.md` — all 14 blocks report `OK`.
- `bun run test/scripts/run-test.ts --last test/workflows/accounting/profit-loss-cash-in-visibility.test.ts`
  — exit 0, **6 pass / 0 fail**.
- `bun run test/scripts/run-test.ts test/workflows/accounting/profit-loss-earned-revenue.test.ts`
  (re-run fresh after a stale `--last` snapshot showed an older 5-test result) — exit 0,
  **6 pass / 0 fail**.

## Notes

- TB.1 and TB.2 checkboxes in `.ai/plans/profit-loss-dashboard/trackable-tasks.md` (lines 392, 398)
  are already `[x]` — left untouched, per instruction.
- AGENTS.md rule 11 ("every journey has a Mermaid diagram") is now satisfied for all three
  profit-loss journey tests.
