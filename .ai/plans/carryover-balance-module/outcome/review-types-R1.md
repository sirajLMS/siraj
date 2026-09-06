# REVIEW (types) — carryover-balance-module — R1

Scope: `backend/types/billing/carryover-balance.types.ts` and its usage across repo, services,
Pothos, queries/mutations, frontend documents, and the accounting/carryover view directory.
Read-only review; no files modified except this report.

Verdict: **solid core** — canonical SelectType/InsertType via `$inferSelect`/`$inferInsert`,
`@/` imports everywhere, no local type sprawl in Pothos files, no backend-type imports from
frontend, type-only imports used correctly for enum types, value imports (CurrencyCode) only
where the value is actually used. Findings below are mostly duplication/discipline issues.

## Findings

### [MEDIUM] Service redefines exported canonical types as inline anonymous shapes
`backend/services/teachers/carryover-balance.service.ts:1052,1368,1370,1409,1411`
- `unpayCarryoverBalance(input: { id; note?; actorUserId })` (1052) duplicates `UnpayCarryoverInput`
  (carryover-balance.types.ts:102).
- `deleteCarryoverBalance(input: { id; actorUserId })` (1368) duplicates `DeleteCarryoverInput` (109).
- `Promise<{ id; deleted }>` return (1370) duplicates `DeleteCarryoverResult` (115).
- `bulkDeleteCarryoverBalances(input: { ids; actorUserId })` (1409) duplicates `BulkDeleteCarryoverInput` (121).
- `Promise<{ deletedIds; auditLogIds }>` return (1411) duplicates `BulkDeleteCarryoverResult` (126).

The same file imports CreateCarryoverInput/UpdateCarryoverInput/BulkCreateCarryoverInput etc. from
`@/backend/types`, so the inline re-declarations are inconsistent and create silent-drift risk
between the service signatures and Pothos (`DeleteResultRef` is typed with
`DeleteCarryoverResult` at carryover.pothos.ts:175 — two diverging sources for one shape).
Fix: use the exported types as the service signatures, or drop the unused exports from the
types file if the inline shapes are intentional. Prefer the former.

### [MEDIUM] `CarryoverPaidStatusFilter` literal set duplicated 5× across layers
- `backend/types/billing/carryover-balance.types.ts:132` — union type `"Paid" | "Unpaid" | "Both"`
- `backend/graphql/query/teachers/carryover.query.ts:15` — `PAID_STATUS_VALUES` Set literal
- `app/api/carryover/export/route.ts:17` — identical `PAID_STATUS_VALUES` Set literal (copy of the query guard)
- `frontend/common/stores/carryoverFilterStore.ts:10` — the union type redefined
- `frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar.tsx:32` — literal array

Five hand-maintained copies of the same closed set; adding a status means touching five files.
Fix: define `CARRYOVER_PAID_STATUS_VALUES` const + derived type once in `shared/constants/`
(cross-layer by design, like the CurrencyCode precedent), import from there in the types file,
both backend guards, the store, and the filter bar.

### [LOW] Repo-local exported types violate the "types live in backend/types/" pattern
`backend/db/repo/teachers/carryover-balance.repository.ts:29,34,40`
- `CarryoverBalanceListRow` (29), `CarryoverBalancePageResult` (34), `CarryoverBalanceUpdatePatch` (40)
  are exported from the repo file. `backend/db/repo/AGENTS.md:45` says repository input/output
  types belong in `backend/types/<subdir>/<entity>.types.ts`, and `backend/types/AGENTS.md:56`
  states all type definitions live in `backend/types/`. Sibling snapshot row type
  `CarryoverLinkedSessionRow` (also a repo-level read shape) already lives in the types file,
  so the split is internally inconsistent.
Fix: move the three types into `carryover-balance.types.ts` (they derive from
`CarryoverBalanceSelectType`/`InsertType` already available there) and import them into the repo.

### [LOW] `CarryoverRow` hand-duplicates `CarryoverBalanceListRow` / SelectType columns
`backend/types/billing/carryover-balance.types.ts:148-168` vs repo `CarryoverBalanceListRow`
(repo file:29-32). `CarryoverRow` restates every persisted column by name plus the teacher
display fields, independent of the Drizzle-derived `CarryoverBalanceSelectType`, so a schema
rename/addition does not surface as a type error at the mapping site
(`mapCarryoverRow` at carryover-balance.service.ts:290) and the doc string must be kept in
sync manually (it also omits nothing — the forbidden-field Omit pattern from
types/AGENTS.md:22-38 is not applied to columns like deletedAt/paidByUserId, which only the
service mapping happens not to copy).
Fix: define `CarryoverRow` as `Omit<CarryoverBalanceListRow, "createdAt" | "paidAt" | …internal columns> & { createdAt: string; paidAt: string | null }`.

### [LOW] `CarryoverPage.aggregates.rowCountByPaid` is an anonymous inline shape duplicated on the client
`backend/types/billing/carryover-balance.types.ts:177` — inline `{ paid: number; unpaid: number }`;
`frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.ts:39-42` redefines it as
`CarryoverRowCountByPaid` (plus the `isRowCountByPaid` guard at 190). Frontend cannot import
backend types, so some duplication is inherent for the JSON scalar, but making the backend
shape a named exported type (e.g. `CarryoverPaidRowCounts`) gives the frontend guard an
authoritative contract to mirror and documents the JSON-scalar encoding in one place.

### [INFO] No `{Entity}ReturnType` canonical return type
types/AGENTS.md:8-11 lists `{Entity}ReturnType` as the canonical pattern name ("as needed").
This module uses `CarryoverRow`/`CarryoverPage` (and repo's `CarryoverBalanceListRow`) instead.
Not a violation — naming is descriptive — but the drift from the house convention is worth a
conscious decision; renaming `CarryoverRow` → `CarryoverBalanceReturnType` would align it.

### [INFO] CurrencyCode imported directly from `@/shared/constants/currency.enum`
`backend/types/billing/carryover-balance.types.ts:3`, `carryover-balance.service.ts:56` (value
import for `CurrencyCode.SAR`), `carryover-aggregate.ts:1`. The cross-layer enum migration
(types/AGENTS.md:80-88) rebuilt `CurrencyCode` in `backend/enum/` as a re-export shim; the
same file imports `CalculationStatus` via `@/backend/enum`, so the enum import style is mixed
within one file. Legitimate either way (shared constants are cross-layer), but importing from
`@/backend/enum` would make the barrel the single entry point consistently.

## Verified non-issues

- Pothos inputs accept null|undefined: all optional fields declared `required: false` and
  service-side input types are `?: T | null`; the create-mutation re-narrow of
  `payable`/`teacherCurrency` (carryover.mutation.ts:67-71) correctly handles the
  helper-widened optional typing with a localized ValidationError.
- No local type sprawl in Pothos: every `objectRef` is parameterized with a canonical type
  from `@/backend/types`; no ad-hoc `{Entity}Definition` types.
- Value-vs-type imports are correct: `CurrencyCode`/`CalculationStatus` imported as values only
  where values are read (`.SAR`, `CALCULATED`, `Object.values`), as `import type` elsewhere.
- `@/` imports used in every scoped file; no relative cross-layer imports.
- Frontend views use codegen-generated types only (`CarryoverFormRow`, `CarryoverRow` aliases on
  generated fragments); the `| null` wideness in generated types legitimately justifies the
  `=== null`/`?? ""` null-safety in `useCarryoverFormViewModel.ts`.
- Documents naming (`{entity}QueryDocument` etc.) and `id` on every selection set comply;
  `TypedDocumentNode` annotations match the generated operation type pairs.
