# Phase 2 Outcome — GraphQL layer (`recordCreditAdjustment`)

- **Status**: ✅ Done
- **Date**: 2026-08-29

## Mutation field shape

```
recordCreditAdjustment(input: CreditAdjustmentInput!): CreditAdjustmentResult
```

- Registered in `backend/graphql/mutation/billing/credit-adjustment.mutation.ts` with
  `authScopes: { loggedIn: true }`. The resolver resolves the actor via
  `requireAuth(ctx)` (throws `GraphQLError` code `UNAUTHENTICATED` when absent),
  then calls `CreditService.recordAdjustment(actorUserId, args.input, ctx.t().errorsTranslations)`.
  The `ACCOUNTING_CREDITS_MANAGE` gate stays in the service (`requirePermission`,
  Task 1.5) — the mutation deliberately does no local permission re-check, matching
  the `recordCreditPurchase` / `createQuota` pattern. Service-layer `DomainError`
  subclasses (`ForbiddenError`, `ValidationError`, `NotFoundError`) propagate with
  their `extensions.code` already set — no extra error-mapping needed in the resolver.
- Side-effect registration per mutation AGENTS.md: `import "./credit-adjustment.mutation";`
  added to `backend/graphql/mutation/billing/index.ts` (barrel exception for
  GraphQL registration imports).

## Input / result types (Task 2.1)

`backend/graphql/pothos/billing/credit-adjustment.pothos.ts` (new):

- `CreditAdjustmentInputPothosRef` = `gqlSchemaBuilder.inputRef<CreditAdjustmentInput>("CreditAdjustmentInput")`
  (backed by `@/backend/types`, input-type exception). Fields: `studentId: ID!`,
  `adjustmentType: CreditAdjustmentType!`, `hours: Int!` (constraint min 1/max 100000),
  `notes: String` (maxLength 2000), `carryoverTeacherId: ID`,
  `carryoverFromDate/carryoverToDate/carryoverPaymentDate: String`.
- `CreditAdjustmentTypePothosEnum` is **not** re-registered — it is imported from
  `backend/graphql/pothos/shared/enum.pothos.ts` where Task 0.2 registered it
  (repo enum rule: single registration in the shared module).
- `CreditAdjustmentResultPothosObject` =
  `gqlSchemaBuilder.objectRef<CreditAdjustmentReturnType>("CreditAdjustmentResult")`,
  implemented via the shared `creditTransactionFields(t)` helper — same full ledger
  field set as `CreditTransaction` / `CreditPurchaseResult`, now including
  `adjustmentType: CreditAdjustmentType` and the four `carryover*` fields.

`backend/graphql/pothos/billing/index.ts` — added `export * from "./credit-adjustment.pothos";`.

### Task 2.2 mechanics & deviations

- The carryover/`adjustmentType` exposure on `CreditTransactionPothosObject` is done
  in `backend/graphql/pothos/billing/__shared__/creditFieldHelpers.ts` (the shared
  helper that backs `CreditTransactionPothosObject`, `CreditPurchaseResultPothosObject`,
  and now `CreditAdjustmentResultPothosObject`) — editing the helper was the minimal
  way to expose the fields because the object fields are already extracted there
  (`credit.pothos.ts` itself holds no field definitions).
- `recordCreditAdjustment` result object uses `t.exposeString("carryoverTeacherId")`
  (not `exposeID`) — consistent with every id-ish field in `creditTransactionFields`
  (`credit.transactions` ids surface as `String`); the schema therefore declares
  `carryoverTeacherId: String`.
- **`clientRequestId` from the §4.1 sketch is intentionally omitted** from
  `CreditAdjustmentInput`: the canonical `CreditAdjustmentInput` type (Task 1.1) has
  no such field and idempotency is fully derived server-side
  (`deriveAdjustmentIdempotencyKey`, Task 1.3); `inputRef<CreditAdjustmentInput>`
  field keys must match the backing type.

### Generated schema (verified)

- `recordCreditAdjustment(input: CreditAdjustmentInput!): CreditAdjustmentResult` ✅
- `input CreditAdjustmentInput` with the 8 fields above ✅
- `type CreditAdjustmentResult` with the full 16-field ledger shape incl.
  `adjustmentType: CreditAdjustmentType` + 4 carryover fields ✅
- `adjustmentType` + carryover fields also present on `CreditTransaction` and
  `CreditPurchaseResult` ✅ (shared helper).

## Mutation tests (Task 2.4)

`backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts` — mocked-module
unit convention matching `backend/graphql/mutation/auth/test/auth.mutation.test.ts`:
mocked `@/backend/graphql/gqlSchemaBuilder` captures the registered
`mutationField` config (`name`, `field`/`arg` shims), mocked
`@/backend/graphql/pothos/billing/credit-adjustment.pothos` stubs the refs, mocked
`@/backend/services` provides a capturing `CreditService.recordAdjustment`; real
`requireAuth` and real error classes. Deferred `await import` of the SUT after mocks.

**5 tests, 23 expects — all pass** (`bun run test/scripts/run-test.ts
backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts`):

1. `registers the recordCreditAdjustment root field` — registration + resolver shape.
2. `returns the CreditTransaction-shaped service result and forwards the full input`
   — all result fields asserted (`id`, `studentId`, `changeAmount`, `reason`,
   `adjustmentType`, `notes`, 4 carryover fields); service call asserted with the
   real actor id and the **verbatim full input** (all optional fields non-null).
