import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { classCategories } from "@/backend/db/schema/classes/class-category";
import { currencyCodeEnum } from "@/backend/db/schema/enums";
import type { CurrencyCode } from "@/backend/enum";

export const classSubjects = pgTable(
  "class_subjects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => classCategories.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    avatarUrl: varchar("avatar_url", { length: 1024 }),
    // Subject-level hourly rate (middle precedence tier). Nullable: when NULL,
    // the rate falls back to `teachers.hourly_rate`. See `rate-resolver.service.ts`.
    hourlyRate: numeric("hourly_rate", { precision: 12, scale: 2 }),
    rateCurrency: currencyCodeEnum("rate_currency").$type<CurrencyCode>(),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 }),
  },
  table => [
    index("class_subjects_category_id_idx").on(table.categoryId),
    uniqueIndex("class_subjects_slug_idx").on(table.slug),
    index("class_subjects_deleted_at_idx").on(table.deletedAt),
  ]
);
