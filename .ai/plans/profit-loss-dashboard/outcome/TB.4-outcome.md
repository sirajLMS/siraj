# TB.4 Outcome — 4-Tier Verification Backfill (P&L service, helpers, repo extensions, GraphQL query, CSV export routes)

**Date:** 2026-09-17
**Method:** audit-first — each existing test file read against its production counterpart's branch map; only genuine Tier 1 / Tier 4 gaps filled (no rewrites). Minimum target per task definition: Tier 1 (branch coverage) + Tier 4 (abuse/permission: wildcard months, oversized/negative pagination, CSV formula injection).

## Per-file gap table (covered vs added)

| Test file | Tier 1 already covered | Tier 4 already covered | Added / fixed in TB.4 |
|---|---|---|---|
| `backend/services/accounting/profit-loss.service.test.ts` | permission denial pre-read; `MONTH_INVALID` pre-read; defaults (50/0); happy path; empty month; mixed-currency FX; missing-FX warning grouping; month forwarding; subtract-credit sum; negative/null margin | 10-case `test.each` pagination abuse (negative/zero/oversized/fractional per tab) with no tab read; forbidden error | **+1 test** — FX-excluded session carrying subtract credits contributes neither payout nor credits to `totalPayments` (closes the `convertedAmount == null` operand of the credit-skip guard in `getPaymentsPage`) |
| `backend/services/accounting/profit-loss-helpers.test.ts` | every branch of `convertCurrency` (same-currency, missing, stale, unparseable), `aggregateWithFx` (excluded/dominant/tie/fallback/empty), `collectFxWarnings`, `composeProfitsSummary` | `validateMonth`: `%`, `.*`, `2024-1`, `2024-13`, `2024-00`, empty, full-date, `2024-01; DROP TABLE`, `____-__`; `validatePagination`: negative/zero/oversized/fractional/NaN/Infinity + 500-boundary | none — complete |
| `backend/db/test/repo/scheduling/profit-loss-payments.repository.test.ts` | month filter, `NOT_CALCULATED` exclusion, pagination + full `totalCount`, soft-delete, join + payroll-fallback mapping | wildcard/malformed month `test.each` (`%`, `%%`, `.*`, `2099-%`, `2099-1`, `""`) → 0 rows | **Was RED at baseline (6 fails)** — `startOfUtcMonth("%")` produced an Invalid Date and Drizzle threw `RangeError`. Fixed in production (`backend/db/repo/scheduling/class-instances.ts`): `PROFIT_LOSS_MONTH_PATTERN` guard returns an empty page for malformed months (repo contract: no data-access throw, no widened scan). Now 11/11 green |
| `backend/db/test/repo/expenses/profit-loss-expenses.repository.test.ts` | column shape, teacher snapshot + carryover provenance, month filter, soft-delete exclusion, newest-first pagination + past-end offset, per-type aggregation | wildcard/malformed months → 0 rows | none |
| `backend/db/test/repo/billing/profit-loss-income.repository.test.ts` | month filter + order, pagination slices, joined provenance, soft-deleted-invoice removal, orphan-parent null name | wildcard/malformed months → 0 rows | none |
| `backend/db/test/repo/billing/profit-loss-credit-subtract.repository.test.ts` | positive normalization, absent instances, empty input, multi-row sum, non-SUBTRACT ignored | n/a (id-array input, no month/pagination surface) | none |
| `backend/graphql/query/accounting/profit-loss.query.test.ts` | four-tab payload, pagination defaults + passthrough, missing month/currency args, `MONTH_INVALID` propagation | permissionless FORBIDDEN, 4-role BOLA probe (teacher/student/parent/staff), logged-out, no-user-id UNAUTHENTICATED, superadmin allow, 6-case month abuse (`%`, `.*`, `2024-1`, `2024-00`, SQL injection, `____-__`), hostile pagination forwarding to the service guard | none |
| `app/api/profit-loss/payments/export/route.test.ts` | 401/403/200, headers + filename, truncation boundary, blank month, bad currency, 500 | URL-encoded month abuse ×6, formula prefixes `=`,`+`,`-`,tab | **extended** OWASP test — now also exercises `@`, CR (`\r`) prefix, embedded-quote RFC 4180 doubling + `\n` quoting (branches of `toCsvCell` previously untested despite the test name claiming CR) |
| `app/api/profit-loss/expenses/export/route.test.ts` | same matrix | month abuse ×6, `=`,`@`,`+`,`-` | **extended** — CR prefix + embedded-quote escaping via `note` cell |
| `app/api/profit-loss/income/export/route.test.ts` | same matrix | month abuse ×6, `=`,`+`,`-` | **extended** — CR prefix (`parentName`) + quote doubling (`invoiceId`) |
| `app/api/profit-loss/summary/export/route.test.ts` | same matrix + null-margin cell | month abuse ×6, `=`,`+`,`-` | **extended** — CR prefix + quote doubling on summary amounts |

## Verification (all green)

- `bun run test/scripts/run-test.ts` per file:
  - `profit-loss.service.test.ts`: 27 pass / 0 fail (was 26, +1)
  - `profit-loss-helpers.test.ts`: 37 pass / 0 fail
  - `profit-loss-payments.repository.test.ts`: 11 pass / 0 fail (baseline was 5 pass / 6 fail — repo guard fix)
  - `profit-loss-expenses.repository.test.ts`: 12 pass / 0 fail
  - `profit-loss-income.repository.test.ts`: 11 pass / 0 fail
  - `profit-loss-credit-subtract.repository.test.ts`: 5 pass / 0 fail
  - `profit-loss.query.test.ts`: 22 pass / 0 fail
  - 4 export route tests: 18/17/17/16 pass, 0 fail
- `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` exit 0 for every touched file:
  `backend/db/repo/scheduling/class-instances.ts`, `backend/services/accounting/profit-loss.service.test.ts`, and the 4 route test files (tsgo → oxlint → biome → lint → duplicates → codescene all passed).

## Files changed

- `backend/db/repo/scheduling/class-instances.ts` — production guard: malformed months (`PROFIT_LOSS_MONTH_PATTERN` mismatch) return an empty payments page instead of a Drizzle `RangeError`. Closes the 6 RED Tier-4 repo tests.
- `backend/services/accounting/profit-loss.service.test.ts` — +1 test (FX-excluded credits exclusion).
- `app/api/profit-loss/{payments,expenses,income,summary}/export/route.test.ts` — extended the existing OWASP-prefix tests with the CR prefix and RFC 4180 embedded-quote escaping (payments also `@` and `\n`).

## Carry-forward

- TB.1–TB.3 journey tests (cash-in / earned-revenue / expense visibility) remain the plan's remaining test-backfill items; TB.4 is backend-unit/integration only per scope.
- Deferred-items ledger untouched — no new deferrals.

## Cross-file dependencies

None outstanding. Note: `backend/db/repo/scheduling/class-instances.ts` also carries other in-flight uncommitted edits (the `findProfitLossPayments` extension itself was uncommitted at baseline); the guard added here is minimal and additive on top of that state.
