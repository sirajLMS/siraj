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

/**
 * Read-side query executor: either an open transaction or the pooled
 * connection. Repository read methods treat both members interchangeably;
 * services accept this union for optional `tx` parameters on read paths.
 */
export type ReadExecutor = DBTransaction | typeof db;
