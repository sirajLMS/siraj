import { sql } from "drizzle-orm";
import { index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { meetingConfigSharedColumns } from "@/backend/db/schema/meeting/__shared__/meeting-config-columns";
import { users } from "@/backend/db/schema/users/users";

export const userMeetingConfigs = pgTable(
  "user_meeting_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...meetingConfigSharedColumns(),
  },
  table => [
    index("user_meeting_configs_user_id_idx").on(table.userId),
    index("user_meeting_configs_provider_id_idx").on(table.providerId),
    uniqueIndex("user_meeting_configs_one_default_per_user_idx").on(table.userId).where(sql`${table.isDefault} = true`),
  ]
);
