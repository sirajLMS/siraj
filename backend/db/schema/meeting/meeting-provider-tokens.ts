import {
  createTable,
  encryptedText,
  index,
  jsonbColumn,
  timestampColumn,
  uniqueIndex,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { users } from "@/backend/db/schema/users/users";

export const meetingProviderTokens = createTable(
  "meeting_provider_tokens",
  {
    id: uuidColumn("id"),
    userId: uuidDefaultColumn("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerSlug: varcharColumn("provider_slug", { length: 50 }).notNull(),
    accessToken: encryptedText("access_token").notNull(),
    refreshToken: encryptedText("refresh_token"),
    expiresAt: timestampColumn("expires_at"),
    scopes: jsonbColumn<readonly string[]>("scopes").notNull().default([]),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    uniqueIndex("meeting_provider_tokens_user_provider_idx").on(table.userId, table.providerSlug),
    index("meeting_provider_tokens_user_id_idx").on(table.userId),
    index("meeting_provider_tokens_provider_slug_idx").on(table.providerSlug),
    index("meeting_provider_tokens_expires_at_idx").on(table.expiresAt),
  ]
);
