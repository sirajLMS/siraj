import { sql } from "drizzle-orm";
import { isPostgresExecutableTx } from "@/backend/db/repo/shared/executable-tx";
import type { DBTransaction } from "@/backend/types";

/**
 * Acquires a Postgres transaction-level advisory lock using the provided lock key string.
 * On SQLite, this is a no-op because SQLite transactions already serialize write access at the file level.
 */
export async function acquireAdvisoryLock(tx: DBTransaction, lockKey: string): Promise<void> {
  if (!isPostgresExecutableTx(tx)) return;
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}::text))`);
}
