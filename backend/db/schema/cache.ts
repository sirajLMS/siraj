import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Cache table for rate limiting and general caching
 * Uses UNLOGGED table for better write performance (no WAL)
 * Data is not crash-safe but acceptable for cache use case
 */
export const cache = pgTable(
	"cache",
	{
		key: text("key").primaryKey().notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	},
	(table) => [
		// Index for efficient cleanup of expired entries
		index("cache_expires_at_idx").on(table.expiresAt),
	],
);

// Export type for TypeScript
export type CacheEntry = typeof cache.$inferSelect;
export type NewCacheEntry = typeof cache.$inferInsert;
