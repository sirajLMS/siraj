import { primaryKeyColumn, timestampColumns } from "@/backend/db/schema/__shared__/columnHelpers";
import {
  booleanColumn,
  createTable,
  index,
  integerColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";

export const classCategories = createTable(
  "class_categories",
  {
    ...primaryKeyColumn(),
    name: varcharColumn("name", { length: 200 }).notNull(),
    slug: varcharColumn("slug", { length: 100 }).notNull().unique(),
    description: textColumn("description"),
    isActive: booleanColumn("is_active").notNull().default(true),
    sortOrder: integerColumn("sort_order").notNull().default(0),
    ...timestampColumns({ withDefaultNow: true }),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
    uniqueIndex("class_categories_slug_idx").on(table.slug),
    index("class_categories_deleted_at_idx").on(table.deletedAt),
  ]
);
