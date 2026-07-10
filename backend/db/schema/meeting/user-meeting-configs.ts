import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { encryptedText } from "@/backend/db/schema/custom-types";
import { meetingProviders } from "@/backend/db/schema/meeting/meeting-providers";
import { users } from "@/backend/db/schema/users/users";
import type { MeetingConfigDetails } from "@/backend/types/meeting/meeting-config.types";

export const userMeetingConfigs = pgTable(
  "user_meeting_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => meetingProviders.id, { onDelete: "restrict" }),
    label: varchar("label", { length: 100 }),
    isDefault: boolean("is_default").notNull().default(false),
    details: jsonb("details").$type<MeetingConfigDetails>().notNull(),
    encryptedSecret: encryptedText("encrypted_secret"),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [
    index("user_meeting_configs_user_id_idx").on(table.userId),
    index("user_meeting_configs_provider_id_idx").on(table.providerId),
    uniqueIndex("user_meeting_configs_one_default_per_user_idx").on(table.userId).where(sql`${table.isDefault} = true`),
  ]
);
