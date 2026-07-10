import { sql } from "drizzle-orm";
import { boolean, check, index, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { classInstances, recurringSchedules } from "@/backend/db/schema/classes/scheduling";
import { encryptedText } from "@/backend/db/schema/custom-types";
import { meetingProviders } from "@/backend/db/schema/meeting/meeting-providers";
import type { MeetingConfigDetails } from "@/backend/types/meeting/meeting-config.types";

export const classMeetingConfigs = pgTable(
  "class_meeting_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classInstanceId: uuid("class_instance_id").references(() => classInstances.id, { onDelete: "cascade" }),
    recurringScheduleId: uuid("recurring_schedule_id").references(() => recurringSchedules.id, { onDelete: "cascade" }),
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
    index("class_meeting_configs_class_instance_id_idx").on(table.classInstanceId),
    index("class_meeting_configs_recurring_schedule_id_idx").on(table.recurringScheduleId),
    index("class_meeting_configs_provider_id_idx").on(table.providerId),
    uniqueIndex("class_meeting_configs_one_default_per_instance_idx")
      .on(table.classInstanceId)
      .where(sql`${table.isDefault} = true AND ${table.classInstanceId} IS NOT NULL`),
    uniqueIndex("class_meeting_configs_one_default_per_recurring_idx")
      .on(table.recurringScheduleId)
      .where(sql`${table.isDefault} = true AND ${table.recurringScheduleId} IS NOT NULL`),
    check(
      "class_meeting_configs_scope_chk",
      sql`(
        (${table.classInstanceId} IS NOT NULL AND ${table.recurringScheduleId} IS NULL)
        OR (${table.classInstanceId} IS NULL AND ${table.recurringScheduleId} IS NOT NULL)
      )`
    ),
  ]
);
