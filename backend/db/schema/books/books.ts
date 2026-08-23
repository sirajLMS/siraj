import {
  createTable,
  index,
  timestampColumn,
  uuidColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { availabilityStatusEnum } from "@/backend/db/schema/enums";
import type { AvailabilityStatus } from "@/backend/enum/books/book.enum";

export const books = createTable(
  "books",
  {
    id: uuidColumn("id"),
    name: varcharColumn("name", { length: 255 }).notNull(),
    availabilityStatus: availabilityStatusEnum("availability_status").$type<AvailabilityStatus>().notNull(),
    createdAt: timestampColumn("created_at").notNull(),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
    index("books_deleted_at_idx").on(table.deletedAt),
    index("books_availability_status_idx").on(table.availabilityStatus),
    index("books_created_at_idx").on(table.createdAt),
    index("books_name_idx").on(table.name),
  ]
);
