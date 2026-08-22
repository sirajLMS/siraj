import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Rate limit cache table
 * Uses UNLOGGED table for better write performance (no WAL)
 * Data is not crash-safe but acceptable for rate limiting
 */
export const rateLimitCache = pgTable(
  "rate_limit_cache",
  {
    key: text("key").primaryKey().notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  table => [
    index("rate_limit_cache_expires_at_idx").on(table.expiresAt),
    index("rate_limit_cache_value_idx").on(table.value),
  ]
);

/**
 * Session and general application cache table
 * Standard LOGGED table to ensure data survives crashes
 */
export const sessionCache = pgTable(
  "session_cache",
  {
    key: text("key").primaryKey().notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  table => [index("session_cache_expires_at_idx").on(table.expiresAt)]
);

// Export types
export type RateLimitCacheEntry = typeof rateLimitCache.$inferSelect;
export type SessionCacheEntry = typeof sessionCache.$inferSelect;
