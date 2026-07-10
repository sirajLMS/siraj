import { boolean, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "@/backend/db/schema/users/users";

export const siteContent = pgTable(
  "site_content",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    contentType: varchar("content_type", { length: 50 }).notNull().default("page"),
    isPublished: boolean("is_published").notNull().default(true),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("site_content_slug_idx").on(table.slug), index("site_content_type_idx").on(table.contentType)]
);
