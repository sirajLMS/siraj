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
 * Acquires a Postgres transaction-level advisory lock using the provided lock key string.
 * On SQLite, this is a no-op because SQLite transactions already serialize write access at the file level.
 */
export async function acquireAdvisoryLock(tx: DBTransaction, lockKey: string): Promise<void> {
  if (isSqlite()) return;
  if (!isExecutableTx(tx)) return;
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}::text))`);
}
