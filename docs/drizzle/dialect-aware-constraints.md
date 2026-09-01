# Dialect-Aware Constraints & Soft-Delete Indexes

How Siraj's Drizzle schema keeps constraints enforced across both SQL dialects in use — PostgreSQL (production) and SQLite (tests) — without silently dropping guarantees on one of them.

## Why

Two hazards motivated this doc:

1. `check()` from `drizzle-orm` is **PostgreSQL-only**. On SQLite it silently no-ops, so a constraint that guards data integrity in production simply does not exist in tests — tests can pass while writing rows production would reject.
2. Unique constraints on soft-deletable tables permanently block value reuse: once a row with a unique value is soft-deleted, inserting a new row with the same value fails even though the old one is logically gone.

## The Patterns

### Dialect-aware CHECK constraints

Always use the shared helper instead of raw `check()`:

```ts
import { checkConstraint } from "@/backend/db/schema/__shared__/dialectAwareBuilder";

checkConstraint(
  "credit_transactions_change_amount_xor_chk",
  sql`((${table.changeAmount} IS NOT NULL AND ${table.changeAmountHours} IS NULL) OR (${table.changeAmount} IS NULL AND ${table.changeAmountHours} IS NOT NULL))`, // PostgreSQL
  sql`((${table.changeAmount} IS NOT NULL AND ${table.changeAmountHours} IS NULL) OR (${table.changeAmount} IS NULL AND ${table.changeAmountHours} IS NOT NULL))`, // SQLite
);
```

The helper emits the right DDL per dialect so the constraint is real in both environments.

### XOR mutual exclusion on one table

When a table carries two parallel measurement columns and exactly one must be set per row (e.g. class-credit `changeAmount` vs hour `changeAmountHours`), express mutual exclusion with an XOR CHECK as above — not with application-layer validation alone.

Reference implementation: `backend/db/schema/billing/credit-transactions.ts`. See `docs/billing/credit-hours-system.md` for the ledger semantics.

### Soft-delete-aware uniqueness

For tables with soft delete, use a partial unique index instead of a plain unique constraint:

```sql
CREATE UNIQUE INDEX ... ON <table> (<column>) WHERE deleted_at IS NULL;
```

This frees the value for reuse once a row is archived. Reference implementation: `backend/db/schema/billing/package-plans.ts` (`codename`).

## Rules

- MUST use `checkConstraint(name, pgSql, sqliteSql)` — never raw `check()` from `drizzle-orm`.
- MUST keep both dialect SQL expressions semantically identical.
- MUST use a partial unique index (`WHERE deleted_at IS NULL`) for uniqueness on any soft-deletable table.
- After schema edits, run `bun run db push` (schema) — custom SQL only via `bun db migrate`.

## Related Documents

- `backend/db/schema/AGENTS.md` — schema layer rules
- `docs/billing/credit-hours-system.md` — credit-hours ledger (XOR reference usage)
- `docs/drizzle/prepared-statements.md` — prepared statements pattern
