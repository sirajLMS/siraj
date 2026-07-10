import { boolean, integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";

/**
 * Timezones lookup table.
 * Stores IANA timezone IDs and their base UTC offsets.
 * Used to ensure referential integrity for timezones and support DST calculations.
 */
export const timezones = pgTable("timezones", {
  id: serial("id").primaryKey(),
  ianaId: varchar("iana_id", { length: 100 }).notNull().unique(), // e.g. 'Africa/Cairo'
  baseOffsetMinutes: integer("base_offset_minutes").notNull(), // Standard offset from UTC
  isDstSupported: boolean("is_dst_supported").notNull().default(true),
});
