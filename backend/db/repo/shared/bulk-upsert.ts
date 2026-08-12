/** biome-ignore-all lint/suspicious/noExplicitAny: bulk insert utility */

import type { AnyPgTable } from "drizzle-orm/pg-core";
import type { DBTransaction } from "@/backend/types";
import { db } from "@/backend/db/drizzleDb";
import { logger } from "@/backend/lib/logger";

export const DEFAULT_BULK_CHUNK_SIZE = 100;

export async function bulkInsertOnConflictDoNothing(
  table: AnyPgTable,
  rows: Record<string, unknown>[],
  options?: { chunkSize?: number; tx?: DBTransaction }
): Promise<void> {
  if (rows.length === 0) return;

  const chunkSize = options?.chunkSize ?? DEFAULT_BULK_CHUNK_SIZE;
  const queryDb = options?.tx ?? db;
  const chunkCount = Math.ceil(rows.length / chunkSize);

  await Array.from({ length: chunkCount }).reduce(async (prev, _, batchIndex) => {
    await prev;
    const i = batchIndex * chunkSize;
    const chunk = rows.slice(i, i + chunkSize);
    await queryDb.insert(table).values(chunk).onConflictDoNothing();
    logger.debug(`Bulk insert batch ${batchIndex + 1} (${chunk.length} rows)`);
  }, Promise.resolve());
}
