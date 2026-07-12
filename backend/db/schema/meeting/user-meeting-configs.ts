import { index, pgTable, uuid } from "drizzle-orm/pg-core";
import { meetingConfigSharedColumns } from "@/backend/db/schema/meeting/__shared__/meeting-config-columns";
import {
  meetingConfigOneDefaultPerScopeIndex,
  meetingConfigProviderIndex,
} from "@/backend/db/schema/meeting/__shared__/meeting-config-indexes";
import { users } from "@/backend/db/schema/users/users";

const TABLE_NAME = "user_meeting_configs";

export const userMeetingConfigs = pgTable(
  TABLE_NAME,
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...meetingConfigSharedColumns(),
  },
  table => [
    index(`${TABLE_NAME}_user_id_idx`).on(table.userId),
    meetingConfigProviderIndex(TABLE_NAME, table),
    meetingConfigOneDefaultPerScopeIndex(TABLE_NAME, "per_user", table.userId, table.isDefault),
  ]
);
