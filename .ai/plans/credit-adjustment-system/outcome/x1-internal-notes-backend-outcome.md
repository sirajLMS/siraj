# x1 Outcome — `internalNotes` backend extension

- **Status**: ✅ Done
- **Date**: 2026-08-30

## Summary

Added the optional plain-text `internalNotes` field (operator-authored,
accounting-only; never rich-text sanitized, never selected by
student/parent-facing documents) end-to-end: nullable `internal_notes`
column on `credit_transactions`, backend types, repository insert payload,
service normalization + length cap, Pothos input/object exposure, regenerated
schema, and assertion coverage across the service/repo/mutation test layers.

## Changes by layer

### Schema — `backend/db/schema/billing/credit-transactions.ts`

`internalNotes: textColumn("internal_notes")` appended after the carryover
columns (same `textColumn` helper idiom as `notes`), with a comment recording
the accounting-only / no-sanitizer / no-student-surface contract.

### Migration (per the 0.5 flow — `bun db generate` + `bun db migrate`)

- Generated folder: `backend/drizzle/20260830125726_easy_black_widow/`
  (`migration.sql` + `snapshot.json`). The SQL is exactly one statement:
  `ALTER TABLE "credit_transactions" ADD COLUMN "internal_notes" text;`
- Applied to the dev DB (`bun db migrate`) and to the test DB
  (`bun --env-file=.env.test run backend/db/scripts/migrate.ts`, which also
  settled the pre-existing pending
  `20260829192949_custom_38-parent-notification-view-alerts` folder there).
- Verified live: `information_schema` shows `internal_notes text`, nullable
  YES; journal tail contains `20260830125726_easy_black_widow`.
- **Data-loss risk: none** — pure additive nullable column, no renames, no
  defaults rewritten. `ensureIdempotentMigrations` rewrote nothing else.

### Types — `backend/types/billing/credit.types.ts`

- `internalNotes?: string | null` on `CreditAdjustmentInput` and
  `CreditAdjustmentInsertInput` (JSDoc states the plain-text/verbatim
  contract).
- `internalNotes: string | null` on `CreditAdjustmentReturnType` (explicit
  restatement, same idiom as the carryover fields even though
  `CreditTransactionReturnType` now infers it structurally).

### Repo — `backend/db/repo/billing/credit.repository.ts`

`createAdjustment` insert payload now stamps
`internalNotes: input.internalNotes ?? null`. No other repo method changed:
`insertCreditTransaction`-based flows (purchase/deduction/refund/batch)
intentionally leave the column NULL.

### Service — `backend/services/billing/credit.service.ts`

- `normalizeInternalNotes()` — trims; blank/omitted persists as NULL;
  otherwise stored verbatim (deliberately NOT routed through
  `sanitizeRichText`, unlike `notes`).
- `INTERNAL_NOTES_MAX_LENGTH = 2000` sanity cap in
  `validateAdjustmentInput` (measured after trim). Over-length throws
  `ValidationError(tErrors.tooLong)` before any write.
- `createAdjustment` call site passes `internalNotes` through.
- Idempotency untouched: `deriveAdjustmentIdempotencyKey` input type keeps
  the same identifying fields — the note is not key material (covered by a
  dedicated replay test comparing derived keys).

### Locale — new generic `tooLong` errors key

No generic `tooLong`/`tooLongLike` key existed (`invalidInput` was the only
generic). Added at the flat root of the errors namespace:

- `shared/locale/types/errors/index.ts`: `readonly tooLong: string` after
  `invalidInput`.
- `shared/locale/en/errors/index.ts`: `"Input exceeds the maximum allowed length."`
- `shared/locale/ar/errors/index.ts`: `"الإدخال يتجاوز الحد الأقصى المسموح به للطول."`

Both surfaces (eager `messages.ts` + `namespaces/errors/`) consume the same
leaf objects — no wiring change required.

### GraphQL — Pothos exposure

- `backend/graphql/pothos/billing/credit-adjustment.pothos.ts`:
  `internalNotes: t.string({ required: false, directives: { constraint: { maxLength: 2000 } } })`
  on `CreditAdjustmentInput` (matches the `notes` field style).
- `backend/graphql/pothos/billing/__shared__/creditFieldHelpers.ts`:
  `internalNotes: t.exposeString("internalNotes", { nullable: true })` in the
  shared `creditTransactionFields` — surfaces on `CreditTransaction`,
  `CreditPurchaseResult`, and `CreditAdjustmentResult` via the canonical
  single-object pattern. Schema-level exposure only: no frontend document
  selects the field, so student/parent surfaces never receive it.

