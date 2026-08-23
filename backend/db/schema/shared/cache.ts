import {
  createTable,
  index,
  textColumn,
  timestampColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";

/**
 * Rate limit cache table.
 * (PG used an UNLOGGED table for write perf; SQLite has no UNLOGGED concept —
 * data is crash-safe under WAL, which is the SQLite default set by the driver.)
 */
export const rateLimitCache = createTable(
  "rate_limit_cache",
  {
    key: textColumn("key").primaryKey().notNull(),
    value: textColumn("value").notNull(),
    expiresAt: timestampColumn("expires_at").notNull(),
  },
  table => [
    index("rate_limit_cache_expires_at_idx").on(table.expiresAt),
    index("rate_limit_cache_value_idx").on(table.value),
  ]
);

/**
 * Session and general application cache table.
 * Standard crash-safe cache (WAL journal mode on SQLite).
 */
export const sessionCache = createTable(
  "session_cache",
  {
    key: textColumn("key").primaryKey().notNull(),
    value: textColumn("value").notNull(),
    expiresAt: timestampColumn("expires_at").notNull(),
  },
  table => [
    index("session_cache_expires_at_idx").on(table.expiresAt),
    index("session_cache_value_idx").on(table.value),
  ]
);

// Export types
export type RateLimitCacheEntry = typeof rateLimitCache.$inferSelect;
export type SessionCacheEntry = typeof sessionCache.$inferSelect;
