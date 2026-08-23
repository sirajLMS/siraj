import {
  booleanColumn,
  createTable,
  index,
  integerColumn,
  textColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { classCategories } from "@/backend/db/schema/classes/class-category";
import { currencyCodeEnum } from "@/backend/db/schema/enums";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export const classSubjects = createTable(
  "class_subjects",
  {
    id: uuidColumn("id"),
    categoryId: uuidDefaultColumn("category_id")
      .notNull()
      .references(() => classCategories.id, { onDelete: "restrict" }),
    name: varcharColumn("name", { length: 200 }).notNull(),
    slug: varcharColumn("slug", { length: 100 }).notNull().unique(),
    description: textColumn("description"),
    avatarUrl: varcharColumn("avatar_url", { length: 1024 }),
    // Subject-level hourly rate (middle precedence tier). Nullable: when NULL,
    // the rate falls back to `teachers.hourly_rate`. See `rate-resolver.service.ts`.
    // PG-only: numeric(12,2) — stored as TEXT on SQLite (drizzle returns string for both).
    hourlyRate: textColumn("hourly_rate"),
    rateCurrency: currencyCodeEnum("rate_currency").$type<CurrencyCode>(),
    isActive: booleanColumn("is_active").notNull().default(true),
    sortOrder: integerColumn("sort_order").notNull().default(0),
    createdAt: timestampColumn("created_at").notNull().defaultNow(),
    updatedAt: timestampColumn("updated_at").notNull().defaultNow(),
    deletedAt: timestampColumn("deleted_at"),
  },
  table => [
    index("class_subjects_category_id_idx").on(table.categoryId),
    uniqueIndex("class_subjects_slug_idx").on(table.slug),
    index("class_subjects_deleted_at_idx").on(table.deletedAt),
  ]
);
