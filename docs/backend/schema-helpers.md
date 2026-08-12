# Schema Column & Junction Table Helpers

## Overview

The Siraj schema layer has three types of duplication: (1) 10 file junction tables with identical column+index shape, (2) 3 supported-* billing tables sharing base column envelopes, and (3) repeated `id`/`createdAt`/`updatedAt` column definitions across all tables. This pattern extracts these into composable helper functions.

## Files

| File | Purpose |
|------|---------|
| `backend/db/schema/__shared__/columnHelpers.ts` | `primaryKeyColumn()`, `timestampColumns()`, `createdAtColumn()` |
| `backend/db/schema/storage/__shared__/makeFileJunctionTable.ts` | Junction table factory |
| `backend/db/schema/billing/__shared__/supportedPaymentMethodBase.ts` | `supportedPaymentMethodBaseHead()` + `BaseTail()` |

## Pattern 1: Column Helpers

```typescript
// Returns { id: uuid().defaultRandom().primaryKey() }
const { id } = primaryKeyColumn();

// Returns { createdAt, updatedAt } with options
const { createdAt, updatedAt } = timestampColumns({ withDefaultNow: true, withOnUpdate: true });

// Append-only tables
const { createdAt } = createdAtColumn({ withDefaultNow: true });
```

### Key Decisions

- **Options bag (`withDefaultNow`, `withOnUpdate`)** — each call-site matches its existing declaration exactly. Not all tables have `.defaultNow()` or `.$onUpdate()`.
- **Three variants supported**: service-supplied value (users/billing), DB default (storage junctions), auto-update on change (whatsapp-accounts only).
- **Tables correctly skipped**: `sessions` (varchar PK), `signedUrls` (varchar PK), composite-PK permission tables.

## Pattern 2: Junction Table Factory

```typescript
const userFiles = makeFileJunctionTable({
  tableName: "user_files",
  entityColumnName: "userId",
  entityColumn: uuid().notNull().references(() => users.id),
});
```

### Key Decisions

1. **Typed config object (`FileJunctionConfig<TColumns>`)** — no `as` casts (satisfies `no-unsafe-type-assertion`).

2. **Generic over columns `<TColumns extends FileJunctionColumns>`** — Drizzle infers full `PgTableWithColumns` return type; consumers access `.userId`, `.$inferSelect`, etc.

3. **Column order preserved exactly** (`id`, `fileId`, `entityFk`, `usageType`, `createdAt`) — prevents column-reordering migrations.

4. **Index suffixes shortened** (`res_id`, `staff_id`, `sched_id`, `instance_id`) — PostgreSQL 63-byte identifier limit.

## Pattern 3: Supported Payment Method Base (Head/Tail Split)

```typescript
pgTable("supported_mobile_wallets", {
  ...supportedPaymentMethodBaseHead(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  phoneRegion: varchar("phone_region", { length: 2 }),
  ...supportedPaymentMethodBaseTail(),
});
```

### Key Decisions

- **Head/tail split (not single function)** — tables insert domain-specific columns in the MIDDLE of the shared envelope. A single spread would force all middle columns to the end → migration with column reordering.
- **`updatedAt` does NOT use `.$onUpdate()`** — plain `.notNull()` timestamp, matching original.
- **Column order preserved exactly** matches original inline order.

## Stats

- **`storage.ts`:** 250→141 lines (−109, 10 junction tables)
- **`users.ts`:** 5 tables refactored with column helpers
- **Billing tables:** 3 tables, ~18 lines of duplicated columns removed
- **Migration verification:** `bun run db generate` produces zero migration files — refactoring is migration-equivalent
