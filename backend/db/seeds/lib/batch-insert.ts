/* eslint-disable @typescript-eslint/no-explicit-any */
/** biome-ignore-all lint/suspicious/noExplicitAny: <seeder> */

import type { AnyPgTable } from "drizzle-orm/pg-core";
import { db } from "@/backend/db/drizzleDb";
import logger from "@/backend/lib/logger";

const DEFAULT_CHUNK_SIZE = 100;

export async function batchInsert(
  table: AnyPgTable,
  rows: Record<string, unknown>[],
  chunkSize = DEFAULT_CHUNK_SIZE
): Promise<void> {
  if (rows.length === 0) return;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await db
      .insert(table)
      .values(chunk as any)
      .onConflictDoNothing();
    logger.debug(`Inserted batch ${Math.floor(i / chunkSize) + 1} (${chunk.length} rows)`);
  }
}
