# G-backend Outcome — Backend enrichment for parity features

## Files changed
- backend/types/billing/accounting-payment.types.ts — `lowHoursThreshold`, `lastPaymentCurrency` added to AccountingPaymentBalance
- backend/services/billing/accounting-payment.service.ts — balance resolver derives both fields via settings + newest payment lookup
- backend/services/billing/accounting-settings.utils.ts (new) — settings read/fallback/garbage-guard util shared with notification service
- backend/graphql/pothos/billing/accounting.pothos.ts — Pothos object fields for the two new properties
- backend/db/repo/billing/accounting-payment.repository.ts — query support for new field derivation
- backend/db/test/logic/lms/accounting-balance-surface.test.ts (new) — surface tests (threshold mirror/fallback/guard; currency null vs newest payment)
- frontend/common/graphql/generated/schema.graphql + generated gql client — regenerated

## Schema confirmation
`rg -n "lowHoursThreshold|lastPaymentCurrency" frontend/common/graphql/generated/schema.graphql`
→ schema.graphql:42 `lastPaymentCurrency: String`, :47 `lowHoursThreshold: Float` inside `type AccountingPaymentBalance`.

Query surface: Pothos query field `studentCreditHourBalance(studentId)` returning `AccountingPaymentBalancePothosObject` is defined in backend/graphql/query/billing/accounting.query.ts:123 (`gqlSchemaBuilder.queryField("studentCreditHourBalance", ...)`, authScopes `{ loggedIn: true }`); no other "studentCreditHourBalance" hits under backend/graphql.

## Test
Command (repo blocks direct `bun test`; used approved runner):
`bun run test/scripts/run-test.ts backend/db/test/logic/lms/accounting-balance-surface.test.ts`
Exit code: 0 — 2 pass, 0 fail, 7 expect() calls (~57s)

Static sanity `rg -n "REQ-|G\.B1|\.ai/plans/"` across all touched files: no hits.

## Downstream contract
AccountingPaymentBalance gains lowHoursThreshold:number and lastPaymentCurrency:string|null via studentCreditHourBalance(studentId) query.

Not committed/pushed; full builds/tsgo intentionally skipped (sandbox OOM).
