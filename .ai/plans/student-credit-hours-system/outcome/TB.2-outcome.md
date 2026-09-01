# TB.2 Outcome — Journey: admin toggles Paid status → invoice cascade; view-only staff observe

## Result: COMPLETE — 6 journey steps, all passing

## What was built

**Journey test**: `test/workflows/accounting/toggle-paid-invoice-cascade.test.ts`
(admin toggles the Paid flag on hour-package payments; the parent invoice cascades
PAID/UNPAID + paidDate per the paid-sibling rule and the
`accounting_paid_toggle_auto_flips_invoice` setting; a VIEW-only staff member reads
every flip but cannot mutate; optimistic-lock mismatches and per-resource denials
are rejected).

- Step 1 (baseline): `recordPayment` (paid) → invoice PAID with `paidDate` = payment day.
- Step 2 (split-payment sibling rule): a gateway-varied `recordPayment` lands on the
  SAME invoice (invoice idempotency key excludes the gateway); toggling one payment
  OFF leaves the invoice PAID while a paid sibling remains (`findPaidSiblingsByInvoice`
  non-empty path). `invoice.version` and `paidDate` are untouched in that branch.
  VIEW-only staff observe `isPaidStatusOn=false` + `invoiceStatus="PAID"` via
  `getById` and `listPaginated`.
- Step 3 (last-paid-sibling OFF → UNPAID): toggling the sibling OFF flips the invoice
  to UNPAID with `paidDate=null`; staff detail+list show UNPAID. Toggling a payment
  back ON restores PAID with `paidDate` = the toggled payment's date (ON cascade).
- Step 4 (optimistic lock): stale `expectedInvoiceVersion` → `ConflictError` whose
  message equals `tErrors.billing.invoiceVersionMismatch({id, expectedVersion,
  gotVersion})` exactly; the rejection fires before any write (payment flag and
  invoice row asserted unchanged).
- Step 5 (setting gate): with `accounting_paid_toggle_auto_flips_invoice=false`
  (snapshot/restore of the seeded `system_settings` row in try/finally), toggles
  change only the payment flag — the invoice stays PAID + `paidDate` even when no
  paid payment remains (decoupled both directions).
- Step 6 (denials): `staff_default` (VIEW, no MANAGE) and an unrelated parent are
  both rejected by service-level `requirePermission(ACCOUNTING_PAYMENTS_MANAGE)`
  with `tErrors.insufficientPermissions`, before any DB write. The resolver
  (`backend/graphql/mutation/billing/accounting.mutation.ts`
  `toggleAccountingPaymentPaidStatus`) repeats the same gate before delegating, but
  a service-level journey cannot reach the resolver wrapper honestly — noted in the
  file header; resolver-level denial remains a GraphQL-integration-layer concern
  (no accounting GraphQL integration test file exists yet).

## Helper / cast changes

None. The TB.1 cast (`provisionAccountingJourneyCast` / `cleanupAccountingJourneyCast`)
and `expectJourneyError` were reused unmodified; cleanup sweeps the two payments +
shared invoice via the family parent id. The notification spy is installed purely as
the external-effects boundary (`recordPayment` dispatches
`ACCOUNTING_PAYMENT_RECORDED` fire-and-forget); toggle dispatches nothing, so no
notification assertions were made.

No product bugs found — service behavior matched the spec in every step.

## Verification

- `bun run test/scripts/run-test.ts test/workflows/accounting/toggle-paid-invoice-cascade.test.ts`
  — 6 pass / 0 fail / 39 expects (re-run after the lint fix below: still green).
- `bun run test:workflows` — 15 pass / 0 fail across 3 files (TB.1 journey +
  lesson-report journey unaffected).
- `bun run scripts/health/sub-loop.ts test/workflows/accounting/toggle-paid-invoice-cascade.test.ts --lifecycle codescene`
  — tsgo, oxlint, biome, lint:type-aware, duplicates (skipped: outside jscpd scope),
  codescene all green.

## Pitfalls / notes for TB.3/TB.4 agents

1. **oxlint `consistent-function-scoping`** also fires on helpers that capture
   nothing from `describe` scope (in addition to the TB.1 `no-await-in-loop` /
   `no-unsafe-type-assertion` traps) — hoist pure helpers like `readInvoice` to
   module scope.
2. **Shared invoices**: two `recordPayment` calls with identical
   student/plan/amount/currency/date but different gateways land on ONE invoice
   (`deriveInvoiceIdempotencyKey` excludes gateway + note) — the cheap way to build
   a sibling pair; different payment dates create separate invoices.
3. **Invoice version**: created at 0; each `updateInvoicePaidFields` call increments
   it by 1 (only in cascade branches — the "sibling still paid" OFF branch does NOT
   bump). Compute stale versions off a fresh `readInvoice` (e.g. `version - 1`
   mismatches reliably).
4. **Global setting mutation**: `accounting_paid_toggle_auto_flips_invoice` is a
   seeded global row (`system_settings`); always snapshot the real `value` and
   restore in `finally` — never hardcode the original, and keep the mutation window
   short in case of parallel workflow files (only `togglePaidStatus` reads it, so
   TB.1/TB.3/TB.4 paths that skip toggling are immune).
5. `AccountingPaymentReturnType.invoiceStatus` + `isPaidStatusOn` on the joined
   read are the honest staff-visible surfaces — no raw `payments`/`invoices` table
   reads needed for actor assertions (raw reads only for version/paidDate detail).
