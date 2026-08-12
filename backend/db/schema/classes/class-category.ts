import { boolean, index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { primaryKeyColumn, timestampColumns } from "@/backend/db/schema/__shared__/columnHelpers";

export const classCategories = pgTable(
  "class_categories",
  {
    ...primaryKeyColumn(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestampColumns({ withDefaultNow: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [
    index("class_categories_slug_idx").on(table.slug),
    index("class_categories_deleted_at_idx").on(table.deletedAt),
  ]
);
