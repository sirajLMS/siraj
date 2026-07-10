import { boolean, index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import type { MeetingProviderFieldSchema } from "@/backend/types/meeting/meeting-provider.types";
import type { LocalizedString } from "@/backend/types/shared/localized-string.types";

export const meetingProviders = pgTable(
  "meeting_providers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: jsonb("name").$type<LocalizedString>().notNull(),
    description: jsonb("description").$type<LocalizedString>(),
    instructions: jsonb("instructions").$type<LocalizedString>(),
    urlAllowlist: jsonb("url_allowlist").$type<readonly string[]>().notNull(),
    urlExample: varchar("url_example", { length: 1024 }),
    logoUrl: varchar("logo_url", { length: 1024 }),
    fieldSchema: jsonb("field_schema").$type<MeetingProviderFieldSchema>().notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [index("meeting_providers_is_active_idx").on(table.isActive)]
);
