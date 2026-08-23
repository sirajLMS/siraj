import {
  booleanColumn,
  createTable,
  index,
  textColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { users } from "@/backend/db/schema/users/users";

export const siteContent = createTable(
  "site_content",
  {
    id: uuidColumn("id"),
    slug: varcharColumn("slug", { length: 100 }).notNull().unique(),
    title: varcharColumn("title", { length: 255 }).notNull(),
    body: textColumn("body").notNull(),
    contentType: varcharColumn("content_type", { length: 50 }).notNull().default("page"),
    isPublished: booleanColumn("is_published").notNull().default(true),
    updatedByUserId: uuidDefaultColumn("updated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("site_content_slug_idx").on(table.slug),
    index("site_content_type_idx").on(table.contentType),
    index("site_content_updated_by_user_id_idx").on(table.updatedByUserId),
    index("site_content_created_at_idx").on(table.createdAt),
    index("site_content_updated_at_idx").on(table.updatedAt),
    index("site_content_is_published_content_type_idx").on(table.isPublished, table.contentType),
  ]
);
