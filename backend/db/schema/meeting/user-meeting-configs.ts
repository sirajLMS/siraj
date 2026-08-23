import { createTable, index, uuidColumn, uuidDefaultColumn } from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { meetingConfigSharedColumns } from "@/backend/db/schema/meeting/__shared__/meeting-config-columns";
import {
  meetingConfigOneDefaultPerScopeIndex,
  meetingConfigProviderIndex,
} from "@/backend/db/schema/meeting/__shared__/meeting-config-indexes";
import { users } from "@/backend/db/schema/users/users";

const TABLE_NAME = "user_meeting_configs";

export const userMeetingConfigs = createTable(
  TABLE_NAME,
  {
    id: uuidColumn("id"),
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .references(() => users.id as never, { onDelete: "cascade" }),
    ...meetingConfigSharedColumns(),
  },
  table => [
    index(`${TABLE_NAME}_user_id_idx`).on(table.userId),
    index(`${TABLE_NAME}_is_default_idx`).on(table.isDefault),
    index(`${TABLE_NAME}_user_id_is_default_idx`).on(table.userId, table.isDefault),
    meetingConfigProviderIndex(TABLE_NAME, table),
    meetingConfigOneDefaultPerScopeIndex(TABLE_NAME, "per_user", table.userId, table.isDefault),
  ]
);