3. `passes null optional arguments through to the service` — the `null` path for
   every optional input field (per `docs/testing/mutation-argument-coverage.md`,
   both non-null and `null` cases covered in resolver-level form).
4. `propagates a ForbiddenError from the service as a GraphQL FORBIDDEN error` —
   Tier-4 permission denial: `ForbiddenError` from `requirePermission` inside the
   service surfaces as `extensions.code === "FORBIDDEN"`.
5. `rejects unauthenticated callers with a UNAUTHENTICATED GraphQL error` —
   `requireAuth` guard, zero service calls.

Note: these are unit-style resolver-contract tests (dev-server integration coverage of
the same mutation belongs to the Phase-5 frontend-document test surface, per the
existing split between `backend/graphql/**/test` mocked suites and
`frontend/common/graphql/test/` full-stack suites).

## Verification (QL / TE / SEC / SR / IV)

**QL** — `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`, exit 0:

| File | Result |
|---|---|
| `backend/graphql/pothos/billing/credit-adjustment.pothos.ts` | ✅ tsgo, oxlint, biome, lint:type-aware, duplicates, codescene |
| `backend/graphql/pothos/billing/__shared__/creditFieldHelpers.ts` | ✅ all stages (first revision with a generic `Parent` parameter failed tsgo — Pothos key narrowing breaks under an unresolved generic; reverted to the concrete `CreditTransactionReturnType` param) |
| `backend/graphql/mutation/billing/credit-adjustment.mutation.ts` | ✅ all stages |
| `backend/graphql/mutation/billing/index.ts` | ✅ all stages |
| `backend/graphql/pothos/billing/index.ts` | ✅ all stages |
| `backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts` | ✅ all six stages (`All checks ... passed`). Two fixes en route: oxlint `no-unsafe-type-assertion` (`error as GraphQLError` → `instanceof` narrowing) and sonarjs `no-undefined-argument` (`mockCtx(undefined)` → `mockCtx()`). |

Project-wide `bun tsgo` after Phase 2: errors exist **only** in other agents'
in-flight work (`frontend/**/exchange-rates/**`, `test/ui/components/**`,
`buildBillingLabels.ts`, `StudentCreditHoursTab.tsx`) — none in any file this phase
touched; every phase-2 file reports zero tsgo errors in the per-file scoped runs.

**TE** — 5/5 mutation tests green via `run-test.ts` (results above). Existing billing
service/repo/test surfaces were not touched in this phase.

**Task 2.5 (acceptance)**
- `bun run generate:gqlSchema` — ✅ completes; schema written with the new mutation,
  input, result type, and the extended transaction objects (verified by grep).
- `bun codegen` — ✅ completes. `frontend/common/graphql/generated/gql/graphql.ts`
  is schema-derived-but-document-driven (operations preset); it is byte-identical
  because no frontend documents changed (codegen skips identical writes) — existing
  generated types unaffected. The `RecordCreditAdjustmentMutation` operation type can
  only be generated once the Phase-5.1 document
  (`frontend/common/graphql/sharedDocuments/billing/credit-adjustment.documents.ts`)
  exists — expected by design, not a Phase-2 deliverable.

**SEC** — permission gate enforced in the service (`requirePermission` first, before
validation or DB work); the mutation passes the real authenticated actor id
(`requireAuth`), never a caller-supplied id; no raw-SQL or new injection surfaces;
input constraints (`hours` min/max, `notes` maxLength) declared via Pothos
directives consistent with `RecordPurchaseInput`.

**SR** — no double enum registration (shared import); no local type definitions in
Pothos files (all shapes from `@/backend/types`); optional input fields accept
`null | undefined` and are forwarded verbatim; no dead code; enums consumed as value
imports only where needed; comments are clean (no plan/task tags).

**IV** — read and followed `backend/AGENTS.md`, `backend/graphql/AGENTS.md`,
`backend/graphql/pothos/AGENTS.md`, `backend/graphql/mutation/AGENTS.md`,
`backend/types/AGENTS.md`, `.agents/instructions/backend.instructions.md`,
`.agents/instructions/tests.instructions.md`, plus the sub-loop printed instruction
set; mutation-layer barrel side-effect import rule honored.

## Files touched

- `backend/graphql/pothos/billing/credit-adjustment.pothos.ts` 🆕
- `backend/graphql/pothos/billing/__shared__/creditFieldHelpers.ts` ✏️ (adjustment/carryover fields)
- `backend/graphql/pothos/billing/index.ts` ✏️ (barrel export)
- `backend/graphql/mutation/billing/credit-adjustment.mutation.ts` 🆕
- `backend/graphql/mutation/billing/index.ts` ✏️ (side-effect import)
- `backend/graphql/mutation/billing/credit-adjustment.mutation.test.ts` 🆕
- `frontend/common/graphql/generated/schema.graphql` ♻️ (generated)
- `.ai/plans/credit-adjustment-system/trackable-tasks.md` ✏️ (2.1–2.5 marked done)

## CROSS-FILE DEPENDENCY

None for Phase 2. Two informational regression notes for the orchestrator:

1. Project-wide `bun tsgo` currently shows 15 errors, all in other agents' in-flight
   billing/frontend work (see list above); none are Phase-2 files.
2. Phase 5.1 must create the frontend mutation document before
   `Operations.RecordCreditAdjustmentMutation` can exist in codegen output.
