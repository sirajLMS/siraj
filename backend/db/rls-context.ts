/**
 * H6 fix: RLS defense-in-depth — wire `app.current_user_id` per request/transaction.
 *
 * RLS policies exist on students, class_instances, invoices, etc. but no request
 * path executes `SET LOCAL app.current_user_id`, so `current_user_id()` returns
 * NULL and policies degrade to broad access. This wrapper sets the session var
 * inside a transaction so RLS policies can use it.
 *
 * Only applies to PostgreSQL (SQLite has no RLS). For SQLite, the function is
 * a pass-through (no-op).
 */

import { sql } from "drizzle-orm";
import { isPostgres } from "@/backend/db/dialect";
import { db } from "@/backend/db/drizzleDb";
import type { DBTransaction } from "@/backend/types";

/**
 * Runs `fn` inside a transaction with `app.current_user_id` set to `userId`.
 * The setting is scoped to the transaction (SET LOCAL) and automatically cleared
 * when the transaction commits or rolls back.
 *
 * For SQLite (no RLS support), this is a pass-through — the function runs
 * without the session var.
 */
export async function withRlsContext<T>(userId: string | null, fn: (t: DBTransaction) => Promise<T>): Promise<T> {
  if (!isPostgres()) {
    // SQLite has no RLS — pass through without setting the session var.
    return db.transaction(fn);
  }

  return db.transaction(async t => {
    // SET LOCAL scopes the setting to the current transaction.
    // Using empty string for null userId (RLS policies check IS NULL).
    await t.execute(sql`SELECT set_config('app.current_user_id', ${userId ?? ""}, true)`);
    return fn(t);
  });
}

/**
 * Sets `app.current_user_id` on an existing transaction (for callers that
 * already manage their own transaction). No-op on SQLite.
 */
export async function setRlsContextOnTx(t: DBTransaction, userId: string | null): Promise<void> {
  if (!isPostgres()) return;
  await t.execute(sql`SELECT set_config('app.current_user_id', ${userId ?? ""}, true)`);
}
