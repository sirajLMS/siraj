import {
  booleanColumn,
  createTable,
  index,
  integerColumn,
  serialColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";

/**
 * Timezones lookup table.
 * Stores IANA timezone IDs and their base UTC offsets.
 * Used to ensure referential integrity for timezones and support DST calculations.
 */
export const timezones = createTable(
  "timezones",
  {
    id: serialColumn("id"),
    ianaId: varcharColumn("iana_id", { length: 100 }).notNull().unique(),
    baseOffsetMinutes: integerColumn("base_offset_minutes").notNull(),
    isDstSupported: booleanColumn("is_dst_supported").notNull().default(true),
  },
  table => [
    index("timezones_is_dst_supported_idx").on(table.isDstSupported),
    index("timezones_base_offset_minutes_idx").on(table.baseOffsetMinutes),
  ]
);
