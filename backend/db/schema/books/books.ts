import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { availabilityStatusEnum } from "@/backend/db/schema/enums";

export const books = pgTable(
  "books",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    availabilityStatus: availabilityStatusEnum("availability_status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [
    index("books_deleted_at_idx").on(table.deletedAt),
    index("books_availability_status_idx").on(table.availabilityStatus),
    index("books_created_at_idx").on(table.createdAt),
    index("books_name_idx").on(table.name),
  ]
);
