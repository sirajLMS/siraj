import { sql } from "drizzle-orm";
import {
  checkConstraint,
  createTable,
  index,
  uuidColumn,
  uuidDefaultColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { classInstances, recurringSchedules } from "@/backend/db/schema/classes/scheduling";
import { meetingConfigSharedColumns } from "@/backend/db/schema/meeting/__shared__/meeting-config-columns";
import {
  meetingConfigOneDefaultPerNullableScopeIndex,
  meetingConfigProviderIndex,
} from "@/backend/db/schema/meeting/__shared__/meeting-config-indexes";

const TABLE_NAME = "class_meeting_configs";

export const classMeetingConfigs = createTable(
  TABLE_NAME,
  {
    id: uuidColumn("id"),
    classInstanceId: uuidDefaultColumn("class_instance_id").references(() => classInstances.id, {
      onDelete: "cascade",
    }),
    recurringScheduleId: uuidDefaultColumn("recurring_schedule_id").references(() => recurringSchedules.id, {
      onDelete: "cascade",
    }),
    ...meetingConfigSharedColumns(),
  },
  table => [
    index(`${TABLE_NAME}_class_instance_id_idx`).on(table.classInstanceId),
    index(`${TABLE_NAME}_recurring_schedule_id_idx`).on(table.recurringScheduleId),
    index(`${TABLE_NAME}_is_default_idx`).on(table.isDefault),
    meetingConfigProviderIndex(TABLE_NAME, table),
    meetingConfigOneDefaultPerNullableScopeIndex(TABLE_NAME, "per_instance", table.classInstanceId, table.isDefault),
    meetingConfigOneDefaultPerNullableScopeIndex(
      TABLE_NAME,
      "per_recurring",
      table.recurringScheduleId,
      table.isDefault
    ),
    checkConstraint(
      `${TABLE_NAME}_scope_chk`,
      sql`(
        (${table.classInstanceId} IS NOT NULL AND ${table.recurringScheduleId} IS NULL)
        OR (${table.classInstanceId} IS NULL AND ${table.recurringScheduleId} IS NOT NULL)
      )`,
      sql`(
        (${table.classInstanceId} IS NOT NULL AND ${table.recurringScheduleId} IS NULL)
        OR (${table.classInstanceId} IS NULL AND ${table.recurringScheduleId} IS NOT NULL)
      )`
    ),
  ]
);
