import type { SQL } from "drizzle-orm";
import { isSqlite } from "@/backend/db/dialect";

export interface ExecutableTx {
  execute(query: SQL): Promise<unknown>;
}

/**
 * True only when running on PostgreSQL and the handle can execute raw SQL
 * (transaction/TCP handles). SQLite transactions already serialize write
 * access at the file level, so GUC-style session-variable calls are skipped
 * there and the caller keeps its no-op / pass-through behavior.
 */
export function isPostgresExecutableTx(tx: unknown): tx is ExecutableTx {
  return !isSqlite() && typeof tx === "object" && tx !== null && "execute" in tx && typeof tx.execute === "function";
}
