import { and, eq, inArray, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/types";

/**
 * Internal Drizzle query building blocks shared by the billing repository
 * factory.
 *
 * These helpers centralize the select/read plumbing so the factory can stay
 * focused on composing the public method bag and mapping rows to their
 * canonical select types.
 */
interface BillingQueryTarget {
  /** The Drizzle table (used for select / from). */
  readonly table: PgTable;
  /** The `id` column (used for `getById` / `listByIds`). */
  readonly id: PgColumn;
  /** The `slug` column (used for `getBySlug` + `orderBy`). */
  readonly slug: PgColumn;
}

/** Selects every row, ordered by `slug`. */
export async function selectAllOrdered(target: BillingQueryTarget, tx?: DBTransaction): Promise<unknown[]> {
  const rows = await queryDb(tx).select().from(target.table).orderBy(target.slug);
  return rows;
}

/** Selects rows matching the supplied conditions, ordered by `slug`. */
export async function selectActiveOrdered(
  target: BillingQueryTarget,
  conditions: (SQL | undefined)[],
  tx?: DBTransaction
): Promise<unknown[]> {
  const clauses = conditions.filter(Boolean);
  const where = clauses.length > 0 ? and(...clauses) : undefined;
  const rows = await queryDb(tx).select().from(target.table).where(where).orderBy(target.slug);
  return rows;
}

/** Selects a single row by primary key, or `undefined` when absent. */
export async function selectById(target: BillingQueryTarget, idValue: string, tx?: DBTransaction): Promise<unknown> {
  const [row] = await queryDb(tx).select().from(target.table).where(eq(target.id, idValue)).limit(1);
  return row;
}

/** Selects a single row by slug, or `undefined` when absent. */
export async function selectBySlug(
  target: BillingQueryTarget,
  slugValue: string,
  tx?: DBTransaction
): Promise<unknown> {
  const [row] = await queryDb(tx).select().from(target.table).where(eq(target.slug, slugValue)).limit(1);
  return row;
}

/**
 * Selects rows whose `id` is contained in `ids`.
 *
 * Uses a dynamic `inArray` query (never a prepared statement) because the
 * PostgreSQL prepared-statement protocol treats `$1` as a single scalar and
 * cannot expand an array parameter for `IN` clauses.
 */
export async function selectByIds(
  target: BillingQueryTarget,
  ids: readonly string[],
  tx?: DBTransaction
): Promise<unknown[]> {
  const rows = await queryDb(tx)
    .select()
    .from(target.table)
    .where(inArray(target.id, [...ids]));
  return rows;
}
