import { sql } from "drizzle-orm";
import { check, index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { classInstances, recurringSchedules } from "@/backend/db/schema/classes/scheduling";
import { meetingConfigSharedColumns } from "@/backend/db/schema/meeting/__shared__/meeting-config-columns";

export const classMeetingConfigs = pgTable(
  "class_meeting_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classInstanceId: uuid("class_instance_id").references(() => classInstances.id, { onDelete: "cascade" }),
    recurringScheduleId: uuid("recurring_schedule_id").references(() => recurringSchedules.id, { onDelete: "cascade" }),
    ...meetingConfigSharedColumns(),
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
