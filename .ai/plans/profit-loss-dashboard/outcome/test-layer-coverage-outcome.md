# Test-Layer Coverage Gate — Outcome

**Plan:** `.ai/plans/profit-loss-dashboard/`
**Verified:** 2026-09-17 (all runs executed fresh in this session)
**Gate:** Test-Layer Coverage (4 mandated layers + deferred-items ledger)

---

## Layer 1 — Repository/DB (profit-loss repo tests) — [PASS]

All run via `bun run test/scripts/run-test.ts <path>`; every run 0 fail:

| Test file | Pass | Fail |
|---|---|---|
| `backend/db/test/repo/scheduling/profit-loss-payments.repository.test.ts` | 11 | 0 |
| `backend/db/test/repo/expenses/profit-loss-expenses.repository.test.ts` | 12 | 0 |
| `backend/db/test/repo/billing/profit-loss-income.repository.test.ts` | 11 | 0 |
| `backend/db/test/repo/billing/profit-loss-credit-subtract.repository.test.ts` | 5 | 0 |

**Total: 39 pass / 0 fail** across the 4 repo test files (the plan's "5 profit-loss repo tests" resolves to these 4 files — task 1.4's `payments.repository.ts` path was corrected to the accounting-payment repository, and 1.5's credit test is `profit-loss-credit-subtract.repository.test.ts`; see `outcome/1.4-outcome.md` / `outcome/1.5-outcome.md`).

## Layer 2 — Services (profit-loss service + helpers) — [PASS]

| Test file | Pass | Fail |
|---|---|---|
| `backend/services/accounting/profit-loss.service.test.ts` | 27 | 0 |
| `backend/services/accounting/profit-loss-helpers.test.ts` | 37 | 0 |

**Total: 64 pass / 0 fail.** Full `bun run test:services` regression was already run green in phase 1.9 / 8.2 (see `outcome/8.2-8.3-outcome.md`) — not re-run here per scoped-run policy; no accounting files changed since.

## Layer 3 — Cross-actor journeys (`bun run test:workflows`) — [PASS with documented pre-existing failures]

Result: **186 pass / 2 fail** (188 tests, 26 files, 1755 expect() calls).

- The only 2 failures are exactly the documented pre-existing WhatsApp failures in `test/workflows/whatsapp/conversations.test.ts`:
  - `free-text waits for the 24h window, then sends after the inbound reply`
  - `listConversations surfaces the thread with outbound + inbound rows to a view actor`
  - These match deferred-items.md D4 and are NOT caused by this plan (no whatsapp files touched; documented in `outcome/8.2-8.3-outcome.md`).
- All profit-loss journeys pass. The plan's "4 journeys" resolves to 3 journey files under `test/workflows/accounting/` (TB.1 cash-in-visibility, TB.2 earned-revenue, TB.3 expense-visibility — TB.4 is the 4-tier verification task, not a journey file); all 3 ran in this suite and none appear in the failure list. They were also verified individually in phase 1.9 (see `outcome/TB.1-TB.2-outcome.md`, `outcome/TB.3-outcome.md`).

## Layer 4 — GraphQL integration (query + CSV export routes) — [PASS]

All run via `bun run test/scripts/run-test.ts <path>`; every run 0 fail:

| Test file | Pass | Fail |
|---|---|---|
| `backend/graphql/query/accounting/profit-loss.query.test.ts` | 22 | 0 |
| `app/api/profit-loss/payments/export/route.test.ts` | 18 | 0 |
| `app/api/profit-loss/expenses/export/route.test.ts` | 17 | 0 |
| `app/api/profit-loss/income/export/route.test.ts` | 17 | 0 |
| `app/api/profit-loss/summary/export/route.test.ts` | 16 | 0 |

**Total: 90 pass / 0 fail.**

---

## Deferred-Items Ledger Verdict

Non-✅ rows in `.ai/plans/profit-loss-dashboard/deferred-items.md` (0 ❌ rows; 4 ⚠️ rows, 1 ✅):

| ID | Item | Status | Classification | Verdict |
|---|---|---|---|---|
| D1 | UI component tests skipped per user instruction (4.6, 5.6, 7.2, 7.3) | ⚠️ Partial | **User-accepted deferral — does NOT block completion.** Explicit user instruction ("dont create any ui/e2e tests at all"). UI-render ACs verified via sub-loop + build per trackable-tasks.md DoD. Per instruction, NOT resolved by creating UI tests. | Accepted |
| D2 | Playwright E2E test skipped (8.1) | ⚠️ Partial | **User-accepted deferral — does NOT block completion.** Same user instruction; `e2e/accounting/profit-loss.spec.ts` not created. | Accepted |
| D4 | Pre-existing WhatsApp journey failures (2 tests) | ⚠️ Partial | **Pre-existing/unrelated — does NOT block completion.** Verified above: these are the ONLY 2 failures in `test:workflows`; this plan touched no whatsapp files. | Accepted (pre-existing) |
| D4 (second row) | Plan 6 `ExpenseTypeChip`/`ExpenseSourceChip` standalone components don't exist; P&L ExpensesTab renders local cells via shared `StatusBadge` | ⚠️ Partial | **Functional parity achieved — does NOT block completion.** Local cells use the same palette + label catalog as the ledger grid; swap deferred to Plan 6's future chip extraction (out of this plan's scope). | Accepted (cross-plan follow-up) |

One ✅ row exists (the template example row D3) — expected.

**Gate conclusion:** 0 ❌ rows; all ⚠️ rows are either user-mandated deferrals (D1, D2), pre-existing failures (D4 WhatsApp), or out-of-scope cross-plan follow-ups (D4 chip row). None block plan completion.

---

## Summary

| Layer | Result |
|---|---|
| 1. Repository/DB | PASS — 39/39 |
| 2. Services | PASS — 64/64 |
| 3. Workflows | PASS — 186/188 (2 pre-existing WhatsApp failures only, D4) |
| 4. GraphQL integration | PASS — 90/90 |
| Deferred ledger | 0 ❌; 4 ⚠️ all user-accepted/pre-existing/out-of-scope — non-blocking |
