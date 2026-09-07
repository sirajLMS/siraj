# Review — Types (R1): `backend/types/billing/expense.types.ts` + cross-layer usage

- **Date**: 2026-09-07
- **Scope (read-only)**: `backend/types/billing/expense.types.ts` and every consumer across
  repo / service / GraphQL (Pothos + resolvers) / CSV route / frontend documents, view models,
  store, and grid. Focus: canonical names, duplicates, `@/` imports, Pothos input
  null|undefined acceptance, end-to-end nullability, enum left/right consistency.

## Verification performed

- `bun run scripts/health/sub-loop.ts backend/types/billing/expense.types.ts --lifecycle codescene` → **exit 0**
  (tsgo, oxlint, biome, lint, duplicates, codescene all pass on the reviewed file).
- Read and traced: `expense.types.ts`, `backend/enum/expenses/expense-type.enum.ts`,
  `shared/constants/expenses/*`, `backend/graphql/pothos/shared/enum.pothos.ts`,
  `backend/graphql/pothos/expenses/expense.pothos.ts`,
  `backend/graphql/query/billing/expense.query.ts`, `backend/graphql/mutation/billing/expense.mutation.ts`,
  `backend/services/expenses/expense.service.ts` + `expense-helpers.ts`,
  `backend/db/repo/expenses/expense.repository.ts`, `backend/db/schema/expenses/expenses.ts`,
  `app/api/expenses/export/route.ts`,
  `frontend/common/graphql/sharedDocuments/billing/expense.documents.ts`,
  generated `graphql.ts` inputs/enums, `useExpensesViewModel.ts`, `useExpenseFormViewModel.ts`,
  `ExpensesDataGrid.tsx`, `expenseFilterStore.ts`.

## Findings

