import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { db } from "@/backend/db/drizzleDb";
import type { relations } from "@/backend/db/drizzleRelations";

export type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Comprehensive database query executor type that encompasses all possible
 * return types from `queryDb()`:
 * - DBTransaction (for transactional operations)
 * - typeof db (pooled connection)
 * - NeonHttpDatabase (HTTP client for stateless reads)
 */
export type DBQueryExecutor = DBTransaction | typeof db | NeonHttpDatabase<typeof relations>;
