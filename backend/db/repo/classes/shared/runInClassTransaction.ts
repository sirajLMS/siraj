import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { logger } from "@/backend/lib/logger";

export async function runInClassTransaction<T>(
  tx: DBTransaction | undefined,
  run: (t: DBTransaction) => Promise<T>,
  errorLabel: string
): Promise<T> {
  try {
    if (tx) return await run(tx);
    return await db.transaction(run);
  } catch (error) {
    logger.error(errorLabel, error);
    throw error;
  }
}