### Schema regen / codegen

- `bun run generate:gqlSchema` ✅ — `CreditAdjustmentInput.internalNotes: String`
  plus `internalNotes: String` on all three transaction object types
  (verified in `frontend/common/graphql/generated/schema.graphql`).
- `bun codegen` ✅ — generated `CreditAdjustmentInput` type now carries
  `internalNotes: string | null | undefined`.

## Tests

| Suite | Result |
|---|---|
| `backend/services/billing/credit-adjustment.service.test.ts` | 48 pass / 0 fail (294 expects) — 6 new: trimmed persist, omitted/blank → NULL, verbatim no-sanitize, 2000-char boundary accepted, 2001-char rejected (VALIDATION, zero writes), idempotency-key invariance on retried submission |
| `backend/db/test/repo/billing/credit-adjustment.repository.test.ts` | 8 pass / 0 fail (75 expects) — 1 new (verbatim markup persist + read-back, omitted → NULL); `expectAdjustmentDefaults` now pins `internalNotes` |
| `backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts` | 6 pass / 0 fail (26 expects) — full-input and null-optional forwarding now include `internalNotes`; result assertion added |
| Regression: `credit.repository.test.ts` | 28 pass / 0 fail |
| Regression: `credit-adjustment.idempotency.test.ts` | 22 pass / 0 fail |
| Regression: `migrations/credit-adjustment-columns.test.ts` | 4 pass / 0 fail |

Repo tests: 100% `runInRollback`, every repo call and direct Drizzle read
takes `tx`, no `rejects.toThrow`, no seed-data queries.

## Pipeline results

**QL — `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`:**

| File | Result |
|---|---|
| `backend/db/schema/billing/credit-transactions.ts` | exit 0 |
| `backend/types/billing/credit.types.ts` | exit 0 |
| `backend/db/repo/billing/credit.repository.ts` | exit 0 |
| `backend/services/billing/credit.service.ts` | exit 0 |
| `shared/locale/types/errors/index.ts` | exit 0 |
| `shared/locale/en/errors/index.ts` | exit 0 |
| `shared/locale/ar/errors/index.ts` | exit 0 |
| `backend/graphql/pothos/billing/credit-adjustment.pothos.ts` | exit 0 |
| `backend/graphql/pothos/billing/__shared__/creditFieldHelpers.ts` | exit 0 |
| `backend/services/billing/credit-adjustment.service.test.ts` | exit 0 |
| `backend/db/test/repo/billing/credit-adjustment.repository.test.ts` | exit 0 |
| `backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts` | exit 0 |

**SEC**: the column stores free operator text verbatim, but no execution or
student/parent rendering surface reads it (no frontend document selects it);
the Pothos input carries a `maxLength` directive and the service re-checks
the cap server-side; all persistence via parameterized Drizzle builds.

**SEC audit caveat (accepted by design):** because the value is stored
unsanitized, any *future* accounting view must render it as plain text
(React text nodes escape by default) — never through `dangerouslySetInnerHTML`.

**SR**: additive-only migration; idempotency key derivation untouched;
`createAdjustment` is the single adjustment write path so DDL/read-mappers
(`mapToReturnType` spreads `$inferSelect`) need no further changes; no plan
tags in code comments.

## Files touched (complete list)

- `backend/db/schema/billing/credit-transactions.ts`
- `backend/drizzle/20260830125726_easy_black_widow/{migration.sql,snapshot.json}` (generated)
- `backend/types/billing/credit.types.ts`
- `backend/db/repo/billing/credit.repository.ts`
- `backend/services/billing/credit.service.ts`
- `shared/locale/types/errors/index.ts`, `shared/locale/en/errors/index.ts`, `shared/locale/ar/errors/index.ts`
- `backend/graphql/pothos/billing/credit-adjustment.pothos.ts`
- `backend/graphql/pothos/billing/__shared__/creditFieldHelpers.ts`
- `backend/services/billing/credit-adjustment.service.test.ts`
- `backend/db/test/repo/billing/credit-adjustment.repository.test.ts`
- `backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts`
- `frontend/common/graphql/generated/schema.graphql` + `generated/gql/*` (regenerated)

## Cross-file dependencies

None. Follow-up surface work (accounting UI exposing the note, audit-log
payload enrichment) is intentionally out of scope for this backend extension.