- **[MEDIUM] Duplicate enum definition, no shim.** `backend/enum/expenses/expense-type.enum.ts:9`
  and `shared/constants/expenses/expense-type.enum.ts:6` both fully declare
  `enum ExpenseType { SALARIES = "Salaries", … }`. Per the cross-layer enum rule
  (`backend/types/AGENTS.md` §"Cross-Layer Enum Migration", `backend/enum/AGENTS.md` "Adding New
  Enums": cross-layer values belong in `shared/constants/`, with `backend/enum/` re-exporting),
  the backend file should be a re-export shim of the shared canonical enum (as was done for
  `CurrencyCode`, `IANATimezone`, `ClassInstanceDetail`). Values are identical today, but the
  shared file's own docstring admits manual "lockstep" — a drift vector that also feeds the
  `expense_type` pgEnum (`backend/db/schema/enums.ts:180`) and the Pothos registration.
  **Fix**: make `backend/enum/expenses/expense-type.enum.ts` re-export from
  `@/shared/constants/expenses` (keep the exported `ExpenseType` symbol so `backend/db/schema/enums.ts`,
  Pothos, and service comparisons are untouched).

- **[MEDIUM] Duplicate provenance constant.** `backend/services/expenses/expense.service.ts:55`
  re-declares `EXPENSE_SOURCE_CARRYOVER_BALANCES = "carryover_balances"` even though the canonical
  cross-layer constant already exists at `shared/constants/expenses/expense-source.constants.ts:8`
  (same value; the frontend reads the shared one in `ExpenseSourceChip.tsx:5`). A
  provenance wire value defined in two places is exactly the drift the shared-constants layer
  exists to prevent; the service layer may import `shared/constants` freely.
  **Fix**: delete the local declaration in `expense.service.ts` and import the shared constant
  (re-export via the services barrel if `carryover-balance.service.ts:15` must keep its current
  import path).

- **[LOW] Dead exported type.** `CreateExpenseInternalInput`
  (`backend/types/billing/expense.types.ts:46-49`, with the `__internal?: true` marker) is
  referenced nowhere in code — only in plan docs. `ExpenseService.createInternal`
  (`expense.service.ts:252`) takes `CreateExpenseInput`. Either the marker was never wired or it
  became obsolete. **Fix**: delete the interface, or change the `createInternal` signature to
  actually require it.

- **[LOW] `ExpenseUpdatePatch` wider than the update contract.**
  `expense.types.ts:21` — `Partial<Omit<ExpenseInsertType, "id">>` still admits
  `createdAt`, `createdByUserId`, `sourceEntity`, `sourceEntityId` as patchable columns, none of
  which the update flow may ever change (service `buildUpdatePatch` whitelists correctly, so this
  is type-level hardening only). **Fix**: also omit provenance/audit columns, e.g.
  `Partial<Omit<ExpenseInsertType, "id" | "createdAt" | "createdByUserId" | "sourceEntity" | "sourceEntityId">>`.

- **[LOW] Stale doc comment on aggregate keys.** `useExpensesViewModel.ts:40-42` says
  `rowCountByType` has "a type with zero matching rows … absent". The backend
  `countExpensesByType` (`expense-helpers.ts:183-194`) always emits all four types with `0`
  defaults. Behaviour is fine; the comment misdescribes the contract the grid footer relies on.
  **Fix**: correct the comment.

- **[INFO] Dead null-guards on non-null GraphQL fields.** `row.type === null`
  (`ExpensesDataGrid.tsx:415`, `expenses.mobile.tsx:193`) and `row.title ?? ""`
  (`ExpensesDataGrid.tsx:202`) can never trigger — the schema marks `Expense.type`/`title`
  non-null. Harmless defensiveness; optional cleanup.

## Verified clean (explicitly checked, no action)

- **Canonical names**: `ExpenseSelectType`, `ExpenseInsertType`, `ExpenseUpdatePatch`,
  `ExpenseRow`, `ExpensePage`, `{Create,Update,Delete,BulkDelete,SoftDelete}Expense*Input`,
  `ExpenseFilters`, `ExpenseListRow`, `ExpensePageResult` — single canonical set in
  `backend/types/billing/`, no `{Entity}Definition` or local type defs in the Pothos file
  (it imports every shape from `@/backend/types`).
- **No duplicate type declarations** for any expense shape anywhere in consumers; the CSV route,
  repo, service, and Pothos objects all consume the same canonical types.
- **`@/` imports everywhere** in all consumers; barrels are compliant
  (`backend/types/billing/index.ts:6` → `export * from "./expense.types"`).
- **Pothos inputs accept null|undefined**: all optional `t.*({ required: false })` fields codegen
  to `T | null | undefined`, which matches the service input types (`X?: T | null`). The
  undefined-vs-null semantic split is honoured end-to-end: `buildUpdatePatch`
  (`expense.service.ts:350-357`) treats `undefined` as "don't touch" and `null` as "clear", and
  the frontend preserves that (`useExpenseFormViewModel.ts:190-228`).
- **Enum left/right consistency, all mapping sites**: the single registration
  `enum.pothos.ts:405-408` (`gqlSchemaBuilder.enumType(ExpenseType)`) exposes GraphQL keys
  `SALARIES`/`MARKETING`/`LOGISTICS`/`TECHNOLOGY` while resolver args carry the TS values
  (`"Salaries"`…), so service comparisons (`input.type === ExpenseType.SALARIES` in
  `expense.service.ts:237`, CSV route `EXPENSE_TYPE_VALUES` from `Object.values(ExpenseType)` in
  `route.ts:17`) are correct. Frontend codegen enum (`'SALARIES'`-valued) is translated to backend
  display values at exactly two sites, both complete and identical 4/4:
  `ExpensesDataGrid.tsx:174-179` (`AGGREGATE_KEY_BY_TYPE`, matches the JSON keys emitted by
  `countExpensesByType`) and `useExpensesViewModel.ts:185-190` (`EXPENSE_TYPE_EXPORT_VALUE`,
  matches the CSV route's validation set).
- **Nullability end-to-end**: schema `notNull` columns (`title`, `type`, `expenseValue`,
  `expenseCurrency`, `paymentDate`, `expenseDate`, `createdByUserId`, `createdAt`, `updatedAt`)
  ↔ non-null `ExpenseRow` fields ↔ non-null Pothos exposures all aligned; nullable columns map to
  `T | null` on both sides. `ExpenseListRow.createdByName: string` is safe — `users.name` is
  `notNull` (`schema/users/users.ts:31`) and the repo uses an inner join. Timestamp
  serialization as ISO strings in `ExpenseRow` is sanctioned by the scalar config
  (`gqlSchemaBuilder.ts:99`: `DateTime: { Input: Date; Output: Date | string }`).
- **Frontend layer discipline**: the frontend never imports `@/backend/*` types/enums — it uses
  codegen `ExpenseType`, `CreateExpenseInput`, `UpdateExpenseInput`, `ExpenseFilter` from
  `@/frontend/common/graphql/generated/gql/graphql` everywhere (store, view models, grid, chip).
