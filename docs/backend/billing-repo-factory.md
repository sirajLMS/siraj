# Billing Repository Factory Pattern

## Overview

The Siraj billing module has three "supported" repositories (mobile wallets, online accounts, payment links) that share an identical CRUD skeleton: `listAll`, `listActive`, `getById`, `getBySlug`, `create`, `update`, `deactivate`, `listByIds`. This pattern extracts the shared CRUD operations into a generic factory function.

## Files

| File | Purpose |
|------|---------|
| `backend/db/repo/billing/__shared__/billingRepoFactory.ts` | Generic `makeBillingRepo()` factory |
| `backend/db/repo/billing/__shared__/directionFilter.ts` | `directionFilter()` SQL clause helper |
| `backend/db/repo/billing/supported-mobile-wallet.repository.ts` | Consumer (with `extraActiveFilters`) |
| `backend/db/repo/billing/supported-online-account.repository.ts` | Consumer |
| `backend/db/repo/billing/supported-payment-link.repository.ts` | Consumer |

## Pattern Details

### Generic Factory Function

```typescript
function makeBillingRepo<TTable extends PgTable, TShape, TSelect, TInsert>(
  config: BillingRepoConfig<TTable, TShape, TSelect, TInsert>
) {
  return {
    listAll: (tx?) => tx?.select().from(config.shape.table) ?? ...,
    listActive: (tx?, direction?) => ...with directionFilter...,
    getById: (id, tx?) => ...,
    // 8 methods total
  };
}
```

### Direction Filter Helper

```typescript
function directionFilter(column: PgColumn, direction?: string) {
  return or(eq(column, direction), eq(column, "BOTH"));
}
```

### Configuration Interface

```typescript
interface BillingRepoConfig<TTable, TShape, TSelect, TInsert> {
  shape: { table: TTable; columns: { id, slug, name, ... } };
  tableName: string;
  toSelectType: (row) => TSelect;
  deactivateInput: (id) => Partial<TInsert>;
  extraActiveFilters?: (params?) => SQL | undefined;
}
```

## Key Design Decisions

1. **`PgColumn`/`PgTable` from `drizzle-orm/pg-core`** — generic `Column` type is too abstract for `eq()`/`orderBy()` calls; the concrete PG types are needed for type inference.

2. **`deactivateInput` config field** — each consumer passes its typed `Update*Input` partial, avoiding `as unknown as` casts for the update operation.

3. **`extraActiveFilters` callback** — handles the mobile wallet's `countryCode` filter without duplicating `listActive`. Returns `SQL | undefined` so it composes with the base filters.

4. **`BillingTableShape` uses simple property names** — property names match schema column names exactly. No renaming.

5. **`makeBillingRepo` has 5th generic `TInsert`** — used only in the function signature (not in `BillingRepoConfig`) to avoid an unused generic parameter lint warning.

6. **No barrel in `__shared__/`** — direct module imports for same-scope files.

## Usage Example

```typescript
// supported-mobile-wallet.repository.ts
const baseRepo = makeBillingRepo({
  shape: { table: supportedMobileWallets, columns: { ... } },
  tableName: "supported_mobile_wallets",
  toSelectType: (row) => ({ ...row }),
  deactivateInput: (id) => ({ id, isActive: false }),
  extraActiveFilters: (params) =>
    params?.countryCode ? eq(supportedMobileWallets.countryCode, params.countryCode) : undefined,
});

export const SupportedMobileWalletRepository = {
  ...baseRepo,
  upsertMany: makeBillingUpsertMany({
    table: supportedMobileWallets,
    slug: supportedMobileWallets.slug,
    toSelectType: (row) => ({ ...row }),
    buildInsert: (input, now) => ({ ...input, createdAt: now, updatedAt: now }),
    buildConflictSet: (input, now) => ({ ...input, updatedAt: now }),
  }),
};
```

### `makeBillingUpsertMany` Factory

The `upsertMany` method is shared across all three billing repos but was
previously inlined in each consumer. The factory extracts the common
control flow (empty check, transaction wrapping, recursive sequential
insert + `onConflictDoUpdate` on slug, `toSelectType` mapping):

```typescript
function makeBillingUpsertMany<TRow extends BillingRow, TSelect, TInsert>(
  config: BillingUpsertConfig<TRow, TSelect, TInsert>
) {
  // Returns: (inputs: readonly TInsert[], tx?: DBTransaction) => Promise<TSelect[]>
  // - empty check → return []
  // - tx ?? db.transaction delegation
  // - recursive sequential insert+onConflictDoUpdate (avoids no-await-in-loop)
  // - toSelectType mapping via type guard (validateUpsertRow)
}
```

Each consumer provides two entity-specific callbacks:
- `buildInsert(input, now)` — builds the insert values payload
- `buildConflictSet(input, now)` — builds the on-conflict update set

## Stats

- **Clones eliminated:** 1 cross-file clone + all billing intra-file
- **Lines reduced:** ~204 lines of CRUD duplication
- **Each consumer reduced:** ~90 lines (from ~120 to ~30)
