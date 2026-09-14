import { type SQL, sql } from "drizzle-orm";
import { isSqlite } from "@/backend/db/dialect";
import type { DBTransaction } from "@/backend/types";

interface ExecutableTx {
  execute(query: SQL): Promise<unknown>;
}

function isExecutableTx(tx: unknown): tx is ExecutableTx {
  return typeof tx === "object" && tx !== null && "execute" in tx && typeof tx.execute === "function";
}

/**
 * Runs `fn` inside the provided transaction with the `app.current_user_id` session variable
 * set to `userId`, mirroring the `app.soft_delete` GUC pattern. The value is bound as a
 * parameter through the Drizzle `sql` template, and `set_config(..., is_local = true)` keeps
 * the setting transaction-local: it is cleared automatically when the surrounding transaction
 * ends, never leaking to other connections. On SQLite this is a no-op.
 */
export async function withCurrentUser<T>(
  tx: DBTransaction,
  userId: string,
  fn: (tx: DBTransaction) => Promise<T>
): Promise<T> {
  if (isSqlite()) return fn(tx);
  if (!isExecutableTx(tx)) return fn(tx);
  await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
  return fn(tx);
}
