import { sql } from "drizzle-orm";
import { isPostgresExecutableTx } from "@/backend/db/repo/shared/executable-tx";
import type { DBTransaction } from "@/backend/types";

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
  if (!isPostgresExecutableTx(tx)) return fn(tx);
  await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
  return fn(tx);
}
